import type { TabKey } from '@shared/navigation.ts';
import { useEffect, useId, useState } from 'react';
import { Animated, View } from 'react-native';
import Svg, { ClipPath, Defs, G, Mask, Rect } from 'react-native-svg';

import { useReduceMotion } from '@/lib/useReduceMotion';
import { AURA, MOTION } from '@/theme/aura';
import { useTheme } from '@/theme/ThemeProvider';

import { CapIcon, type CapIconName } from './CapIcon';
import { ARRIVE_RN, LEAVE_RN, springConfig } from './motion';

// The tab icons (Aura v65 GaleriAltMenu → Simgeler, U7): the capsule icon family (Keşfet compass,
// Aktiviteler calendar, Mesajlar chat, Profil user). Off: one colour (--muted), the body at half.
// On: the strong part accent, the body buzz pink, both full. Mekân keeps the mark's two capsules
// (the icon of today, unchanged): outlined while off, the mark's colours while on.

const CAP: Record<Exclude<TabKey, 'venue'>, CapIconName> = {
  explore: 'compass',
  activities: 'calendar',
  messages: 'chat',
  profile: 'user',
};

const SW = 1.9;
type Box = { x: number; y: number; w: number; h: number; r: number };
const MARK: [Box, Box] = [
  { x: 5.2, y: 2.4, w: 8, h: 15.6, r: 4 },
  { x: 10.8, y: 6, w: 8, h: 15.6, r: 4 },
];

const box = (b: Box, paint: { fill?: string; stroke?: string; strokeWidth?: number }) => (
  <Rect x={b.x} y={b.y} width={b.w} height={b.h} rx={b.r} {...paint} />
);

function MarkOff({ color, uid }: { color: string; uid: string }) {
  const [back, front] = MARK;
  const line = { fill: 'none', stroke: color, strokeWidth: SW };
  return (
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
}

// Back purple, front pink, the overlap amber.
function MarkOn({ uid }: { uid: string }) {
  const [b, f] = MARK;
  const { back, front, overlap } = AURA.mark;
  return (
    <>
      <Defs>
        <ClipPath id={uid}>{box(b, {})}</ClipPath>
      </Defs>
      {box(b, { fill: back })}
      {box(f, { fill: front })}
      <G clipPath={`url(#${uid})`}>{box(f, { fill: overlap })}</G>
    </>
  );
}

function Icon({ tab, on, color, uid }: { tab: TabKey; on: boolean; color: string; uid: string }) {
  const { scheme, colors } = useTheme();
  const size = on ? AURA.tabBar.iconOn : AURA.tabBar.icon;
  if (tab === 'venue') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        {on ? <MarkOn uid={uid} /> : <MarkOff color={color} uid={uid} />}
      </Svg>
    );
  }
  return on ? (
    <CapIcon
      name={CAP[tab]}
      color={AURA[scheme].tab.on}
      second={colors.buzz}
      soft={1}
      size={size}
    />
  ) : (
    <CapIcon name={CAP[tab]} color={color} size={size} />
  );
}

// A tab's icon: the quiet icon while off, the coloured one popping in when it is selected (the film's
// tab switch: the old icon fades out, the new one grows from half its size with a bounce).
export function TabGlyph({ tab, active, color }: { tab: TabKey; active: boolean; color: string }) {
  const reduce = useReduceMotion();
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const [onOp] = useState(() => new Animated.Value(active ? 1 : 0));
  const [onScale] = useState(() => new Animated.Value(active ? 1 : MOTION.tab.iconPopFrom));
  const [offOp] = useState(() => new Animated.Value(active ? 0 : 1));
  useEffect(() => {
    const t = MOTION.tab;
    if (reduce) {
      onOp.setValue(active ? 1 : 0);
      onScale.setValue(1);
      offOp.setValue(active ? 0 : 1);
      return undefined;
    }
    const native = { useNativeDriver: true };
    if (active) onScale.setValue(t.iconPopFrom);
    const anim = active
      ? Animated.parallel([
          Animated.timing(onOp, {
            ...native,
            toValue: 1,
            duration: t.iconFadeMs,
            delay: t.iconInDelay,
            easing: ARRIVE_RN,
          }),
          Animated.spring(onScale, {
            ...springConfig(MOTION.springs.pop),
            toValue: 1,
            delay: t.iconInDelay,
          }),
          Animated.timing(offOp, {
            ...native,
            toValue: 0,
            duration: t.iconFadeMs,
            easing: ARRIVE_RN,
          }),
        ])
      : Animated.parallel([
          Animated.timing(onOp, {
            ...native,
            toValue: 0,
            duration: t.oldIconOutMs,
            easing: LEAVE_RN,
          }),
          Animated.timing(onScale, {
            ...native,
            toValue: 0.8,
            duration: t.oldIconOutMs,
            easing: LEAVE_RN,
          }),
          Animated.timing(offOp, {
            ...native,
            toValue: 1,
            duration: t.offInMs,
            delay: t.offInDelay,
            easing: ARRIVE_RN,
          }),
        ]);
    anim.start();
    return () => anim.stop();
  }, [active, reduce, onOp, onScale, offOp]);
  const s = AURA.tabBar;
  return (
    <View
      style={{ width: s.iconOn, height: s.iconOn, alignItems: 'center', justifyContent: 'center' }}
    >
      <Animated.View style={{ position: 'absolute', opacity: offOp }}>
        <Icon tab={tab} on={false} color={color} uid={`m${uid}`} />
      </Animated.View>
      <Animated.View
        style={{ position: 'absolute', opacity: onOp, transform: [{ scale: onScale }] }}
      >
        <Icon tab={tab} on color={color} uid={`c${uid}`} />
      </Animated.View>
    </View>
  );
}
