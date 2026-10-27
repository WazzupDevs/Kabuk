// The capsule drawing library (capsuleDrawing.js, copied from the v46 source): a look's SVG text.
// 'av' draws the avatar disc (48 × 48), 'fig' the capsule standing alone (48 × 66); `pop` the
// editor's stage (viewBox -6 -8 60 57: the circle of 48 with room above it), with a feeling or none.
export type LookParts = Partial<Record<'c' | 'e' | 'h' | 'f' | 'm' | 'n', string>>;

declare const LOOK: {
  svg(look: LookParts, mode: 'av' | 'fig'): string;
  pop(look: LookParts, emo: string): string;
  bg(look: LookParts): string;
  EMOS: [string, string][];
};
export default LOOK;
