import { forwardRef, type ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';

// The web preview's stand-in for @maplibre/maplibre-react-native (metro.config.js → WEB_STUBS;
// scripts/visual/web-shot.ts): the native map does not draw in a browser. The map is a plain box,
// its sources, layers and images draw nothing. Android and iOS never resolve this file.
type BoxProps = ViewProps & { children?: ReactNode };

export const Map = forwardRef<View, BoxProps>(function Map({ style, testID }, ref) {
  return <View ref={ref} testID={testID} style={[{ flex: 1 }, style]} />;
});

function Nothing(): null {
  return null;
}

export const Camera = forwardRef<unknown, object>(function Camera() {
  return null;
});
export const GeoJSONSource = forwardRef<unknown, { children?: ReactNode }>(
  function GeoJSONSource() {
    return null;
  },
);
export const Images = Nothing;
export const Layer = Nothing;
