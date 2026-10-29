import { Children, type ReactNode } from 'react';
import { Image, type ImageSourcePropType, Pressable, View } from 'react-native';

import { FrostIn } from '@/aura/FrostIn';
import { usePressScale } from '@/components/motion';
import { Tag } from '@/components/Tag';
import { tr } from '@/i18n/tr';
import { AURA } from '@/theme/aura';
import { SPACING } from '@/theme/tokens';

// The games on the table: since 29 Ekim each its comic poster in a small landscape card
// (scripts/art/posters.ts, after the owner's earlier posters in assets/game-card/), the game's
// name lettered on it. Every game waits for its step (4.6): "Yakında" in the corner, not pressed.
export const GAME_CARDS = [
  { id: 'vampir', category: 'multi', art: require('../../../assets/game-poster/vampir.webp') },
  { id: 'signum', category: 'teams', art: require('../../../assets/game-poster/signum.webp') },
  { id: 'kinshi', category: 'teams', art: require('../../../assets/game-poster/kinshi.webp') },
  { id: 'krot', category: 'multi', art: require('../../../assets/game-poster/krot.webp') },
  { id: 'sprengja', category: 'multi', art: require('../../../assets/game-poster/sprengja.webp') },
  { id: 'kaupholl', category: 'multi', art: require('../../../assets/game-poster/kaupholl.webp') },
] as const satisfies readonly {
  id: keyof typeof tr.table.gameCards;
  category: keyof typeof tr.table.gameCategories;
  art: ImageSourcePropType;
}[];

export type GameCardId = (typeof GAME_CARDS)[number]['id'];
export type GameCategory = keyof typeof tr.table.gameCategories;

// The frost over a card while it arrives: the card's 22 corner at its width on a 390 wide phone.
const CARD_CORNER = 0.13;

export function GameCard({
  id,
  art,
  onPress,
  tag = tr.table.soon,
  lit,
  dim,
  testID,
}: {
  id: GameCardId;
  art: ImageSourcePropType;
  onPress?: () => void;
  // The corner tag: "Yakında" until the game's step; a playable game's votes or "Aç".
  tag?: string;
  // The person's own vote is on it.
  lit?: boolean;
  // Fewer phones at the table than the game needs (K-17).
  dim?: boolean;
  testID?: string;
}) {
  const pressScale = usePressScale();
  const text = tr.table.gameCards[id];
  const look = AURA.gameCards[id];
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={tr.table.gameCardLabel(text.name, text.sub, text.people, tag)}
      accessibilityState={{ disabled: !onPress }}
      disabled={!onPress}
      onPress={onPress}
    >
      {({ pressed }) => (
        // The poster fills the card (its name is in the drawing; the owner's call, 29 Ekim); only
        // the corner tag lies over it.
        <View
          style={[
            {
              aspectRatio: POSTER_RATIO,
              borderRadius: GAME_CARD.radius,
              overflow: 'hidden',
              boxShadow: look.shadow,
              opacity: dim ? DIMMED : 1,
            },
            pressScale(pressed && !!onPress),
          ]}
        >
          <Image
            source={art}
            fadeDuration={0}
            resizeMode="cover"
            style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' }}
            accessible={false}
          />
          <View style={{ position: 'absolute', left: GAME_CARD.inset, top: GAME_CARD.inset }}>
            <Tag variant={lit ? 'light' : 'glass'} label={tag} />
          </View>
        </View>
      )}
    </Pressable>
  );
}

const DIMMED = 0.55;

// The poster's 3 : 2 (480 × 320), its corner and the tag's inset.
const POSTER_RATIO = 1.5;
const GAME_CARD = { radius: 22, inset: 8 } as const;

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
              {/* Frosted first, then the drawing (docs/design/aura → Masa). */}
              <FrostIn index={i * 2 + j} radius={CARD_CORNER}>
                {c}
              </FrostIn>
            </View>
          ))}
          {row.length === 1 ? <View className="flex-1" /> : null}
        </View>
      ))}
    </View>
  );
}
