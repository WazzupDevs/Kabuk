import { describe, expect, it } from 'vitest';

import { parseLegalInline, parseLegalMarkdown } from './legalMarkdown.ts';

describe('parseLegalInline', () => {
  it('splits bold and links from plain text', () => {
    expect(parseLegalInline('Önce **Profil**, sonra [Hesap Silme](hesap-silme.html).')).toEqual([
      { text: 'Önce ' },
      { text: 'Profil', bold: true },
      { text: ', sonra ' },
      { text: 'Hesap Silme', href: 'hesap-silme.html' },
      { text: '.' },
    ]);
  });

  it('keeps plain text whole', () => {
    expect(parseLegalInline('Düz metin')).toEqual([{ text: 'Düz metin' }]);
  });
});

describe('parseLegalMarkdown', () => {
  it('reads headings, paragraphs and lists', () => {
    const blocks = parseLegalMarkdown(
      '# Başlık\n\nİlk satır\nikinci satır\n\n## Bölüm\n\n- bir\n- **iki**\n\n1. önce\n2. sonra\n',
    );
    expect(blocks).toEqual([
      { type: 'heading', level: 1, spans: [{ text: 'Başlık' }] },
      { type: 'paragraph', spans: [{ text: 'İlk satır ikinci satır' }] },
      { type: 'heading', level: 2, spans: [{ text: 'Bölüm' }] },
      { type: 'list', ordered: false, items: [[{ text: 'bir' }], [{ text: 'iki', bold: true }]] },
      { type: 'list', ordered: true, items: [[{ text: 'önce' }], [{ text: 'sonra' }]] },
    ]);
  });

  it('reads a table without its rule row', () => {
    const blocks = parseLegalMarkdown('| Veri | Neden |\n| --- | --- |\n| Ad | **Profil** |\n');
    expect(blocks).toEqual([
      {
        type: 'table',
        head: ['Veri', 'Neden'],
        rows: [[[{ text: 'Ad' }], [{ text: 'Profil', bold: true }]]],
      },
    ]);
  });

  it('ends a paragraph where a list starts', () => {
    const blocks = parseLegalMarkdown('Şunlar:\n- bir\n');
    expect(blocks.map((block) => block.type)).toEqual(['paragraph', 'list']);
  });
});
