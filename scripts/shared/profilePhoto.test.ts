import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { inspectJpeg } from '../../supabase/functions/_shared/pure/jpegMetadata.ts';
import { BOT_PHOTO_PATH } from './profilePhoto.ts';

// The bot's profile photo (scripts/e2e/fixtures/bot-photo.jpg): what photo-commit accepts (no
// metadata), small, and a real 256x256 image the app can draw.
describe('the bot photo fixture', () => {
  const bytes = new Uint8Array(readFileSync(BOT_PHOTO_PATH));

  it('carries no metadata and stays small', () => {
    expect(inspectJpeg(bytes)).toEqual({ ok: true });
    expect(bytes.length).toBeLessThan(10_000);
  });

  it('is a 256x256 baseline image', () => {
    const sof = bytes.findIndex((b, i) => b === 0xff && bytes[i + 1] === 0xc0);
    expect(sof).toBeGreaterThan(0);
    const height = ((bytes[sof + 5] ?? 0) << 8) | (bytes[sof + 6] ?? 0);
    const width = ((bytes[sof + 7] ?? 0) << 8) | (bytes[sof + 8] ?? 0);
    expect({ width, height }).toEqual({ width: 256, height: 256 });
  });
});
