import { useEffect, useId, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { ClipPath, Defs, G, Path, Rect } from 'react-native-svg';

import { useReduceMotion } from '@/lib/useReduceMotion';

import {
  BAR,
  BAR_ICON_COLORS,
  BAR_ICONS,
  type BarIconKind,
  barRect,
  type BarState,
  BELL,
  BELL_BADGE,
  SLOT,
} from '@/theme/barIcons';
import { ON_GAME } from '@/theme/gameColors';
import {
  BADGE_BUMP,
  BELL_RING,
  BELL_RING_MS,
  ICON_SPRINGS,
  iconFormAt,
  keyAt,
  lobbyMorphAt,
} from '@/theme/playMotion';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON } from '@/theme/tokens';

import { Text } from './Text';

function Bar({ p, thickness, fill }: { p: BarState; thickness: number; fill: string }) {
  const r = barRect(p, thickness);
  return (
    <Rect
      x={r.x}
      y={r.y}
      width={r.width}
      height={r.height}
      rx={r.rx}
      fill={fill}
      transform={`rotate(${r.rotate.join(' ')})`}
    />
  );
}

// Milliseconds into a short motion that starts when `run` changes (and, with `playFirst`, on the
// first render); null when none is playing. The icons' springs are drawn frame by frame on the JS
// thread, like v45: a 24-unit SVG for under a second, only while the motion plays.
function useMotionClock(run: unknown, ms: number, on: boolean, playFirst: boolean): number | null {
  const [clock, setClock] = useState<{ run: unknown; t: number | null }>(() => ({
    run,
    t: on && playFirst ? 0 : null,
  }));
  const playing = clock.run !== run || clock.t !== null;
  useEffect(() => {
    if (!on || !playing) return;
    const start = Date.now();
    let frame = requestAnimationFrame(function step() {
      const t = Date.now() - start;
      setClock({ run, t: t >= ms ? null : t });
      if (t < ms) frame = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(frame);
  }, [run, ms, on, playing]);
  if (!on) return null;
  return clock.run === run ? clock.t : 0;
}

type Props = {
  kind: BarIconKind;
  size?: number;
  // The lobby icon's bar and slot (the label's colour); the others carry their own colours.
  color?: string;
  // Plus, cross and check: form from the mark when first shown (v45: on coming into view). Off in
  // long lists, where every row would spring at once.
  form?: boolean;
  // Plus, cross and check: a new value folds the icon into the mark and springs it out (a press);
  // the first value does not.
  pressKey?: string | number;
};

// An icon from the bar family (src/theme/barIcons.ts): plus, cross and check in two colours with a
// dark crossing; the lobby icon (a bar and a dashed slot) and its open "minus" in the label's
// colour. Changing `kind` between lobby and minus turns the bar with a spring (v45: IC.to); plus,
// cross and check can form and spring when pressed (src/theme/playMotion.ts). Reduce motion draws
// the resting icon. Decorative: the button around it carries the label.
export function BarIcon({ kind, size = ICON.md, color, form = false, pressKey }: Props) {
  const { colors } = useTheme();
  const reduce = useReduceMotion();
  const clip = `bar${useId().replace(/[^A-Za-z0-9]/g, '')}`;
  const ink = color ?? colors.text;
  const lobby = kind === 'lobby' || kind === 'minus';
  const [firstPress] = useState(pressKey);
  const pressed = pressKey !== firstPress;
  const t = useMotionClock(
    lobby ? kind : pressKey,
    lobby ? ICON_SPRINGS.morphMs : pressed ? ICON_SPRINGS.pressMs : ICON_SPRINGS.formMs,
    !reduce,
    !lobby && form,
  );
  let body;
  if (kind === 'lobby' || kind === 'minus') {
    const d = t === null ? BAR_ICONS[kind] : lobbyMorphAt(kind, t);
    const s = barRect(d.s, BAR.thick);
    body = (
      <>
        <Bar p={d.a} thickness={BAR.thick} fill={ink} />
        <Rect
          x={s.x}
          y={s.y}
          width={s.width}
          height={s.height}
          rx={s.rx}
          fill="none"
          stroke={ink}
          strokeWidth={SLOT.stroke}
          strokeDasharray={SLOT.dash.join(' ')}
          opacity={Math.max(0, Math.min(1, d.s.o ?? 1))}
          transform={`rotate(${s.rotate.join(' ')})`}
        />
      </>
    );
  } else {
    const d = t === null ? BAR_ICONS[kind] : iconFormAt(kind, t, pressed);
    const c = BAR_ICON_COLORS[kind];
    const a = barRect(d.a, BAR.thin);
    body = (
      <>
        <Defs>
          <ClipPath id={clip}>
            <Rect
              x={a.x}
              y={a.y}
              width={a.width}
              height={a.height}
              rx={a.rx}
              transform={`rotate(${a.rotate.join(' ')})`}
            />
          </ClipPath>
        </Defs>
        <Bar p={d.a} thickness={BAR.thin} fill={c.a} />
        <Bar p={d.b} thickness={BAR.thin} fill={c.b} />
        <G clipPath={`url(#${clip})`}>
          <Bar p={d.b} thickness={BAR.thin} fill={c.x} />
        </G>
      </>
    );
  }
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={{ width: size, height: size }}
    >
      <Svg width={size} height={size} viewBox="0 0 24 24">
        {body}
      </Svg>
    </View>
  );
}

type BellProps = {
  // Unread notifications; none shows no badge.
  unread?: number;
  size?: number;
  // A new value rings the bell once and bumps the badge (a new notification, step 4.7); the first
  // value does not.
  ringKey?: string | number;
};

// The Mesajlar bell from the bar family (src/theme/barIcons.ts) with its unread badge (v43:
// .nbell, .nb-bdg). The button around it carries the label and the count ("Bildirimler, 3 yeni").
export function BellIcon({ unread = 0, size = ICON.lg, ringKey }: BellProps) {
  const { colors } = useTheme();
  const reduce = useReduceMotion();
  const clip = `bell${useId().replace(/[^A-Za-z0-9]/g, '')}`;
  const b = BELL.bar;
  const c = BELL.clapper;
  const unit = size / 24;
  // The ring (v45: nbRing, nbClap, vbump): the bell swings about its top, the clapper the other
  // way, the badge bumps. Linear time here; keyAt eases each swing with the pop, as v45's CSS does.
  const ring = useSharedValue(1);
  const bump = useSharedValue(1);
  const lastKey = useRef(ringKey);
  useEffect(() => {
    if (lastKey.current === ringKey) return;
    lastKey.current = ringKey;
    if (reduce) return;
    ring.set(0);
    ring.set(withTiming(1, { duration: BELL_RING_MS, easing: Easing.linear }));
    bump.set(0);
    bump.set(withTiming(1, { duration: BADGE_BUMP.ms, easing: Easing.linear }));
  }, [ringKey, reduce, ring, bump]);
  const swing = useAnimatedStyle(() => ({
    transform: [{ rotate: `${keyAt(ring.value, BELL_RING.rotate)}deg` }],
  }));
  const clap = useAnimatedStyle(() => ({
    transform: [{ translateX: keyAt(ring.value, BELL_RING.clapper) * unit }],
  }));
  const badge = useAnimatedStyle(() => ({
    transform: [{ scale: keyAt(bump.value, BADGE_BUMP.keys) }],
  }));
  return (
    <View style={{ width: size, height: size }}>
      <Animated.View style={[{ width: size, height: size, transformOrigin: '50% 14%' }, swing]}>
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Defs>
            <ClipPath id={clip}>
              <Path d={BELL.dome} />
            </ClipPath>
          </Defs>
          <Path d={BELL.dome} fill={BELL.colors.dome} />
          <Rect
            x={b.x}
            y={b.y}
            width={b.width}
            height={b.height}
            rx={b.rx}
            fill={BELL.colors.bar}
          />
          <G clipPath={`url(#${clip})`}>
            <Rect
              x={b.x}
              y={b.y}
              width={b.width}
              height={b.height}
              rx={b.rx}
              fill={BELL.colors.overlap}
            />
          </G>
        </Svg>
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: c.x * unit,
              top: c.y * unit,
              width: c.width * unit,
              height: c.height * unit,
              borderRadius: c.rx * unit,
              backgroundColor: BELL.colors.clapper,
            },
            clap,
          ]}
        />
      </Animated.View>
      {unread > 0 ? (
        <Animated.View
          className="absolute items-center justify-center"
          style={[
            {
              top: -BELL_BADGE.lift,
              right: -BELL_BADGE.lift,
              minWidth: BELL_BADGE.minWidth,
              height: BELL_BADGE.height,
              paddingHorizontal: BELL_BADGE.lift + BELL_BADGE.ring,
              borderRadius: BELL_BADGE.height / 2,
              backgroundColor: BELL_BADGE.color,
              borderWidth: BELL_BADGE.ring,
              borderColor: colors.canvas,
            },
            badge,
          ]}
        >
          <Text variant="caption" color={ON_GAME} tabular>
            {unread > 99 ? '99+' : String(unread)}
          </Text>
        </Animated.View>
      ) : null}
    </View>
  );
}
