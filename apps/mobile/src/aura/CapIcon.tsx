import type { ReactElement } from 'react';
import Svg, { Circle, Rect } from 'react-native-svg';

import { KIT } from '@/theme/auraKit';

// The canvas's icons (docs/design/aura → `.ci`): drawn from capsules, two tones, the second softer
// (`soft`: its opacity; 0.62 on a primary button, 1 for the brand's two colours). On a 24 grid.
export type CapIconName =
  | 'back'
  | 'forward'
  | 'close'
  | 'plus'
  | 'check'
  | 'more'
  | 'search'
  | 'pin'
  | 'bell'
  | 'chat'
  | 'user'
  | 'invite'
  | 'calendar'
  | 'compass'
  | 'settings'
  | 'shuffle'
  | 'list'
  | 'map';

type Part =
  | { k: 'cap'; x1: number; y1: number; x2: number; y2: number; tone: 'a' | 'b'; t?: number }
  | { k: 'rect'; x: number; y: number; w: number; h: number; r: number; tone: 'a' | 'b' }
  | { k: 'circ'; cx: number; cy: number; r: number; tone: 'a' | 'b' | 'o' };

const T = 3.2;
const cap = (x1: number, y1: number, x2: number, y2: number, tone: 'a' | 'b', t = T): Part => ({
  k: 'cap',
  x1,
  y1,
  x2,
  y2,
  tone,
  t,
});
const rect = (x: number, y: number, w: number, h: number, r: number, tone: 'a' | 'b'): Part => ({
  k: 'rect',
  x,
  y,
  w,
  h,
  r,
  tone,
});
const circ = (cx: number, cy: number, r: number, tone: 'a' | 'b' | 'o'): Part => ({
  k: 'circ',
  cx,
  cy,
  r,
  tone,
});

const ICONS: Record<CapIconName, Part[]> = {
  back: [cap(15.5, 5, 8.5, 12, 'a'), cap(8.5, 12, 15.5, 19, 'b')],
  forward: [cap(8.5, 5, 15.5, 12, 'a'), cap(15.5, 12, 8.5, 19, 'b')],
  close: [cap(6, 6, 18, 18, 'a'), cap(18, 6, 6, 18, 'b')],
  plus: [cap(12, 4.5, 12, 19.5, 'a'), cap(4.5, 12, 19.5, 12, 'b')],
  check: [cap(5, 12.5, 9.8, 17.3, 'b'), cap(9.8, 17.3, 19, 7, 'a')],
  more: [
    rect(3.4, 9, 3.2, 6, 1.6, 'a'),
    rect(10.4, 9, 3.2, 6, 1.6, 'b'),
    rect(17.4, 9, 3.2, 6, 1.6, 'a'),
  ],
  search: [circ(10.5, 10.5, 6, 'o'), cap(15.2, 15.2, 19.5, 19.5, 'b')],
  pin: [rect(7, 3, 10, 14, 5, 'a'), cap(12, 18.4, 12, 20.6, 'b')],
  bell: [rect(6, 3.5, 12, 13.5, 6, 'a'), cap(4.5, 17.4, 19.5, 17.4, 'b'), circ(12, 21, 1.7, 'a')],
  chat: [rect(3, 4.5, 18, 12.5, 6.25, 'a'), cap(7.4, 16, 5.4, 20.2, 'b')],
  user: [circ(12, 7.5, 3.9, 'a'), rect(4.5, 13.5, 15, 7.5, 3.75, 'b')],
  invite: [
    circ(9, 7.8, 3.5, 'a'),
    rect(2.8, 13.6, 12.4, 7, 3.5, 'b'),
    cap(18.6, 7, 18.6, 13, 'a', 2.8),
    cap(15.6, 10, 21.6, 10, 'a', 2.8),
  ],
  calendar: [
    rect(3.5, 5.5, 17, 15, 4.5, 'b'),
    cap(8, 3.4, 8, 7.6, 'a'),
    cap(16, 3.4, 16, 7.6, 'a'),
    cap(7.6, 13.2, 16.4, 13.2, 'a', 2.8),
  ],
  compass: [circ(12, 12, 8.6, 'o'), cap(12, 12, 15.6, 8.4, 'a'), cap(12, 12, 8.4, 15.6, 'b')],
  settings: [
    cap(4, 6.5, 20, 6.5, 'b', 2.6),
    cap(4, 12, 20, 12, 'b', 2.6),
    cap(4, 17.5, 20, 17.5, 'b', 2.6),
    circ(15, 6.5, 2.7, 'a'),
    circ(8.5, 12, 2.7, 'a'),
    circ(14, 17.5, 2.7, 'a'),
  ],
  shuffle: [
    rect(4, 4, 16, 16, 5, 'b'),
    circ(8.6, 8.6, 1.9, 'a'),
    circ(15.4, 15.4, 1.9, 'a'),
    circ(15.4, 8.6, 1.9, 'a'),
    circ(8.6, 15.4, 1.9, 'a'),
  ],
  list: [
    cap(10, 6.5, 20, 6.5, 'a'),
    cap(10, 12, 20, 12, 'a'),
    cap(10, 17.5, 17, 17.5, 'a'),
    cap(4.6, 6.5, 5, 6.5, 'b'),
    cap(4.6, 12, 5, 12, 'b'),
    cap(4.6, 17.5, 5, 17.5, 'b'),
  ],
  map: [
    rect(3, 4, 18, 16, 5, 'b'),
    rect(9.5, 6.5, 5, 8.5, 2.5, 'a'),
    cap(12, 16.4, 12, 17, 'a', 2.4),
  ],
};

const OUTLINE = 2.8;

export function CapIcon({
  name,
  color,
  second,
  soft = 0.5,
  size = KIT.size.icon,
}: {
  name: CapIconName;
  color: string;
  // The softer tone's own colour (the open tab: the brand's pink); its opacity is `soft`.
  second?: string;
  soft?: number;
  size?: number;
}) {
  const b = second ?? color;
  const parts = ICONS[name].map((p, i): ReactElement => {
    const fill = p.tone === 'b' ? b : color;
    const opacity = p.tone === 'b' ? soft : 1;
    if (p.k === 'circ') {
      return p.tone === 'o' ? (
        <Circle
          key={i}
          cx={p.cx}
          cy={p.cy}
          r={p.r}
          fill="none"
          stroke={color}
          strokeWidth={OUTLINE}
        />
      ) : (
        <Circle key={i} cx={p.cx} cy={p.cy} r={p.r} fill={fill} opacity={opacity} />
      );
    }
    if (p.k === 'rect') {
      return (
        <Rect
          key={i}
          x={p.x}
          y={p.y}
          width={p.w}
          height={p.h}
          rx={p.r}
          fill={fill}
          opacity={opacity}
        />
      );
    }
    const t = p.t ?? T;
    const cx = (p.x1 + p.x2) / 2;
    const cy = (p.y1 + p.y2) / 2;
    const len = Math.hypot(p.x2 - p.x1, p.y2 - p.y1) + t;
    const angle = (Math.atan2(p.y2 - p.y1, p.x2 - p.x1) * 180) / Math.PI;
    return (
      <Rect
        key={i}
        x={cx - len / 2}
        y={cy - t / 2}
        width={len}
        height={t}
        rx={t / 2}
        fill={fill}
        opacity={opacity}
        transform={`rotate(${angle} ${cx} ${cy})`}
      />
    );
  });
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {parts}
    </Svg>
  );
}
