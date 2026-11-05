import type { ImageSourcePropType } from 'react-native';

import { kinshiArt } from '@/features/games/kinshi/kinshiArt';

// Sprengja's riso pictures (aura v88, "Sprengja (elden ele bomba)"). The "HECE" label, the
// syllable and every name are drawn by code on top. The peeking buddies are Kinshi's files
// (assets/games/kinshi/), read through kinshiArt, never copied. The hidden fuse has no time
// capsule: Sprengja shows no time at all.
export const sprengjaArt = {
  buddies: kinshiArt.buddies,
  // Syllable card back: the night poster, nothing written on it.
  back: require('../../../../assets/games/sprengja/b-arka.webp'),
  // Syllable card front: yellow top label and pink fuse medallion, both filled by code.
  syllable: require('../../../../assets/games/sprengja/b-hece.webp'),
  // The table ring's ground, fits a 350×350 box uncropped.
  table: require('../../../../assets/games/sprengja/b-masa.webp'),
  // The bomb (transparent): 150×165 in the middle of the ring, 56×62 in front of a player.
  bomb: require('../../../../assets/games/sprengja/b-bomba.webp'),
  // The explosion: 350×350 panel, and the round end's 250 high top scene (cover).
  explosion: require('../../../../assets/games/sprengja/b-patlama.webp'),
  // The Players screen's poster (shown 84×56).
  poster: require('../../../../assets/games/sprengja/b-poster.webp'),
} satisfies Record<string, ImageSourcePropType | Record<string, ImageSourcePropType>>;
