// The capsule drawing library (capsuleDrawing.js, copied from the v46 source): a look's SVG text.
// 'av' draws the avatar disc (48 × 48), 'fig' the capsule standing alone (48 × 66).
export type LookParts = Partial<Record<'c' | 'e' | 'h' | 'f' | 'm' | 'n', string>>;

declare const LOOK: { svg(look: LookParts, mode: 'av' | 'fig'): string };
export default LOOK;
