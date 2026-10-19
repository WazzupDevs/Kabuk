import { mixOklab } from './gameColors';
import type { ColorScheme } from './tokens';

// The sender's name inside a venue chat bubble, and in a quote of their message, takes one of six
// colours, the same one every time for the same name (v45: VC.col, .vname). Light: the colours as
// they are, on the white bubble. Dark: each mixed with white (38 % colour in OKLab, v45's
// color-mix), on the dark bubble. Pure data: nameInk.test.ts checks every pair for 4.5:1.
export const NAME_INKS = [
  '#5A3AE6',
  '#C51F62',
  '#1C7843',
  '#9A5300',
  '#3B25A6',
  '#0F6E8C',
] as const;
const DARK_MIX = 0.38;

// v45's hash over the name's UTF-16 units: the same name gets the same colour on every phone.
export function nameInkIndex(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 41 + name.charCodeAt(i)) >>> 0;
  return h % NAME_INKS.length;
}

export function nameInks(scheme: ColorScheme): readonly string[] {
  return scheme === 'dark' ? NAME_INKS.map((c) => mixOklab(c, '#FFFFFF', DARK_MIX)) : NAME_INKS;
}

export function nameInk(scheme: ColorScheme, name: string): string {
  return nameInks(scheme)[nameInkIndex(name)] ?? NAME_INKS[0];
}
