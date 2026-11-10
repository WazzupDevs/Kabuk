// At most this many faces move in a chat at a time (the newest of those on the screen).
export const FACE_MOVERS = 4;

// The keys of the rows whose face moves: of the rows on the screen, the newest `limit` (the lists
// run newest first, so the lowest index). `visible` is what the list reports as viewable.
export function faceMovers(
  visible: readonly { key: string; index: number | null }[],
  limit: number = FACE_MOVERS,
): ReadonlySet<string> {
  return new Set(
    visible
      .filter((v): v is { key: string; index: number } => v.index !== null)
      .sort((a, b) => a.index - b.index)
      .slice(0, Math.max(0, limit))
      .map((v) => v.key),
  );
}

export function sameKeys(a: ReadonlySet<string>, b: ReadonlySet<string>): boolean {
  if (a.size !== b.size) return false;
  for (const k of a) if (!b.has(k)) return false;
  return true;
}
