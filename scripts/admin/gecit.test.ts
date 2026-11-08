import { describe, expect, it } from 'vitest';

import { parseGecitFile } from './gecit.ts';

const ok = { day: '2030-01-02', prompt: 'Örnek?', options: ['a', 'b', 'c', 'd'], answer: 2 };

describe('parseGecitFile', () => {
  it('reads a valid file', () => {
    expect(parseGecitFile(JSON.stringify([ok]))).toEqual({ ok: true, rows: [ok] });
  });

  it('names every problem and writes nothing', () => {
    const res = parseGecitFile(
      JSON.stringify([ok, ok, { ...ok, day: '2030-01-03', options: ['a'] }, { ...ok, day: 'x' }]),
    );
    expect(res).toEqual({
      ok: false,
      problems: [
        '#2: day 2030-01-02 twice',
        '#3: options must be four short texts',
        '#4: day must be YYYY-MM-DD',
      ],
    });
    expect(parseGecitFile('nope')).toEqual({ ok: false, problems: ['not JSON'] });
    expect(parseGecitFile(JSON.stringify([{ ...ok, answer: 4 }]))).toMatchObject({ ok: false });
  });
});
