import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { BRAND, VENUE_TILE_EDGE_OPACITY, VENUE_TILE_SHADOW } from '@/theme/brand';
import { squirclePath } from '@/theme/markMotion';
import { useTheme } from '@/theme/ThemeProvider';

import { Mark } from './Mark';

const CANVAS = 512;
const TILE = squirclePath(CANVAS);
// The mark's share of the tile, the edge line's width (canvas units), the active ring's distance
// from the tile and the ring's corner (a share of its side, close to the tile's curve).
const MARK_SHARE = 0.78;
const EDGE = 14;
const RING_GAP = 5;
const RING_CORNER = 0.34;

type Props = { size: number; active?: boolean };

// The Mekan tab's icon: the colour mark on the ink tile, the app icon in small. The same in both
// schemes. Active: a 2 px accent ring around the tile.
export function VenueTabIcon({ size, active = false }: Props) {
  const { colors, shape } = useTheme();
  const ring = size + 2 * RING_GAP;
  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      {active ? (
        <View
          style={{
            position: 'absolute',
            left: -RING_GAP,
            top: -RING_GAP,
            width: ring,
            height: ring,
            borderRadius: ring * RING_CORNER,
            borderWidth: shape.stroke.venueRing,
            borderColor: colors.accent,
          }}
        />
      ) : null}
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size * RING_CORNER,
          boxShadow: VENUE_TILE_SHADOW,
        }}
      />
      <Svg
        width={size}
        height={size}
        viewBox={`0 0 ${CANVAS} ${CANVAS}`}
        style={{ position: 'absolute' }}
      >
        <Path d={TILE} fill={BRAND.ink} />
        <Path
          d={TILE}
          fill="none"
          stroke={BRAND.white}
          strokeOpacity={VENUE_TILE_EDGE_OPACITY}
          strokeWidth={EDGE}
        />
      </Svg>
      <Mark size={Math.round(size * MARK_SHARE)} onInk label={null} />
    </View>
  );
}
