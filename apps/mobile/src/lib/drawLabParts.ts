// Çizim ölçümü's parts and steps (lib/drawLab.ts), pure so drawLabParts.test.ts pins them.
//
// `cam` the liquid glass (tab bar, chat composer), `golge` the kit's outer shadows, `kart` the glass
// cards' gradient (a flat colour instead), `zemin` the colour clouds behind the screen, `hareket`
// every loop (live dots, buddies, the capsule's look). The tab switch's parts, each on its own
// (docs/denetim/performans-2026-11.md → B4): `buzlu` the frost under clear buttons, chips and
// fields (aura/kit → useFrost; the button keeps its own fill, as below Android 12), `bulanma` the
// tab's blur dissolve (DissolveView: no blur, the arrival's fade and rise stay), `gelis` the tab's
// fade and rise (TabScene: the screen in place at once, the blur stays), `kademe` the screen's
// cascade played again on each opening (Screen, Keşfet's rows: the tab's focus context no longer
// changes on an opening, so nothing under it draws again).
// The chat's parts (docs/perf/akicilik-denetimi.md → 4.3: a chat's every frame costs the same
// whatever its bubbles hold; which full-screen layer costs it is measured with these): `duvar` the
// wallpaper (the plain ground instead), `bant` the wallpaper's strips under the bars. The wall, its
// strips and the shadows did not move a frame's cost (4.4 B), so two more, which change what the
// chat shows and are for measuring only: `ters` the list not flipped (a chat's list is drawn from
// the bottom up, itself and each row mirrored: unflipped it reads newest first), `balon` a bubble
// as a plain round box (no drawn shape and tail, no skin).
export type DrawPart =
  | 'cam'
  | 'golge'
  | 'kart'
  | 'zemin'
  | 'hareket'
  | 'buzlu'
  | 'bulanma'
  | 'gelis'
  | 'kademe'
  | 'duvar'
  | 'bant'
  | 'ters'
  | 'balon'
  | 'karo';

export const DRAW_PARTS: readonly DrawPart[] = [
  'cam',
  'buzlu',
  'golge',
  'kart',
  'zemin',
  'hareket',
  'bulanma',
  'gelis',
  'kademe',
  'duvar',
  'bant',
  'ters',
  'balon',
  'karo',
];

// The tab switch's own parts: turned off by hand (the panel's switches) while tabs are switched,
// not by the timed steps (a switch is a press, not a few seconds of a still screen).
export const SWITCH_PARTS: readonly DrawPart[] = ['buzlu', 'bulanma', 'gelis', 'kademe', 'cam'];

// `karo`: Süsle's option tiles as the picture way's SVG again while the whole capsule is Skia's
// (FxSkia.tsx → tileUri), to tell the tiles' cost from the big capsule's (4.9).

// The chat's parts, turned off by hand; with "Kapanınca koru" they stay off when the panel closes
// (the panel covers the top of the chat it measures).
export const CHAT_PARTS: readonly DrawPart[] = ['duvar', 'bant', 'golge', 'ters', 'balon'];

export type DrawStepKey =
  'all' | 'cam' | 'buzlu' | 'golge' | 'kart' | 'zemin' | 'four' | 'hareket' | 'end';
export type DrawStep = { key: DrawStepKey; off: readonly DrawPart[] };
export const DRAW_STEPS: readonly DrawStep[] = [
  { key: 'all', off: [] },
  { key: 'cam', off: ['cam'] },
  { key: 'buzlu', off: ['buzlu'] },
  { key: 'golge', off: ['golge'] },
  { key: 'kart', off: ['kart'] },
  { key: 'zemin', off: ['zemin'] },
  { key: 'four', off: ['cam', 'golge', 'kart', 'zemin'] },
  { key: 'hareket', off: ['hareket'] },
  { key: 'end', off: [] },
];

export type LabParts = { step: number | null; manual: readonly DrawPart[] };

// What is off now: the running step's parts and the ones turned off by hand.
export function partsOff(s: LabParts): readonly DrawPart[] {
  const stepOff = s.step === null ? [] : (DRAW_STEPS[s.step]?.off ?? []);
  if (s.manual.length === 0) return stepOff;
  return [...new Set([...stepOff, ...s.manual])];
}

// A switch pressed: the part off if it was on, on if it was off.
export function togglePart(manual: readonly DrawPart[], part: DrawPart): readonly DrawPart[] {
  return manual.includes(part) ? manual.filter((p) => p !== part) : [...manual, part];
}
