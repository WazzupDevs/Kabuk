// No imports: the root typecheck reads it through auraKit.ts.
// The riso round "+" of Mesajlar (the owner's call, 8 Kasım; docs/decisions/riso-dugme.md): its
// ink, the second ink printed `shift` off under it and the press's settle. The buttons are glass
// since 12 Kasım (docs/design/iskelet.md → 2.1; auraKit.ts → BUTTON_GLASS).
export const RISO_BUTTON = {
  ink: '#1B7F45',
  onInk: '#FFFFFF',
  offset: '#FF4F8B',
  shift: 3,
  pressMs: 70,
} as const;
