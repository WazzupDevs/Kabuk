// Ayarlar, value for value from the approved board (tuval: Ayarlar.dc.html; 390 × 844) where
// docs/design/iskelet.md → 5.9 gives no value of its own. The sheet's 8 from the edges, its 40
// corners, the handle and the 38 close button (3.5) are iskelet's.
import { EXPLORE } from './explore';
import type { ExploreFace } from './explore';

export const SETTINGS = {
  // The sheet 16 inside, 40 under its last part; the handle 10 under its top, the title's row 10
  // under the handle, the title 22 in from the sheet's left (6 more than the content), the close
  // button 16 from its right; the content 76 under the sheet's top (13 under the title's row).
  sheet: { padX: 16, padBottom: 40, headTop: 10, titleIn: 6, closeIn: 0, bodyTop: 13 },
  // A group's card: 22 round. A row 56 high, 14 in, 14 between its parts; the icon's square 32, 10
  // round, its icon 17; the chevron 16; the hairline from 58 in to the card's right edge.
  card: { radius: 22 },
  row: { height: 56, padX: 14, gap: 14, icon: 17, chevron: 16, hairIn: 58 },
  // Çıkış yap alone on its card, 54 high, 20 under the seg above it.
  signOut: { height: 54, top: 20 },
  // A section's eyebrow 18 under what is above it, 14 in, 8 over its seg; the note 8 under the seg,
  // 14 in at either side.
  eyebrow: { top: 18, bottom: 8, in: 14 },
  note: { top: 8, in: 14, gap: 4 },
  // The seg: 46 high, 23 round, 4 inside, its parts flush, the chosen one 38 high (19 round).
  seg: { item: 38, radius: 23, gap: 0 },
  // Each page's square in its own colour.
  tone: {
    notifications: '#0E8745',
    privacy: '#2C63D6',
    account: '#FF4F8B',
    test: '#6B7E71',
  },
  light: {
    // The sheet's ground: a pink light at its top right and a green one at its left, on #F3F7F4.
    ground:
      'radial-gradient(80% 25% at 100% 0%, #F8E3EB 0%, rgba(248, 227, 235, 0) 70%), radial-gradient(80% 25% at 0% 0%, #DDF1E5 0%, rgba(221, 241, 229, 0) 70%)',
    base: '#F3F7F4',
    card: {
      fill: 'rgba(255, 255, 255, 0.92)',
      edge: '#FFFFFF',
      inset: '',
      shadow: '0px 1px 2px rgba(3, 27, 11, 0.04), 0px 10px 26px rgba(3, 27, 11, 0.06)',
    } satisfies ExploreFace,
    hair: '#E6EDE8',
    chevron: '#9AAEA1',
    eyebrow: '#4A6550',
    note: '#6B7E71',
    signOut: '#C8331F',
    segTrack: 'rgba(3, 27, 11, 0.06)',
    segOnShadow: '0px 3px 10px rgba(3, 27, 11, 0.10)',
  },
  // The dark scheme is not drawn on the board: the kit's dark sheet and its card.
  dark: {
    ground: '',
    base: '#121614',
    card: {
      fill: '#1B211F',
      edge: 'rgba(255, 255, 255, 0.09)',
      inset: '',
      shadow: '',
    } satisfies ExploreFace,
    hair: 'rgba(255, 255, 255, 0.07)',
    chevron: EXPLORE.dark.chevron,
    eyebrow: '#A3AEA8',
    note: '#A3AEA8',
    signOut: '#FF977E',
    segTrack: EXPLORE.dark.track,
    segOnShadow: '',
  },
} as const;
