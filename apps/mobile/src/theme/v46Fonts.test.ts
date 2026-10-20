import { describe, expect, it } from 'vitest';

import { V46_TYPE } from './tokens.generated';
import { BUNDLED_WEIGHTS, familyFor, matchWeight } from './v46Fonts';

describe('v46 font weights', () => {
  // v46 loads Plus Jakarta Sans 500 to 800 only, and so does the app.
  it('bundles the weights v46 loads', () => {
    expect(BUNDLED_WEIGHTS).toEqual([500, 600, 700, 800]);
  });

  // CSS Fonts 4 §5.2. In Chromium, inside v46 with the files it loads from Google Fonts (and again
  // with the app's four files), 13 px text at 400 and at 500 measure the same width (74.906 px for
  // "Masaya katıl"; 600: 76.031): v46's 400 is its 500 file.
  it('draws a weight v46 does not load as the browser does', () => {
    expect(matchWeight(400, BUNDLED_WEIGHTS)).toBe(500);
    expect(matchWeight(300, BUNDLED_WEIGHTS)).toBe(500);
    expect(matchWeight(650, BUNDLED_WEIGHTS)).toBe(700);
    expect(matchWeight(900, BUNDLED_WEIGHTS)).toBe(800);
    expect(matchWeight(450, [400, 600])).toBe(400);
    expect(matchWeight(450, [300, 600])).toBe(300);
    expect(matchWeight(550, [500, 800])).toBe(800);
    expect(familyFor(400)).toBe('PlusJakartaSans_500Medium');
  });

  it('has a file for every v46 type style', () => {
    const weights = [...new Set(Object.values(V46_TYPE).map((t) => t.weight))].sort(
      (a, b) => a - b,
    );
    expect(weights).toEqual([400, 600, 700, 800]);
    for (const w of weights) expect(familyFor(w)).toMatch(/^PlusJakartaSans_/);
    expect(weights.filter((w) => !BUNDLED_WEIGHTS.includes(w))).toEqual([400]);
  });
});
