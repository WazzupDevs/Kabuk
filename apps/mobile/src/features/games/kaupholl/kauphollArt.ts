import type { ImageSourcePropType } from 'react-native';

import { kinshiArt } from '@/features/games/kinshi/kinshiArt';

// Kaupholl's riso pictures (Aura v89, "Kaupholl (en yakına yatır)"). The question, its unit and
// every number and name are drawn by code on top. The peeking buddies and the time capsule are
// Kinshi's files (assets/games/kinshi/), read through kinshiArt, never copied. The capsule
// avatars are not riso and do not come from here.
export const kauphollArt = {
  buddies: kinshiArt.buddies,
  timer: kinshiArt.timer,
  // Question card back (1184×1579): the night weighing hall poster, nothing written on it.
  back: require('../../../../assets/games/kaupholl/k-arka.webp'),
  // Question card front (1184×1579): yellow top label and an empty paper panel, both filled by
  // code. Also the question strip's paper (background-size 130%, position 50% 24%).
  question: require('../../../../assets/games/kaupholl/k-soru.webp'),
  // The guess board's ground (1050×1320): green baize, yellow frame, stretched to the box.
  board: require('../../../../assets/games/kaupholl/k-tahta.webp'),
  // The coin (360×360, transparent): 30 on a slot, 40 in the wallet.
  coin: require('../../../../assets/games/kaupholl/k-jeton.webp'),
  // The overflowing chest (1080×1080): question end and game end top scene (cover).
  chest: require('../../../../assets/games/kaupholl/k-kasa.webp'),
  // The Players screen's poster (504×336, shown 84×56).
  poster: require('../../../../assets/games/kaupholl/k-poster.webp'),
} satisfies Record<string, ImageSourcePropType | Record<string, ImageSourcePropType>>;
