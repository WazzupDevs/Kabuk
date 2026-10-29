import * as Updates from 'expo-updates';
import { create } from 'zustand';

// Ayarlar → Tasarım (test) → Çizim ölçümü: on the owner's own phone, what each part of a screen
// costs to draw (the owner's call, 29 Ekim: measure, never cut). The lab turns parts off one by one
// for a few seconds each while the phone's "profile rendering as bars" is recorded; the frame times
// of each step are read from the recording. Preview builds and development only; production never
// turns anything off (labOff is false there and the store never changes).
export const DRAW_LAB = Updates.channel === 'preview' || __DEV__;

// `cam` the liquid glass (tab bar, chat composer), `golge` the kit's outer shadows, `kart` the glass
// cards' gradient (a flat colour instead), `zemin` the colour clouds behind the screen, `hareket`
// every loop (live dots, buddies, the capsule's look).
export type DrawPart = 'cam' | 'golge' | 'kart' | 'zemin' | 'hareket';

export type DrawStepKey = 'all' | 'cam' | 'golge' | 'kart' | 'zemin' | 'four' | 'hareket' | 'end';
export type DrawStep = { key: DrawStepKey; off: readonly DrawPart[] };
export const DRAW_STEPS: readonly DrawStep[] = [
  { key: 'all', off: [] },
  { key: 'cam', off: ['cam'] },
  { key: 'golge', off: ['golge'] },
  { key: 'kart', off: ['kart'] },
  { key: 'zemin', off: ['zemin'] },
  { key: 'four', off: ['cam', 'golge', 'kart', 'zemin'] },
  { key: 'hareket', off: ['hareket'] },
  { key: 'end', off: [] },
];
export const DRAW_STEP_MS = 5000;

type LabState = { open: boolean; step: number | null };
export const useDrawLab = create<LabState>(() => ({ open: false, step: null }));

const NONE: readonly DrawPart[] = [];
function offIn(s: LabState): readonly DrawPart[] {
  return s.step === null ? NONE : (DRAW_STEPS[s.step]?.off ?? NONE);
}

// Read while drawing (shadowParts); the component drawing it calls useLabOff so it draws again.
export function labOff(part: DrawPart): boolean {
  return DRAW_LAB && offIn(useDrawLab.getState()).includes(part);
}

export function useLabOff(part: DrawPart): boolean {
  return useDrawLab((s) => DRAW_LAB && offIn(s).includes(part));
}

let timers: ReturnType<typeof setTimeout>[] = [];

export function openDrawLab(open: boolean) {
  stopDrawLab();
  useDrawLab.setState({ open });
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
