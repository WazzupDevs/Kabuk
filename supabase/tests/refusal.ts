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
//   may answer differently (a second `rooms/create` finds the table already in the room the first
//   one opened and answers `already_in_room`).
// local.ts → invoke sends a call again once and writes every one of these answers to
// INVOKE_RETRY_LOG, sent again or not, for the CI job summary.
import { IDEMPOTENT_CALLS } from '../functions/_shared/pure/apiRetry.ts';

export type Refusal = 'retired-500' | 'no-answer';
export type ServeFault = Refusal | 'empty-503';

export const RETIRED_WORKER_BODY =
  '{"code":"Internal Server Error","message":"Request failed due to an internal server error"}';

// The serve fault an answer is, or null for an answer to look at as it is (`no-answer` has no
// answer to look at).
export function serveFaultOf(status: number, body: string): ServeFault | null {
  if (status === 500 && body === RETIRED_WORKER_BODY) return 'retired-500';
  if (status === 503 && body === '') return 'empty-503';
  return null;
}

// Whether `call` ("tabu/mark", pure/apiRetry.ts → callName) is sent again after `fault`.
export function sendsAgain(fault: ServeFault, call: string): boolean {
  return fault !== 'empty-503' || (IDEMPOTENT_CALLS as readonly string[]).includes(call);
}
