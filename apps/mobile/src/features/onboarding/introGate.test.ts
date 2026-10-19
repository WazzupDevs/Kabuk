import { describe, expect, it } from 'vitest';

import { SPLASH_CAP_MS } from '../../lib/launchGuard';
import { COPY_PARTS, copySettledAt, INTRO } from '../../theme/introScene';

import { INTRO_WAIT_CAP_MS, introCopy } from './introGate';

const ALL = [...COPY_PARTS];

describe('the first screen’s words and buttons, whatever the motion and the curtain do', () => {
  it('the curtain never signals its end: everything shows at the cap, without "Geç"', () => {
    expect(INTRO_WAIT_CAP_MS).toBe(SPLASH_CAP_MS);
    const waiting = introCopy({
      sinceMount: INTRO_WAIT_CAP_MS - 1,
      sinceStart: null,
      still: false,
    });
    expect(waiting).toEqual({ shown: [], skip: false, next: 1, giveUp: false });
    const late = introCopy({ sinceMount: INTRO_WAIT_CAP_MS, sinceStart: null, still: false });
    expect(late).toEqual({ shown: ALL, skip: false, next: null, giveUp: true });
    expect(introCopy({ sinceMount: 60_000, sinceStart: null, still: false }).shown).toEqual(ALL);
  });

  it('reduce motion, or the scene seen before: everything shows from the first frame', () => {
    for (const sinceStart of [null, 0]) {
      expect(introCopy({ sinceMount: 0, sinceStart, still: true })).toEqual({
        shown: ALL,
        skip: false,
        next: null,
        giveUp: false,
      });
    }
  });

  it('while the scene plays, each piece stands at the end of its motion, "Başla" first', () => {
    const foot = copySettledAt('foot');
    expect(introCopy({ sinceMount: 500, sinceStart: 0, still: false })).toEqual({
      shown: [],
      skip: true,
      next: Math.min(...ALL.map(copySettledAt)),
      giveUp: false,
    });
    expect(introCopy({ sinceMount: 500 + foot, sinceStart: foot, still: false }).shown).toContain(
      'foot',
    );
    expect(Math.min(...ALL.map(copySettledAt))).toBeLessThanOrEqual(foot);
    const last = Math.max(...ALL.map(copySettledAt));
    expect(introCopy({ sinceMount: 500 + last, sinceStart: last, still: false }).shown).toEqual(
      ALL,
    );
  });

  it('"Geç" shows from the scene’s start until it is done; then nothing more changes', () => {
    expect(introCopy({ sinceMount: 1, sinceStart: 0, still: false }).skip).toBe(true);
    expect(introCopy({ sinceMount: 1, sinceStart: INTRO.doneMs - 1, still: false }).skip).toBe(
      true,
    );
    expect(introCopy({ sinceMount: 1, sinceStart: INTRO.doneMs, still: false })).toEqual({
      shown: ALL,
      skip: false,
      next: null,
      giveUp: false,
    });
  });

  it('the cap counts only while the scene waits: once it plays, the cap passing changes nothing', () => {
    const v = introCopy({ sinceMount: INTRO_WAIT_CAP_MS + 1000, sinceStart: 1100, still: false });
    expect(v.giveUp).toBe(false);
    expect(v.skip).toBe(true);
  });
});
