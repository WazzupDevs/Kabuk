import * as Updates from 'expo-updates';
import { create } from 'zustand';

import { type DrawPart, DRAW_STEPS, type LabParts, partsOff, togglePart } from './drawLabParts';

export { CHAT_PARTS, DRAW_PARTS, PROFILE_PARTS, DRAW_STEPS, SWITCH_PARTS } from './drawLabParts';
export type { DrawPart, DrawStep, DrawStepKey } from './drawLabParts';

// Ayarlar → Tasarım (test) → Çizim ölçümü: on the owner's own phone, what each part of a screen
// costs to draw (the owner's call, 29 Ekim: measure, never cut). The lab turns parts off one by one
// for a few seconds each while the phone's "profile rendering as bars" is recorded; the frame times
// of each step are read from the recording. The tab switch's parts (drawLabParts.ts) are turned off
// by hand, each on its own, while tabs are switched; each switch's frames are measured (Geçiş
// ölçümü, DrawLabPanel). Preview builds and development only; production never turns anything off
// (useLabOff and labOff are false there and the store never changes).
export const DRAW_LAB = Updates.channel === 'preview' || __DEV__;

type LabState = LabParts & {
  open: boolean;
  // Each tab opening while the panel is open (TabScene → markTabSwitch): the panel measures the
  // frames that follow.
  switches: number;
  // The capsule's Skia drawing while the panel is open (theme/capsuleSkia.ts → capsulePainter):
  // Süsle's big capsule and the measure's grid, either way on the same phone. It opens as the app
  // draws (CAPSULE_SKIA on this system).
  skia: boolean;
  // The whole capsule on one Skia canvas (theme/capsuleSkia.ts → capsuleWholeOn): on or off for
  // this phone, or null while the app's own switch decides. It stays as set when the panel closes:
  // the panel covers the top of Süsle, where it is measured.
  whole: boolean | null;
  // The whole drawing's pictures copied to the GPU ahead (theme/capsuleSkia.ts → textureAheadOn):
  // on or off for this phone, or null while the app's own switch decides; kept as `whole` is.
  texture: boolean | null;
  // The whole canvas's P2b ways (components/FxSkia.tsx, features/capsule/CapsuleStage.tsx), on
  // unless turned off here: a still part's picture cut to its pixels (`trim`), fewer layers
  // (`few`), the fading look's canvas kept between fades (`keep`). Kept as `whole` is.
  trim: boolean;
  few: boolean;
  keep: boolean;
  // "Kapanınca koru": the parts turned off by hand stay off when the panel closes.
  hold: boolean;
};
export const useDrawLab = create<LabState>(() => ({
  open: false,
  step: null,
  manual: [],
  switches: 0,
  skia: false,
  whole: null,
  texture: null,
  trim: true,
  few: true,
  keep: true,
  hold: false,
}));

export function useLabOff(part: DrawPart): boolean {
  return useDrawLab((s) => DRAW_LAB && partsOff(s).includes(part));
}

// The same outside a render (a listener reads it when it runs).
export function labOff(part: DrawPart): boolean {
  return DRAW_LAB && partsOff(useDrawLab.getState()).includes(part);
}

// The panel's `skia` switch, null while the panel is closed (the app's own switch decides then).
export function useLabSkia(): boolean | null {
  return useDrawLab((s) => (DRAW_LAB && s.open ? s.skia : null));
}

// The panel's "Bütün kapsül Skia", panel open or closed (a preview build only); null when it has
// not been set (the app's own switch decides).
export function useLabWhole(): boolean | null {
  return useDrawLab((s) => (DRAW_LAB ? s.whole : null));
}

// `now`: what the capsule draws with at present (the panel reads it from capsuleWholeOn).
export function toggleLabWhole(now: boolean) {
  if (!DRAW_LAB) return;
  useDrawLab.setState({ whole: !now });
}

// The panel's "Önceden doku", panel open or closed (a preview build only); null when it has not
// been set. In a render, and outside one (the queue reads it before each copy).
export function useLabTexture(): boolean | null {
  return useDrawLab((s) => (DRAW_LAB ? s.texture : null));
}
export function labTexture(): boolean | null {
  return DRAW_LAB ? useDrawLab.getState().texture : null;
}

// `now`: whether the pictures are copied ahead at present (theme/capsuleSkia.ts → textureAheadOn).
export function toggleLabTexture(now: boolean) {
  if (!DRAW_LAB) return;
  useDrawLab.setState({ texture: !now });
}

// The whole canvas's P2b ways (on everywhere but a preview build that turned one off).
export type LabP2b = { trim: boolean; few: boolean; keep: boolean };
export function useLabTrim(): boolean {
  return useDrawLab((s) => !DRAW_LAB || s.trim);
}
export function useLabFew(): boolean {
  return useDrawLab((s) => !DRAW_LAB || s.few);
}
export function useLabKeep(): boolean {
  return useDrawLab((s) => !DRAW_LAB || s.keep);
}
// The same outside a render (a look's list is made in the queue).
export function labTrim(): boolean {
  return !DRAW_LAB || useDrawLab.getState().trim;
}
export function toggleLabP2b(way: keyof LabP2b) {
  if (!DRAW_LAB) return;
  useDrawLab.setState((s) =>
    way === 'trim' ? { trim: !s.trim } : way === 'few' ? { few: !s.few } : { keep: !s.keep },
  );
}

export function useLabHold(): boolean {
  return useDrawLab((s) => DRAW_LAB && s.hold);
}

export function toggleLabHold() {
  if (!DRAW_LAB) return;
  useDrawLab.setState((s) => ({ hold: !s.hold }));
}

export function toggleLabSkia() {
  if (!DRAW_LAB) return;
  useDrawLab.setState((s) => ({ skia: !s.skia }));
}

export function toggleLabPart(part: DrawPart) {
  if (!DRAW_LAB) return;
  useDrawLab.setState((s) => ({ manual: togglePart(s.manual, part) }));
}

// A tab opened (after another tab): measured only while the panel is open.
export function markTabSwitch() {
  if (!DRAW_LAB || !useDrawLab.getState().open) return;
  useDrawLab.setState((s) => ({ switches: s.switches + 1 }));
}

const DRAW_STEP_MS = 5000;
let timers: ReturnType<typeof setTimeout>[] = [];

// `skia`: what the app draws the capsule with (the caller reads theme/capsuleSkia.ts: this file is
// on the launch's path and does not import the drawings).
export function openDrawLab(open: boolean, skia = false) {
  stopDrawLab();
  // Closing the panel turns every part back on (and gives the Skia drawing back to the app's
  // switch); opening it starts from what the app draws.
  useDrawLab.setState((s) =>
    open ? { open, skia } : { open, manual: s.hold ? s.manual : [], skia: false },
  );
}

export function startDrawLab() {
  stopDrawLab();
  DRAW_STEPS.forEach((_, i) => {
    timers.push(setTimeout(() => useDrawLab.setState({ step: i }), i * DRAW_STEP_MS));
  });
  timers.push(
    setTimeout(() => useDrawLab.setState({ step: null }), DRAW_STEPS.length * DRAW_STEP_MS),
  );
}

function stopDrawLab() {
  timers.forEach(clearTimeout);
  timers = [];
  useDrawLab.setState({ step: null });
}
