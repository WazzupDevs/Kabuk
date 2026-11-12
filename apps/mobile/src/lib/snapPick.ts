// What a snapping strip chooses (docs/design/iskelet.md → 5.10; motion/SnapStrip.tsx): only a
// scroll the finger began chooses where it comes to rest, and a tap chooses the option tapped. The
// strip's own scrolls (to a tapped option, to a choice made elsewhere) choose nothing: one of them
// cut short by the next comes to rest part of the way, and choosing from there sent the strip back
// and forth between two options without end (the owner's recording, 11 Kasım; #572). A new list
// (another slot, another pack) is placed on its chosen option without motion and chooses nothing.

// `rest`: still or settling on its own; `finger`: a scroll the finger began, until it rests; `own`:
// the strip's own scroll. `at`: the option the strip is on or going to (-1: none of its options).
export type SnapMode = 'rest' | 'finger' | 'own';
export type SnapState = { mode: SnapMode; at: number };

export type SnapEvent =
  // The finger began a scroll.
  | { kind: 'drag' }
  // The finger lifted: `at` when the strip rests there already (no fling follows), else null.
  | { kind: 'release'; at: number | null }
  // A scroll came to rest on `at`.
  | { kind: 'settle'; at: number }
  // An option tapped: the strip scrolls it to the centre.
  | { kind: 'tap'; at: number }
  // The choice changed elsewhere (Rastgele, Hepsini çıkar): the strip goes to it.
  | { kind: 'follow'; at: number; animated: boolean }
  // The strip placed on `at` without motion.
  | { kind: 'place'; at: number };

export type SnapOut = {
  state: SnapState;
  // The option chosen by this event, or null.
  pick: number | null;
  // Where the strip scrolls itself, or null.
  scroll: { at: number; animated: boolean } | null;
};

export function snapStart(at: number): SnapState {
  return { mode: 'rest', at };
}

const still = (state: SnapState): SnapOut => ({ state, pick: null, scroll: null });

// The finger's scroll ends on `at`: chosen when it is not what the strip was on.
function fingerRest(state: SnapState, at: number): SnapOut {
  return { state: { mode: 'rest', at }, pick: at !== state.at ? at : null, scroll: null };
}

export function snapStep(state: SnapState, event: SnapEvent): SnapOut {
  switch (event.kind) {
    case 'drag':
      return still({ mode: 'finger', at: state.at });
    case 'release':
      return event.at !== null && state.mode === 'finger'
        ? fingerRest(state, event.at)
        : still(state);
    case 'settle':
      // Only the finger's scroll chooses; the end of the strip's own (or a second end) does not.
      return state.mode === 'finger'
        ? fingerRest(state, event.at)
        : still({ mode: 'rest', at: state.at });
    case 'tap':
      return {
        state: { mode: 'own', at: event.at },
        pick: event.at !== state.at ? event.at : null,
        scroll: { at: event.at, animated: true },
      };
    case 'follow':
      if (event.at === state.at) return still(state);
      if (event.at < 0) return still({ mode: state.mode, at: event.at });
      return {
        state: { mode: event.animated ? 'own' : 'rest', at: event.at },
        pick: null,
        scroll: { at: event.at, animated: event.animated },
      };
    case 'place':
      return {
        state: { mode: 'rest', at: event.at },
        pick: null,
        scroll: event.at < 0 ? null : { at: event.at, animated: false },
      };
  }
}
