import type { TabKey } from '@shared/navigation.ts';
import { useId } from 'react';
import Svg, { Circle, Defs, G, Mask, Path, Rect } from 'react-native-svg';

import { AURA } from '@/theme/aura';

// The tab icons (the owner's call, 20 Kasım): every tab in the manner of Mekân's mark, one line
// 1.9 wide with round ends and no fill, in one colour: quiet at rest, the chosen tab's green. Keşfet
// a compass, Aktiviteler a ticket, Mesajlar two bubbles (the back one behind the front, as the
// mark's capsules), Profil a person; Mekân the two outlined capsules. The tab bar
// (motion/TabBar.tsx) gives the colour.

const SW = 1.9;
type Box = { x: number; y: number; w: number; h: number; r: number };
const MARK: [Box, Box] = [
  { x: 5.2, y: 2.4, w: 8, h: 15.6, r: 4 },
  { x: 10.8, y: 6, w: 8, h: 15.6, r: 4 },
];

const box = (b: Box, paint: { fill?: string; stroke?: string; strokeWidth?: number }) => (
  <Rect x={b.x} y={b.y} width={b.w} height={b.h} rx={b.r} {...paint} />
);

const BUBBLES: [Box, Box] = [
  { x: 2.6, y: 3.8, w: 13.4, h: 10.4, r: 5.2 },
  { x: 8, y: 9.8, w: 13.4, h: 10.4, r: 5.2 },
];

// Two outlined shapes, the back one hidden where the front one lies over it.
function Pair({ shapes, color, uid }: { shapes: [Box, Box]; color: string; uid: string }) {
  const [back, front] = shapes;
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

const TICKET =
  'M5.6 5.2h12.8a2 2 0 0 1 2 2v2.2a2.6 2.6 0 0 0 0 5.2v2.2a2 2 0 0 1-2 2H5.6a2 2 0 0 1-2-2v-2.2a2.6 2.6 0 0 0 0-5.2V7.2a2 2 0 0 1 2-2z';

export function TabIcon({ tab, color, size }: { tab: TabKey; color: string; size: number }) {
  const uid = `m${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const line = {
    fill: 'none',
    stroke: color,
    strokeWidth: SW,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {tab === 'venue' ? (
        <Pair shapes={MARK} color={color} uid={uid} />
      ) : tab === 'messages' ? (
        <Pair shapes={BUBBLES} color={color} uid={uid} />
      ) : tab === 'explore' ? (
        <>
          <Circle cx={12} cy={12} r={8.6} {...line} />
          <Path d="M15.4 8.6l-1.9 4.9-4.9 1.9 1.9-4.9z" {...line} />
        </>
      ) : tab === 'activities' ? (
        <>
          <Path d={TICKET} {...line} />
          <Path d="M14 8.4v7.2" {...line} strokeDasharray="1.4 2.6" />
        </>
      ) : (
        <>
          <Circle cx={12} cy={8.2} r={3.8} {...line} />
          <Path d="M4.8 20.2c.9-3.8 3.7-5.8 7.2-5.8s6.3 2 7.2 5.8" {...line} />
        </>
      )}
    </Svg>
  );
}
