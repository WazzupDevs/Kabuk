// The skall tuvali's icons (docs/design/sistem/uretec/lib.cjs → B and I), drawn as the canvas draws
// them (skall.css → `.bi`, `.ico`; src/components/CanvasIcon.tsx): the two-tone bar icons for
// actions, the line icons for the rest. Only the ones the app uses; the drawings are the canvas's,
// letter for letter.
export const CANVAS_BAR = {
  bell: '<path class="a" d="M5.2 16.2V9.6a6.8 6.8 0 0 1 13.6 0v6.6z"/><rect class="b" x="2.4" y="14" width="19.2" height="4.6" rx="2.3"/><rect x="5.2" y="14" width="13.6" height="2.2" fill="#3B25A6"/><rect class="x" x="9.6" y="19.8" width="4.8" height="3.6" rx="1.8"/>',
  photo:
    '<rect class="sa" x="2.5" y="6.5" width="19" height="13.5" rx="4.5"/><rect class="a" x="8" y="3.6" width="8" height="4.4" rx="2.2"/><circle class="sb" cx="12" cy="13.2" r="3.6"/>',
} as const;
export const CANVAS_LINE = {
  shuffle:
    '<path d="M4 7h3.5c4 0 5 10 9 10H20"/><path d="M4 17h3.5c1.6 0 2.7-1.6 3.6-3.6M13.3 9.6C14.2 8 15.2 7 16.5 7H20"/><polyline points="17.5 4.5 20 7 17.5 9.5"/><polyline points="17.5 14.5 20 17 17.5 19.5"/>',
} as const;

// skall.css → `--bar-in-primary`: the overlap of a bar icon on a primary fill.
export const BAR_IN_PRIMARY = { light: '#E8E3FF', dark: '#4A35B8' } as const;
