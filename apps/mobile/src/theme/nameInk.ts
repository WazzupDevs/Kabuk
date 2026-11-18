import type { ColorScheme } from './tokens';

// The six colours the hash below picks from (v45: VC.col): the avatars' grounds read the same
// index (theme/avatar.ts).
export const NAME_INKS = [
  '#5A3AE6',
  '#C51F62',
  '#1C7843',
  '#9A5300',
  '#3B25A6',
  '#0F6E8C',
] as const;

// The sender's name over another's bubble in the group chats, and in a quote of their message
// (yeni arayüz tuvali, SemtDolu and MekanSohbet `.nk.o1`–`.o3`): one of three, the same one every
// time for the same name; the dark scheme's own three. Pure data: nameInk.test.ts checks each for
// 4.5:1 on the bubble's surface and on the reply strip.
export const CHAT_NAME_INKS = {
  light: ['#B5560A', '#C2185B', '#0E8745'],
  dark: ['#FFB547', '#FF7AA6', '#3DDC84'],
} as const satisfies Record<ColorScheme, readonly string[]>;

// v45's hash over the name's UTF-16 units: the same name gets the same colour on every phone.
export function nameInkIndex(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 41 + name.charCodeAt(i)) >>> 0;
  return h % NAME_INKS.length;
}

export function nameInks(scheme: ColorScheme): readonly string[] {
  return CHAT_NAME_INKS[scheme];
}

export function nameInk(scheme: ColorScheme, name: string): string {
  const inks = nameInks(scheme);
  return inks[nameInkIndex(name) % inks.length] ?? CHAT_NAME_INKS[scheme][0];
}
