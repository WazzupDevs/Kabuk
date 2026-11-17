import { describe, expect, it } from 'vitest';

import { SPLASH_CAP_MS } from '../../lib/launchGuard';
import { COPY_PARTS, copySettledAt, INTRO } from '../../theme/introScene';

import { INTRO_WAIT_CAP_MS, introCopy } from './introGate';

const ALL = [...COPY_PARTS];

describe('the first screen’s words and button, whatever the motion and the curtain do', () => {
  it('the curtain never signals its end: everything shows at the cap', () => {
    expect(INTRO_WAIT_CAP_MS).toBe(SPLASH_CAP_MS);
    const waiting = introCopy({
      sinceMount: INTRO_WAIT_CAP_MS - 1,
      sinceStart: null,
      still: false,
    });
    expect(waiting).toEqual({ shown: [], stageStill: false, next: 1, giveUp: false });
    const late = introCopy({ sinceMount: INTRO_WAIT_CAP_MS, sinceStart: null, still: false });
    expect(late).toEqual({ shown: ALL, stageStill: true, next: null, giveUp: true });
    expect(introCopy({ sinceMount: 60_000, sinceStart: null, still: false }).shown).toEqual(ALL);
  });

  it('reduce motion, the scene seen before, or "Başla": everything shows from the first frame', () => {
    for (const sinceStart of [null, 0]) {
      expect(introCopy({ sinceMount: 0, sinceStart, still: true })).toEqual({
        shown: ALL,
        stageStill: true,
        next: null,
        giveUp: false,
      });
    }
  });

  it('while the scene plays, each piece stands at the end of its motion, the logo first', () => {
    const first = Math.min(...ALL.map(copySettledAt));
    expect(first).toBe(copySettledAt('logo'));
    expect(introCopy({ sinceMount: 500, sinceStart: 0, still: false })).toEqual({
      shown: [],
      stageStill: false,
      next: first,
      giveUp: false,
    });
    const foot = copySettledAt('foot');
    expect(introCopy({ sinceMount: 500 + foot, sinceStart: foot, still: false }).shown).toEqual(
      ALL,
    );
  });

  it('the scene stands still at its end; then nothing more changes', () => {
    expect(introCopy({ sinceMount: 1, sinceStart: INTRO.endMs - 1, still: false }).stageStill).toBe(
      false,
    );
    expect(introCopy({ sinceMount: 1, sinceStart: INTRO.endMs, still: false })).toEqual({
      shown: ALL,
      stageStill: true,
      next: null,
      giveUp: false,
    });
  });

  it('the cap counts only while the scene waits: once it plays, the cap passing changes nothing', () => {
    const v = introCopy({ sinceMount: INTRO_WAIT_CAP_MS + 1000, sinceStart: 1100, still: false });
    expect(v.giveUp).toBe(false);
    expect(v.stageStill).toBe(false);
  });
});
