import { tableAvatar } from '../../../../supabase/functions/_shared/pure/tableAvatar.ts';

import { BRAND } from './brand';
import { FLAT } from './flatLists';
import { nameInkIndex } from './nameInk';

// An anonymous table's face: one of twelve game-night icons (scripts/icon/glyphs.ts →
// TABLE_AVATARS) on one of skall's eight discs (src/components/Avatar.tsx). Fixed values, the same
// in both schemes: the disc is an object, not a surface; the ink icon reads on each (brand.test.ts).
export const TABLE_AVATAR_COLORS = [
  '#B5A4FF',
  '#FF97BC',
  '#FFC46A',
  '#7EDDB5',
  '#8FC6FF',
  '#FFAE96',
  '#D9EE6B',
  '#EDB8FF',
] as const;
// The icon's ink on every disc.
export const TABLE_AVATAR_INK = BRAND.ink;

// A table's avatar: icon and disc colour from its alias, the same on every phone (the session id
// never reaches the lobby or the venue chat, and one table must not wear two faces).
export function tableAvatarOf(alias: string): { icon: number; color: string } {
  const { icon, color } = tableAvatar(alias, TABLE_AVATAR_COLORS.length);
  return { icon, color: TABLE_AVATAR_COLORS[color] ?? TABLE_AVATAR_COLORS[0] };
}

// A profile's initials: the first letters of its first two words, upper-cased the Turkish way.
export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toLocaleUpperCase('tr-TR') ?? '')
    .join('');
}

// A request row's letter face (`.rqa`): the first letter of the name shown, and one of the board's
// five colours picked from that name with the venue chat's hash (the same name, the same colour, on
// every phone). Only the name already on the screen goes in: nothing of the account (rule 4).
export function letterFace(name: string): { letter: string; color: string } {
  const inks = FLAT.requestFace.inks;
  return {
    letter: initials(name).slice(0, 1),
    color: inks[nameInkIndex(name) % inks.length] ?? inks[0],
  };
}
