// The visual gate's screens drawn from their own data (src/features/design/gorsel): with the app
// off the network, nothing they mount reaches the server (no Edge Function, no database read, no
// Realtime channel), so the screen shows only what the gate put in its query cache. Never put back:
// the gate starts the app afresh for every shot (deterministic.ts → freezeWorld). Off by default;
// nothing else turns it on.
let off = false;

export function goOffline(): void {
  off = true;
}

export function isOffline(): boolean {
  return off;
}
