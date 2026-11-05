import type { ImageSourcePropType } from 'react-native';

import { kinshiArt } from '@/features/games/kinshi/kinshiArt';

// Kibrit's riso pictures (aura v90, "Kibrit (gizli soru, gizli oy)"). The question, the counts and
// every name are drawn by code on top. The peeking buddies and the time capsule are Kinshi's files
// (assets/games/kinshi/), read through kinshiArt, never copied. The capsule avatars are not riso.
export const kibritArt = {
  buddies: kinshiArt.buddies,
  timer: kinshiArt.timer,
  // Paper deck back (1480×1973): the match poster, nothing written on it.
  back: require('../../../../assets/games/kibrit/b-arka.webp'),
  // Drawn paper front (1480×1973); the question is written by code. Also the texture of the
  // question strip and the writing field (background-size 150%, position 50% 20–22%).
  paper: require('../../../../assets/games/kibrit/b-kagit.webp'),
  // The jar (1080×1080): "Kâğıtlar kavanozda" box and the game-over top scene, cover.
  jar: require('../../../../assets/games/kibrit/b-kavanoz.webp'),
  // The votes-revealed top scene (1080×1080), cover; its middle is left for the winner's capsule.
  light: require('../../../../assets/games/kibrit/b-isik.webp'),
  // One matchstick (240×320, transparent): one per vote in a result row, shown 22×30.
  stick: require('../../../../assets/games/kibrit/b-cop.webp'),
  // The Players screen's poster (504×336, shown 84×56).
  poster: require('../../../../assets/games/kibrit/b-poster.webp'),
} satisfies Record<string, ImageSourcePropType | Record<string, ImageSourcePropType>>;
