import type { ReactNode } from 'react';

import { PREVIEW_SETS } from '../previews';

// `full`: the state draws the whole screen itself (a game's stage), one page, no side padding.
export type GateEntry = { render: () => ReactNode; full?: boolean };

// Every state the visual gate can open (CLAUDE.md → Görsel kapı; e2e/visual/states.json picks
// which ones it photographs). Keys:
// - `galeri/<set>`: a set of Ayarlar → Tasarım (test) → Bileşen önizleme;
// - `oyun/<game>/<phase>`: a phase of a game with a fixed state: the game's own stage component
//   with a fixture (its state as props, no server, no-op actions), e.g. before the turn, while
//   telling, the vote, the result. A new game adds its phases here in its first PR.
// - later the non-game screens, with v46's sample data, as the screens session moves them.
export const GATE_STATES: Record<string, GateEntry> = {
  ...Object.fromEntries(PREVIEW_SETS.map((s) => [`galeri/${s.key}`, { render: s.render }])),
};
