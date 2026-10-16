// How a request the local serve refused reaches the caller. The serve (`per_worker`) retires an
// isolate once the CPU time of the requests it served adds up past its 1 s soft limit, or 200 s
// after it started (half its 400 s wall clock). A request routed to it at that moment is refused
// before the function runs (WorkerAlreadyRetired, edge-runtime crates/base/src/worker/pool.rs), and
// the caller gets one of two answers, none from our code (ours is `{ error: { code, message } }`):
// - 500 with RETIRED_WORKER_BODY from the serve's main service;
// - no answer at all: the main service never sends its 500 (`no-answer`, decided by the caller's
//   timeout, not here).
// Nothing ran, so sending the request again is its first attempt (local.ts → invoke).
// Not a refusal: a 503 with an empty body ("connection aborted" in the serve's log) also comes when
// the isolate retires, but after the function answered: a `rooms/respond` accept was written and
// the 503 came back. Sent again, a call that is not idempotent answers differently, so it stays a
// failure.
export type Refusal = 'retired-500' | 'no-answer';

export const RETIRED_WORKER_BODY =
  '{"code":"Internal Server Error","message":"Request failed due to an internal server error"}';

// The refusal an answer is, or null for an answer to look at as it is.
export function refusalOf(status: number, body: string): Refusal | null {
  return status === 500 && body === RETIRED_WORKER_BODY ? 'retired-500' : null;
}
