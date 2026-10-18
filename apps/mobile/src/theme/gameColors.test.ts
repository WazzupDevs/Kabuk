import { describe, expect, it } from 'vitest';

import { AA_TEXT, contrastRatio } from './contrast';
import {
  BADGE,
  CHAT_THEMES,
  chipOn,
  type GameGround,
  gameGround,
  type GroundKey,
  JUDGE_COLORS,
  mixOklab,
  type Team,
  TEAM_COLORS,
  teamGround,
} from './gameColors';
import type { ColorScheme } from './tokens';

const WHITE = '#FFFFFF';
const INK = '#14112B';
const SCHEMES: readonly ColorScheme[] = ['light', 'dark'];
const GROUND_KEYS: readonly GroundKey[] = ['sahtekar', 'letters', 'song', 'chat'];
const TEAMS = Object.keys(TEAM_COLORS) as Team[];

function grounds(scheme: ColorScheme): [string, GameGround][] {
  return [
    ...GROUND_KEYS.map((key): [string, GameGround] => [key, gameGround(scheme, key)]),
    ...TEAMS.map((team): [string, GameGround] => [`team ${team}`, teamGround(scheme, team)]),
  ];
}

describe('game colours (docs/SPEC_V4.md §4.C, step 4.2)', () => {
  it('matches CSS color-mix in OKLab (v44 dark team grounds)', () => {
    // Values of color-mix(in oklab, team 62%, #0D0B1E), computed with Ottosson's matrices.
    expect(mixOklab('#6A47F5', '#0D0B1E', 0.62)).toBe('#43309C');
    expect(mixOklab('#D6336C', '#0D0B1E', 0.62)).toBe('#83294E');
    expect(mixOklab('#6A47F5', '#0D0B1E', 1)).toBe('#6A47F5');
  });

  for (const scheme of SCHEMES) {
    for (const [name, ground] of grounds(scheme)) {
      it(`${scheme}: white text reads on ${name} and on its chips`, () => {
        for (const stop of [ground.top, ground.bottom]) {
          expect(contrastRatio(WHITE, stop)).toBeGreaterThanOrEqual(AA_TEXT);
          expect(contrastRatio(WHITE, chipOn(ground, stop))).toBeGreaterThanOrEqual(AA_TEXT);
        }
      });
    }
  }

  it('the light bright grounds take the dark chip (K-25)', () => {
    expect(gameGround('light', 'letters').chip).toBe('ink');
    expect(gameGround('light', 'chat').chip).toBe('ink');
    for (const team of TEAMS) expect(teamGround('light', team).chip).toBe('ink');
  });

  it('white text reads on the themes, "Yasak!" and the badge; ink on Pas and Doğru', () => {
    for (const color of [...Object.values(CHAT_THEMES), JUDGE_COLORS.forbidden, BADGE]) {
      expect(contrastRatio(WHITE, color)).toBeGreaterThanOrEqual(AA_TEXT);
    }
    expect(CHAT_THEMES.warmUp).toBe('#B4481A'); // K-24
    for (const color of [JUDGE_COLORS.pass, JUDGE_COLORS.correct]) {
      expect(contrastRatio(INK, color)).toBeGreaterThanOrEqual(AA_TEXT);
    }
  });
});
