// The profanity list the deck's checks use (content/profanity-tr.json, rule 7).
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { prepareTerms, type PreparedTerms } from '../supabase/functions/_shared/pure/profanity.ts';
import { parseProfanity } from './seed/content.ts';

export function deckTerms(): PreparedTerms {
  const list = parseProfanity(
    JSON.parse(readFileSync(resolve(import.meta.dirname, '../content/profanity-tr.json'), 'utf8')),
  );
  return prepareTerms(list.terms, list.wholeWords);
}
