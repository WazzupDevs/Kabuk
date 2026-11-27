import { describe, expect, it } from 'vitest';

import { GECIT_LOW_POOL, parseGecitFile, poolStatus } from './gecit.ts';

const ok = { prompt: 'Örnek?', options: ['a', 'b', 'c', 'd'], answer: 2 };

describe('parseGecitFile', () => {
  it('reads a valid file', () => {
    expect(parseGecitFile(JSON.stringify([ok]))).toEqual({ ok: true, rows: [ok] });
  });

  it('names every problem and writes nothing', () => {
    const res = parseGecitFile(
      JSON.stringify([ok, { ...ok, prompt: ' Örnek? ' }, { ...ok, prompt: 'B?', options: ['a'] }]),
    );
    expect(res).toEqual({
      ok: false,
      problems: ['#2: the same question twice', '#3: options must be four short texts'],
    });
    expect(parseGecitFile('nope')).toEqual({ ok: false, problems: ['not JSON'] });
    expect(parseGecitFile(JSON.stringify([{ ...ok, answer: 4 }]))).toMatchObject({ ok: false });
    expect(parseGecitFile(JSON.stringify([{ ...ok, prompt: '' }]))).toMatchObject({ ok: false });
  });
});

describe('poolStatus', () => {
  it('counts, and warns when few new questions are left', () => {
    expect(poolStatus(200, 150)).toBe('Pool: 200 questions, 150 never asked.');
    expect(poolStatus(20, GECIT_LOW_POOL - 1)).toContain('asked again');
  });
});
