// What Kapsülünü süsle reads ahead in idle time, in order (profile/capsule.tsx).

// The indices of a row of `count` within `reach` of `centre`, the nearest first (the one after
// before the one before at the same distance), `centre` itself first when it is in the row.
export function nearFirst(count: number, centre: number, reach: number): number[] {
  const out: number[] = [];
  const add = (i: number) => {
    if (i >= 0 && i < count) out.push(i);
  };
  add(centre);
  for (let d = 1; d <= reach; d++) {
    add(centre + d);
    add(centre - d);
  }
  return out;
}

// Every slot's tiles in the order they are read: the open slot's from its chosen option outwards
// (what a scroll reaches first), then the other slots' in their order.
export function tileOrder<T>(
  slots: readonly { id: string; flat: readonly T[] }[],
  open: string,
  chosen: number,
): T[] {
  const first = slots.find((s) => s.id === open);
  const out: T[] = [];
  if (first) {
    const at = Math.min(Math.max(chosen, 0), Math.max(first.flat.length - 1, 0));
    for (const i of nearFirst(first.flat.length, at, first.flat.length)) {
      const t = first.flat[i];
      if (t !== undefined) out.push(t);
    }
  }
  for (const s of slots) if (s.id !== open) out.push(...s.flat);
  return out;
}

// The options next to the chosen one whose stage drawing is read ahead: `reach` either side, the
// chosen one left out (it is drawn already).
export const STAGE_AHEAD = 2;

export function stageAhead(count: number, chosen: number, reach: number = STAGE_AHEAD): number[] {
  return nearFirst(count, chosen, reach).filter((i) => i !== chosen);
}
