import type { ImageSourcePropType } from 'react-native';

// Krot's riso pictures (Aura v86, "Krot (gizli kart ve şüpheli sırası)"). The role card's
// back carries no text; the word and impostor fronts get their text layer from code. The
// time capsule and the peeking kankis are Kinshi's (assets/games/kinshi/), not copied here;
// the capsule avatars are not riso.
export const krotArt = {
  // Role card back: the soil cross-section, 1184×1579.
  back: require('../../../../assets/games/krot/k-arka.webp'),
  // Word card front (yellow label, teal band, scene), 1184×1579.
  word: require('../../../../assets/games/krot/k-kelime.webp'),
  // Impostor card front (pink, black band, masked kanki), 1184×1579.
  impostor: require('../../../../assets/games/krot/k-sahtekar.webp'),
  // Suspect line-up wall, 1400×1120: fits the 350×280 box whole, never cropped.
  lineup: require('../../../../assets/games/krot/k-sira.webp'),
  // "Kimler oynuyor" poster, 600×400 (shown 84×56).
  poster: require('../../../../assets/games/krot/poster.webp'),
} satisfies Record<string, ImageSourcePropType>;
