import { SIGNUM as RULES } from '../../../../supabase/functions/_shared/pure/signum.ts';
import { describe, expect, it } from 'vitest';

import { captainLine, SIGNUM, signumBoard, tileLook } from './signum';

describe('signum board', () => {
  it('is the panel’s 350 × 294 on 390 and never wider', () => {
    expect(signumBoard(390, 20)).toMatchObject({ width: 350, height: 294 });
    expect(signumBoard(500, 20).width).toBe(350);
  });

  it('keeps room for the longest word of the list on 320 dp', () => {
    const { tile } = signumBoard(320, 20);
    // The list is measured to SIGNUM.tileTextPx with a 2 px margin on each side.
    expect(tile).toBeGreaterThanOrEqual(RULES.tileTextPx + 2 * 2);
  });

  it('shows a closed tile’s colour only from a key', () => {
    expect(tileLook(null, null, 3)).toEqual({ kind: 'closed' });
    expect(tileLook(null, ['a', 'b', 'n', 'x'], 3)).toEqual({ kind: 'captain', key: 'x' });
    expect(tileLook('n', null, 0)).toEqual({ kind: 'open', key: 'n' });
    expect(tileLook('b', ['a'], 0)).toEqual({ kind: 'open', key: 'b' });
  });

  it('draws the black card’s line white with the ink inside, not a team colour', () => {
    const line = captainLine('x') ?? '';
    expect(line).toContain(`3px ${SIGNUM.captain.x.line}`);
    expect(line).toContain(`5px ${SIGNUM.captain.x.ground}`);
    expect(captainLine('n')).toBeUndefined();
  });
});
