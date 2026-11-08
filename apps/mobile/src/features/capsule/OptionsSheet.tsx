import { useState } from 'react';
import { Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import Animated, {
  measure,
  runOnUI,
  scrollTo,
  useAnimatedRef,
  useSharedValue,
} from 'react-native-reanimated';

import { Chip, T, useKit } from '@/aura/kit';
import { LookAvatar } from '@/components/LookAvatar';
import { Sheet } from '@/components/Sheet';
import { TierGems } from '@/features/gifts/parts';
import { tr } from '@/i18n/tr';
import { KIT } from '@/theme/auraKit';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

import type { Option, OptionGroup } from './options';

const COLUMNS = 5;
const GAP = SPACING[2];
const RING_OUT = KIT.size.boxRing + KIT.size.boxRingGap;

// "Hepsini gör" (the owner's call, 8 Kasım): the slot's options all at once, "boş" and the owned
// accessories first, then pack by pack with the pack's name and "Paketi tak"; the packs' chips at
// the top scroll the sheet to a pack. A tile chooses its option and closes the sheet.
export function OptionsSheet({
  visible,
  onClose,
  title,
  groups,
  chosenKey,
  onPick,
  onWearPack,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  groups: readonly OptionGroup[];
  chosenKey: string | null;
  onPick: (option: Option) => void;
  onWearPack: (group: OptionGroup) => void;
}) {
  const { c } = useKit();
  const { width } = useWindowDimensions();
  const inner = width - KIT.size.sheetInset * 2 - KIT.size.sheetPadX * 2;
  const cell = Math.floor((inner - GAP * (COLUMNS - 1)) / COLUMNS);
  const tile = Math.min(KIT.size.sheetTile, cell - RING_OUT * 2);
  const scroll = useAnimatedRef<Animated.ScrollView>();
  const wrap = useAnimatedRef<Animated.View>();
  // Where the options begin in the sheet's scroll, measured once as the sheet opens at its top.
  const base = useSharedValue(-1);
  const [tops, setTops] = useState<Record<string, number>>({});
  const [chip, setChip] = useState<string | null>(null);
  const packs = groups.filter((g) => g.pack !== null);
  const measureBase = () => {
    runOnUI(() => {
      'worklet';
      if (base.get() >= 0) return;
      const s = measure(scroll);
      const w = measure(wrap);
      if (s && w) base.set(w.pageY - s.pageY);
    })();
  };
  const goTo = (y: number) => {
    runOnUI((to: number) => {
      'worklet';
      scrollTo(scroll, 0, Math.max(0, base.get() + to), true);
    })(y);
  };

  const close = () => {
    setChip(null);
    onClose();
  };
  return (
    <Sheet visible={visible} onClose={close} title={title} scrollRef={scroll}>
      <Animated.View ref={wrap} onLayout={measureBase} style={{ gap: KIT.size.sheetGap }}>
        {packs.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ gap: KIT.size.chipsGap }}
          >
            <Chip
              label={tr.capsule.allPacks}
              on={chip === null}
              onPress={() => {
                setChip(null);
                goTo(0);
              }}
            />
            {packs.map((g) => {
              const key = groupKey(g);
              return (
                <Chip
                  key={key}
                  label={g.pack ?? ''}
                  on={chip === key}
                  onPress={() => {
                    setChip(key);
                    goTo(tops[key] ?? 0);
                  }}
                />
              );
            })}
          </ScrollView>
        ) : null}
        {groups.map((g) => {
          const key = groupKey(g);
          return (
            <View
              key={key}
              onLayout={(e) => {
                const y = e.nativeEvent.layout.y;
                setTops((t) => (t[key] === y ? t : { ...t, [key]: y }));
              }}
              style={{ gap: SPACING[3] }}
            >
              {g.pack && g.rack ? (
                <View className="flex-row items-center" style={{ gap: SPACING[3] }}>
                  <View className="flex-1">
                    <T v="h3" ink>
                      {tr.capsule.pack(g.pack)}
                    </T>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    hitSlop={SPACING[3]}
                    onPress={() => onWearPack(g)}
                  >
                    <T v="fine" strong color={c.link}>
                      {tr.capsule.wearPack}
                    </T>
                  </Pressable>
                </View>
              ) : null}
              <View className="flex-row flex-wrap" style={{ gap: GAP }}>
                {g.options.map((o) => (
                  <Tile
                    key={o.key}
                    option={o}
                    cell={cell}
                    size={tile}
                    on={o.key === chosenKey}
                    onPress={() => {
                      setChip(null);
                      onPick(o);
                    }}
                  />
                ))}
              </View>
            </View>
          );
        })}
      </Animated.View>
    </Sheet>
  );
}

function groupKey(g: OptionGroup): string {
  return g.pack && g.rack ? `${g.rack}-${g.pack}` : 'top';
}

function Tile({
  option,
  cell,
  size,
  on,
  onPress,
}: {
  option: Option;
  cell: number;
  size: number;
  on: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const box = size + RING_OUT * 2;
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: on }}
      accessibilityLabel={option.name}
      onPress={onPress}
      style={{ width: cell, alignItems: 'center', gap: SPACING[1] }}
    >
      <View style={{ width: box, height: box, padding: RING_OUT }}>
        <LookAvatar look={option.tile} size={size} />
        {on ? (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: box / 2,
              borderWidth: KIT.size.boxRing,
              borderColor: colors.accent,
            }}
          />
        ) : null}
      </View>
      {option.tier ? <TierGems tier={option.tier} /> : null}
    </Pressable>
  );
}
