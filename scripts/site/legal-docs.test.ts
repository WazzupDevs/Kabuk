import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { LEGAL_DOCS_FILE, legalDocsSource } from './legal-docs.ts';

describe('legal texts in the app', () => {
  it('the generated file is the texts of docs/legal', () => {
    const root = join(import.meta.dirname, '../..');
    expect(readFileSync(join(root, LEGAL_DOCS_FILE), 'utf8')).toBe(legalDocsSource(root));
  });
});
