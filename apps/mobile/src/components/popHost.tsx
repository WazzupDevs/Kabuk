import { useLayoutEffect } from 'react';
import { create } from 'zustand';

// Whether a held message's layer is open (MessagePop). The stream holds still under it (no
// keyboard-driven scroll, no following the end), so closing the keyboard for it or a reaction
// landing never moves the reader (the owner's report, 6 Kasım).
//
// A store of its own, read only by the stream's scroll view (ChatScreen → HeldScroll): opening the
// layer redraws that one part, never the chat screen or its rows (CLAUDE.md → Çizim bütçesi; the
// owner's report, 21 Kasım: the chat screen drew itself again for every held message, and the
// layer was slow to come). The layer itself is drawn by the message in the app's layer
// (motion/menuLayer.tsx), so its cell never changes as it opens.
const useHeld = create<{ count: number }>(() => ({ count: 0 }));

export function usePopOpen(): boolean {
  return useHeld((s) => s.count > 0);
}

// The same, read at the moment without subscribing (a callback's check: nothing redraws).
export function isPopOpen(): boolean {
  return useHeld.getState().count > 0;
}

// Marks a held message's layer open while the calling component is mounted.
export function useMarkPopOpen(): void {
  useLayoutEffect(() => {
    useHeld.setState((s) => ({ count: s.count + 1 }));
    return () => useHeld.setState((s) => ({ count: Math.max(0, s.count - 1) }));
  }, []);
}
