import { Children, type ReactNode } from 'react';
import { Image, type ImageSourcePropType, Pressable, View } from 'react-native';

import { FrostIn } from '@/aura/FrostIn';
import { Tag } from '@/aura/kit';
import { usePressScale } from '@/components/motion';
import { tr } from '@/i18n/tr';
import { useNarrow } from '@/lib/useNarrow';
import { KIT } from '@/theme/auraKit';
import { SPACING } from '@/theme/tokens';
import { useLabOff } from '@/lib/drawLab';
import { boxShadowParts } from '@/components/NativeShadow';

// The games on the table, each its poster in a small landscape card, the game's own palette and logo
// in the drawing (Aura v92 Masa / MasaKoyu / MasaDar; the posters are the riso rule's deliberate
// exception), the same picture in light and dark. 600 × 400, and its @2x for 2x screens. A game that
// waits for its step (4.6): "Yakında" in the corner, not pressed.
export const GAME_CARDS = [
  { id: 'vampir', category: 'multi', art: require('../../../assets/game-poster/g-vampir.webp') },
  { id: 'signum', category: 'teams', art: require('../../../assets/game-poster/g-signum.webp') },
  { id: 'kinshi', category: 'teams', art: require('../../../assets/game-poster/g-kinshi.webp') },
  { id: 'krot', category: 'multi', art: require('../../../assets/game-poster/g-krot.webp') },
  {
    id: 'sprengja',
    category: 'multi',
    art: require('../../../assets/game-poster/g-sprengja.webp'),
  },
  {
    id: 'kaupholl',
    category: 'multi',
    art: require('../../../assets/game-poster/g-kaupholl.webp'),
  },
  // Kibrit has its poster only (the owner's call, 5 Kasım): no category, line or headcount yet.
  { id: 'kibrit', art: require('../../../assets/game-poster/g-kibrit.webp') },
] as const satisfies readonly {
  id: keyof typeof tr.table.gameCards;
  category?: keyof typeof tr.table.gameCategories;
  art: ImageSourcePropType;
}[];

export type GameCardId = (typeof GAME_CARDS)[number]['id'];

// A poster's game on the server (content/games.json): Kinshi is Kapsül Anlat's `tabu`; the others
// carry their own id.
const CONCEPTS: Partial<Record<GameCardId, string>> = { kinshi: 'tabu' };
export function conceptOf(card: GameCardId): string {
  return CONCEPTS[card] ?? card;
}
export type GameCategory = keyof typeof tr.table.gameCategories;

// The frost over a card while it arrives: the card's 24 corner at its width on a 390 wide phone.
const CARD_CORNER = 0.14;

export function GameCard({
  id,
  art,
  onPress,
  tag = tr.table.soon,
  lit,
  ok,
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
  // The owner can open it: "Aç" in the success tag (U22, `.tag.ok`).
  ok?: boolean;
  // Fewer phones at the table than the game needs (K-17).
  dim?: boolean;
  testID?: string;
}) {
  const pressScale = usePressScale();
  const narrow = useNarrow();
  const text = tr.table.gameCards[id];
  // The poster clips its picture, so its native shadow (NativeShadow.tsx) sits on a box around it.
  const shadow = boxShadowParts(useLabOff('golge'), KIT.gameCardShadow, GAME_CARD.radius);
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={tr.table.gameCardLabel(
        text.name,
        'sub' in text ? text.sub : undefined,
        'people' in text ? text.people : undefined,
        tag,
      )}
      accessibilityState={{ disabled: !onPress }}
      disabled={!onPress}
      onPress={onPress}
    >
      {({ pressed }) => (
        // The poster fills the card (its name is in the drawing; the owner's call, 29 Ekim); only
        // the corner tag lies over it, dark glass (docs/design/aura → Masa), white with the
        // person's own vote.
        <View
          style={[
            { borderRadius: GAME_CARD.radius, opacity: dim ? DIMMED : 1 },
            pressScale(pressed && !!onPress),
          ]}
        >
          {shadow.node}
          <View
            style={{
              // Aura v92 Masa: 112 high, MasaDar (narrow): 104; the poster covers it, centred.
              height: narrow ? NARROW_CARD_HEIGHT : CARD_HEIGHT,
              borderRadius: GAME_CARD.radius,
              overflow: 'hidden',
              boxShadow: shadow.boxShadow,
            }}
          >
            <Image
              source={art}
              fadeDuration={0}
              resizeMode="cover"
              style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' }}
              accessible={false}
            />
            <View style={{ position: 'absolute', left: GAME_CARD.tagX, top: GAME_CARD.tagY }}>
              <Tag
                tone={lit ? 'artLit' : ok ? 'green' : 'art'}
                label={tag}
                height={narrow ? KIT.size.tagNarrow : undefined}
              />
            </View>
          </View>
        </View>
      )}
    </Pressable>
  );
}

const DIMMED = 0.55;

// The card 112 high (104 on a narrow screen), its corner 22 and the tag 8 in from its top left.
const CARD_HEIGHT = 112;
const NARROW_CARD_HEIGHT = 104;
const GAME_CARD = {
  radius: KIT.size.gameCardRadius,
  tagX: KIT.size.gameTagX,
  tagY: KIT.size.gameTagY,
} as const;

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
