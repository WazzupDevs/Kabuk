import { Image, type ImageSourcePropType, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { ICON, type PaletteKey } from '@/theme/tokens';

// The app's own icon family (canvas: Aşama 5 · Geri bildirim → İkonlar A): drawn in
// scripts/icon/glyphs.ts, rasterised white by `pnpm icons` (1×/2×/3×) and tinted here, since
// react-native-svg is a native module the installed builds do not have.
const BELL: ImageSourcePropType = require('../../assets/glyph/bell.png');

// The notification bell (a line drawing). Decorative: the button around it carries the label.
export function BellIcon({ color, size = ICON.lg }: { color: string; size?: number }) {
  return (
    <Image
      source={BELL}
      accessible={false}
      style={{ width: size, height: size, tintColor: color }}
      resizeMode="contain"
    />
  );
}

// Map marker glyphs as signed distance fields (ExploreMap colours them per bucket).
export const MARKER_IMAGES = {
  cafe: require('../../assets/glyph/marker-cafe.png') as ImageSourcePropType,
  campus: require('../../assets/glyph/marker-campus.png') as ImageSourcePropType,
};

// The Keşfet map's pin glyphs in the capsule family's colours (scripts/build-pins.ts), drawn as
// they are on the pin's white disc.
export const PIN_IMAGES = {
  cafe: require('../../assets/pin/pin-cafe.png') as ImageSourcePropType,
  campus: require('../../assets/pin/pin-campus.png') as ImageSourcePropType,
};

// The Keşfet map's pins by the venue's type (the owner's call, 28 Ekim): the type's picture from
// the table pictures (kafe: espresso, çay bahçesi: demlik, yemek: kantin tepsisi, kampüs: saat
// kulesi) cut round, 40 pt, the same as the list's thumbs (ui/VenueThumb.tsx).
export const TYPE_PIN_IMAGES = {
  kafe: require('../../assets/pin/pin-kafe.png') as ImageSourcePropType,
  cay: require('../../assets/pin/pin-cay.png') as ImageSourcePropType,
  yemek: require('../../assets/pin/pin-yemek.png') as ImageSourcePropType,
  kampus: require('../../assets/pin/pin-kampus.png') as ImageSourcePropType,
};

// The live dot's blurred halo (src/components/LiveDot.tsx), white, tinted by the app.
export const HALO_IMAGE: ImageSourcePropType = require('../../assets/glyph/halo.png');

// A venue's kind on the Keşfet list (the map marker drawings, solid).
export type KindGlyph = 'cafe' | 'campus';
const KIND: Record<KindGlyph, ImageSourcePropType> = {
  cafe: require('../../assets/glyph/kind-cafe.png'),
  campus: require('../../assets/glyph/kind-campus.png'),
};

export function KindIcon({
  kind,
  color,
  size = ICON.xl,
}: {
  kind: KindGlyph;
  color: string;
  size?: number;
}) {
  return (
    <Image
      source={KIND[kind]}
      accessible={false}
      style={{ width: size, height: size, tintColor: color }}
      resizeMode="contain"
    />
  );
}

// A table's avatar icon (canvas: Aşama 8 · Saha → Masa avatarları), in the order of
// scripts/icon/glyphs.ts → TABLE_AVATARS (scripts/icon/avatars.test.ts checks it).
export const TABLE_AVATAR_IMAGES: readonly ImageSourcePropType[] = [
  require('../../assets/glyph/avatar-dice.png'),
  require('../../assets/glyph/avatar-card.png'),
  require('../../assets/glyph/avatar-crown.png'),
  require('../../assets/glyph/avatar-star.png'),
  require('../../assets/glyph/avatar-bolt.png'),
  require('../../assets/glyph/avatar-heart.png'),
  require('../../assets/glyph/avatar-flame.png'),
  require('../../assets/glyph/avatar-rocket.png'),
  require('../../assets/glyph/avatar-moon.png'),
  require('../../assets/glyph/avatar-pawn.png'),
  require('../../assets/glyph/avatar-gamepad.png'),
  require('../../assets/glyph/avatar-party.png'),
];

// The games' icons (canvas: Aşama 6 · Oyunlar → Oyun ikonları): Aktiviteler cards and "Oyun öner".
// Each game has its own colour pair from the palette.
export type GameGlyph = 'tabu' | 'sohbet' | 'impostor' | 'letters' | 'song' | 'needle';

const GAME: Record<GameGlyph, ImageSourcePropType> = {
  tabu: require('../../assets/glyph/game-tabu.png'),
  sohbet: require('../../assets/glyph/game-sohbet.png'),
  impostor: require('../../assets/glyph/game-impostor.png'),
  letters: require('../../assets/glyph/game-letters.png'),
  song: require('../../assets/glyph/game-song.png'),
  needle: require('../../assets/glyph/game-needle.png'),
};

export const GAME_TONES: Record<GameGlyph, readonly [PaletteKey, PaletteKey]> = {
  tabu: ['violet', 'onViolet'],
  sohbet: ['signal', 'onSignal'],
  impostor: ['lively', 'onLively'],
  letters: ['calm', 'onCalm'],
  song: ['buzz', 'onBuzz'],
  needle: ['event', 'onEvent'],
};

export function GameIcon({
  name,
  color,
  size = ICON.lg,
}: {
  name: GameGlyph;
  color: string;
  size?: number;
}) {
  return (
    <Image
      source={GAME[name]}
      accessible={false}
      style={{ width: size, height: size, tintColor: color }}
      resizeMode="contain"
    />
  );
}

// The game's icon on its colour disc. Decorative.
export function GameDisc({ name, size = 56 }: { name: GameGlyph; size?: number }) {
  const { colors, shape } = useTheme();
  const [bg, fg] = GAME_TONES[name];
  return (
    <View
      accessible={false}
      className="items-center justify-center"
      style={{
        width: size,
        height: size,
        borderRadius: shape.radius.pill,
        backgroundColor: colors[bg],
      }}
    >
      <GameIcon name={name} color={colors[fg]} size={Math.round(size * 0.56)} />
    </View>
  );
}
