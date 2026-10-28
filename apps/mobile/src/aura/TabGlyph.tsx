import type { TabKey } from '@shared/navigation.ts';
import { useEffect, useId } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, ClipPath, Defs, G, Mask, Path, Rect } from 'react-native-svg';

import { useReduceMotion } from '@/lib/useReduceMotion';
import { AURA, MOTION } from '@/theme/aura';

import { ARRIVE, LEAVE, SPRING } from './motion';

// The tab icons (docs/design/aura → the tab bars of Keşfet, Mekan, Mesajlar, Profil), in the
// mark's language: rounded shapes, one in front of the other. Off: outlined, the front shape
// cutting a gap into the back one. On: filled, back purple, front pink, where they overlap amber.
// On a 24 grid.

const SW = 1.9;
const DIAMOND = 'M16.3 7.7 13.7 13.7 7.7 16.3 10.3 10.3Z';
type Box = { x: number; y: number; w: number; h: number; r: number };
const MARK: [Box, Box] = [
  { x: 5.2, y: 2.4, w: 8, h: 15.6, r: 4 },
  { x: 10.8, y: 6, w: 8, h: 15.6, r: 4 },
];
const BUBBLES: [Box, Box] = [
  { x: 2.4, y: 3.2, w: 14.2, h: 10.8, r: 5.4 },
  { x: 7.4, y: 9.6, w: 14.2, h: 10.8, r: 5.4 },
];
const CAL: Box = { x: 3.2, y: 5.4, w: 17.6, h: 15.6, r: 5 };
const RINGS: Box[] = [
  { x: 6.6, y: 2.4, w: 2.8, h: 6.4, r: 1.4 },
  { x: 14.6, y: 2.4, w: 2.8, h: 6.4, r: 1.4 },
];
const TODAY: Box = { x: 13.4, y: 13.4, w: 4.2, h: 4.2, r: 1.5 };

type Paint = { fill?: string; stroke?: string; strokeWidth?: number };
const box = (b: Box, paint: Paint, key?: string) => (
  <Rect key={key} x={b.x} y={b.y} width={b.w} height={b.h} rx={b.r} {...paint} />
);

function Off({ tab, color, uid }: { tab: TabKey; color: string; uid: string }) {
  const line: Paint = { fill: 'none', stroke: color, strokeWidth: SW };
  const cut = (back: Box, front: Box) => (
    <>
      <Defs>
        <Mask id={uid} maskUnits="userSpaceOnUse" x={0} y={0} width={24} height={24}>
          <Rect x={0} y={0} width={24} height={24} fill={AURA.mask.show} />
          {box(front, { fill: AURA.mask.hide, stroke: AURA.mask.hide, strokeWidth: SW + 3.2 })}
        </Mask>
      </Defs>
      <G mask={`url(#${uid})`}>{box(back, line)}</G>
      {box(front, line)}
    </>
  );
  switch (tab) {
    case 'explore':
      return (
        <>
          <Circle cx={12} cy={12} r={9} {...line} />
          <Path d={DIAMOND} {...line} strokeLinejoin="round" />
        </>
      );
    case 'activities':
      return (
        <>
          {box(CAL, line)}
          <Path d="M8 2.8v4.6M16 2.8v4.6" {...line} strokeLinecap="round" />
          {box(TODAY, { fill: color })}
        </>
      );
    case 'venue':
      return cut(MARK[0], MARK[1]);
    case 'messages':
      return cut(BUBBLES[0], BUBBLES[1]);
    case 'profile':
      return (
        <>
          <Circle cx={12} cy={7.8} r={4.2} {...line} />
          {box({ x: 4.2, y: 14, w: 15.6, h: 7.4, r: 3.7 }, line)}
        </>
      );
  }
}

function On({ tab, uid }: { tab: TabKey; uid: string }) {
  const { back, front, overlap, light } = AURA.mark;
  // Back purple, front pink, the overlap amber.
  const lit = (b: Box, fronts: Box[]) => (
    <>
      <Defs>
        <ClipPath id={uid}>{box(b, {})}</ClipPath>
      </Defs>
      {box(b, { fill: back })}
      {fronts.map((f, i) => box(f, { fill: front }, `f${i}`))}
      <G clipPath={`url(#${uid})`}>{fronts.map((f, i) => box(f, { fill: overlap }, `o${i}`))}</G>
    </>
  );
  switch (tab) {
    case 'explore':
      return (
        <>
          <Circle cx={12} cy={12} r={9.6} fill={back} />
          <Path
            d={DIAMOND}
            fill={overlap}
            stroke={overlap}
            strokeWidth={1.2}
            strokeLinejoin="round"
          />
          <Circle cx={12} cy={12} r={1.3} fill={light} />
        </>
      );
    case 'activities':
      return (
        <>
          {lit(CAL, RINGS)}
          {box(TODAY, { fill: light })}
        </>
      );
    case 'venue':
      return lit(MARK[0], [MARK[1]]);
    case 'messages':
      return lit(BUBBLES[0], [BUBBLES[1]]);
    case 'profile':
      return (
        <>
          <Circle cx={12} cy={7.6} r={4.6} fill={back} />
          {box({ x: 3.8, y: 13.4, w: 16.4, h: 8.2, r: 4.1 }, { fill: front })}
        </>
      );
  }
}

// A tab's icon: the outline while off, the filled icon popping in when it is selected (the film's
// tab switch: the old icon fades out, the new one grows from half its size with a bounce).
export function TabGlyph({ tab, active, color }: { tab: TabKey; active: boolean; color: string }) {
  const reduce = useReduceMotion();
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const onOp = useSharedValue(active ? 1 : 0);
  const onScale = useSharedValue(active ? 1 : MOTION.tab.iconPopFrom);
  const offOp = useSharedValue(active ? 0 : 1);
  useEffect(() => {
    const t = MOTION.tab;
    if (reduce) {
      onOp.value = active ? 1 : 0;
      onScale.value = 1;
      offOp.value = active ? 0 : 1;
      return;
    }
    if (active) {
      onScale.value = t.iconPopFrom;
      onOp.value = withDelay(
        t.iconInDelay,
        withTiming(1, { duration: t.iconFadeMs, easing: ARRIVE }),
      );
      onScale.value = withDelay(t.iconInDelay, withSpring(1, SPRING.pop));
      offOp.value = withTiming(0, { duration: t.iconFadeMs, easing: ARRIVE });
    } else {
      onOp.value = withTiming(0, { duration: t.oldIconOutMs, easing: LEAVE });
      onScale.value = withTiming(0.8, { duration: t.oldIconOutMs, easing: LEAVE });
      offOp.value = withDelay(80, withTiming(1, { duration: 200, easing: ARRIVE }));
    }
  }, [active, reduce, onOp, onScale, offOp]);
  const onStyle = useAnimatedStyle(() => ({
    opacity: onOp.value,
    transform: [{ scale: onScale.value }],
  }));
  const offStyle = useAnimatedStyle(() => ({ opacity: offOp.value }));
  const s = AURA.tabBar;
  return (
    <View
      style={{ width: s.iconOn, height: s.iconOn, alignItems: 'center', justifyContent: 'center' }}
    >
      <Animated.View style={[{ position: 'absolute' }, offStyle]}>
        <Svg width={s.icon} height={s.icon} viewBox="0 0 24 24">
          <Off tab={tab} color={color} uid={`m${uid}`} />
        </Svg>
      </Animated.View>
      <Animated.View style={[{ position: 'absolute' }, onStyle]}>
        <Svg width={s.iconOn} height={s.iconOn} viewBox="0 0 24 24">
          <On tab={tab} uid={`c${uid}`} />
        </Svg>
      </Animated.View>
    </View>
  );
}
