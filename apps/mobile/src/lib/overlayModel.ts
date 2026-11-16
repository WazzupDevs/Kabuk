// What is open over the screens (CLAUDE.md → Ekran davranışı: only one bar, menu or sheet at a
// time). Pure: the store (overlayStore.ts) keeps the state and calls the displaced one's `onDismiss`.

// A centred confirmation, a bottom sheet, a held message's layer, a button's menu.
export type OverlayKind = 'dialog' | 'sheet' | 'hold' | 'menu';

export type OverlayEntry<P> = {
  id: string;
  kind: OverlayKind;
  payload: P;
  // Called once when it closes for any reason but its own action (outside, back, another opening).
  onDismiss?: () => void;
};

export type OverlayState<P> = { open: OverlayEntry<P> | null };

export type OverlayStep<P> = { state: OverlayState<P>; closed: OverlayEntry<P> | null };

// A new one always takes the place of the one open: a confirmation opened from a menu or a held
// message replaces it; anything else opening closes what was there.
export function openOverlay<P>(state: OverlayState<P>, entry: OverlayEntry<P>): OverlayStep<P> {
  const before = state.open;
  return { state: { open: entry }, closed: before && before.id !== entry.id ? before : null };
}

// Closes it only if it is still the one open (a late close of a replaced one changes nothing).
export function closeOverlay<P>(state: OverlayState<P>, id: string): OverlayStep<P> {
  if (state.open?.id !== id) return { state, closed: null };
  return { state: { open: null }, closed: state.open };
}

export function closeAllOverlays<P>(state: OverlayState<P>): OverlayStep<P> {
  return { state: { open: null }, closed: state.open };
}
