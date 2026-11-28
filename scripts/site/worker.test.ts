// The Worker against the real migrations (d1/*.sql) on Node's SQLite, with Turnstile and Resend
// stubbed: what D1 would see in production.
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DAILY_LIMITS } from './forms.ts';
import { cleanup, type Env, handle } from './worker.ts';

type Value = string | number | null;

function d1(db: DatabaseSync): Env['DB'] {
  return {
    prepare(query: string) {
      let values: Value[] = [];
      const stmt = {
        bind(...v: unknown[]) {
          values = v as Value[];
          return stmt;
        },
        async first<T>() {
          return (db.prepare(query).get(...values) as T | undefined) ?? null;
        },
        async all<T>() {
          return { results: db.prepare(query).all(...values) as T[] };
        },
        async run() {
          return { meta: { changes: Number(db.prepare(query).run(...values).changes) } };
        },
      };
      return stmt;
    },
  };
}

const DEVICE_A = '3f2b8c1e-9a4d-4e6f-8b2a-1c3d5e7f9a0b';
const DEVICE_B = '9a0b3f2b-8c1e-4e6f-8b2a-1c3d5e7f9a0b';

let db: DatabaseSync;
let env: Env;
let waits: Promise<unknown>[];
let mails: { to: string[]; subject: string; text: string; reply_to?: string }[];
let turnstileHost: string;
let turnstileOk: boolean;
const ctx = { waitUntil: (p: Promise<unknown>) => waits.push(p) };

beforeEach(() => {
  db = new DatabaseSync(':memory:');
  const dir = resolve(import.meta.dirname, 'd1');
  for (const file of readdirSync(dir).sort()) db.exec(readFileSync(resolve(dir, file), 'utf8'));
  env = {
    DB: d1(db),
    ASSETS: { fetch: async () => new Response('asset') },
    TURNSTILE_SITE_KEY: 'site-key',
    TURNSTILE_SECRET_KEY: 'secret',
    IP_SALT: 'salt',
    RESEND_API_KEY: 'resend',
  };
  waits = [];
  mails = [];
  turnstileOk = true;
  turnstileHost = 'skall.world';
  vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
    if (url.includes('turnstile')) {
      const form = init.body as FormData;
      const action = String(form.get('response'));
      return Response.json({ success: turnstileOk, action, hostname: turnstileHost });
    }
    mails.push(JSON.parse(String(init.body)));
    return Response.json({ id: 'm1' });
  });
});

afterEach(() => vi.unstubAllGlobals());

// The stub echoes the token as the Turnstile action: a token is valid for the form it names.
function post(path: string, body: object, ip = '203.0.113.7'): Request {
  return new Request(`https://skall.world${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: 'https://skall.world',
      'cf-connecting-ip': ip,
    },
    body: JSON.stringify(body),
  });
}

async function call(request: Request): Promise<{ status: number; body: Record<string, unknown> }> {
  const response = await handle(request, env, ctx, new Date('2026-11-28T10:00:00Z'));
  return { status: response.status, body: (await response.json()) as Record<string, unknown> };
}

async function firstSchool(): Promise<{ id: number; name: string; votes: number }> {
  const [first] = await schools();
  if (!first) throw new Error('no school');
  return first;
}

async function schools(): Promise<{ id: number; name: string; votes: number }[]> {
  const { body } = await call(new Request('https://skall.world/api/okullar'));
  return body.schools as { id: number; name: string; votes: number }[];
}

describe('worker', () => {
  it('passes everything outside /api/ to the static files', async () => {
    const response = await handle(new Request('https://skall.world/mekanlar'), env, ctx);
    expect(await response.text()).toBe('asset');
  });

  it('gives the public site key', async () => {
    expect((await call(new Request('https://skall.world/api/ayar'))).body).toEqual({
      turnstileSiteKey: 'site-key',
    });
  });

  it('counts one vote per device', async () => {
    const first = await firstSchool();
    expect(
      await call(post('/api/oy', { schoolId: first.id, device: DEVICE_A, token: 'vote' })),
    ).toEqual({
      status: 200,
      body: { ok: true, school: first.name, status: 'approved' },
    });
    const again = await call(
      post('/api/oy', { schoolId: first.id + 1, device: DEVICE_A, token: 'vote' }),
    );
    expect(again.status).toBe(409);
    expect(again.body.error).toMatchObject({ code: 'already_voted', school: first.name });
    expect((await schools())[0]).toMatchObject({ id: first.id, votes: 1 });
    // Only the device's hash is kept.
    expect(JSON.stringify(db.prepare('select * from votes').all())).not.toContain(DEVICE_A);
  });

  it('refuses a failed Turnstile, a token of another form and a foreign origin', async () => {
    const first = await firstSchool();
    turnstileOk = false;
    expect(
      (await call(post('/api/oy', { schoolId: first.id, device: DEVICE_A, token: 'vote' }))).status,
    ).toBe(403);
    turnstileOk = true;
    turnstileHost = 'example.com';
    expect(
      (await call(post('/api/oy', { schoolId: first.id, device: DEVICE_A, token: 'vote' }))).status,
    ).toBe(403);
    turnstileHost = 'skall.world';
    expect(
      (await call(post('/api/oy', { schoolId: first.id, device: DEVICE_A, token: 'venue' })))
        .status,
    ).toBe(403);
    const foreign = post('/api/oy', { schoolId: first.id, device: DEVICE_A, token: 'vote' });
    const headers = new Headers(foreign.headers);
    headers.set('origin', 'https://example.com');
    expect((await call(new Request(foreign, { headers }))).status).toBe(403);
    expect(db.prepare('select count(*) as n from votes').get()).toEqual({ n: 0 });
  });

  it('stays closed without its secrets', async () => {
    delete env.TURNSTILE_SECRET_KEY;
    const first = await firstSchool();
    const result = await call(
      post('/api/oy', { schoolId: first.id, device: DEVICE_A, token: 'vote' }),
    );
    expect(result.status).toBe(503);
  });

  it('limits an IP per day', async () => {
    const first = await firstSchool();
    for (let i = 0; i < DAILY_LIMITS.vote; i++) {
      const device = `${String(i).padStart(8, '0')}-9a4d-4e6f-8b2a-1c3d5e7f9a0b`;
      expect(
        (await call(post('/api/oy', { schoolId: first.id, device, token: 'vote' }))).status,
      ).toBe(200);
    }
    expect(
      (await call(post('/api/oy', { schoolId: first.id, device: DEVICE_B, token: 'vote' }))).status,
    ).toBe(429);
    expect(
      (
        await call(
          post('/api/oy', { schoolId: first.id, device: DEVICE_B, token: 'vote' }, '198.51.100.1'),
        )
      ).status,
    ).toBe(200);
    expect(JSON.stringify(db.prepare('select * from rate_limits').all())).not.toContain(
      '203.0.113.7',
    );
  });

  it('holds a new school until approved, and joins spellings', async () => {
    const before = (await schools()).length;
    const applied = await call(
      post('/api/okul-basvuru', {
        name: 'Isparta  Uygulamalı Bilimler Üniversitesi',
        adult: true,
        device: DEVICE_A,
        token: 'school',
      }),
    );
    expect(applied.body).toEqual({
      ok: true,
      school: 'Isparta Uygulamalı Bilimler Üniversitesi',
      status: 'pending',
    });
    const second = await call(
      post('/api/okul-basvuru', {
        name: 'isparta uygulamalı bilimler üniversitesi',
        adult: true,
        device: DEVICE_B,
        token: 'school',
      }),
    );
    expect(second.body).toMatchObject({ status: 'pending' });
    expect(db.prepare("select count(*) as n from schools where status = 'pending'").get()).toEqual({
      n: 1,
    });
    expect((await schools()).length).toBe(before);
    db.exec("update schools set status = 'approved' where status = 'pending'");
    expect((await schools())[0]).toMatchObject({
      name: 'Isparta Uygulamalı Bilimler Üniversitesi',
      votes: 2,
    });
  });

  it('sends an application for a listed school to that school', async () => {
    const result = await call(
      post('/api/okul-basvuru', {
        name: 'boğaziçi üniversitesi',
        adult: true,
        device: DEVICE_A,
        token: 'school',
      }),
    );
    expect(result.body).toEqual({ ok: true, school: 'Boğaziçi Üniversitesi', status: 'approved' });
  });

  it('creates no school for a device that already voted', async () => {
    const first = await firstSchool();
    await call(post('/api/oy', { schoolId: first.id, device: DEVICE_A, token: 'vote' }));
    const result = await call(
      post('/api/okul-basvuru', {
        name: 'Yeni Bir Üniversite',
        adult: true,
        device: DEVICE_A,
        token: 'school',
      }),
    );
    expect(result.status).toBe(409);
    expect(db.prepare("select count(*) as n from schools where status = 'pending'").get()).toEqual({
      n: 0,
    });
  });

  it('saves a venue application and mails support', async () => {
    const result = await call(
      post('/api/mekan-basvuru', {
        venueName: 'Kafe Lale',
        district: 'Kadıköy',
        contactName: 'Ayşe Yılmaz',
        phone: '0532 123 45 67',
        email: 'ayse@ornek.com',
        noticeRead: true,
        token: 'venue',
      }),
    );
    expect(result).toEqual({ status: 200, body: { ok: true } });
    await Promise.all(waits);
    expect(mails).toEqual([
      expect.objectContaining({
        to: ['support@skall.world'],
        subject: 'Pilot mekan başvurusu: Kafe Lale',
      }),
    ]);
    // The person stays in D1: the mail service and the inbox get no name, phone or e-mail.
    const sent = JSON.stringify(mails);
    for (const personal of ['Ayşe', '532', 'ayse@ornek.com']) expect(sent).not.toContain(personal);
    expect(
      db
        .prepare(
          'select phone, notice_version, emailed_at is not null as emailed from venue_applications',
        )
        .get(),
    ).toEqual({
      phone: '+905321234567',
      notice_version: '2026-11-28',
      emailed: 1,
    });
  });

  it('names the wrong venue fields before Turnstile', async () => {
    const result = await call(
      post('/api/mekan-basvuru', { venueName: 'Kafe', noticeRead: true, token: 'venue' }),
    );
    expect(result.status).toBe(400);
    expect(result.body.error).toMatchObject({
      code: 'bad_fields',
      fields: ['district', 'contactName', 'phone', 'email'],
    });
  });

  it('counts an IPv6 /64 as one address', async () => {
    const first = await firstSchool();
    for (let i = 0; i < DAILY_LIMITS.vote; i++) {
      const device = `${String(i).padStart(8, '0')}-9a4d-4e6f-8b2a-1c3d5e7f9a0b`;
      await call(
        post('/api/oy', { schoolId: first.id, device, token: 'vote' }, `2001:db8:1:2::${i + 1}`),
      );
    }
    const next = await call(
      post(
        '/api/oy',
        { schoolId: first.id, device: DEVICE_B, token: 'vote' },
        '2001:db8:1:2:ffff::9',
      ),
    );
    expect(next.status).toBe(429);
  });

  it('does not give back the name of a school that is not approved', async () => {
    await call(
      post('/api/okul-basvuru', {
        name: 'Bekleyen Üniversite',
        adult: true,
        device: DEVICE_A,
        token: 'school',
      }),
    );
    const again = await call(
      post('/api/okul-basvuru', {
        name: 'Başka Üniversite',
        adult: true,
        device: DEVICE_A,
        token: 'school',
      }),
    );
    expect(again.status).toBe(409);
    expect(again.body.error).toMatchObject({ code: 'already_voted', school: null });
    expect(db.prepare("select count(*) as n from schools where status = 'pending'").get()).toEqual({
      n: 1,
    });
  });

  it('refuses a body over the limit', async () => {
    const result = await call(
      post('/api/oy', { schoolId: 1, device: DEVICE_A, token: 'x'.repeat(5000) }),
    );
    expect(result.status).toBe(400);
  });

  it('deletes old applications and counters', async () => {
    db.exec(`insert into venue_applications (venue_name, district, contact_name, phone, email, notice_version, created_at)
      values ('Eski', 'X', 'Y', '+905321234567', 'a@b.co', 'v', '2025-01-01T00:00:00.000Z'),
             ('Yeni', 'X', 'Y', '+905321234567', 'a@b.co', 'v', '2026-11-27T00:00:00.000Z')`);
    db.exec(
      "insert into rate_limits values ('vote', 'h', '2026-11-26', 3), ('vote', 'h', '2026-11-27', 3), ('vote', 'h', '2026-11-28', 3)",
    );
    await cleanup(env, new Date('2026-11-28T03:00:00Z'));
    expect(db.prepare('select venue_name from venue_applications').all()).toEqual([
      { venue_name: 'Yeni' },
    ]);
    expect(db.prepare('select day from rate_limits').all()).toEqual([
      { day: '2026-11-27' },
      { day: '2026-11-28' },
    ]);
  });
});
