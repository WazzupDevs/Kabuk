import { useEffect, useState } from 'react';

import { MAP_COLORS, type MapStyleJson, recolorStyle } from '@/theme/mapStyle';
import type { ColorScheme } from '@/theme/tokens';

// Read styles, by address, for the whole run of the app, as the JSON text the map takes.
const read = new Map<string, string>();

// The style to draw: the repainted style's JSON once read, the address before that (MapLibre takes
// either as `mapStyle`).
export function useMapStyle(url: string, scheme: ColorScheme): string {
  const key = `${scheme} ${url}`;
  const [style, setStyle] = useState<string | null>(() => read.get(key) ?? null);
  const [shownKey, setShownKey] = useState(key);
  if (shownKey !== key) {
    setShownKey(key);
    setStyle(read.get(key) ?? null);
  }
  useEffect(() => {
    if (read.has(key)) return undefined;
    let live = true;
    fetch(url)
      .then((res) => (res.ok ? (res.json() as Promise<MapStyleJson>) : null))
      .then((json) => {
        if (!json || !Array.isArray(json.layers)) return;
        const painted = JSON.stringify(recolorStyle(json, MAP_COLORS[scheme]));
        read.set(key, painted);
        if (live) setStyle(painted);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [key, url, scheme]);
  return style ?? url;
}
