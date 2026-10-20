import { useId } from 'react';
import Svg, { ClipPath, Defs, G, Rect } from 'react-native-svg';

import { BAR, BAR_ICONS, BAR_VIEW_BOX, type BarRect, barRect } from '@/theme/barIcons';

export type BarGlyphKind = 'plus' | 'cross' | 'check';

function Bar({ r, fill }: { r: BarRect; fill?: string }) {
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

// A two-bar icon of v46 (`.bi`): bar a, bar b, and b again where it crosses a. The bars are v46's
// drawing at rest (theme/barIcons.ts: its IC springs settle there); the fills are the ones v46
// computes for this place (parts.generated.ts: `.bi-a`, `.bi-b`, `.bi-x`).
export function BarGlyph({
  kind,
  fills,
  size,
}: {
  kind: BarGlyphKind;
  fills: { a: string; b: string; x: string };
  size: readonly [number, number];
}) {
  const clip = useId().replace(/[^a-zA-Z0-9]/g, '');
  const icon = BAR_ICONS[kind];
  const a = barRect(icon.a, BAR.thin);
  const b = barRect(icon.b, BAR.thin);
  const [width, height] = size;
  return (
    <Svg width={width} height={height} viewBox={BAR_VIEW_BOX}>
      <Defs>
        <ClipPath id={clip}>
          <Bar r={a} />
        </ClipPath>
      </Defs>
      <Bar r={a} fill={fills.a} />
      <Bar r={b} fill={fills.b} />
      <G clipPath={`url(#${clip})`}>
        <Bar r={b} fill={fills.x} />
      </G>
    </Svg>
  );
}
