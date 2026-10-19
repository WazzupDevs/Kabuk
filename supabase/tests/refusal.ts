// How the local serve's retiring isolate reaches the caller, and which calls are sent again. The
// serve (`per_worker`) retires an isolate once the CPU time of the requests it served adds up past
// its 1 s soft limit, or 200 s after it started (half its 400 s wall clock). None of these answers
// comes from our code (ours is `{ error: { code, message } }`):
// - Refused (WorkerAlreadyRetired, edge-runtime crates/base/src/worker/pool.rs): a request routed
//   to the isolate at that moment never reaches the function. It comes back as a 500 with
//   RETIRED_WORKER_BODY from the serve's main service, or as no answer at all when the main
//   service never sends that 500 (`no-answer`, decided by the caller's timeout, not here). Nothing
//   ran, so sending it again is its first attempt: every call is sent again.
// - Cut off (`empty-503`, "connection aborted" in the serve's log): a 503 with an empty body, also
//   when the isolate retires, but after the function answered: a `rooms/respond` accept was written
//   and the 503 came back. Only a call that answers the same when sent twice is sent again:
//   IDEMPOTENT_CALLS (pure/apiRetry.ts), the calls the app itself sends again after a 5xx, each
//   with an integration test that sends it twice. Any other call stays a failure: sent again, it
//   may answer differently (a second `rooms/create` finds the room the first one opened and
//   answers `already_in_room`; a second `dm/send` writes the message twice).
// - No runtime (`no-runtime`): Kong's 503 `{"message":"name resolution failed"}`, when the serve's
//   container is gone and Kong cannot find its host. On 18 and 19 Oct it died ("error running
//   container: exit 135") seconds after it started; CI starts it again (scripts/ci/functions-
//   serve.sh). Nothing ran: local.ts waits until `ping` answers (SERVE_WAIT_MS at most), then sends
//   the call again.
// local.ts → invoke sends a call again once and writes every one of these answers to
// INVOKE_RETRY_LOG, sent again or not, for the CI job summary.
import { IDEMPOTENT_CALLS } from '../functions/_shared/pure/apiRetry.ts';

export type Refusal = 'retired-500' | 'no-answer' | 'no-runtime';
export type ServeFault = Refusal | 'empty-503';

export const RETIRED_WORKER_BODY =
  '{"code":"Internal Server Error","message":"Request failed due to an internal server error"}';

const NO_RUNTIME_MESSAGE = 'name resolution failed';

// The serve fault an answer is, or null for an answer to look at as it is (`no-answer` has no
// answer to look at).
export function serveFaultOf(status: number, body: string): ServeFault | null {
  if (status === 500 && body === RETIRED_WORKER_BODY) return 'retired-500';
  if (status === 503 && body === '') return 'empty-503';
  if (status === 503 && kongMessage(body) === NO_RUNTIME_MESSAGE) return 'no-runtime';
  return null;
}

// Kong's own error body, `{"message": "…"}` (its spacing and line breaks vary), or null.
function kongMessage(body: string): string | null {
  try {
    const parsed: unknown = JSON.parse(body);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const { message } = parsed as { message?: unknown };
    return Object.keys(parsed).length === 1 && typeof message === 'string' ? message : null;
  } catch {
    return null;
  }
}

// Asks `answers` every `everyMs` until it says yes; false once `timeoutMs` has passed.
export async function waitUntil(
  answers: () => Promise<boolean>,
  timeoutMs: number,
  everyMs: number,
  sleep: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms)),
  now: () => number = Date.now,
): Promise<boolean> {
  const end = now() + timeoutMs;
  for (;;) {
    if (await answers()) return true;
    if (now() + everyMs > end) return false;
    await sleep(everyMs);
  }
}

// Whether `call` ("tabu/mark", pure/apiRetry.ts → callName) is sent again after `fault`.
export function sendsAgain(fault: ServeFault, call: string): boolean {
  return fault !== 'empty-503' || (IDEMPOTENT_CALLS as readonly string[]).includes(call);
}
