// Usage: pnpm site:build → site/ (git-ignored): the website (web/) and the public legal pages from
// docs/legal/, published by Cloudflare to https://skall.world/ (wrangler.jsonc; docs/OPS.md →
// "Yasal sayfalar (skall.world)"). The app name comes from pure/brand.ts.
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { APP_NAME } from '../supabase/functions/_shared/pure/brand.ts';
import { LEGAL_PAGES, renderIndex, renderLegalPage } from './site/render.ts';

const root = resolve(import.meta.dirname, '..');
const out = resolve(root, 'site');

rmSync(out, { recursive: true, force: true });
mkdirSync(out);
// The website (web/: home page, 404, its scripts and images) as it is; the legal pages go next to it.
cpSync(resolve(root, 'web'), out, { recursive: true });
for (const page of LEGAL_PAGES) {
  const markdown = readFileSync(resolve(root, 'docs/legal', `${page.slug}.md`), 'utf8');
  writeFileSync(resolve(out, `${page.slug}.html`), renderLegalPage(markdown, page, APP_NAME));
}
// The legal pages' list: the website's footer links to yasal.html; index.html is the home page.
if (existsSync(resolve(out, 'yasal.html'))) throw new Error('web/yasal.html would be overwritten');
writeFileSync(resolve(out, 'yasal.html'), renderIndex(APP_NAME));
// GitHub Pages serves files as they are (no Jekyll processing).
writeFileSync(resolve(out, '.nojekyll'), '');
console.log(`Built ${LEGAL_PAGES.length + 1} pages into site/`);
