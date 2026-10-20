import type { ReactNode } from 'react';
import { View } from 'react-native';

import { UI_GALLERY } from '@/features/gallery/registry';

import { PREVIEW_SETS } from '../previews';

// `full`: the state draws the whole screen itself (a game's stage), one page, no side padding.
// `bare`: in the frame without its side padding, so a component as wide as v46 makes it in its own
// place (328 for the disabled primaries) is not narrowed to the padded 320.
export type GateEntry = { render: () => ReactNode; full?: boolean; bare?: boolean };

// Every state the visual gate can open (CLAUDE.md → Görsel kapı; e2e/visual/states.json picks
// which ones it photographs). Keys:
// - `galeri/<set>`: a set of Ayarlar → Tasarım (test) → Bileşen önizleme;
// - `oyun/<game>/<phase>`: a phase of a game with a fixed state: the game's own stage component
//   with a fixture (its state as props, no server, no-op actions), e.g. before the turn, while
//   telling, the vote, the result. A new game adds its phases here in its first PR.
// - `galeri/v46/<id>`: a component rewritten from v46 (src/ui), as the v46 gallery draws it first
//   (features/gallery/registry.tsx), in `gorsel-oge`: states.json crops to it (`uygulamaKirp`)
//   beside the same component in v46's gallery or screen;
// - later the non-game screens, with v46's sample data, as the screens session moves them.
export const GATE_STATES: Record<string, GateEntry> = {
  ...Object.fromEntries(PREVIEW_SETS.map((s) => [`galeri/${s.key}`, { render: s.render }])),
  ...Object.fromEntries(
    Object.entries(UI_GALLERY).flatMap(([id, states]) => {
      const first = states?.[0];
      if (!first) return [];
      const entry: GateEntry = {
        bare: true,
        render: () => (
          <View testID="gorsel-oge" style={{ alignSelf: first.wide ? 'stretch' : 'flex-start' }}>
            {first.render()}
          </View>
        ),
      };
      return [[`galeri/v46/${id}`, entry]];
    }),
  ),
};
