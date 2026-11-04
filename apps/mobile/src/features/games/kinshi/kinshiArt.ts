import type { ImageSourcePropType } from 'react-native';

// Kinshi's riso pictures for the tabu layout (Aura v85, "Kinshi (tabu düzeni)" row; the owner's
// files). The card's words are drawn over `cardFront` in code; the capsule avatars are not riso and
// do not come from here.

export type KinshiTimer = 'full' | 'half' | 'low';
export type KinshiBuddy = '1a80a9' | '9c96bd' | 'd2fbb5' | 'f280a5';

export const kinshiArt = {
  // The tabu card (1776 × 2368): the front's ground and the back with the KİNSHİ band.
  cardFront: require('../../../../assets/games/kinshi/kart-on.webp') as ImageSourcePropType,
  cardBack: require('../../../../assets/games/kinshi/kart-arka.webp') as ImageSourcePropType,
  // The time capsule (240 × 360, transparent): full, half, and the last 10 seconds.
  timer: {
    full: require('../../../../assets/games/kinshi/kap-dolu.webp'),
    half: require('../../../../assets/games/kinshi/kap-yarim.webp'),
    low: require('../../../../assets/games/kinshi/kap-az.webp'),
  } satisfies Record<KinshiTimer, ImageSourcePropType>,
  // The buddies peeking from behind the card and in the game-over scene (320 × 420, transparent).
  buddies: {
    '1a80a9': require('../../../../assets/games/kinshi/kk-1a80a9.webp'),
    '9c96bd': require('../../../../assets/games/kinshi/kk-9c96bd.webp'),
    d2fbb5: require('../../../../assets/games/kinshi/kk-d2fbb5.webp'),
    f280a5: require('../../../../assets/games/kinshi/kk-f280a5.webp'),
  } satisfies Record<KinshiBuddy, ImageSourcePropType>,
  // The game's poster on the Teams screen (300 × 200, shown at 84 × 56).
  poster: require('../../../../assets/games/kinshi/poster.webp') as ImageSourcePropType,
};
