import type { TabKey } from '@shared/navigation.ts';
import { useId } from 'react';
import Svg, { Defs, G, Mask, Rect } from 'react-native-svg';

import { AURA } from '@/theme/aura';

import { CapIcon, type CapIconName } from './CapIcon';

// The tab icons (Aura v65 GaleriAltMenu → Simgeler, U7): the capsule icon family (Keşfet compass,
// Aktiviteler calendar, Mesajlar chat, Profil user) and Mekân's two outlined capsules (the mark).
// One line style in one colour (docs/design/iskelet.md → 3.3: the chosen tab's green, the others
// quiet); the tab bar (motion/TabBar.tsx) gives the colour.

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

function Mark({ color, uid }: { color: string; uid: string }) {
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

export function TabIcon({ tab, color, size }: { tab: TabKey; color: string; size: number }) {
  const uid = `m${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  if (tab === 'venue') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Mark color={color} uid={uid} />
      </Svg>
    );
  }
  return <CapIcon name={CAP[tab]} color={color} size={size} />;
}
