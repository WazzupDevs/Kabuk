// Connection details of the local Supabase stack, read from `supabase status`.
import { execSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';

import { createClient, FunctionsHttpError, type SupabaseClient } from '@supabase/supabase-js';
import postgres from 'postgres';

import { callName } from '../functions/_shared/pure/apiRetry.ts';
import type { Database } from '../functions/_shared/pure/database.ts';
import { sendsAgain, type ServeFault, serveFaultOf } from './refusal.ts';

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

// Every answer of the local serve's retiring isolate (refusal.ts), with a warning naming the call
// and whether it is sent again. In CI, INVOKE_RETRY_LOG collects them for the job summary
// (.github/workflows/ci.yml → "Retries"), so a call that comes back often shows, and so does an
// empty 503 that failed its test.
function noteFault(call: string, fault: ServeFault, again: boolean): void {
  console.warn(`local serve ${fault} on ${call}: ${again ? 'sending it again' : 'not sent again'}`);
  const log = process.env.INVOKE_RETRY_LOG;
  if (log) appendFileSync(log, `${call} ${fault} ${again ? 'yes' : 'no'}\n`);
}

// Calls an Edge Function; errors come back as { status, body } instead of throwing. A 5xx is never
// an expected answer, so it throws with the function, action and body to name the failure. A serve
// fault (refusal.ts) is sent again once when sendsAgain says so; otherwise, and on the second
// attempt, it throws too.
export async function invoke(
  client: Client,
  fn: string,
  body: Record<string, unknown>,
  attempt = 1,
): Promise<{ status: number; body: unknown }> {
  const call = callName(fn, body);
  const twice = attempt > 1 ? ' (sent twice)' : '';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), INVOKE_TIMEOUT_MS);
  let answer: { status: number; body: unknown } | { fault: ServeFault; failure: Error };
  try {
    answer = await send(client, call, fn, body, controller.signal, twice);
  } catch (e) {
    if (!controller.signal.aborted) throw e;
    answer = {
      fault: 'no-answer',
      failure: new Error(`${call} got no answer in ${INVOKE_TIMEOUT_MS} ms${twice}`, { cause: e }),
    };
  } finally {
    clearTimeout(timer);
  }
  if (!('fault' in answer)) return answer;
  const again = attempt === 1 && sendsAgain(answer.fault, call);
  noteFault(call, answer.fault, again);
  if (!again) throw answer.failure;
  return invoke(client, fn, body, 2);
}

async function send(
  client: Client,
  call: string,
  fn: string,
  body: Record<string, unknown>,
  signal: AbortSignal,
  twice: string,
): Promise<{ status: number; body: unknown } | { fault: ServeFault; failure: Error }> {
  const { data, error } = await client.functions.invoke(fn, { body, signal });
  // A request aborted mid-way may come back as an error value rather than a throw.
  signal.throwIfAborted();
  if (error instanceof FunctionsHttpError) {
    const status = error.context.status as number;
    const text = await (error.context as Response).text();
    const failure = new Error(`${call} answered ${status}: ${text}${twice}`);
    const fault = serveFaultOf(status, text);
    if (fault) return { fault, failure };
    if (status >= 500) throw failure;
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
