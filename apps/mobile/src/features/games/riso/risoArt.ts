import type { ImageSourcePropType } from 'react-native';

// The riso pictures the card games share (Aura v85 Kinshi, v86 Krot; the owner's files, kept in
// assets/games/kinshi/ where they came first): the time capsule and the buddies who peek from
// behind the card. The capsule avatars are not riso and do not come from here.

export type RisoTimer = 'full' | 'half' | 'low';
export type RisoBuddy = '1a80a9' | '9c96bd' | 'd2fbb5' | 'f280a5';

export const risoArt = {
  // The time capsule (240 × 360, transparent): full, half, and the last 10 seconds.
  timer: {
    full: require('../../../../assets/games/kinshi/kap-dolu.webp'),
    half: require('../../../../assets/games/kinshi/kap-yarim.webp'),
    low: require('../../../../assets/games/kinshi/kap-az.webp'),
  } satisfies Record<RisoTimer, ImageSourcePropType>,
  // The buddies (320 × 420, transparent): pink with ears, green with a flower, orange in a
  // pirate's hat, teal in a straw hat.
  buddies: {
    '1a80a9': require('../../../../assets/games/kinshi/kk-1a80a9.webp'),
    '9c96bd': require('../../../../assets/games/kinshi/kk-9c96bd.webp'),
    d2fbb5: require('../../../../assets/games/kinshi/kk-d2fbb5.webp'),
    f280a5: require('../../../../assets/games/kinshi/kk-f280a5.webp'),
  } satisfies Record<RisoBuddy, ImageSourcePropType>,
};
