import { memo, type ReactNode, useEffect, useRef, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import Reanimated, {
  Extrapolation,
  interpolate,
  runOnJS,
  type SharedValue,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

import { carouselWindow } from '@/lib/carouselWindow';
import { type SnapEvent, snapStart, snapStep } from '@/lib/snapPick';
import { useLatestCallback } from '@/lib/useLatestCallback';
import { KIT } from '@/theme/auraKit';
import { useTheme } from '@/theme/ThemeProvider';

import { Tap } from './Tap';

const STEP = KIT.size.stripStep;
const ITEM = KIT.size.stripItem;
const RING_OUT = KIT.size.boxRing + KIT.size.boxRingGap;
const BOX = ITEM + RING_OUT * 2;
const ON = KIT.size.stripOn;
const OFF = KIT.size.stripOff;
// The strip's height: the centred option at its full size.
export const SNAP_STRIP_HEIGHT = Math.ceil(BOX * ON);
// A lifted finger rests where it is when the strip is this close to an option and still.
const ALIGNED = 0.5;

// The trying strip (docs/design/iskelet.md → 5.10, 3.4, 4.1): round options in a row that snaps to
// the centre, as wide as the panel, both ends fading. The centred option is at `stripOn` with the
// green ring, the others at `stripOff`: scale and ring follow the scroll linearly on the UI thread.
// What it chooses: lib/snapPick.ts (only the finger's scroll and a tap; never the strip's own
// scroll). Only the options on the screen and a few either side are bound (lib/carouselWindow.ts).
// A new list (`key` it from the screen) opens on `chosen` without motion; `chosen` changed
// elsewhere scrolls the strip to it. With reduce motion nothing scales as it moves.
export function SnapStrip({
  count,
  chosen,
  keyOf,
  labelOf,
  renderItem,
  onPick,
  label,
  reduce,
  ground,
  testID,
}: {
  count: number;
  // The chosen option's index, -1 when none of these.
  chosen: number;
  keyOf: (index: number) => string;
  labelOf: (index: number) => string;
  // What is drawn inside an option's circle.
  renderItem: (index: number) => ReactNode;
  onPick: (index: number) => void;
  label: string;
  reduce: boolean;
  // The options' circle.
  ground: string;
  testID?: string;
}) {
  const { width } = useWindowDimensions();
  const pad = (width - STEP) / 2;
  const ref = useAnimatedRef<Reanimated.ScrollView>();
  const start = Math.max(chosen, 0);
  const x = useSharedValue(start * STEP);
  const last = count - 1;
  const [win, setWin] = useState(() => carouselWindow(start * STEP, STEP, count, width));
  const winFrom = useSharedValue(win.from);
  const winTo = useSharedValue(win.to);
  const moveWindow = (from: number, to: number) => setWin({ from, to });
  const machine = useRef(snapStart(chosen));
  const send = useLatestCallback((event: SnapEvent) => {
    const out = snapStep(machine.current, event);
    machine.current = out.state;
    if (out.scroll)
      ref.current?.scrollTo({ x: out.scroll.at * STEP, animated: out.scroll.animated });
    if (out.pick !== null && out.pick >= 0 && out.pick <= last) onPick(out.pick);
  });
  const indexAt = (offset: number) => Math.min(Math.max(Math.round(offset / STEP), 0), last);
  const settle = useLatestCallback((offset: number) =>
    send({ kind: 'settle', at: indexAt(offset) }),
  );
  const release = useLatestCallback((offset: number, still: boolean) => {
    const at = indexAt(offset);
    send({ kind: 'release', at: still && Math.abs(offset - at * STEP) < ALIGNED ? at : null });
  });
  const drag = useLatestCallback(() => send({ kind: 'drag' }));
  const tap = useLatestCallback((index: number) => send({ kind: 'tap', at: index }));

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
      onBeginDrag: () => {
        runOnJS(drag)();
      },
      onEndDrag: (e) => {
        const v = e.velocity?.x ?? 0;
        runOnJS(release)(e.contentOffset.x, v === 0);
      },
      onMomentumEnd: (e) => {
        runOnJS(settle)(e.contentOffset.x);
      },
    },
    [count, width],
  );
  // The choice changed elsewhere (Rastgele, Hepsini çıkar): the strip goes to it.
  useEffect(() => {
    send({ kind: 'follow', at: chosen, animated: !reduce });
  }, [chosen, reduce, send]);

  return (
    <Reanimated.ScrollView
      ref={ref}
      testID={testID}
      horizontal
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      snapToInterval={STEP}
      decelerationRate="fast"
      disableIntervalMomentum
      contentOffset={{ x: start * STEP, y: 0 }}
      onScroll={onScroll}
      scrollEventThrottle={16}
      fadingEdgeLength={{ start: KIT.size.stripFade, end: KIT.size.stripFade }}
      style={{ flexGrow: 0, width, height: SNAP_STRIP_HEIGHT }}
      contentContainerStyle={{ paddingHorizontal: pad, alignItems: 'center' }}
    >
      <View style={{ width: Math.max(0, win.from) * STEP }} />
      {Array.from({ length: Math.max(0, win.to - win.from + 1) }, (_, i) => {
        const index = win.from + i;
        return (
          <Item
            key={keyOf(index)}
            index={index}
            label={labelOf(index)}
            on={index === chosen}
            x={x}
            reduce={reduce}
            ground={ground}
            onPress={tap}
          >
            {renderItem(index)}
          </Item>
        );
      })}
      <View style={{ width: Math.max(0, last - win.to) * STEP }} />
    </Reanimated.ScrollView>
  );
}

const Item = memo(function Item({
  index,
  label,
  on,
  x,
  reduce,
  ground,
  onPress,
  children,
}: {
  index: number;
  label: string;
  on: boolean;
  x: SharedValue<number>;
  reduce: boolean;
  ground: string;
  onPress: (index: number) => void;
  children: ReactNode;
}) {
  const { colors } = useTheme();
  const scale = useAnimatedStyle(() => {
    if (reduce) return { transform: [{ scale: on ? ON : OFF }] };
    const d = Math.abs(x.get() / STEP - index);
    return { transform: [{ scale: interpolate(d, [0, 1], [ON, OFF], Extrapolation.CLAMP) }] };
  });
  const ring = useAnimatedStyle(() => {
    if (reduce) return { opacity: on ? 1 : 0 };
    const d = Math.abs(x.get() / STEP - index);
    return { opacity: interpolate(d, [0, 1], [1, 0], Extrapolation.CLAMP) };
  });
  return (
    <Tap
      sink={false}
      accessibilityRole="radio"
      accessibilityState={{ checked: on }}
      accessibilityLabel={label}
      onPress={() => onPress(index)}
      style={{
        width: STEP,
        height: SNAP_STRIP_HEIGHT,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Reanimated.View style={[{ width: BOX, height: BOX, padding: RING_OUT }, scale]}>
        <View
          style={{
            width: ITEM,
            height: ITEM,
            borderRadius: ITEM / 2,
            backgroundColor: ground,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {children}
        </View>
        <Reanimated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: BOX / 2,
              borderWidth: KIT.size.boxRing,
              borderColor: colors.accent,
            },
            ring,
          ]}
        />
      </Reanimated.View>
    </Tap>
  );
});
