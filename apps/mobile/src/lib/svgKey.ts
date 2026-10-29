// A name for an SVG's picture (patches/react-native-svg: nativeID "svgc:..."): every view with the
// same name and size shares one bitmap, drawn once on the main thread instead of in every place it
// shows (the owner's trace, 30 Ekim: a screen opening drew its icons and capsules for up to 130 ms).
// The name must change whenever the drawing does: it is made of everything the drawing reads.
export function svgKey(...parts: readonly (string | number)[]): string {
  return `svgc:${parts.join('|')}`;
}

// A short, stable name for an SVG's text (FNV-1a and the length).
export function textKey(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return `${(h >>> 0).toString(36)}${text.length.toString(36)}`;
}
