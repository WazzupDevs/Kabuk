// A sheet's slide (Sheet.tsx). Closing, it leaves the screen when the slide ends, whether or not
// the slide ran to its end (an interrupted native animation reports `finished: false`), and at the
// latest after `fallbackMs` (a slide whose end never comes back). Only the effect's own cleanup, a
// newer slide taking over, keeps it: a sheet left mounted at progress 0 is an invisible window over
// the app that swallows every touch (E2E 02 "tab bar 3/4", 3 Kasım).
export type Slide = {
  start: (done?: (result: { finished: boolean }) => void) => void;
  stop: () => void;
};

export function runSheetSlide(
  slide: Slide,
  closing: boolean,
  unmount: () => void,
  fallbackMs: number,
): () => void {
  let live = true;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const done = () => {
    if (!live) return;
    live = false;
    if (timer !== undefined) clearTimeout(timer);
    if (closing) unmount();
  };
  slide.start(done);
  if (closing && live) timer = setTimeout(done, fallbackMs);
  return () => {
    live = false;
    if (timer !== undefined) clearTimeout(timer);
    slide.stop();
  };
}
