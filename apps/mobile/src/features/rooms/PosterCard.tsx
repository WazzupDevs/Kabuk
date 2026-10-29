import { Children, type ReactNode } from 'react';
import { type ImageSourcePropType, Pressable, Text, View } from 'react-native';

import { Buddy } from '@/aura/Buddy';
import { FrostIn } from '@/aura/FrostIn';
import { usePressScale } from '@/components/motion';
import { Tag } from '@/components/Tag';
import { tr } from '@/i18n/tr';
import { AURA } from '@/theme/aura';
import { KIT, KIT_TYPE } from '@/theme/auraKit';
import { gradientStyle } from '@/theme/gradient';
import { SPACING } from '@/theme/tokens';

// The games on the table: since 28 Ekim drawn as docs/design/aura → Masa's cards (GameCard); the
// earlier drawings (the owner's file skall-oyun-kartlari, assets/game-card/) stay with the list.
// Every game waits for its step (4.6): "Yakında" in the vote's corner, not pressed.
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

// The frost over a card while it arrives: the card's 22 corner at its width on a 390 wide phone.
const CARD_CORNER = 0.13;

export function GameCard({
  id,
  onPress,
  tag = tr.table.soon,
  lit,
  dim,
  testID,
}: {
  id: GameCardId;
  art?: ImageSourcePropType;
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
        // docs/design/aura → Masa, as a small landscape card (the owner's call, 29 Ekim: more of
        // them on the screen): a deep card of the game's colour, a warm glow at its foot, the
        // game's buddy at the right, the corner tag, the name and its line at the bottom left.
        <View
          style={[
            gradientStyle(look.ground),
            {
              height: GAME_CARD.height,
              borderRadius: GAME_CARD.radius,
              overflow: 'hidden',
              boxShadow: look.shadow,
              opacity: dim ? DIMMED : 1,
            },
            pressScale(pressed && !!onPress),
          ]}
        >
          <View
            style={[
              gradientStyle(`radial-gradient(closest-side, ${look.glow}, transparent)`),
              {
                position: 'absolute',
                left: '-10%',
                right: '-10%',
                bottom: -GAME_CARD.glowDrop,
                height: GAME_CARD.glow,
                borderRadius: GAME_CARD.glow,
              },
            ]}
          />
          <View
            style={{
              position: 'absolute',
              right: -GAME_CARD.buddyOut,
              bottom: GAME_CARD.buddyFoot,
            }}
          >
            <Buddy look={look.buddy} height={GAME_CARD.buddy} />
          </View>
          <View style={{ position: 'absolute', left: GAME_CARD.inset, top: GAME_CARD.inset }}>
            <Tag variant={lit ? 'light' : 'glass'} label={tag} />
          </View>
          <View
            style={{
              position: 'absolute',
              left: GAME_CARD.inset + 2,
              bottom: GAME_CARD.inset,
              right: GAME_CARD.textRight,
            }}
          >
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.6}
              maxFontSizeMultiplier={1.3}
              style={[KIT_TYPE.h3, KIT_TYPE.strong, { color: KIT.white }]}
            >
              {text.name}
            </Text>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
              maxFontSizeMultiplier={1.3}
              style={[KIT_TYPE.fine, { color: look.sub }]}
            >
              {text.sub}
            </Text>
          </View>
        </View>
      )}
    </Pressable>
  );
}

const DIMMED = 0.55;

const GAME_CARD = {
  height: 104,
  radius: 22,
  glow: 90,
  glowDrop: 48,
  // The buddy at the right, past the edge a little, standing on the card's foot.
  buddy: 70,
  buddyOut: 8,
  buddyFoot: 6,
  inset: 10,
  // The name and its line keep clear of the buddy.
  textRight: 50,
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
