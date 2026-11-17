import { memo } from 'react';
import { View } from 'react-native';

import { T } from '@/aura/kit';
import { CachedSvg } from '@/components/CachedSvg';
import { FadeMark, Tap } from '@/motion';
import { KIT } from '@/theme/auraKit';
import { CAPSULE_EDIT } from '@/theme/capsuleEdit';
import { useTheme } from '@/theme/ThemeProvider';

import { type CatalogItem } from './catalog';
import { optionArt } from './tileArt';

// A piece in Tüm aksesuarlar (yeni arayüz tuvali, TumAksesuarlar `.gc`): its picture alone in a
// round, its name under it (two lines at most, shrinking rather than ending in "…"). The piece on
// the capsule now and the one picked wear the kit's pink ring; the ring fades in and the last one's
// out in 140 ms (hareket 6.3), a press sinks the piece to 0.96 (Tap).
function CatalogTileView({
  item,
  color,
  side,
  nameHeight,
  ringed,
  onPress,
}: {
  item: CatalogItem;
  color: string | undefined;
  // The picture's round.
  side: number;
  nameHeight: number;
  // On the capsule or picked.
  ringed: boolean;
  onPress: (item: CatalogItem) => void;
}) {
  const E = CAPSULE_EDIT;
  const { scheme } = useTheme();
  // A set shows its first piece; any other piece its own picture.
  const first = item.pieces?.[0];
  const xml = first
    ? optionArt('h', { accessory: first }, color)
    : item.option && item.slot
      ? optionArt(item.slot, item.option, color)
      : null;
  const out = E.catalog.ring + E.catalog.ringGap;
  return (
    <Tap
      testID={`catalog-${item.key}`}
      accessibilityRole="button"
      accessibilityLabel={item.name}
      accessibilityState={{ selected: ringed }}
      onPress={() => onPress(item)}
      style={{ alignItems: 'center', gap: E.catalog.nameGap }}
    >
      <View style={{ width: side, height: side }}>
        <View
          style={{
            width: side,
            height: side,
            borderRadius: side / 2,
            overflow: 'hidden',
            backgroundColor: E[scheme].tile,
          }}
        >
          {xml ? (
            <View style={{ width: side, height: side }}>
              <CachedSvg xml={xml} width="100%" height="100%" />
            </View>
          ) : null}
        </View>
        <FadeMark
          on={ringed}
          style={{
            position: 'absolute',
            top: -out,
            left: -out,
            right: -out,
            bottom: -out,
            borderRadius: (side + 2 * out) / 2,
            borderWidth: E.catalog.ring,
            borderColor: KIT.pink,
          }}
        />
      </View>
      <View style={{ height: nameHeight, alignSelf: 'stretch', justifyContent: 'flex-start' }}>
        <T v="eyebrow" ink strong={ringed} lines={2} fit center>
          {item.name}
        </T>
      </View>
    </Tap>
  );
}

export const CatalogTile = memo(CatalogTileView);
