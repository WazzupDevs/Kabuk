import { describe, expect, it } from 'vitest';

import { DAY_HANDOFF, floatingDay } from './chatDay';

const HEADER = 100;
const FLOAT_FOOT = 134; // 8 under the bar, 26 tall

describe('floatingDay (Grup 3, P3: one day line on the screen)', () => {
  it('shows the oldest message day while no line is near', () => {
    expect(
      floatingDay({
        lines: [{ top: 400, height: 26, day: 2 }],
        headerBottom: HEADER,
        floatBottom: FLOAT_FOOT,
        fallback: 1,
      }),
    ).toEqual({ show: true, day: 1 });
  });

  it('goes when a stream line comes within the handoff distance of its foot', () => {
    const near = { top: FLOAT_FOOT + DAY_HANDOFF - 1, height: 26, day: 2 };
    expect(
      floatingDay({ lines: [near], headerBottom: HEADER, floatBottom: FLOAT_FOOT, fallback: 1 })
        .show,
    ).toBe(false);
    const far = { ...near, top: FLOAT_FOOT + DAY_HANDOFF };
    expect(
      floatingDay({ lines: [far], headerBottom: HEADER, floatBottom: FLOAT_FOOT, fallback: 1 })
        .show,
    ).toBe(true);
  });

  it('stays gone while the line is partly below the top bar', () => {
    expect(
      floatingDay({
        lines: [{ top: HEADER - 10, height: 26, day: 2 }],
        headerBottom: HEADER,
        floatBottom: FLOAT_FOOT,
        fallback: 1,
      }).show,
    ).toBe(false);
  });

  it('comes back with the new day once the line has gone under the top bar', () => {
    expect(
      floatingDay({
        lines: [
          { top: -200, height: 26, day: 1 },
          { top: HEADER - 26, height: 26, day: 2 },
        ],
        headerBottom: HEADER,
        floatBottom: FLOAT_FOOT,
        fallback: 1,
      }),
    ).toEqual({ show: true, day: 2 });
  });
});
