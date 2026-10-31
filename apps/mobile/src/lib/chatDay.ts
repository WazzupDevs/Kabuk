// The floating day over a chat stream (Grup 3, P3): 8 under the top bar, never on the screen
// together with a day line of the stream. A stream line coming within HANDOFF of the floating one's
// foot takes over (the floating one goes); once that line has gone under the top bar the floating
// one comes back with its day.
export const DAY_HANDOFF = 48;

// A day line of the stream, where it is on the screen now (from the stream's top) and its day.
export type StreamDay = { top: number; height: number; day: number };

export function floatingDay({
  lines,
  headerBottom,
  floatBottom,
  fallback,
}: {
  lines: readonly StreamDay[];
  // The top bar's foot and the floating line's foot, from the stream's top.
  headerBottom: number;
  floatBottom: number;
  // The day of the oldest message on the screen, for when no line has gone under the top bar.
  fallback: number | null;
}): { show: boolean; day: number | null } {
  let day = fallback;
  let above = -Infinity;
  let show = true;
  for (const line of lines) {
    const foot = line.top + line.height;
    if (foot <= headerBottom) {
      // Gone under the top bar: the messages under the floating line are of its day (the lowest
      // such line).
      if (line.top > above) {
        above = line.top;
        day = line.day;
      }
    } else if (line.top < floatBottom + DAY_HANDOFF) {
      show = false;
    }
  }
  return { show, day };
}
