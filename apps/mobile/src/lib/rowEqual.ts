// Memo comparison for a chat row: a row's data (a message, its quote, its reactions) comes back
// from the server as new objects with the same content, and a function prop is the parent's to keep
// stable. Props are equal when each is the same value, or plain data with the same JSON.
export function sameRowProps<P extends object>(prev: P, next: P): boolean {
  const a = prev as Record<string, unknown>;
  const b = next as Record<string, unknown>;
  const keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) return false;
  for (const key of keys) {
    const x = a[key];
    const y = b[key];
    if (Object.is(x, y)) continue;
    if (typeof x !== 'object' || typeof y !== 'object' || x === null || y === null) return false;
    if (JSON.stringify(x) !== JSON.stringify(y)) return false;
  }
  return true;
}
