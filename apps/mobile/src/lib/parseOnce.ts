// A drawing parsed once per key for the app's life (the CTO's 4.2b review: a list of 100 messages
// would otherwise parse the same drawings again and again). A drawing that does not parse is kept
// as null, so the caller draws its stand-in instead of throwing on every render and taking the
// screen down; the error is handed on once.
export function parseOnce<K, T>(
  cache: Map<K, T | null>,
  key: K,
  parse: () => T | null,
  onError: (error: unknown) => void,
): T | null {
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  let tree: T | null;
  try {
    tree = parse();
  } catch (error) {
    tree = null;
    onError(error);
  }
  cache.set(key, tree);
  return tree;
}
