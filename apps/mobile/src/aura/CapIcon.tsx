import type { ReactElement } from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { KIT } from '@/theme/auraKit';
import { CAP_ICONS } from '@/theme/capIcons.generated';
import { useTheme } from '@/theme/ThemeProvider';
import { svgKey } from '@/lib/svgKey';

// The app's one icon family (Aura v65, U6): the capsule icons of Ikonlar, IkonlarYeni and
// IkonlarRevize, drawn from docs/design/aura/ikonlar (scripts/sistem/capIcons.ts). On a 24 grid, two
// tones: `a` the strong part in `color`, `b` the body in `second` (or `color`) at `soft` opacity
// (0.5; 0.62 on a primary button; 1 for an open icon: accent in front, the buzz pink behind).
export type CapIconName = keyof typeof CAP_ICONS;

type Part = (typeof CAP_ICONS)[CapIconName][number];

// skall.css `.ci .o` and `.ob`: a ring or a soft line, 3 wide unless the drawing says.
const RING = 3;

function num(part: Part, key: string): number | undefined {
  const v = (part as Record<string, unknown>)[key];
  return typeof v === 'number' ? v : undefined;
}

function str(part: Part, key: string): string | undefined {
  const v = (part as Record<string, unknown>)[key];
  return typeof v === 'string' ? v : undefined;
}

export function CapIcon({
  name,
  color,
  second,
  soft = 0.5,
  size = KIT.size.icon,
}: {
  name: CapIconName;
  color: string;
  // The body's own colour (an open tab: the buzz pink); its opacity is `soft`.
  second?: string;
  soft?: number;
  size?: number;
}) {
  const { colors } = useTheme();
  const b = second ?? color;
  // `w`: a dot in the surface's colour (the compass's pivot, the palette's hole).
  const surface = colors.surface;
  const parts = CAP_ICONS[name].map((p: Part, i): ReactElement => {
    const layer = p.l;
    const stroked = layer === 'o' || layer === 'ob' || layer === 'sa' || layer === 'sb';
    const ink =
      layer === 'w' ? surface : layer === 'b' || layer === 'ob' || layer === 'sb' ? b : color;
    const opacity = layer === 'b' || layer === 'ob' || layer === 'sb' ? soft : 1;
    const paint = stroked
      ? {
          fill: 'none',
          stroke: ink,
          strokeWidth: num(p, 'sw') ?? RING,
          strokeLinecap: layer === 'o' ? undefined : ('round' as const),
          strokeLinejoin: layer === 'sa' || layer === 'sb' ? ('round' as const) : undefined,
          opacity,
        }
      : { fill: ink, opacity };
    const transform = str(p, 'transform');
    if (p.t === 'circle') {
      return (
        <Circle
          key={i}
          cx={num(p, 'cx')}
          cy={num(p, 'cy')}
          r={num(p, 'r')}
          transform={transform}
          {...paint}
        />
      );
    }
    if (p.t === 'rect') {
      return (
        <Rect
          key={i}
          x={num(p, 'x')}
          y={num(p, 'y')}
          width={num(p, 'width')}
          height={num(p, 'height')}
          rx={num(p, 'rx')}
          transform={transform}
          {...paint}
        />
      );
    }
    return <Path key={i} d={str(p, 'd') ?? ''} transform={transform} {...paint} />;
  });
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      // One picture for every icon drawn the same (lib/svgKey.ts).
      nativeID={svgKey('cap', name, color, b, soft, surface)}
    >
      {parts}
    </Svg>
  );
}
