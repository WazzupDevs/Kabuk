import { Children, type ReactNode } from 'react';
import { Image, type ImageSourcePropType, Pressable, View } from 'react-native';

import { Card } from '@/components/Card';
import { usePressScale } from '@/components/motion';
import { Tag } from '@/components/Tag';
import { Text } from '@/components/Text';
import { tr } from '@/i18n/tr';
import { SPACING } from '@/theme/tokens';

// The games' posters on the table (skall tuvali, Masa and MasaPosterlerYakinda): the canvas's
// drawings, exported at 3× (assets/poster/), and their faded "Yakında" copies (grayscale 0.7).
const POSTERS: Record<string, { on: ImageSourcePropType; soon: ImageSourcePropType }> = {
  'kapsul-anlat': {
    on: require('../../../assets/poster/kapsul-anlat.jpg'),
    soon: require('../../../assets/poster/kapsul-anlat-soon.jpg'),
  },
  ibre: {
    on: require('../../../assets/poster/ibre.jpg'),
    soon: require('../../../assets/poster/ibre-soon.jpg'),
  },
  sahtekar: {
    on: require('../../../assets/poster/sahtekar.jpg'),
    soon: require('../../../assets/poster/sahtekar-soon.jpg'),
  },
  'harf-kapmaca': {
    on: require('../../../assets/poster/harf-kapmaca.jpg'),
    soon: require('../../../assets/poster/harf-kapmaca-soon.jpg'),
  },
  'sarkida-gecsin': {
    on: require('../../../assets/poster/sarkida-gecsin.jpg'),
    soon: require('../../../assets/poster/sarkida-gecsin-soon.jpg'),
  },
  'sohbet-kartlari': {
    on: require('../../../assets/poster/sohbet-kartlari.jpg'),
    soon: require('../../../assets/poster/sohbet-kartlari-soon.jpg'),
  },
};

// skall.css → `.media .art`: 150 high; the drawing (160 × 200) covers it from the top.
const ART_HEIGHT = SPACING[16] * 2 + SPACING[5] + SPACING[0.5];
const POSTER_RATIO = 160 / 200;
const SOON_OPACITY = 0.6;

type Props = {
  poster: string;
  name: string;
  tagline: string;
  minPlayers: number;
  soon?: boolean;
  onPress?: () => void;
  testID?: string;
};

export function PosterCard({ poster, name, tagline, minPlayers, soon, onPress, testID }: Props) {
  const pressScale = usePressScale();
  const art = POSTERS[poster];
  const face = (pressed: boolean) => (
    <View style={[{ opacity: soon ? SOON_OPACITY : 1 }, pressScale(pressed && !soon)]}>
      <Card flush>
        <View style={{ height: ART_HEIGHT, overflow: 'hidden' }}>
          {art ? (
            <Image
              source={soon ? art.soon : art.on}
              accessible={false}
              style={{ width: '100%', aspectRatio: POSTER_RATIO }}
            />
          ) : null}
          <View
            className="absolute flex-row"
            style={{ top: SPACING[3], left: SPACING[3], right: SPACING[3], gap: SPACING[1.5] }}
          >
            <Tag variant="light" label={tr.table.minPeople(minPlayers)} />
            {soon ? (
              <View style={{ marginLeft: 'auto' }}>
                <Tag variant="glass" label={tr.table.soon} />
              </View>
            ) : null}
          </View>
        </View>
        <View
          style={{
            gap: SPACING[0.5],
            paddingTop: SPACING[3],
            paddingRight: SPACING[3] + SPACING[0.5],
            paddingBottom: SPACING[3] + SPACING[0.5],
            paddingLeft: SPACING[4],
          }}
        >
          <Text variant="heading">{name}</Text>
          <Text variant="fine">{tagline}</Text>
        </View>
      </Card>
    </View>
  );
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={soon ? `${name}, ${tr.table.soon}` : name}
      accessibilityState={{ disabled: !!soon }}
      disabled={soon || !onPress}
      onPress={onPress}
    >
      {({ pressed }) => face(pressed)}
    </Pressable>
  );
}

// Two posters a row, 12 apart (the canvas's grid).
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
