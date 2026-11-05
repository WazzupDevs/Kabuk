// Usage: pnpm kaupholl:export-check --file <deck.json> --out <check.json>
// (docs/decisions/kaupholl.md §4 "Bağımsız doğrulama"): the deck for the checkers' private repo,
// without answers, notes, authors or statuses. Refuses when a question or its link holds the
// answer's digits. Run outside this repo's folder; prints only ids and counts.
import { readFileSync, writeFileSync } from 'node:fs';

import { argValue, exportCheck, parseDeck, problemLines } from './admin/kaupholl.ts';
import { deckTerms } from './kaupholl-terms.ts';

const args = process.argv.slice(2);
const file = argValue(args, '--file');
const out = argValue(args, '--out');
if (!file || !out) {
  console.error('pnpm kaupholl:export-check --file <deck.json> --out <check.json>');
  process.exit(1);
}
const parsed = parseDeck(readFileSync(file, 'utf8'), deckTerms());
if (!parsed.ok) {
  console.error(`The deck has problems:\n${problemLines(parsed.problems)}`);
  process.exit(1);
}
const { rows, problems } = exportCheck(parsed.deck);
if (problems.length) {
  console.error(`The answer shows in these rows; nothing was written:\n${problemLines(problems)}`);
  process.exit(1);
}
writeFileSync(out, `${JSON.stringify({ questions: rows }, null, 2)}\n`);
console.log(`Wrote ${rows.length} questions for the checkers.`);
