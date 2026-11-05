import { describe, expect, it } from 'vitest';

import { AA_LARGE, AA_TEXT, contrastRatio } from './contrast';
import {
  BADGE,
  CHAT_THEMES,
  chipOn,
  type GameGround,
  gameGround,
  type GroundKey,
  JUDGE_COLORS,
  LOW_TIME,
  mainButtonInk,
  mixOklab,
  type Team,
  TEAM_COLORS,
  TEAM_TONES,
  teamGround,
} from './gameColors';
import type { ColorScheme } from './tokens';

const WHITE = '#FFFFFF';
const INK = '#14112B';
const SCHEMES: readonly ColorScheme[] = ['light', 'dark'];
const GROUND_KEYS: readonly GroundKey[] = ['sahtekar', 'letters', 'song', 'chat'];
const TEAMS = Object.keys(TEAM_COLORS) as Team[];
// The light team grounds are the canvas's Mor and Pembe (the owner's call, 5 Kasım), whose white
// words read at 4.36:1 and 4.09:1: large text only there (an open question to the design).
const floorOf = (scheme: ColorScheme, name: string) =>
  scheme === 'light' && name.startsWith('team ') ? AA_LARGE : AA_TEXT;

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
          expect(contrastRatio(WHITE, stop)).toBeGreaterThanOrEqual(floorOf(scheme, name));
          expect(contrastRatio(WHITE, chipOn(ground, stop))).toBeGreaterThanOrEqual(
            floorOf(scheme, name),
          );
        }
      });
    }
  }

  it("the teams are the canvas's Mor and Pembe in both schemes (Aura v85)", () => {
    expect(TEAM_TONES.light.purple.color).toBe('#7B5CFF');
    expect(TEAM_TONES.light.pink.color).toBe('#E8336F');
    expect(TEAM_TONES.dark.purple.color).toBe('#9C86FF');
    expect(TEAM_TONES.dark.pink.color).toBe('#FF7EA8');
    // The labels' ink reads on their ground over the screen (light canvas, black in the dark).
    for (const team of TEAMS) {
      expect(contrastRatio(TEAM_TONES.dark[team].tagInk, '#000000')).toBeGreaterThanOrEqual(
        AA_TEXT,
      );
      expect(
        contrastRatio(TEAM_TONES.dark[team].onColor, TEAM_TONES.dark[team].color),
      ).toBeGreaterThanOrEqual(AA_TEXT);
    }
  });

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

  for (const scheme of SCHEMES) {
    it(`${scheme}: the main game button's label reads on white; the last seconds read on every ground`, () => {
      for (const [name, ground] of grounds(scheme)) {
        expect(contrastRatio(WHITE, mainButtonInk(ground))).toBeGreaterThanOrEqual(
          floorOf(scheme, name),
        );
        for (const stop of [ground.top, ground.bottom]) {
          // The clock's number is large text (40 px, 800).
          expect(contrastRatio(LOW_TIME.text, stop)).toBeGreaterThanOrEqual(AA_LARGE);
        }
      }
    });
  }

  it('"Yasak!" in a toast reads on white; ink reads on the orange of the last seconds', () => {
    expect(contrastRatio(JUDGE_COLORS.forbidden, WHITE)).toBeGreaterThanOrEqual(AA_TEXT);
    expect(contrastRatio(INK, LOW_TIME.fill)).toBeGreaterThanOrEqual(AA_TEXT);
  });
});
