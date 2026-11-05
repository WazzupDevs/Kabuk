import {
  containsProfanity,
  type PreparedTerms,
} from '../../supabase/functions/_shared/pure/profanity.ts';
import { formatTrNumber, isGuessValue } from '../../supabase/functions/_shared/pure/kaupholl.ts';

// The Kaupholl deck's tools (docs/decisions/kaupholl.md §4). The real questions live only in the
// private repos (WazzupDevs/kaupholl-sorular, WazzupDevs/kaupholl-kontrol); this repo holds the
// schema, the checks and the obviously fake content/kaupholl-questions.sample.json. Nothing here
// prints a question, an answer or a note: only ids, rule names and counts.
//
//   pnpm admin:kaupholl-import --file <deck.json>   verified rows into kaupholl_questions
//   pnpm admin:kaupholl-stats                       the deck's counts (kaupholl_question_stats)
//   pnpm kaupholl:export-check --file <deck.json> --out <check.json>
//                                                   the deck without answers and notes, for checkers
//   pnpm kaupholl:compare --deck <deck.json> --check <answers.json>
//                                                   which ids the checkers' answers match

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export const BIASES = ['under', 'neutral', 'over'] as const;
export const STATUSES = ['taslak', 'doğrulandı', 'elendi'] as const;
// kör: the checker could not see the author's answer (§4 "Ne garanti edilir"); bağımsız: an
// independent check, not blind.
export const CHECKS = ['kör', 'bağımsız'] as const;

export type DeckRow = {
  id: string;
  text: string;
  unit: string;
  decimals: 0 | 1;
  answer: number;
  note: string;
  source: string;
  sourceDate: string;
  difficulty: (typeof DIFFICULTIES)[number];
  bias: (typeof BIASES)[number];
  category: string;
  author: string;
  status: (typeof STATUSES)[number];
  check?: (typeof CHECKS)[number];
};

export type Deck = { sample?: boolean; questions: DeckRow[] };

// A row's problem: its id (or its place) and the rule's name, never a value.
export type DeckProblem = { row: string; rule: string };

const ID = /^[a-z0-9][a-z0-9_-]{0,63}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

const str = (v: unknown, min: number, max: number): v is string =>
  typeof v === 'string' && v.trim() === v && [...v].length >= min && [...v].length <= max;
const oneOf = <T extends string>(list: readonly T[], v: unknown): v is T =>
  typeof v === 'string' && (list as readonly string[]).includes(v);

// The answer's digits as they could be written in the question or the link: "8.760", "8760",
// "8,7" (`decimals` 1) or "87". The text must hold none of them.
export function answerForms(answer: number, decimals: 0 | 1): string[] {
  const grouped = formatTrNumber(answer, decimals);
  const plain = grouped.replace(/\./g, '');
  return [...new Set([grouped, plain, plain.replace(',', ''), plain.replace(',', '.')])].filter(
    (f) => f.replace(/\D/g, '').length >= 2,
  );
}

const containsAnswer = (text: string, answer: number, decimals: 0 | 1): boolean =>
  answerForms(answer, decimals).some((form) =>
    new RegExp(`(^|[^0-9.,])${form.replace(/[.,]/g, (c) => `\\${c}`)}($|[^0-9])`).test(text),
  );

// §4 "Satır kuralları", for one row. `terms`: the profanity list (content/profanity-tr.json).
export function rowProblems(raw: unknown, place: number, terms: PreparedTerms): DeckProblem[] {
  const r = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  const row = typeof r.id === 'string' && ID.test(r.id) ? r.id : `#${place + 1}`;
  const out: string[] = [];
  if (!(typeof r.id === 'string' && ID.test(r.id))) out.push('id');
  if (!str(r.text, 1, 200)) out.push('text');
  if (!str(r.unit, 1, 40)) out.push('unit');
  if (r.decimals !== 0 && r.decimals !== 1) out.push('decimals');
  if (!isGuessValue(r.answer)) out.push('answer');
  else if (r.decimals === 0 && !Number.isInteger(r.answer)) out.push('answer_decimals');
  if (!str(r.note, 1, 400)) out.push('note');
  if (!(typeof r.source === 'string' && /^https:\/\/\S+$/.test(r.source))) out.push('source');
  if (!(typeof r.sourceDate === 'string' && DATE.test(r.sourceDate))) out.push('source_date');
  if (!oneOf(DIFFICULTIES, r.difficulty)) out.push('difficulty');
  if (!oneOf(BIASES, r.bias)) out.push('bias');
  if (!str(r.category, 1, 40)) out.push('category');
  if (!str(r.author, 1, 40)) out.push('author');
  if (!oneOf(STATUSES, r.status)) out.push('status');
  if (r.check !== undefined && !oneOf(CHECKS, r.check)) out.push('check');
  if (r.status === 'doğrulandı' && r.check === undefined) out.push('check_missing');
  if (
    typeof r.text === 'string' &&
    isGuessValue(r.answer) &&
    (r.decimals === 0 || r.decimals === 1) &&
    containsAnswer(r.text, r.answer, r.decimals)
  ) {
    out.push('answer_in_text');
  }
  for (const field of ['text', 'unit', 'note'] as const) {
    const value = r[field];
    if (typeof value === 'string' && containsProfanity(value, terms))
      out.push(`${field}_profanity`);
  }
  return out.map((rule) => ({ row, rule }));
}

// The whole deck: every row's problems and the ids that come twice.
export function deckProblems(raw: unknown, terms: PreparedTerms): DeckProblem[] {
  const d = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  if (!Array.isArray(d.questions)) return [{ row: 'deck', rule: 'questions' }];
  const problems = d.questions.flatMap((row, i) => rowProblems(row, i, terms));
  const seen = new Set<string>();
  for (const row of d.questions as Record<string, unknown>[]) {
    if (typeof row?.id !== 'string') continue;
    if (seen.has(row.id)) problems.push({ row: row.id, rule: 'id_twice' });
    seen.add(row.id);
  }
  return problems;
}

export function parseDeck(
  text: string,
  terms: PreparedTerms,
): { ok: true; deck: Deck } | { ok: false; problems: DeckProblem[] } {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, problems: [{ row: 'deck', rule: 'json' }] };
  }
  const problems = deckProblems(raw, terms);
  return problems.length ? { ok: false, problems } : { ok: true, deck: raw as Deck };
}

// A kaupholl_questions row, as the import writes it.
export type QuestionRow = {
  id: string;
  body: string;
  unit: string;
  decimals: 0 | 1;
  answer: number;
  note: string;
  difficulty: DeckRow['difficulty'];
  bias: DeckRow['bias'];
  category: string;
  verification: 'blind' | 'independent';
  active: boolean;
};

// What the import does (§4 "İçe aktarma ve üretim"): verified rows with a check in, by id (added or
// updated, active); every other question of the database out (active false; nothing is deleted).
// Drafts and dropped rows of the file are counted, never imported.
export function importPlan(
  deck: Deck,
  existing: readonly string[],
): {
  upsert: QuestionRow[];
  deactivate: string[];
  counts: { verified: number; drafts: number; dropped: number; deactivated: number };
} {
  const verified = deck.questions.filter(
    (q): q is DeckRow & { check: (typeof CHECKS)[number] } =>
      q.status === 'doğrulandı' && q.check !== undefined,
  );
  const upsert = verified.map((q) => ({
    id: q.id,
    body: q.text,
    unit: q.unit,
    decimals: q.decimals,
    answer: q.answer,
    note: q.note,
    difficulty: q.difficulty,
    bias: q.bias,
    category: q.category,
    verification: q.check === 'kör' ? ('blind' as const) : ('independent' as const),
    active: true,
  }));
  const keep = new Set(upsert.map((q) => q.id));
  const deactivate = existing.filter((id) => !keep.has(id));
  return {
    upsert,
    deactivate,
    counts: {
      verified: upsert.length,
      drafts: deck.questions.filter((q) => q.status === 'taslak').length,
      dropped: deck.questions.filter((q) => q.status === 'elendi').length,
      deactivated: deactivate.length,
    },
  };
}

// The checkers' file (WazzupDevs/kaupholl-kontrol): no answer, no note, no author, no status.
// Rows the checker must not get (dropped) stay out.
export type CheckRow = {
  id: string;
  text: string;
  unit: string;
  decimals: 0 | 1;
  source: string;
};

export function exportCheck(deck: Deck): { rows: CheckRow[]; problems: DeckProblem[] } {
  const rows: CheckRow[] = [];
  const problems: DeckProblem[] = [];
  for (const q of deck.questions) {
    if (q.status === 'elendi') continue;
    if (containsAnswer(q.text, q.answer, q.decimals)) {
      problems.push({ row: q.id, rule: 'answer_in_text' });
    }
    if (containsAnswer(q.source, q.answer, q.decimals)) {
      problems.push({ row: q.id, rule: 'answer_in_source' });
    }
    rows.push({ id: q.id, text: q.text, unit: q.unit, decimals: q.decimals, source: q.source });
  }
  return { rows, problems };
}

// A checker's answers: by id, with the kind of check it was (kör or bağımsız).
export type CheckAnswer = { id: string; answer: number; check: (typeof CHECKS)[number] };

// Which ids the checker's answer matches (in tenths), which it does not, which it lacks. Only ids
// and their kind of check: never the two answers.
export function compareChecks(
  deck: Deck,
  answers: readonly CheckAnswer[],
): {
  match: { id: string; check: CheckAnswer['check'] }[];
  mismatch: string[];
  missing: string[];
} {
  const byId = new Map(answers.map((a) => [a.id, a]));
  const match: { id: string; check: CheckAnswer['check'] }[] = [];
  const mismatch: string[] = [];
  const missing: string[] = [];
  for (const q of deck.questions) {
    if (q.status === 'elendi') continue;
    const a = byId.get(q.id);
    if (!a) missing.push(q.id);
    else if (Math.round(a.answer * 10) === Math.round(q.answer * 10)) {
      match.push({ id: q.id, check: a.check });
    } else mismatch.push(q.id);
  }
  return { match, mismatch, missing };
}

export function parseCheckAnswers(text: string): CheckAnswer[] {
  const raw = JSON.parse(text) as { answers?: unknown };
  if (!Array.isArray(raw.answers)) throw new Error('answers: an array is needed');
  return raw.answers.map((a: Record<string, unknown>, i: number) => {
    if (typeof a?.id !== 'string' || !isGuessValue(a.answer) || !oneOf(CHECKS, a.check)) {
      throw new Error(`answers #${i + 1}: id, answer and check (kör or bağımsız) are needed`);
    }
    return { id: a.id, answer: a.answer, check: a.check };
  });
}

// `pnpm admin:kaupholl-stats` (§3 "Pilotta ne bakılır"): the deck's counts, no text, no answer.
export type StatsRow = {
  question_id: string;
  games: number;
  guesses: number;
  no_guess: number;
  smaller_wins: number;
  win_bucket: number[];
  sum_abs_log_err: number;
};

export const BUCKETS = [
  'Hepsinden küçük',
  'alt uç',
  'merkez altı',
  'merkez',
  'merkez üstü',
  'üst uç',
] as const;

export function statsReport(rows: readonly StatsRow[], exhausted: number): string {
  const games = rows.reduce((n, r) => n + r.games, 0);
  const guesses = rows.reduce((n, r) => n + r.guesses, 0);
  const buckets = BUCKETS.map((_, i) => rows.reduce((n, r) => n + (r.win_bucket[i] ?? 0), 0));
  const won = buckets.reduce((n, b) => n + b, 0);
  const err = rows.reduce((n, r) => n + r.sum_abs_log_err, 0);
  const lines = [
    `Sorular: ${rows.length}, oynanan soru: ${games}, tahmin: ${guesses}`,
    `Kimse tahmin yazmadı: ${rows.reduce((n, r) => n + r.no_guess, 0)}`,
    `Kazanan konum (${won}):`,
    ...BUCKETS.map((name, i) => {
      const n = buckets[i] ?? 0;
      return `  ${name}: ${n}${won ? ` (%${Math.round((n / won) * 100)})` : ''}`;
    }),
    `Tahminin cevaba ortalama log uzaklığı: ${guesses ? (err / guesses).toFixed(3) : '-'}`,
    `Soru kalmadı (questions_exhausted): ${exhausted}`,
    'En az oynanan 10 soru (id · oyun):',
    ...[...rows]
      .sort((a, b) => a.games - b.games || a.question_id.localeCompare(b.question_id))
      .slice(0, 10)
      .map((r) => `  ${r.question_id} · ${r.games}`),
  ];
  return lines.join('\n');
}

export function argValue(args: readonly string[], name: string): string | null {
  const i = args.indexOf(name);
  const value = i >= 0 ? args[i + 1] : undefined;
  return value && !value.startsWith('--') ? value : null;
}

export const problemLines = (problems: readonly DeckProblem[]): string =>
  problems.map((p) => `  ${p.row}: ${p.rule}`).join('\n');
