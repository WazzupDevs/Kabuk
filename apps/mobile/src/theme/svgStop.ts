// A gradient stop's colour for react-native-svg. On Android the alpha in an `rgba()` stop colour is
// dropped and the colour is drawn whole (the clouds and the scenes' glows came out at full
// strength), so the alpha goes to `stopOpacity`, times `opacity`.
export function stopPaint(color: string, opacity = 1): { stopColor: string; stopOpacity: number } {
  const m = /^rgba\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)$/.exec(color);
  if (!m) return { stopColor: color, stopOpacity: opacity };
  return { stopColor: `rgb(${m[1]}, ${m[2]}, ${m[3]})`, stopOpacity: Number(m[4]) * opacity };
}
