import * as Updates from 'expo-updates';
import { create } from 'zustand';

import { type DrawPart, DRAW_STEPS, type LabParts, partsOff, togglePart } from './drawLabParts';

export { DRAW_PARTS, DRAW_STEPS, SWITCH_PARTS } from './drawLabParts';
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
};
export const useDrawLab = create<LabState>(() => ({
  open: false,
  step: null,
  manual: [],
  switches: 0,
}));

export function useLabOff(part: DrawPart): boolean {
  return useDrawLab((s) => DRAW_LAB && partsOff(s).includes(part));
}

// The same outside a render (a listener reads it when it runs).
export function labOff(part: DrawPart): boolean {
  return DRAW_LAB && partsOff(useDrawLab.getState()).includes(part);
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

export function openDrawLab(open: boolean) {
  stopDrawLab();
  // Closing the panel turns every part back on.
  useDrawLab.setState(open ? { open } : { open, manual: [] });
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
