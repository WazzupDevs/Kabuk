import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { APP_NAME } from '../../supabase/functions/_shared/pure/brand.ts';
import {
  LEGAL_ENTITY,
  type LegalEntity,
} from '../../supabase/functions/_shared/pure/legalEntity.ts';
import { DRAFT_NOTICE, LEGAL_PAGES, renderIndex, renderLegalPage } from './render.ts';

const legalDir = resolve(import.meta.dirname, '../../docs/legal');
const privacy = { slug: 'gizlilik-politikasi', title: 'Gizlilik Politikası' };
const named: LegalEntity = { ...LEGAL_ENTITY, controllerName: 'Deniz Örnek' };
const unnamed: LegalEntity = { ...LEGAL_ENTITY, controllerName: '' };

function source(slug: string): string {
  return readFileSync(resolve(legalDir, `${slug}.md`), 'utf8');
}

describe('legal site', () => {
  it('renders every page from docs/legal with no placeholder left', () => {
    for (const page of LEGAL_PAGES) {
      const html = renderLegalPage(source(page.slug), page, APP_NAME, named);
      expect(html).toContain(`<title>${page.title} · ${APP_NAME}</title>`);
      expect(html).not.toMatch(/\{\{[A-Z_]+\}\}/);
      expect(html).not.toContain(DRAFT_NOTICE);
    }
  });

  it('marks every page a draft until the data controller is named', () => {
    for (const page of LEGAL_PAGES) {
      expect(renderLegalPage(source(page.slug), page, APP_NAME, unnamed)).toContain(DRAFT_NOTICE);
    }
    expect(renderIndex(APP_NAME, unnamed)).toContain(DRAFT_NOTICE);
    expect(renderIndex(APP_NAME, named)).not.toContain(DRAFT_NOTICE);
  });

  it('leaves no unfinished field in the texts', () => {
    for (const page of LEGAL_PAGES) {
      const markdown = source(page.slug);
      expect(markdown).not.toContain('TASLAK');
      expect(markdown).not.toContain('hukuki görüşle belirlenecek');
      // A bracketed field to fill in ("[tarih]"); links are "[text](href)".
      expect(markdown).not.toMatch(/\[[^\]]*\](?!\()/);
    }
  });

  it('links only to pages that exist', () => {
    const slugs = new Set(LEGAL_PAGES.map((page) => page.slug));
    for (const page of LEGAL_PAGES) {
      for (const [, href] of source(page.slug).matchAll(/\]\(([^)]+)\)/g)) {
        expect(slugs.has((href ?? '').replace(/\.html$/, ''))).toBe(true);
      }
    }
  });

  it('names the app and the developer on the child safety page', () => {
    const page = { slug: 'cocuk-guvenligi', title: 'Çocuk Güvenliği Standartları' };
    const html = renderLegalPage(source(page.slug), page, APP_NAME, named);
    expect(html).toContain(APP_NAME);
    expect(html).toContain(named.developerName);
    expect(html).toContain('CSAE');
  });

  it('fills the placeholders with the given names', () => {
    const html = renderLegalPage(
      '**{{APP_NAME}}** hesabı, {{CONTROLLER_NAME}}',
      privacy,
      'Deneme',
      named,
    );
    expect(html).toContain('<strong>Deneme</strong> hesabı, Deniz Örnek');
  });

  it('wraps tables so they scroll on a phone', () => {
    const html = renderLegalPage('| a | b |\n| - | - |\n| 1 | 2 |', privacy, 'X');
    expect(html).toContain('<div class="table"><table>');
  });

  it('links every page from the index', () => {
    const html = renderIndex(APP_NAME);
    for (const page of LEGAL_PAGES) expect(html).toContain(`href="${page.slug}.html"`);
  });
});
