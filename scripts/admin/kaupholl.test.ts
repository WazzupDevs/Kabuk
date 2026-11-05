// The Kaupholl deck's tools (docs/decisions/kaupholl.md §4), with the sample deck and fake rows
// built here: no real question ever comes into this repo.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { prepareTerms } from '../../supabase/functions/_shared/pure/profanity.ts';
import { deckTerms } from '../kaupholl-terms.ts';
import {
  answerForms,
  compareChecks,
  type Deck,
  type DeckRow,
  exportCheck,
  importPlan,
  parseCheckAnswers,
  parseDeck,
  rowProblems,
  statsReport,
} from './kaupholl.ts';

const SAMPLE = readFileSync(
  resolve(import.meta.dirname, '../../content/kaupholl-questions.sample.json'),
  'utf8',
);
const terms = deckTerms();
const NONE = prepareTerms([]);

const row = (over: Partial<DeckRow> = {}): DeckRow => ({
  id: 'ornek-x',
  text: 'Örnek soru: kaç birim?',
  unit: 'birim',
  decimals: 0,
  answer: 8760,
  note: 'Örnek açıklama.',
  source: 'https://example.com/a',
  sourceDate: '2026-11-05',
  difficulty: 'easy',
  bias: 'neutral',
  category: 'genel',
  author: 'ornek',
  status: 'doğrulandı',
  check: 'kör',
  ...over,
});

const rules = (r: unknown) => rowProblems(r, 0, NONE).map((p) => p.rule);

describe('the deck’s rows (§4 "Satır kuralları")', () => {
  it('takes the sample deck as it is', () => {
    const parsed = parseDeck(SAMPLE, terms);
    expect(parsed.ok).toBe(true);
  });

  it('wants a unit, a source and its date, the labels and a check for a verified row', () => {
    expect(rules(row())).toEqual([]);
    expect(rules(row({ unit: '' }))).toEqual(['unit']);
    expect(rules(row({ source: 'example.com' }))).toEqual(['source']);
    expect(rules(row({ sourceDate: '5 Kasım' }))).toEqual(['source_date']);
    expect(rules({ ...row(), difficulty: 'kolay' })).toEqual(['difficulty']);
    expect(rules({ ...row(), bias: 'yukarı' })).toEqual(['bias']);
    expect(rules(row({ check: undefined }))).toEqual(['check_missing']);
    expect(rules(row({ status: 'taslak', check: undefined }))).toEqual([]);
  });

  it('keeps answers between 0 and 999.999,9, with a decimal only when `decimals` is 1', () => {
    expect(rules(row({ answer: -1 }))).toEqual(['answer']);
    expect(rules(row({ answer: 1_000_000 }))).toEqual(['answer']);
    expect(rules(row({ answer: 8.76 }))).toEqual(['answer']);
    expect(rules(row({ answer: 8.7 }))).toEqual(['answer_decimals']);
    expect(rules(row({ answer: 8.7, decimals: 1 }))).toEqual([]);
  });

  it('refuses a question that holds its answer’s digits, as written or grouped', () => {
    expect(answerForms(8760, 0)).toEqual(['8.760', '8760']);
    expect(rules(row({ text: 'Örnek soru: 8.760 mı?' }))).toEqual(['answer_in_text']);
    expect(rules(row({ text: 'Örnek soru: 8760 mı?' }))).toEqual(['answer_in_text']);
    expect(rules(row({ text: 'Örnek soru: 18760 değil, kaç?' }))).toEqual([]);
    expect(rules(row({ answer: 12.5, decimals: 1, text: 'Örnek soru: 12,5 mi?' }))).toEqual([
      'answer_in_text',
    ]);
  });

  it('passes the question, the unit and the note through the profanity list (rule 7)', () => {
    const r = rowProblems(row({ note: 'Örnek siktir açıklama.' }), 0, terms).map((p) => p.rule);
    expect(r).toEqual(['note_profanity']);
  });

  it('names rows by id and rule, never by a value', () => {
    const parsed = parseDeck(
      JSON.stringify({ questions: [row(), row({ answer: 123457 })] }),
      terms,
    );
    expect(parsed).toEqual({ ok: false, problems: [{ row: 'ornek-x', rule: 'id_twice' }] });
    expect(JSON.stringify(parseDeck('{', terms))).not.toContain('{"questions"');
    expect(JSON.stringify(rowProblems(row({ answer: 123457.25 }), 0, NONE))).not.toContain(
      '123457',
    );
  });
});

describe('the import (§4 "İçe aktarma ve üretim")', () => {
  it('writes only verified rows with a check, and takes every other question out', () => {
    const deck: Deck = {
      questions: [
        row({ id: 'a' }),
        row({ id: 'b', check: 'bağımsız' }),
        row({ id: 'c', status: 'taslak', check: undefined }),
        row({ id: 'd', status: 'elendi' }),
      ],
    };
    const plan = importPlan(deck, ['a', 'd', 'old']);
    expect(plan.upsert.map((q) => [q.id, q.verification, q.active])).toEqual([
      ['a', 'blind', true],
      ['b', 'independent', true],
    ]);
    expect(plan.upsert[0]).toMatchObject({ body: 'Örnek soru: kaç birim?', answer: 8760 });
    expect(plan.deactivate).toEqual(['d', 'old']);
    expect(plan.counts).toEqual({ verified: 2, drafts: 1, dropped: 1, deactivated: 2 });
  });
});

describe('the checkers’ file and the comparison (§4 "Bağımsız doğrulama")', () => {
  it('gives the checkers no answer, note, author or status, and no dropped row', () => {
    const deck: Deck = { questions: [row({ id: 'a' }), row({ id: 'b', status: 'elendi' })] };
    const out = exportCheck(deck);
    expect(out.problems).toEqual([]);
    expect(out.rows).toEqual([
      {
        id: 'a',
        text: 'Örnek soru: kaç birim?',
        unit: 'birim',
        decimals: 0,
        source: 'https://example.com/a',
      },
    ]);
    expect(JSON.stringify(out)).not.toContain('8760');
  });

  it('refuses a link that holds the answer', () => {
    const out = exportCheck({ questions: [row({ source: 'https://example.com/8760' })] });
    expect(out.problems).toEqual([{ row: 'ornek-x', rule: 'answer_in_source' }]);
  });

  it('says which ids match, which do not and which have no check; never an answer', () => {
    const deck: Deck = {
      questions: [row({ id: 'a' }), row({ id: 'b' }), row({ id: 'c' })],
    };
    const answers = parseCheckAnswers(
      JSON.stringify({
        answers: [
          { id: 'a', answer: 8760, check: 'kör' },
          { id: 'b', answer: 8761, check: 'bağımsız' },
        ],
      }),
    );
    const result = compareChecks(deck, answers);
    expect(result).toEqual({ match: [{ id: 'a', check: 'kör' }], mismatch: ['b'], missing: ['c'] });
    expect(JSON.stringify(result)).not.toContain('876');
    expect(() => parseCheckAnswers(JSON.stringify({ answers: [{ id: 'a', answer: 1 }] }))).toThrow(
      /check/,
    );
  });
});

describe('admin:kaupholl-stats', () => {
  it('reports counts, where the winning slice stood and the exhausted starts; ids only', () => {
    const report = statsReport(
      [
        {
          question_id: 'a',
          games: 3,
          guesses: 10,
          no_guess: 1,
          smaller_wins: 1,
          win_bucket: [1, 0, 1, 0, 0, 0],
          sum_abs_log_err: 5,
        },
        {
          question_id: 'b',
          games: 1,
          guesses: 0,
          no_guess: 1,
          smaller_wins: 0,
          win_bucket: [0, 0, 0, 0, 0, 0],
          sum_abs_log_err: 0,
        },
      ],
      2,
    );
    expect(report).toContain('Sorular: 2, oynanan soru: 4, tahmin: 10');
    expect(report).toContain('Hepsinden küçük: 1 (%50)');
    expect(report).toContain('ortalama log uzaklığı: 0.500');
    expect(report).toContain('Soru kalmadı (questions_exhausted): 2');
    expect(report.indexOf('  b · 1')).toBeLessThan(report.indexOf('  a · 3'));
  });
});
