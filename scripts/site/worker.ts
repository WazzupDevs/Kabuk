// skall.world's Worker (wrangler.jsonc → main; docs/decisions/skall-world-formlar.md). It runs only
// for /api/* (assets.run_worker_first); every other request is a static file from site/. The
// rules are in forms.ts; this file reads the request, checks Turnstile and the IP limit, and
// writes to D1. Secrets live in Cloudflare (docs/OPS.md → "skall.world formları"), never here.
import {
  cutoff,
  DAILY_LIMITS,
  dayKey,
  type LimitKind,
  parseSchoolApplication,
  parseVenueApplication,
  parseVote,
  RATE_KEEP_DAYS,
  VENUE_KEEP_DAYS,
  VENUE_MAIL_TO,
  VENUE_NOTICE_VERSION,
  venueMail,
} from './forms.ts';

// The parts of the Workers runtime this file uses (no @cloudflare/workers-types dependency).
interface D1Statement {
  bind(...values: unknown[]): D1Statement;
  first<T>(): Promise<T | null>;
  all<T>(): Promise<{ results: T[] }>;
  run(): Promise<{ meta: { changes: number } }>;
}
interface D1Database {
  prepare(query: string): D1Statement;
}
interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
}
export interface Env {
  DB: D1Database;
  ASSETS: { fetch(request: Request): Promise<Response> };
  TURNSTILE_SITE_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
  IP_SALT?: string;
  RESEND_API_KEY?: string;
  MAIL_FROM?: string;
}

const MAX_BODY = 4096;
const ALLOWED_ORIGINS = new Set(['https://skall.world', 'https://www.skall.world']);

function json(body: unknown, status = 200, cache = 'no-store'): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': cache },
  });
}

function error(code: string, message: string, status: number, extra: object = {}): Response {
  return json({ error: { code, message, ...extra } }, status);
}

async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function readJson(request: Request): Promise<unknown> {
  const type = request.headers.get('content-type') ?? '';
  if (!type.startsWith('application/json')) return undefined;
  const text = await request.text();
  if (text.length > MAX_BODY) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

async function verifyTurnstile(
  env: Env,
  token: string,
  ip: string,
  action: string,
): Promise<boolean> {
  const form = new FormData();
  form.set('secret', env.TURNSTILE_SECRET_KEY ?? '');
  form.set('response', token);
  if (ip) form.set('remoteip', ip);
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: form,
    });
    const result = (await response.json()) as { success?: boolean; action?: string };
    return result.success === true && result.action === action;
  } catch {
    return false;
  }
}

// One more use of today's allowance; false once it is spent.
async function takeLimit(env: Env, kind: LimitKind, ipHash: string, now: Date): Promise<boolean> {
  const row = await env.DB.prepare(
    `insert into rate_limits (kind, ip_hash, day, count) values (?1, ?2, ?3, 1)
     on conflict (kind, ip_hash, day) do update set count = count + 1
     returning count`,
  )
    .bind(kind, ipHash, dayKey(now))
    .first<{ count: number }>();
  return (row?.count ?? Infinity) <= DAILY_LIMITS[kind];
}

type Guard = { ok: true; ipHash: string } | { ok: false; response: Response };

// What every form shares: configured, from our page, a person (Turnstile), within the IP limit.
async function guard(
  request: Request,
  env: Env,
  token: string,
  kind: LimitKind,
  now: Date,
): Promise<Guard> {
  if (!env.TURNSTILE_SECRET_KEY || !env.IP_SALT) {
    return { ok: false, response: error('closed', 'Şu an alamıyoruz, biraz sonra dene.', 503) };
  }
  const ip = request.headers.get('cf-connecting-ip') ?? '';
  if (!(await verifyTurnstile(env, token, ip, kind))) {
    return {
      ok: false,
      response: error('verification_failed', 'Doğrulama tamamlanmadı, tekrar dene.', 403),
    };
  }
  const ipHash = await sha256(`${env.IP_SALT}|${ip}`);
  if (!(await takeLimit(env, kind, ipHash, now))) {
    return {
      ok: false,
      response: error('rate_limited', 'Bugünlük sınıra ulaşıldı, yarın tekrar dene.', 429),
    };
  }
  return { ok: true, ipHash };
}

async function votedSchool(env: Env, deviceHash: string): Promise<string | null> {
  const row = await env.DB.prepare(
    'select s.name from votes v join schools s on s.id = v.school_id where v.device_hash = ?1',
  )
    .bind(deviceHash)
    .first<{ name: string }>();
  return row?.name ?? null;
}

async function castVote(
  env: Env,
  deviceHash: string,
  schoolId: number,
  now: Date,
): Promise<Response | null> {
  const result = await env.DB.prepare(
    'insert into votes (device_hash, school_id, created_at) values (?1, ?2, ?3) on conflict (device_hash) do nothing',
  )
    .bind(deviceHash, schoolId, now.toISOString())
    .run();
  if (result.meta.changes === 1) return null;
  const school = await votedSchool(env, deviceHash);
  return error('already_voted', 'Bu cihazdan zaten bir okula oy verildi.', 409, { school });
}

async function listSchools(env: Env): Promise<Response> {
  const { results } = await env.DB.prepare(
    `select s.id, s.name, count(v.device_hash) as votes
     from schools s left join votes v on v.school_id = s.id
     where s.status = 'approved'
     group by s.id order by votes desc, s.name`,
  ).all<{ id: number; name: string; votes: number }>();
  return json({ schools: results }, 200, 'public, max-age=30');
}

async function vote(request: Request, env: Env, now: Date): Promise<Response> {
  const parsed = parseVote(await readJson(request));
  if (!parsed.ok) return error(parsed.code, parsed.message, 400);
  const { schoolId, device, token } = parsed.value;
  const checked = await guard(request, env, token, 'vote', now);
  if (!checked.ok) return checked.response;
  const school = await env.DB.prepare(
    "select name from schools where id = ?1 and status = 'approved'",
  )
    .bind(schoolId)
    .first<{ name: string }>();
  if (!school) return error('not_found', 'Bu okul listede yok.', 404);
  const refused = await castVote(env, await sha256(device), schoolId, now);
  return refused ?? json({ ok: true, school: school.name, status: 'approved' });
}

async function applySchool(request: Request, env: Env, now: Date): Promise<Response> {
  const parsed = parseSchoolApplication(await readJson(request));
  if (!parsed.ok) return error(parsed.code, parsed.message, 400);
  const { name, key, device, token } = parsed.value;
  const checked = await guard(request, env, token, 'school', now);
  if (!checked.ok) return checked.response;
  const deviceHash = await sha256(device);
  // A device that voted creates no pending school.
  const earlier = await votedSchool(env, deviceHash);
  if (earlier)
    return error('already_voted', 'Bu cihazdan zaten bir okula oy verildi.', 409, {
      school: earlier,
    });
  await env.DB.prepare(
    "insert into schools (name, name_key, status, created_at) values (?1, ?2, 'pending', ?3) on conflict (name_key) do nothing",
  )
    .bind(name, key, now.toISOString())
    .run();
  const school = await env.DB.prepare('select id, name, status from schools where name_key = ?1')
    .bind(key)
    .first<{ id: number; name: string; status: string }>();
  if (!school) return error('server_error', 'Bir sorun oldu, tekrar dene.', 500);
  const refused = await castVote(env, deviceHash, school.id, now);
  // A rejected name reads as waiting: the applicant learns nothing from it.
  const status = school.status === 'approved' ? 'approved' : 'pending';
  return refused ?? json({ ok: true, school: status === 'approved' ? school.name : name, status });
}

async function sendVenueMail(
  env: Env,
  id: number,
  app: Parameters<typeof venueMail>[0],
  now: Date,
): Promise<void> {
  if (!env.RESEND_API_KEY) return;
  const mail = venueMail(app, now);
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: env.MAIL_FROM ?? 'skall <bildirim@skall.world>',
      to: [VENUE_MAIL_TO],
      reply_to: app.email,
      subject: mail.subject,
      text: mail.text,
    }),
  });
  if (!response.ok) {
    console.error(`venue mail failed: ${response.status}`);
    return;
  }
  await env.DB.prepare('update venue_applications set emailed_at = ?1 where id = ?2')
    .bind(new Date().toISOString(), id)
    .run();
}

async function applyVenue(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  now: Date,
): Promise<Response> {
  const parsed = parseVenueApplication(await readJson(request));
  if (!parsed.ok) return error(parsed.code, parsed.message, 400, { fields: parsed.fields });
  const { token, ...app } = parsed.value;
  const checked = await guard(request, env, token, 'venue', now);
  if (!checked.ok) return checked.response;
  const row = await env.DB.prepare(
    `insert into venue_applications
       (venue_name, district, contact_name, phone, email, notice_version, created_at)
     values (?1, ?2, ?3, ?4, ?5, ?6, ?7) returning id`,
  )
    .bind(
      app.venueName,
      app.district,
      app.contactName,
      app.phone,
      app.email,
      VENUE_NOTICE_VERSION,
      now.toISOString(),
    )
    .first<{ id: number }>();
  if (!row) return error('server_error', 'Bir sorun oldu, tekrar dene.', 500);
  // Saved first: a failed mail loses nothing (the row stays without emailed_at).
  ctx.waitUntil(
    sendVenueMail(env, row.id, app, now).catch((e: unknown) => console.error('venue mail', e)),
  );
  return json({ ok: true });
}

export async function handle(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  now = new Date(),
): Promise<Response> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
  if (request.method === 'GET') {
    if (url.pathname === '/api/ayar')
      return json({ turnstileSiteKey: env.TURNSTILE_SITE_KEY ?? null }, 200, 'public, max-age=300');
    if (url.pathname === '/api/okullar') return listSchools(env);
    return error('not_found', 'Bulunamadı.', 404);
  }
  if (request.method !== 'POST') return error('method_not_allowed', 'Desteklenmiyor.', 405);
  const origin = request.headers.get('origin');
  if (origin && !ALLOWED_ORIGINS.has(origin)) return error('forbidden', 'İzin yok.', 403);
  try {
    if (url.pathname === '/api/oy') return await vote(request, env, now);
    if (url.pathname === '/api/okul-basvuru') return await applySchool(request, env, now);
    if (url.pathname === '/api/mekan-basvuru') return await applyVenue(request, env, ctx, now);
  } catch (e) {
    console.error('api', e);
    return error('server_error', 'Bir sorun oldu, tekrar dene.', 500);
  }
  return error('not_found', 'Bulunamadı.', 404);
}

// The daily job (wrangler.jsonc → triggers): old venue applications and IP counters go.
export async function cleanup(env: Env, now = new Date()): Promise<void> {
  await env.DB.prepare('delete from venue_applications where created_at < ?1')
    .bind(cutoff(now, VENUE_KEEP_DAYS))
    .run();
  await env.DB.prepare('delete from rate_limits where day < ?1')
    .bind(cutoff(now, RATE_KEEP_DAYS).slice(0, 10))
    .run();
}

export default {
  fetch: (request: Request, env: Env, ctx: ExecutionContext) => handle(request, env, ctx),
  scheduled: (_event: unknown, env: Env, ctx: ExecutionContext) => ctx.waitUntil(cleanup(env)),
};
