import { create } from 'zustand';

// The DM surface (Telegram's way, the owner's call, 25 Kasım: a chat opens at once, its screen built
// ahead): over the tabs, a few conversations stay built and hidden (`warm`, the newest first), each
// one only ever its own conversation, so nothing of one (its draft, its answer, its edit) can show
// in another. Opening a warm one only shows it and slides it in; another is built as it slides. Kept
// in this store, never in a screen's state (CLAUDE.md → Çizim bütçesi): only the surface reads it.
export type DmThreadRef = { threadId: string; publicId: string; name: string };

// How many conversations stay built: the two the inbox starts with and the last ones opened.
export const DM_WARM_MAX = 3;

type SurfaceState = {
  // The conversation on screen (sliding in, in, or sliding out), null when none.
  open: DmThreadRef | null;
  // Slid all the way in (reads it, takes Android's back key, has its keyboard).
  settled: boolean;
  warm: readonly DmThreadRef[];
  // The surface is on the screen (the tabs' layout drew it): openers use it, else the route.
  mounted: boolean;
};

export const useDmSurface = create<SurfaceState>(() => ({
  open: null,
  settled: false,
  warm: [],
  mounted: false,
}));

// `thread` first in the warm list, the oldest one past DM_WARM_MAX let go.
export function withWarm(
  warm: readonly DmThreadRef[],
  thread: DmThreadRef,
): readonly DmThreadRef[] {
  const rest = warm.filter((t) => t.threadId !== thread.threadId);
  const own = warm.find((t) => t.threadId === thread.threadId);
  return [own ?? thread, ...rest].slice(0, DM_WARM_MAX);
}

// Built ahead (the inbox's first conversations): never pushes out the one on screen.
export function warmDm(thread: DmThreadRef): void {
  useDmSurface.setState((s) => {
    if (s.warm.some((t) => t.threadId === thread.threadId)) return s;
    if (s.warm.length < DM_WARM_MAX) return { warm: [...s.warm, thread] };
    // Full: the oldest that is not on screen makes room.
    const keep = s.warm.filter((t) => t.threadId !== s.open?.threadId).slice(0, -1);
    const open = s.warm.filter((t) => t.threadId === s.open?.threadId);
    return { warm: [...open, ...keep, thread].slice(0, DM_WARM_MAX) };
  });
}

export function openDmSurface(thread: DmThreadRef): void {
  useDmSurface.setState((s) => ({ open: thread, settled: false, warm: withWarm(s.warm, thread) }));
}

export function settleDmSurface(): void {
  useDmSurface.setState({ settled: true });
}

export function shutDmSurface(): void {
  useDmSurface.setState({ open: null, settled: false });
}
