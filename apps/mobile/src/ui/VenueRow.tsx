import { type ReactNode, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { useReduceMotion } from '@/lib/useReduceMotion';
import {
  V46_EXPLORE,
  V46_EXPLORE_ICONS,
  V46_EXPLORE_MOTION,
  type V46Text,
  type V46ThumbKind,
} from '@/theme/parts.generated';
import { useTheme } from '@/theme/ThemeProvider';
import { v46FontStyle } from '@/theme/v46Type';

import { LiveDot } from './LiveDot';
import { keyframeRest, keyframeSequence, transitionStyle } from './motion';
import { V46Svg } from './V46Svg';
import { VenueThumb } from './VenueThumb';

type Props = {
  thumb: V46ThumbKind;
  name: string;
  // The kind and district (`Kafe · Serdivan`).
  sub: string;
  // The open tables in words (K-41): with the live dot while there are any, muted when quiet.
  status: { text: string; live: boolean };
  // Its place in the list: each row comes in a step after the one above.
  index: number;
  onPress: () => void;
  testID?: string;
  pressedPreview?: boolean;
};

// A venue in Keşfet's list (v46 `.vrow`): its icon, the name, the kind and district and the open
// tables, and an arrow. Pressed, the row takes the screen's ground (150 ms) and shrinks
// (`.va button:active`). Rows come in rising and fading in (`rowIn`, 340 ms), each 40 ms after the
// one above; v46 drops it with reduce motion.
export function VenueRow({
  thumb,
  name,
  sub,
  status,
  index,
  onPress,
  testID,
  pressedPreview = false,
}: Props) {
  const { scheme } = useTheme();
  const r = V46_EXPLORE[scheme].row;
  const [pressing, setPressing] = useState(false);
  const pressed = pressing || pressedPreview;
  const comeIn = useComeIn(index);
  return (
    <Animated.View style={comeIn}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${name}, ${sub}, ${status.text}`}
        testID={testID}
        onPress={onPress}
        onPressIn={() => setPressing(true)}
        onPressOut={() => setPressing(false)}
      >
        <Animated.View
          style={[
            {
              flexDirection: 'row',
              alignItems: 'center',
              gap: r.gap,
              minHeight: r.minHeight,
              paddingTop: r.padding[0],
              paddingRight: r.padding[1],
              paddingBottom: r.padding[2],
              paddingLeft: r.padding[3],
              backgroundColor: pressed ? r.pressed.bg : 'transparent',
              transform: [{ scale: pressed ? r.pressed.scale : 1 }],
            },
            transitionStyle(r.transitions),
          ]}
        >
          <VenueThumb kind={thumb} />
          <View style={{ flex: 1, minWidth: 0, gap: r.middle.gap }}>
            <Line text={r.name}>{name}</Line>
            <Line text={r.sub}>{sub}</Line>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: r.live.gap,
                marginTop: r.live.marginTop,
              }}
            >
              {status.live ? <LiveDot size={r.live.dot} /> : null}
              <Text
                style={[
                  v46FontStyle(r.live.font),
                  { color: status.live ? r.live.color : r.live.quiet, flexShrink: 1 },
                ]}
              >
                {status.text}
              </Text>
            </View>
          </View>
          <V46Svg
            drawing={V46_EXPLORE_ICONS.chevron}
            size={r.chevron.size}
            color={r.chevron.color}
          />
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

function Line({ text, children }: { text: V46Text; children: ReactNode }) {
  return (
    <Text style={[v46FontStyle(text.font, text.letterSpacing), { color: text.color }]}>
      {children}
    </Text>
  );
}

// The longest a row waits to come in (docs/SPEC_V4.md §4.C, the owner's decision): v46's largest
// delay. v46's script puts no limit on its `i * 40` ms; rows past it come in together.
const ROW_DELAY_MAX_MS = 200;

// v46's `rowIn` for the row at `index`: from 10 dp below and transparent to its place, after
// `index` steps, at most ROW_DELAY_MAX_MS. While it waits it holds the first keyframe when the rule
// says so (`holdsBefore`, `animation-fill-mode: backwards`), else its own place.
function useComeIn(index: number) {
  const reduce = useReduceMotion();
  const m = V46_EXPLORE_MOTION.rowIn;
  const plays = !(reduce && m.offWhenReduced);
  const waits = plays && m.holdsBefore;
  const y = useSharedValue(
    waits ? (m.channels.translateY?.from ?? 0) : keyframeRest(m, 'translateY'),
  );
  const opacity = useSharedValue(
    waits ? (m.channels.opacity?.from ?? 1) : keyframeRest(m, 'opacity'),
  );
  useEffect(() => {
    if (!plays) return;
    const wait = Math.min(index * V46_EXPLORE_MOTION.rowStaggerMs, ROW_DELAY_MAX_MS);
    const motion = { ...m, delayMs: m.delayMs + wait };
    const rise = keyframeSequence(motion, 'translateY');
    const show = keyframeSequence(motion, 'opacity');
    if (rise) y.set(rise);
    if (show) opacity.set(show);
    // Played once, when the row comes; a new place does not replay it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (plays) return;
    y.set(keyframeRest(m, 'translateY'));
    opacity.set(keyframeRest(m, 'opacity'));
  }, [plays, m, y, opacity]);
  return useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: y.value }] }));
}
