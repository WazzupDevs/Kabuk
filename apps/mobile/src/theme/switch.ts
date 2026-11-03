import type { Palette } from './tokens';

// The skall tuvali's switch (skall.css → "Anahtar"): the control track off, the primary track on,
// a white thumb with a soft shadow, no outlines. The thumb's side says the state as well.
export type SwitchColors = {
  track: string;
  thumb: string;
};

export function switchColors(palette: Palette, on: boolean): SwitchColors {
  return { track: on ? palette.primary : palette.control, thumb: palette.onPrimary };
}
