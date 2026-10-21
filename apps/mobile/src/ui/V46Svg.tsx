import { type ReactNode, useId } from 'react';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  Ellipse,
  G,
  Line,
  LinearGradient,
  Path,
  Polyline,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

import type { V46Drawing, V46Paint, V46SvgNode } from '@/theme/parts.generated';

// One of v46's inline drawings as measured (parts.generated.ts: its viewBox, shapes, clip paths and
// gradients, with each shape's computed paint), drawn with react-native-svg at `size`. Ids of clip
// paths and gradients are made unique per drawing, as v46's own are per page. A paint of
// `currentColor` is `color` (a tab's icon, in the colour of its state).
export function V46Svg({
  drawing,
  size,
  color,
}: {
  drawing: V46Drawing;
  size: readonly [number, number];
  color?: string;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const [width, height] = size;
  const paint = (p: V46Paint | undefined): string =>
    p === undefined || p === null
      ? 'none'
      : typeof p === 'string'
        ? p
        : `url(#${uid}g${p.gradient})`;
  const node = (n: V46SvgNode, key: number): ReactNode => {
    const a = n.attrs;
    const shape = {
      key,
      fill: paint(n.fill),
      stroke: paint(n.stroke),
      strokeWidth: n.strokeWidth,
      strokeLinecap: n.lineCap as 'butt' | 'round' | 'square' | undefined,
      strokeLinejoin: n.lineJoin as 'miter' | 'round' | 'bevel' | undefined,
      opacity: n.opacity,
      transform: a.transform as string | undefined,
      clipPath: n.clip === undefined ? undefined : `url(#${uid}c${n.clip})`,
    };
    switch (n.tag) {
      case 'rect':
        return (
          <Rect {...shape} x={a.x} y={a.y} width={a.width} height={a.height} rx={a.rx} ry={a.ry} />
        );
      case 'path':
        return <Path {...shape} d={String(a.d)} />;
      case 'polyline':
        return <Polyline {...shape} points={String(a.points)} />;
      case 'circle':
        return <Circle {...shape} cx={a.cx} cy={a.cy} r={a.r} />;
      case 'ellipse':
        return <Ellipse {...shape} cx={a.cx} cy={a.cy} rx={a.rx} ry={a.ry} />;
      case 'line':
        return <Line {...shape} x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2} />;
      case 'g':
        return (
          <G key={key} transform={shape.transform} clipPath={shape.clipPath} opacity={n.opacity}>
            {(n.children ?? []).map(node)}
          </G>
        );
      default:
        return null;
    }
  };
  return (
    <Svg width={width} height={height} viewBox={drawing.viewBox.join(' ')} color={color}>
      {drawing.clips.length || drawing.gradients.length ? (
        <Defs>
          {drawing.clips.map((shapes, i) => (
            <ClipPath key={`c${i}`} id={`${uid}c${i}`}>
              {shapes.map(node)}
            </ClipPath>
          ))}
          {drawing.gradients.map((g, i) => {
            const Gradient = g.tag === 'radialGradient' ? RadialGradient : LinearGradient;
            return (
              <Gradient key={`g${i}`} id={`${uid}g${i}`} {...g.attrs}>
                {g.stops.map((s, j) => (
                  <Stop key={j} offset={s.offset} stopColor={s.color} stopOpacity={s.opacity} />
                ))}
              </Gradient>
            );
          })}
        </Defs>
      ) : null}
      {drawing.nodes.map(node)}
    </Svg>
  );
}
