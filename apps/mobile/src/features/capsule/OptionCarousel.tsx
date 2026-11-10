import { memo, useEffect, useState } from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  type SharedValue,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

import { LookAvatar } from '@/components/LookAvatar';
import { useLatestCallback } from '@/lib/useLatestCallback';
import { KIT } from '@/theme/auraKit';
import { useTheme } from '@/theme/ThemeProvider';

import { carouselWindow } from './carouselWindow';
import type { Option } from './options';

const STEP = KIT.size.carouselStep;
const ITEM = KIT.size.carouselItem;
const RING_OUT = KIT.size.boxRing + KIT.size.boxRingGap;
const BOX = ITEM + RING_OUT * 2;
const DISTANCES = KIT.size.carouselSizes.map((_, i) => i);
const SCALES = KIT.size.carouselSizes.map((s) => s / ITEM);
const FADES: number[] = [...KIT.size.carouselFades];
// With reduce motion every option but the centred one stands at the first neighbour's size.
const STILL = SCALES[1] ?? 1;

// Kapsülünü süsle's options for the slot in a snapping row (the owner's call, 8 Kasım): the centred
// one is chosen and ringed in the accent, its neighbours shrink and fade on the UI thread as the row
// moves. A scroll that comes to rest on an option chooses it; a tap scrolls it to the centre and
// chooses it. With reduce motion nothing scales as the row moves.
export function OptionCarousel({
  options,
  chosen,
  onPick,
  reduce,
  label,
}: {
  options: readonly Option[];
  chosen: number;
  onPick: (index: number) => void;
  reduce: boolean;
  label: string;
}) {
  const { width } = useWindowDimensions();
  const pad = (width - STEP) / 2;
  const ref = useAnimatedRef<Animated.ScrollView>();
  const x = useSharedValue(chosen * STEP);
  const last = options.length - 1;
  // Only the options on the screen and a few either side are bound (carouselWindow); the rest are
  // the row's empty width. The UI thread works the window out and tells React when it moves.
  const [win, setWin] = useState(() => carouselWindow(chosen * STEP, STEP, options.length, width));
  const winFrom = useSharedValue(win.from);
  const winTo = useSharedValue(win.to);
  const count = options.length;
  const moveWindow = (from: number, to: number) => setWin({ from, to });
  const settle = (offset: number) => {
    const at = Math.min(Math.max(Math.round(offset / STEP), 0), last);
    if (at !== chosen) onPick(at);
  };
  const press = useLatestCallback((index: number) => {
    ref.current?.scrollTo({ x: index * STEP, animated: !reduce });
    if (index !== chosen) onPick(index);
  });
  const onScroll = useAnimatedScrollHandler(
    {
      onScroll: (e) => {
        x.set(e.contentOffset.x);
        const w = carouselWindow(e.contentOffset.x, STEP, count, width);
        if (w.from !== winFrom.get() || w.to !== winTo.get()) {
          winFrom.set(w.from);
          winTo.set(w.to);
          runOnJS(moveWindow)(w.from, w.to);
        }
      },
      onMomentumEnd: (e) => {
        runOnJS(settle)(e.contentOffset.x);
      },
    },
    [settle, count, width],
  );
  // The chosen option comes to the centre when it changes elsewhere (Karıştır, Hepsini çıkar, the
  // sheet).
  useEffect(() => {
    ref.current?.scrollTo({ x: chosen * STEP, animated: !reduce });
  }, [chosen, reduce, ref]);

  return (
    <Animated.ScrollView
      ref={ref}
      horizontal
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      snapToInterval={STEP}
      decelerationRate="fast"
      disableIntervalMomentum
      contentOffset={{ x: chosen * STEP, y: 0 }}
      onScroll={onScroll}
      scrollEventThrottle={16}
      style={{ flexGrow: 0, width }}
      contentContainerStyle={{ paddingHorizontal: pad, alignItems: 'center' }}
    >
      <View style={{ width: win.from * STEP }} />
      {options.slice(win.from, win.to + 1).map((option, i) => {
        const index = win.from + i;
        return (
          <Item
            key={option.key}
            option={option}
            index={index}
            on={index === chosen}
            x={x}
            reduce={reduce}
            onPress={press}
          />
        );
      })}
      <View style={{ width: Math.max(0, last - win.to) * STEP }} />
    </Animated.ScrollView>
  );
}

const Item = memo(function Item({
  option,
  index,
  on,
  x,
  reduce,
  onPress,
}: {
  option: Option;
  index: number;
  on: boolean;
  x: SharedValue<number>;
  reduce: boolean;
  onPress: (index: number) => void;
}) {
  const { colors } = useTheme();
  const style = useAnimatedStyle(() => {
    if (reduce) return { transform: [{ scale: on ? 1 : STILL }], opacity: 1 };
    const d = Math.abs(x.get() / STEP - index);
    return {
      transform: [{ scale: interpolate(d, DISTANCES, SCALES, Extrapolation.CLAMP) }],
      opacity: interpolate(d, DISTANCES, FADES, Extrapolation.CLAMP),
    };
  });
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: on }}
      accessibilityLabel={option.name}
      onPress={() => onPress(index)}
      style={{ width: STEP, height: BOX, alignItems: 'center', justifyContent: 'center' }}
    >
      <Animated.View style={[{ width: BOX, height: BOX, padding: RING_OUT }, style]}>
        <LookAvatar look={option.tile} size={ITEM} />
        {on ? (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: BOX / 2,
              borderWidth: KIT.size.boxRing,
              borderColor: colors.accent,
            }}
          />
        ) : null}
      </Animated.View>
    </Pressable>
  );
});
