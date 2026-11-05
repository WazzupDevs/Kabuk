import type { ImageSourcePropType } from 'react-native';

import { risoArt, type RisoBuddy, type RisoTimer } from '../riso/risoArt';

// Kinshi's riso pictures for the tabu layout (Aura v85, "Kinshi (tabu düzeni)" row; the owner's
// files). The card's words are drawn over `cardFront` in code; the time capsule and the buddies are
// the card games' shared ones (riso/risoArt.ts); the capsule avatars are not riso and do not come
// from here.

export type KinshiTimer = RisoTimer;
export type KinshiBuddy = RisoBuddy;

export const kinshiArt = {
  // The tabu card (1776 × 2368): the front's ground and the back with the KİNSHİ band.
  cardFront: require('../../../../assets/games/kinshi/kart-on.webp') as ImageSourcePropType,
  cardBack: require('../../../../assets/games/kinshi/kart-arka.webp') as ImageSourcePropType,
  timer: risoArt.timer,
  buddies: risoArt.buddies,
  // The game's poster on the Teams screen (300 × 200, shown at 84 × 56).
  poster: require('../../../../assets/games/kinshi/poster.webp') as ImageSourcePropType,
};
