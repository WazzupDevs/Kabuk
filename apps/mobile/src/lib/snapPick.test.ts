import { describe, expect, it } from 'vitest';

import { type SnapEvent, type SnapState, snapStart, snapStep } from './snapPick';

// Runs the events in turn: the picks made and the last state.
function run(start: SnapState, events: SnapEvent[]): { picks: number[]; state: SnapState } {
  let state = start;
  const picks: number[] = [];
  for (const e of events) {
    const out = snapStep(state, e);
    if (out.pick !== null) picks.push(out.pick);
    state = out.state;
  }
  return { picks, state };
}

describe('snapPick', () => {
  it('a scroll the finger began chooses where it rests', () => {
    const { picks, state } = run(snapStart(2), [
      { kind: 'drag' },
      { kind: 'release', at: null },
      { kind: 'settle', at: 5 },
    ]);
    expect(picks).toEqual([5]);
    expect(state).toEqual({ mode: 'rest', at: 5 });
  });

  it('a finger lifted where the strip already rests chooses at once, once', () => {
    const { picks } = run(snapStart(2), [
      { kind: 'drag' },
      { kind: 'release', at: 3 },
      { kind: 'settle', at: 3 },
    ]);
    expect(picks).toEqual([3]);
  });

  it('a finger scroll back to the same option chooses nothing', () => {
    const { picks } = run(snapStart(2), [{ kind: 'drag' }, { kind: 'settle', at: 2 }]);
    expect(picks).toEqual([]);
  });

  it("the strip's own scroll chooses nothing where it rests", () => {
    const out = snapStep(snapStart(1), { kind: 'follow', at: 4, animated: true });
    expect(out.pick).toBeNull();
    expect(out.scroll).toEqual({ at: 4, animated: true });
    const { picks, state } = run(out.state, [
      { kind: 'settle', at: 3 },
      { kind: 'settle', at: 4 },
    ]);
    expect(picks).toEqual([]);
    expect(state.at).toBe(4);
  });

  it('a tap chooses once and its scroll chooses nothing more', () => {
    const tap = snapStep(snapStart(0), { kind: 'tap', at: 3 });
    expect(tap.pick).toBe(3);
    expect(tap.scroll).toEqual({ at: 3, animated: true });
    const { picks } = run(tap.state, [
      { kind: 'settle', at: 2 },
      { kind: 'settle', at: 3 },
    ]);
    expect(picks).toEqual([]);
  });

  it('a tap during a fling takes over: the cut fling chooses nothing', () => {
    const { picks, state } = run(snapStart(0), [
      { kind: 'drag' },
      { kind: 'release', at: null },
      { kind: 'tap', at: 6 },
      { kind: 'settle', at: 4 },
      { kind: 'settle', at: 6 },
    ]);
    expect(picks).toEqual([6]);
    expect(state).toEqual({ mode: 'rest', at: 6 });
  });

  it('a new list (slot or pack) is placed without motion and chooses nothing', () => {
    const out = snapStep({ mode: 'finger', at: 2 }, { kind: 'place', at: 7 });
    expect(out.pick).toBeNull();
    expect(out.scroll).toEqual({ at: 7, animated: false });
    expect(run(out.state, [{ kind: 'settle', at: 7 }]).picks).toEqual([]);
    expect(snapStep(snapStart(0), { kind: 'place', at: -1 }).scroll).toBeNull();
  });

  it('a choice made elsewhere that the strip is on already moves nothing', () => {
    const out = snapStep(snapStart(3), { kind: 'follow', at: 3, animated: true });
    expect(out.scroll).toBeNull();
    expect(snapStep(snapStart(3), { kind: 'follow', at: -1, animated: true }).scroll).toBeNull();
  });

  it('no back and forth: events in a row never choose two options in turn', () => {
    // The owner's recording (11 Kasım): the strip's own scrolls, each cut short by the next.
    const { picks } = run(snapStart(0), [
      { kind: 'tap', at: 2 },
      { kind: 'follow', at: 3, animated: true },
      { kind: 'settle', at: 2 },
      { kind: 'follow', at: 2, animated: true },
      { kind: 'settle', at: 3 },
      { kind: 'settle', at: 2 },
      { kind: 'follow', at: 3, animated: true },
      { kind: 'settle', at: 3 },
    ]);
    expect(picks).toEqual([2]);
  });

  it("a finger scroll after the strip's own one chooses again", () => {
    const { picks } = run(snapStart(0), [
      { kind: 'follow', at: 5, animated: true },
      { kind: 'drag' },
      { kind: 'settle', at: 8 },
    ]);
    expect(picks).toEqual([8]);
  });
});
