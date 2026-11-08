// No imports: the root typecheck reads it through contrast.test.ts.
// Riso buttons (the owner's call, 8 Kasım; docs/decisions/riso-dugme.md): the inks, the second
// ink printed `shift` off under a full button, the paper's edge, a disabled print's fade and the
// press's settle.
export const RISO_BUTTON = {
  ink: '#1B7F45',
  onInk: '#FFFFFF',
  offset: '#FF4F8B',
  paper: '#FBF7EE',
  paperInk: '#0B5A2D',
  danger: '#C8331F',
  dangerOffset: '#5A1A12',
  shift: 3,
  edge: 2,
  offOpacity: 0.5,
  pressMs: 70,
} as const;
