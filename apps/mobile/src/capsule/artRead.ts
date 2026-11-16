// What a drawing reads of the store's resources (capsule/useArt.ts → useArtValues): its keys'
// values in their order once all of them are made. No dependency: unit-tested
// (features/capsule/artRead.test.ts).

// The store's stamps of `keys` (artStore.ts → stamp), each followed by a comma: what changes when
// one of them is put again. '' for no keys, null as well: the stamps are only the store's note
// that something changed, never what says whether there is anything to read (an empty list of
// needs is all made: a still look with no motion inside a clip needs no plan).
export function stampsOf(keys: readonly string[] | null, stamp: (key: string) => number): string {
  if (!keys) return '';
  let out = '';
  for (const k of keys) out += `${stamp(k)},`;
  return out;
}

// `keys`' values in their order, undefined when one of them is not made, and when nothing is asked
// (null). An empty list reads as an empty list. `stamps` (stampsOf) is taken only so that a caller
// that memoizes on its arguments (React Compiler infers a memo's inputs from what it reads) reads
// again when one of the values is put again.
export function readArts<V>(
  keys: readonly string[] | null,
  peek: (key: string) => V | undefined,
  stamps = '',
): V[] | undefined {
  void stamps;
  if (!keys) return undefined;
  const out: V[] = [];
  for (const k of keys) {
    const v = peek(k);
    if (v === undefined) return undefined;
    out.push(v);
  }
  return out;
}
