import { Children, type ReactNode } from 'react';
import { Image, type ImageSourcePropType, Pressable, View } from 'react-native';

import { usePressScale } from '@/components/motion';
import { Tag } from '@/components/Tag';
import { tr } from '@/i18n/tr';
import { SPACING } from '@/theme/tokens';

// The games' cards on the table (the owner's file skall-oyun-kartlari, 27 Ekim; the table's games
// part made anew): each card is the file's drawing whole (scene, logo, line and headcount),
// exported at 4× with its rounded corners (assets/game-card/). Every game waits for its step (4.6):
// "Yakında" in the vote's corner, not pressed.
export const GAME_CARDS = [
  { id: 'vampir', category: 'multi', art: require('../../../assets/game-card/vampir.webp') },
  { id: 'signum', category: 'teams', art: require('../../../assets/game-card/signum.webp') },
  { id: 'kinshi', category: 'teams', art: require('../../../assets/game-card/kinshi.webp') },
  { id: 'krot', category: 'multi', art: require('../../../assets/game-card/krot.webp') },
  { id: 'sprengja', category: 'multi', art: require('../../../assets/game-card/sprengja.webp') },
  { id: 'kaupholl', category: 'multi', art: require('../../../assets/game-card/kaupholl.webp') },
] as const satisfies readonly {
  id: keyof typeof tr.table.gameCards;
  category: keyof typeof tr.table.gameCategories;
  art: ImageSourcePropType;
}[];

export type GameCardId = (typeof GAME_CARDS)[number]['id'];
export type GameCategory = keyof typeof tr.table.gameCategories;

// The file's card: 158 × 211.
const CARD_RATIO = 158 / 211;

export function GameCard({
  id,
  art,
  onPress,
  testID,
}: {
  id: GameCardId;
  art: ImageSourcePropType;
  onPress?: () => void;
  testID?: string;
}) {
  const pressScale = usePressScale();
  const text = tr.table.gameCards[id];
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={tr.table.gameCardLabel(text.name, text.sub, text.people)}
      accessibilityState={{ disabled: !onPress }}
      disabled={!onPress}
      onPress={onPress}
    >
      {({ pressed }) => (
        <View style={pressScale(pressed && !!onPress)}>
          {/* The card's box first, then the drawing filling it: given only a width, Android kept the
              file's own height and drew it far too large (the owner's report, 27 Ekim). */}
          <View style={{ width: '100%', aspectRatio: CARD_RATIO }}>
            <Image
              // No fade-in: a drawing shown again does not blink.
              fadeDuration={0}
              source={art}
              accessible={false}
              resizeMode="contain"
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            />
          </View>
          <View className="absolute" style={{ top: SPACING[2.5], left: SPACING[2.5] }}>
            <Tag variant="glass" label={tr.table.soon} />
          </View>
        </View>
      )}
    </Pressable>
  );
}

// Two cards a row, 12 apart (the file's grid).
export function PosterGrid({ children }: { children: ReactNode }) {
  const cells = Children.toArray(children);
  const rows: ReactNode[][] = [];
  cells.forEach((c, i) => {
    if (i % 2 === 0) rows.push([c]);
    else rows[rows.length - 1]?.push(c);
  });
  return (
    <View style={{ gap: SPACING[3] }}>
      {rows.map((row, i) => (
        <View key={i} className="flex-row" style={{ gap: SPACING[3] }}>
          {row.map((c, j) => (
            <View key={j} className="flex-1">
              {c}
            </View>
          ))}
          {row.length === 1 ? <View className="flex-1" /> : null}
        </View>
      ))}
    </View>
  );
}
