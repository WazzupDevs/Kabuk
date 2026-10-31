import { describe, expect, it } from 'vitest';

import { PEEK_FRAME, peekScale, peekShown, SHEET_MAX } from './sheetFit';

describe('peekScale', () => {
  it('is the 350 frame scaled to the sheet: 58 → 61 on a 370 wide sheet', () => {
    expect(peekScale(PEEK_FRAME, 58)).toEqual({ k: 1, strip: 58 });
    expect(Math.round(peekScale(370, 58).strip)).toBe(61);
    expect(peekScale(300, 58).strip).toBeCloseTo(58 * (300 / 350));
  });

  it('keeps the frame until the sheet is measured', () => {
    expect(peekScale(0, 58)).toEqual({ k: 1, strip: 58 });
  });
});

describe('peekShown', () => {
  it('shows the buddies while the sheet is shorter than 90% of the screen', () => {
    expect(SHEET_MAX).toBe(0.9);
    expect(peekShown(400, 844)).toBe(true);
    expect(peekShown(759, 844)).toBe(true);
  });

  it('hides them at the tallest sheet, rounding included', () => {
    expect(peekShown(844 * 0.9, 844)).toBe(false);
    expect(peekShown(759.3, 844)).toBe(false);
  });

  it('shows them before anything is measured', () => {
    expect(peekShown(0, 844)).toBe(true);
    expect(peekShown(500, 0)).toBe(true);
  });
});
