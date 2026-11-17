import { describe, expect, it } from 'vitest';

import {
  buddyFrame,
  COPY_PARTS,
  copyFrame,
  copySettledAt,
  groundFrame,
  INTRO,
  INTRO_LOOPS,
  INTRO_PLACES,
  INTRO_STAGE,
  introMinHeight,
  stageScale,
  tableFrame,
} from './introScene';

const AT_REST = { opacity: 1, dy: 0 };
const COPY_AT_REST = { opacity: 1, dy: 0, scale: 1 };

// Every entrance at `t`, in one comparable object.
function frame(t: number) {
  return {
    ground: groundFrame(t),
    table: tableFrame(t),
    buddies: INTRO.buddyAt.map((_, i) => buddyFrame(i, t)),
    copy: COPY_PARTS.map((p) => copyFrame(p, t)),
  };
}

describe('the first screen’s scene (pano 47 KayitAcilis)', () => {
  it('takes 2–3 s in all (the owner’s call, 17 Kasım), the board’s delays and durations', () => {
    expect(INTRO.endMs).toBeGreaterThanOrEqual(2000);
    expect(INTRO.endMs).toBeLessThanOrEqual(3000);
    expect(INTRO.endMs).toBe(INTRO.footAt + INTRO.wordsMs);
    const ends = [
      INTRO.groundAt + INTRO.groundMs,
      INTRO.tableAt + INTRO.tableMs,
      ...INTRO.buddyAt.map((at) => at + INTRO.buddyMs),
      ...COPY_PARTS.map(copySettledAt),
    ];
    expect(Math.max(...ends)).toBe(INTRO.endMs);
  });

  it('starts empty: nothing of the scene and none of the words shows', () => {
    const f = frame(0);
    expect(f.ground.opacity).toBe(0);
    expect(f.table.opacity).toBe(0);
    expect(f.buddies.every((b) => b.opacity === 0 && b.dy === 120)).toBe(true);
    expect(f.copy.every((c) => c.opacity === 0)).toBe(true);
  });

  it('ends at rest: nothing comes in after the end', () => {
    const end = frame(INTRO.endMs);
    expect(end.ground).toEqual(AT_REST);
    expect(end.table).toEqual(AT_REST);
    expect(end.buddies.every((b) => b.opacity === 1 && b.dy === 0)).toBe(true);
    expect(end.copy.every((c) => JSON.stringify(c) === JSON.stringify(COPY_AT_REST))).toBe(true);
    expect(frame(INTRO.endMs + 1)).toEqual(end);
    expect(frame(INTRO.endMs + 60_000)).toEqual(end);
  });

  it('brings the buddies up from behind the table, overshooting up and settling (drop)', () => {
    INTRO.buddyAt.forEach((at, i) => {
      expect(buddyFrame(i, at).opacity).toBe(0);
      expect(buddyFrame(i, at + INTRO.buddyMs * 0.55)).toEqual({ opacity: 1, dy: -14 });
      expect(buddyFrame(i, at + INTRO.buddyMs * 0.75)).toEqual({ opacity: 1, dy: 5 });
      expect(buddyFrame(i, at + INTRO.buddyMs)).toEqual(AT_REST);
    });
    // One after another, left to right.
    expect([...INTRO.buddyAt]).toEqual([...INTRO.buddyAt].sort((a, b) => a - b));
  });

  it('pops the logo (.6 → 1.06 → 1) and brings the words up after the scene', () => {
    const peak = copyFrame('logo', INTRO.logoAt + INTRO.logoMs * 0.7);
    expect(peak.opacity).toBe(1);
    expect(peak.scale).toBeCloseTo(1.06);
    expect(copyFrame('logo', INTRO.logoAt).scale).toBeCloseTo(0.6);
    expect(copyFrame('title', INTRO.titleAt)).toEqual({ opacity: 0, dy: 16, scale: 1 });
    expect(INTRO.logoAt).toBeLessThan(INTRO.titleAt);
    expect(INTRO.titleAt).toBeLessThan(INTRO.bodyAt);
    expect(INTRO.bodyAt).toBeLessThan(INTRO.footAt);
  });

  it('says when each piece of the words stands still: from then on it is drawn without motion', () => {
    for (const p of COPY_PARTS) {
      expect(copyFrame(p, copySettledAt(p))).toEqual(COPY_AT_REST);
      expect(copyFrame(p, copySettledAt(p) - 1)).not.toEqual(COPY_AT_REST);
      expect(copySettledAt(p)).toBeLessThanOrEqual(INTRO.endMs);
    }
  });

  it('keeps the board’s loops: bob, swing and twinkle, one delay and angle each', () => {
    expect(INTRO_LOOPS.bob.delays).toHaveLength(INTRO_PLACES.buddies.length);
    expect(INTRO_LOOPS.bob.deg).toHaveLength(INTRO_PLACES.buddies.length);
    expect(INTRO_LOOPS.twinkle.delays).toHaveLength(INTRO_PLACES.stars.length);
    expect(INTRO_LOOPS.swing.originX).toBe(INTRO_PLACES.lamp.width / 2);
  });

  it('lays the stage out in the board’s frame and fits it to its box', () => {
    for (const b of [INTRO_PLACES.ground, INTRO_PLACES.lamp, INTRO_PLACES.table]) {
      expect(b.left + b.width).toBeLessThanOrEqual(INTRO_STAGE.width);
      expect(b.top + b.height).toBeLessThanOrEqual(INTRO_STAGE.height);
    }
    // The buddies stand behind the table: their feet below its top, inside the clip.
    for (const b of INTRO_PLACES.buddies) {
      expect(b.top + b.height).toBeGreaterThan(INTRO_PLACES.table.top);
    }
    expect(stageScale(390, 470)).toBe(1);
    expect(stageScale(320, 470)).toBeCloseTo(320 / 390);
    expect(stageScale(390, 235)).toBeCloseTo(0.5);
  });

  it('gives the scene at least 160, up to 290 when the screen is tall', () => {
    expect(introMinHeight(568)).toBe(176);
    expect(introMinHeight(480)).toBe(160);
    expect(introMinHeight(900)).toBe(290);
  });
});
