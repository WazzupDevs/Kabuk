import type { ReactElement } from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

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
  | 'map'
  | 'report'
  | 'block'
  | 'mute'
  | 'shield'
  | 'logout'
  | 'trash'
  | 'doc'
  | 'refresh'
  | 'photo'
  | 'eyeOff'
  | 'personRemove';

type Part =
  | { k: 'cap'; x1: number; y1: number; x2: number; y2: number; tone: 'a' | 'b'; t?: number }
  // A line drawing (the tab bar's: 1.9 wide, round ends), or a filled shape.
  | { k: 'line'; d: string; tone: 'a' | 'b'; fill?: boolean }
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
const line = (d: string, tone: 'a' | 'b', fill?: boolean): Part => ({ k: 'line', d, tone, fill });
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
  // A bell as the tab bar draws (the owner's call, 28 Ekim): its outline, the clapper under it and
  // a little knob on top.
  bell: [
    line(
      'M12 4.6c-3.3 0-5.6 2.5-5.6 5.8v3.5l-1.7 2.6c-.4.6 0 1.4.8 1.4h13c.8 0 1.2-.8.8-1.4l-1.7-2.6v-3.5c0-3.3-2.3-5.8-5.6-5.8Z',
      'a',
    ),
    line('M9.9 20.2c.5.8 1.2 1.2 2.1 1.2s1.6-.4 2.1-1.2', 'a'),
    circ(12, 3.3, 1.3, 'b'),
  ],
  // A speech bubble with its tail and three dots (the owner's call, 28 Ekim).
  chat: [
    line(
      'M7.6 4.5h8.8c2.6 0 4.6 2 4.6 4.6v3.8c0 2.6-2 4.6-4.6 4.6H11l-4.1 3.1c-.5.4-1.2 0-1.2-.6v-2.6c-1.6-.7-2.7-2.3-2.7-4.2V9.1c0-2.6 2-4.6 4.6-4.6Z',
      'a',
    ),
    circ(8.4, 11, 1.25, 'b'),
    circ(12, 11, 1.25, 'b'),
    circ(15.6, 11, 1.25, 'b'),
  ],
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
  // A folded map with its pin (the owner's call, 28 Ekim: the old one was small and unclear).
  map: [
    line('M3.4 6.5 8.9 4.4l6.2 2.2 5.5-2.1v13l-5.5 2.1-6.2-2.2-5.5 2.1Z', 'a'),
    line('M8.9 4.4v13M15.1 6.6v13', 'b'),
    line(
      'M12 7.6c-1.5 0-2.6 1.1-2.6 2.6 0 1.7 2.6 4.2 2.6 4.2s2.6-2.5 2.6-4.2c0-1.5-1.1-2.6-2.6-2.6Z',
      'a',
      true,
    ),
  ],
  // The menu's icons in the same family (the owner's report, 29 Ekim: Bildir, Engelle, Sessize al,
  // Gizlilik, Çıkış yap looked unrelated): capsule strokes and soft shapes, the strong tone on what
  // the action does.
  // A flag on its pole.
  report: [
    cap(6.4, 4, 6.4, 20.4, 'a'),
    line('M8 4.6h10.2c.7 0 1.1.8.7 1.3l-2.1 3.1 2.1 3.1c.4.5 0 1.3-.7 1.3H8Z', 'b', true),
  ],
  // A soft disc with the bar across it (a ring would read as the compass).
  block: [circ(12, 12, 8.6, 'b'), cap(7.6, 16.4, 16.4, 7.6, 'a')],
  // The speaker, silenced.
  mute: [
    line('M3.8 9.4h3.1L11.6 5.6v12.8l-4.7-3.8H3.8Z', 'a', true),
    cap(15.2, 9.4, 20.2, 14.6, 'b', 2.6),
    cap(20.2, 9.4, 15.2, 14.6, 'b', 2.6),
  ],
  // A shield with a check in it.
  shield: [
    line('M12 3.4 19.2 6v5.6c0 4.3-3 7.7-7.2 9-4.2-1.3-7.2-4.7-7.2-9V6Z', 'b', true),
    cap(9, 12.2, 11.2, 14.4, 'a', 2.6),
    cap(11.2, 14.4, 15.4, 10.2, 'a', 2.6),
  ],
  // A door and the way out of it.
  logout: [
    rect(3.6, 4, 9, 16, 3.5, 'b'),
    cap(9.6, 12, 20, 12, 'a', 2.8),
    cap(16.6, 8.6, 20, 12, 'a', 2.8),
    cap(20, 12, 16.6, 15.4, 'a', 2.8),
  ],
  trash: [
    rect(6, 8, 12, 12.6, 3.4, 'b'),
    cap(4.6, 5.6, 19.4, 5.6, 'a'),
    cap(10.2, 3.4, 13.8, 3.4, 'a', 2.6),
  ],
  doc: [
    rect(5, 3, 14, 18, 4, 'b'),
    cap(8.8, 9, 15.2, 9, 'a', 2.4),
    cap(8.8, 12.8, 15.2, 12.8, 'a', 2.4),
    cap(8.8, 16.6, 12.6, 16.6, 'a', 2.4),
  ],
  // Round arrow.
  refresh: [line('M19.2 12a7.2 7.2 0 1 1-2.1-5.1', 'a'), line('M17.6 3.6v3.8h-3.8', 'b')],
  // A camera.
  photo: [
    rect(3.4, 7.2, 17.2, 12.6, 4, 'b'),
    rect(8.4, 4.4, 7.2, 3.6, 1.8, 'b'),
    circ(12, 13.4, 3.3, 'a'),
  ],
  // An eye, crossed out.
  eyeOff: [
    line('M2.8 12s3.4-6 9.2-6 9.2 6 9.2 6-3.4 6-9.2 6-9.2-6-9.2-6Z', 'b'),
    circ(12, 12, 2.7, 'b'),
    cap(5, 19, 19, 5, 'a', 2.6),
  ],
  // A person, taken off: the invite's figure with a minus.
  personRemove: [
    circ(9, 7.8, 3.5, 'a'),
    rect(2.8, 13.6, 12.4, 7, 3.5, 'b'),
    cap(15.6, 10, 21.6, 10, 'a', 2.8),
  ],
};

const OUTLINE = 2.8;
// The tab bar's line (aura.css `.ti`).
const LINE = 1.9;

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
    if (p.k === 'line') {
      return p.fill ? (
        <Path key={i} d={p.d} fill={fill} opacity={opacity} />
      ) : (
        <Path
          key={i}
          d={p.d}
          fill="none"
          stroke={fill}
          strokeWidth={LINE}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={opacity}
        />
      );
    }
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
