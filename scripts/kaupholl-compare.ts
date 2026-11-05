// Usage: pnpm kaupholl:compare --deck <deck.json> --check <answers.json>
// (docs/decisions/kaupholl.md §4 "Bağımsız doğrulama"): which questions the checker's answers match.
// Prints only ids and the kind of check (kör, bağımsız), never an answer.
import { readFileSync } from 'node:fs';

import {
  argValue,
  compareChecks,
  parseCheckAnswers,
  parseDeck,
  problemLines,
} from './admin/kaupholl.ts';
import { deckTerms } from './kaupholl-terms.ts';

const args = process.argv.slice(2);
const deckFile = argValue(args, '--deck');
const checkFile = argValue(args, '--check');
if (!deckFile || !checkFile) {
  console.error('pnpm kaupholl:compare --deck <deck.json> --check <answers.json>');
  process.exit(1);
}
const parsed = parseDeck(readFileSync(deckFile, 'utf8'), deckTerms());
if (!parsed.ok) {
  console.error(`The deck has problems:\n${problemLines(parsed.problems)}`);
  process.exit(1);
}
const result = compareChecks(parsed.deck, parseCheckAnswers(readFileSync(checkFile, 'utf8')));
console.log(`Tutan (${result.match.length}):`);
for (const m of result.match) console.log(`  ${m.id} · ${m.check}`);
console.log(`Tutmayan (${result.mismatch.length}): ${result.mismatch.join(', ') || '-'}`);
console.log(`Kontrolsüz (${result.missing.length}): ${result.missing.join(', ') || '-'}`);
