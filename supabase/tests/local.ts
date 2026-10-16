// Connection details of the local Supabase stack, read from `supabase status`.
import { execSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';

import { createClient, FunctionsHttpError, type SupabaseClient } from '@supabase/supabase-js';
import postgres from 'postgres';

import type { Database } from '../functions/_shared/pure/database.ts';
import { type Refusal, refusalOf } from './refusal.ts';

function readStatus(): Record<string, string> {
  const out = execSync('pnpm -s supabase status -o env', { encoding: 'utf8' });
  return Object.fromEntries(
    out
      .split('\n')
      .map((line) => line.match(/^([A-Z_]+)="?(.*?)"?$/))
      .filter((m): m is RegExpMatchArray => m !== null)
      .map((m) => [m[1], m[2]]),
  );
}

const status = readStatus();

function value(name: string): string {
  const v = status[name];
  if (!v) throw new Error(`supabase status has no ${name}; is the local stack running?`);
  return v;
}

export const apiUrl = value('API_URL');
export const anonKey = value('ANON_KEY');
const secretKey = value('SECRET_KEY');
export const dbUrl = value('DB_URL');
export const sql = postgres(dbUrl, { max: 1, onnotice: () => {} });

export const TEST_OTP = '123456';

// Same kind of client `pnpm admin:ban` uses on a developer machine.
export const admin = createClient<Database>(apiUrl, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Signs a local test number in (see [auth.sms.test_otp] in config.toml).
export async function signIn(phone: string): Promise<SupabaseClient<Database>> {
  const client = createClient<Database>(apiUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  // Skip the 60 s resend limit (auth.sms.max_frequency) when a test signs the same number in again.
  await sql`
    update auth.users set confirmation_sent_at = null, recovery_sent_at = null
    where phone = ${phone.replace(/\D/g, '')}
  `;
  const sent = await client.auth.signInWithOtp({ phone });
  if (sent.error) throw sent.error;
  const verified = await client.auth.verifyOtp({ phone, token: TEST_OTP, type: 'sms' });
  if (verified.error) throw verified.error;
  return client;
}

export async function deleteUserByPhone(phone: string): Promise<void> {
  await sql`delete from auth.users where phone = ${phone.replace(/\D/g, '')}`;
}

export type Client = SupabaseClient<Database>;

// Every function answers locally in well under a second; a request still open after this was
// refused by the local serve and never answered (refusal.ts), or hung. Either way it is named here
// with its function and action instead of as an unnamed test timeout.
export const INVOKE_TIMEOUT_MS = 10_000;

// A call the local serve refused (refusal.ts) is sent again once, with a warning naming it. In CI,
// INVOKE_RETRY_LOG collects them for the job summary (.github/workflows/ci.yml → "Retries"), so a
// call that comes back often shows.
function noteRetry(call: string, refusal: Refusal): void {
  console.warn(`local serve refused ${call} (${refusal}): sending it again`);
  const log = process.env.INVOKE_RETRY_LOG;
  if (log) appendFileSync(log, `${call} ${refusal}\n`);
}

// Calls an Edge Function; errors come back as { status, body } instead of throwing. A 5xx is never
// an expected answer, so it throws with the function, action and body to name the failure; so does
// a refusal of the second attempt.
export async function invoke(
  client: Client,
  fn: string,
  body: Record<string, unknown>,
  attempt = 1,
): Promise<{ status: number; body: unknown }> {
  const call = `${fn}/${String(body.action)}`;
  const again = attempt > 1 ? ' (sent twice)' : '';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), INVOKE_TIMEOUT_MS);
  let answer: { status: number; body: unknown } | Refusal;
  try {
    answer = await send(client, fn, body, controller.signal, again);
  } catch (e) {
    if (!controller.signal.aborted) throw e;
    if (attempt > 1) {
      throw new Error(`${call} got no answer in ${INVOKE_TIMEOUT_MS} ms${again}`, { cause: e });
    }
    answer = 'no-answer';
  } finally {
    clearTimeout(timer);
  }
  if (typeof answer === 'string') {
    noteRetry(call, answer);
    return invoke(client, fn, body, 2);
  }
  return answer;
}

async function send(
  client: Client,
  fn: string,
  body: Record<string, unknown>,
  signal: AbortSignal,
  again: string,
): Promise<{ status: number; body: unknown } | Refusal> {
  const { data, error } = await client.functions.invoke(fn, { body, signal });
  // A request aborted mid-way may come back as an error value rather than a throw.
  signal.throwIfAborted();
  if (error instanceof FunctionsHttpError) {
    const status = error.context.status as number;
    const text = await (error.context as Response).text();
    const refusal = refusalOf(status, text);
    if (refusal && !again) return refusal;
    if (status >= 500) {
      throw new Error(`${fn}/${String(body.action)} answered ${status}: ${text}${again}`);
    }
    return { status, body: JSON.parse(text) as unknown };
  }
  if (error) throw error;
  return { status: 200, body: data as unknown };
}

export async function userIdOf(client: Client): Promise<string> {
  const { data } = await client.auth.getUser();
  if (!data.user) throw new Error('not signed in');
  return data.user.id;
}
