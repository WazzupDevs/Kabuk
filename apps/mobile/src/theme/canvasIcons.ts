// The skall tuvali's icon families (canvasIcons.generated.ts), drawn by
// src/components/CanvasIcon.tsx, and the colours skall.css gives the bar icons' tones (`.bi`).
export { CANVAS_BAR, CANVAS_LINE } from './canvasIcons.generated';

// skall.css → `--bar-in-primary`: the overlap of a bar icon on a primary fill.
export const BAR_IN_PRIMARY = { light: '#E8E3FF', dark: '#4A35B8' } as const;

// skall.css → `.bi.positive` and `.bi.negative`: bar a, bar b and their overlap.
export const BAR_TONES = {
  positive: { a: '#1C8C4E', b: '#6FD69A', x: '#0F5C31' },
  negative: { a: '#E0402C', b: '#FF8A70', x: '#A8240F' },
} as const;
