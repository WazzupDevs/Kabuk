import { readdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { buildSeed } from './build.ts';
import {
  buildTableIconImagesModule,
  buildTableIconsModule,
  parseTableIcons,
  TABLE_ICON_ASSET_DIR,
  TABLE_ICON_IMAGES_MODULE,
  TABLE_CARD_DIR,
  TABLE_ICON_SOURCE_DIR,
  TABLE_ICONS_MODULE,
  tableIconAssetFiles,
  tableIconSource,
} from './tableIcons.ts';

const root = resolve(import.meta.dirname, '../..');
const content = JSON.parse(readFileSync(resolve(root, 'content/table-icons.json'), 'utf8'));

describe(TABLE_ICONS_MODULE, () => {
  // K-45: the app and the server read the same list; it is the one built from content/.
  it('is the module built from the current content (run `pnpm seed`)', async () => {
    expect(readFileSync(resolve(root, TABLE_ICONS_MODULE), 'utf8')).toBe(
      await buildTableIconsModule(root),
    );
  });

  it('is the list the seed loads into public.table_icons', () => {
    const { icons } = parseTableIcons(content);
    const sql = buildSeed(root).sql;
    for (const icon of icons) expect(sql).toContain(`('${icon.id}', `);
  });
});

describe(TABLE_ICON_IMAGES_MODULE, () => {
  it('is the module built from the current content (run `pnpm seed`)', async () => {
    expect(readFileSync(resolve(root, TABLE_ICON_IMAGES_MODULE), 'utf8')).toBe(
      await buildTableIconImagesModule(root),
    );
  });

  // The app's squares are the cards' ones, byte for byte, and only the listed ones.
  it(`ships the source files in ${TABLE_ICON_ASSET_DIR}`, () => {
    const ids = parseTableIcons(content).icons.map((i) => i.id);
    expect(tableIconAssetFiles(root)).toEqual(ids.map((id) => `${id}.webp`).sort());
    const hash = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex');
    for (const id of ids) {
      expect(hash(resolve(root, TABLE_ICON_ASSET_DIR, `${id}.webp`))).toBe(
        hash(tableIconSource(root, id)),
      );
    }
  });
});

describe(TABLE_CARD_DIR, () => {
  // The riso cards (docs/decisions/masa-kimligi-riso.md): every listed card has its wide and tall
  // picture, and no other card is shipped.
  it('holds exactly the listed cards, wide and tall', () => {
    const ids = parseTableIcons(content)
      .icons.map((i) => `${i.id}.webp`)
      .sort();
    for (const kind of ['yatay', 'uzun']) {
      const files = readdirSync(resolve(root, TABLE_CARD_DIR, kind))
        .filter((f) => f.endsWith('.webp'))
        .sort();
      expect(files, kind).toEqual(ids);
    }
  });
});

describe('content/table-icons.json', () => {
  // §4.E: the files the app ships (4.5b) come from the same folder as the list.
  it('names exactly the 55 card squares', () => {
    const files = readdirSync(resolve(root, TABLE_ICON_SOURCE_DIR))
      .filter((f) => f.endsWith('.webp'))
      .map((f) => f.replace(/\.webp$/, ''))
      .sort();
    expect(
      parseTableIcons(content)
        .icons.map((i) => i.id)
        .sort(),
    ).toEqual(files);
    expect(files).toHaveLength(55);
  });

  it('refuses an icon twice and one outside the themes', () => {
    const [first] = content.icons;
    expect(() => parseTableIcons({ ...content, icons: [first, first] })).toThrow(/twice/);
    expect(() => parseTableIcons({ ...content, icons: [{ ...first, theme: 'Yok' }] })).toThrow(
      /no theme/,
    );
  });
});
