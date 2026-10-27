// The skall tuvali's icon families (canvasIcons.generated.ts), drawn by
// src/components/CanvasIcon.tsx, and the colours skall.css gives the bar icons' tones (`.bi`).
import { CANVAS_BAR as DRAWN_BAR } from './canvasIcons.generated';

export { CANVAS_LINE } from './canvasIcons.generated';

// The bar icons, with those the canvas has not drawn yet drawn in its manner (capsule bars in its
// two colours, their crossing in the overlap colour; the owner's call, 27 Ekim): "Karıştır" two
// crossing arrows, "Davet et" a person and a plus.
export const CANVAS_BAR = {
  ...DRAWN_BAR,
  shuffle:
    '<rect class="b" x="1.3" y="9.8" width="21.4" height="4.4" rx="2.2" transform="rotate(45 12 12)"/><rect class="a" x="1.3" y="9.8" width="21.4" height="4.4" rx="2.2" transform="rotate(-45 12 12)"/><rect class="x" x="9.8" y="9.8" width="4.4" height="4.4" transform="rotate(45 12 12)"/><rect class="a" x="13.4" y="2.2" width="8.4" height="4.4" rx="2.2"/><rect class="a" x="17.4" y="2.2" width="4.4" height="8.4" rx="2.2"/><rect class="b" x="13.4" y="17.4" width="8.4" height="4.4" rx="2.2"/><rect class="b" x="17.4" y="13.4" width="4.4" height="8.4" rx="2.2"/>',
  invite:
    '<rect class="a" x="5" y="2.6" width="7.4" height="7.4" rx="3.7"/><path class="a" d="M1.8 20.6a6.9 6.9 0 0 1 13.8 0z"/><rect class="b" x="16.9" y="8.6" width="4.2" height="11" rx="2.1"/><rect class="b" x="13.5" y="12" width="11" height="4.2" rx="2.1"/><rect class="x" x="16.9" y="12" width="4.2" height="4.2"/>',
} as const;

// skall.css → `--bar-in-primary`: the overlap of a bar icon on a primary fill.
export const BAR_IN_PRIMARY = { light: '#E8E3FF', dark: '#4A35B8' } as const;

// skall.css → `.bi.positive` and `.bi.negative`: bar a, bar b and their overlap.
export const BAR_TONES = {
  positive: { a: '#1C8C4E', b: '#6FD69A', x: '#0F5C31' },
  negative: { a: '#E0402C', b: '#FF8A70', x: '#A8240F' },
} as const;
