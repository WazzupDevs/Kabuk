// The other table's connection in a room (Realtime presence). A drop shorter than the grace (a
// network switch, the app in the background for a moment, a reconnect) shows nothing; the note
// "Diğer masanın bağlantısı koptu." appears only after the other table has been gone for the whole
// grace, and goes away as soon as it is back.
export const OFFLINE_GRACE_MS = 15_000;

// Since when the other table has been gone: null while it is there; the first moment it was seen
// gone (or the screen opened without it) otherwise.
export function nextOfflineSince(prev: number | null, online: boolean, now: number): number | null {
  if (online) return null;
  return prev ?? now;
}

// Whether to show the note now.
export function showOffline(offlineSince: number | null, now: number): boolean {
  return offlineSince !== null && now - offlineSince >= OFFLINE_GRACE_MS;
}
