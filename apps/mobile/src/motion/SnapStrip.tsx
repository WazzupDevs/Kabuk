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
import { T } from '@/aura/kit';
import { KIT } from '@/theme/auraKit';
import { CAPSULE_EDIT } from '@/theme/capsuleEdit';
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
// The options' names under them (KapsulSusle `.gi p`): the height they add to the strip.
export function snapStripNameHeight(fontScale: number): number {
  const N = CAPSULE_EDIT.strip;
  return N.nameGap + Math.ceil(N.nameLine * Math.min(fontScale, N.nameScale));
}
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
  ringColor,
  markOf,
  markHeight = 0,
  stampOf,
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
  // The centred option's ring (the theme's accent when not given; Süsle's is the kit's pink).
  ringColor?: string;
  // What stands between an option's round and its name (Süsle: an accessory's rarity gems), in a
  // row `markHeight` high (its gap over it included) under every option, so the names line up.
  markOf?: (index: number) => ReactNode;
  markHeight?: number;
  // What an option's drawing reads besides its key (Süsle: on the screen or not, the colour): an
  // option is drawn again only when its stamp, its name or its being chosen changes (the owner's
  // report, 22 Kasım: every option drawn again on each choice flickered).
  stampOf?: (index: number) => string;
  testID?: string;
}) {
  const { width, fontScale } = useWindowDimensions();
  const { colors } = useTheme();
  const nameHeight = snapStripNameHeight(fontScale) + markHeight;
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

  // One ring, still in the strip's middle (the owner's report, 23 Kasım: a ring on each option
  // faded from the old choice to the new one, two rings while the strip moved): the options pass
  // under it, the one in the middle at its full size inside it.
  const ringSide = BOX * ON;
  return (
    <View style={{ width, height: SNAP_STRIP_HEIGHT + nameHeight }}>
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
        style={{ flexGrow: 0, width, height: SNAP_STRIP_HEIGHT + nameHeight }}
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
              nameHeight={nameHeight}
              ringColor={ringColor}
              mark={markOf ? markOf(index) : null}
              markHeight={markHeight}
              stamp={stampOf ? stampOf(index) : ''}
              onPress={tap}
            >
              {renderItem(index)}
            </Item>
          );
        })}
        <View style={{ width: Math.max(0, last - win.to) * STEP }} />
      </Reanimated.ScrollView>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: (width - ringSide) / 2,
          top: (SNAP_STRIP_HEIGHT - ringSide) / 2,
          width: ringSide,
          height: ringSide,
          borderRadius: ringSide / 2,
          borderWidth: KIT.size.boxRing * ON,
          borderColor: ringColor ?? colors.accent,
        }}
      />
    </View>
  );
}

const Item = memo(
  function Item({
    index,
    label,
    on,
    x,
    reduce,
    ground,
    ringColor,
    nameHeight,
    mark,
    markHeight,
    onPress,
    children,
  }: {
    stamp: string;
    index: number;
    label: string;
    on: boolean;
    x: SharedValue<number>;
    reduce: boolean;
    ground: string;
    ringColor?: string;
    nameHeight: number;
    mark: ReactNode;
    markHeight: number;
    onPress: (index: number) => void;
    children: ReactNode;
  }) {
    const scale = useAnimatedStyle(() => {
      if (reduce) return { transform: [{ scale: on ? ON : OFF }] };
      const d = Math.abs(x.get() / STEP - index);
      return { transform: [{ scale: interpolate(d, [0, 1], [ON, OFF], Extrapolation.CLAMP) }] };
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
          height: SNAP_STRIP_HEIGHT + nameHeight,
          alignItems: 'center',
        }}
      >
        <View
          style={{
            width: STEP,
            height: SNAP_STRIP_HEIGHT,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* The animated styles go to the view on the UI thread (ANDROID_SYNCHRONOUSLY_UPDATE_UI_PROPS)
          and React keeps the first render's copy, written back when the item renders again (a tap:
          the old and the new choice). That copy is the item's rest as it is now, after the animated
          one, so a ring and a size from when it stood in the middle never come back (the owner's
          report, 23 Kasım: a ring on the tapped side option; docs/decisions/m15-22-acilis-olcegi.md). */}
          <Reanimated.View
            style={[
              { width: BOX, height: BOX, padding: RING_OUT },
              scale,
              { transform: [{ scale: on ? ON : OFF }] },
            ]}
          >
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
          </Reanimated.View>
        </View>
        {/* The name under the option, one line that shrinks; the centred one in bold. */}
        {markHeight > 0 ? (
          <View
            style={{
              height: markHeight - CAPSULE_EDIT.strip.nameGap,
              marginTop: CAPSULE_EDIT.strip.nameGap,
              justifyContent: 'center',
            }}
          >
            {mark}
          </View>
        ) : null}
        <View
          style={{
            width: STEP - 2 * CAPSULE_EDIT.strip.nameSide,
            height: nameHeight - markHeight - CAPSULE_EDIT.strip.nameGap,
            marginTop: CAPSULE_EDIT.strip.nameGap,
            justifyContent: 'flex-start',
          }}
        >
          <T v="eyebrow" ink strong={on} lines={1} fit center>
            {label}
          </T>
        </View>
      </Tap>
    );
  },
  // Its drawing is new each time the strip draws (`children`, `mark`): the stamp stands for it.
  (a, b) =>
    a.index === b.index &&
    a.label === b.label &&
    a.on === b.on &&
    a.x === b.x &&
    a.reduce === b.reduce &&
    a.ground === b.ground &&
    a.ringColor === b.ringColor &&
    a.nameHeight === b.nameHeight &&
    a.markHeight === b.markHeight &&
    a.onPress === b.onPress &&
    a.stamp === b.stamp,
);
