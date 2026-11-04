import type { ImageSourcePropType } from 'react-native';

// Signum's riso pictures (aura v87, "Signum (kelime ızgarası ve kaptan)"). Text, the 5×5 key
// map and the tile words are drawn by code on top; the time capsule and the peeking buddies
// are Kinshi's and are not repeated here.
export const signumArt = {
  // Role card back: the signal board poster, nothing written on it.
  back: require('../../../../assets/games/signum/s-arka.webp'),
  // Role card fronts: the captain (empty key map panel) and the guesser.
  captain: require('../../../../assets/games/signum/s-kaptan.webp'),
  guesser: require('../../../../assets/games/signum/s-tahminci.webp'),
  // The word board's cloth, fits a 350×294 box uncropped.
  board: require('../../../../assets/games/signum/s-masa.webp'),
  // Word tiles: closed, then each kind once opened.
  tile: {
    closed: require('../../../../assets/games/signum/t-kapali.webp'),
    mor: require('../../../../assets/games/signum/t-mor.webp'),
    pembe: require('../../../../assets/games/signum/t-pembe.webp'),
    neutral: require('../../../../assets/games/signum/t-notr.webp'),
    black: require('../../../../assets/games/signum/t-kara.webp'),
  },
  // The Teams screen's poster (shown 84×56).
  poster: require('../../../../assets/games/signum/poster.webp'),
} satisfies Record<string, ImageSourcePropType | Record<string, ImageSourcePropType>>;
