// The visual gate's comparisons (CLAUDE.md → Görsel kapı), apart from Maestro's own
// assertScreenshot: the app beside v46 (the soft similarity report, a decision for the CTO), two
// photos of the same state (the noise the hard threshold is set above, in Maestro's own measure)
// and Maestro's JUnit report (which shots failed the hard gate).
import { readFileSync, writeFileSync } from 'node:fs';

import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

export function readPng(file: string): PNG {
  return PNG.sync.read(readFileSync(file));
}

// `png` on a w × h canvas, top left; the rest is magenta, so a size difference counts as a
// difference.
export function padTo(png: PNG, width: number, height: number): PNG {
  if (png.width === width && png.height === height) return png;
  const out = new PNG({ width, height });
  for (let i = 0; i < out.data.length; i += 4) {
    out.data[i] = 255;
    out.data[i + 1] = 0;
    out.data[i + 2] = 255;
    out.data[i + 3] = 255;
  }
  PNG.bitblt(png, out, 0, 0, png.width, png.height, 0, 0);
  return out;
}

export type Similarity = {
  // Share of pixels that match, 0–100.
  percent: number;
  mismatched: number;
  width: number;
  height: number;
  sameSize: boolean;
};

// pixelmatch with its default colour threshold (0.1) and anti-aliasing detection on.
export function similarity(a: PNG, b: PNG, diffFile?: string): Similarity {
  const width = Math.max(a.width, b.width);
  const height = Math.max(a.height, b.height);
  const pa = padTo(a, width, height);
  const pb = padTo(b, width, height);
  const diff = new PNG({ width, height });
  const mismatched = pixelmatch(pa.data, pb.data, diff.data, width, height, { threshold: 0.1 });
  if (diffFile) writeFileSync(diffFile, PNG.sync.write(diff));
  return {
    percent: 100 * (1 - mismatched / (width * height)),
    mismatched,
    width,
    height,
    sameSize: a.width === b.width && a.height === b.height,
  };
}

// Maestro 2.10.0's assertScreenshot measure (maestro-orchestra ScreenshotMatch.matchPercentage):
// the share of pixels, 0–100, whose RGB values are within a tenth of the largest RGB distance of
// each other. No anti-aliasing allowance, unlike pixelmatch; its thresholdPercentage is compared
// with this. Same-size images only.
export function maestroMatch(a: PNG, b: PNG): number {
  if (a.width !== b.width || a.height !== b.height) {
    throw new Error(`different sizes: ${a.width}×${a.height}, ${b.width}×${b.height}`);
  }
  const total = a.width * a.height;
  if (total === 0) return 100;
  const limit = (0.1 * Math.sqrt(255 * 255 * 3)) ** 2;
  let differing = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    const dr = (a.data[i] ?? 0) - (b.data[i] ?? 0);
    const dg = (a.data[i + 1] ?? 0) - (b.data[i + 1] ?? 0);
    const db = (a.data[i + 2] ?? 0) - (b.data[i + 2] ?? 0);
    if (dr * dr + dg * dg + db * db > limit) differing++;
  }
  return 100 - (differing / total) * 100;
}

export type CaseResult = { name: string; ok: boolean; message: string };

// Maestro's `--format junit` report: one <testcase> per flow (the flow's `name:`), with a
// <failure> when a command failed.
export function junitCases(xml: string): CaseResult[] {
  const cases: CaseResult[] = [];
  for (const m of xml.matchAll(/<testcase\b([^>]*?)(\/>|>([\s\S]*?)<\/testcase>)/g)) {
    const name = /\bname="([^"]*)"/.exec(m[1] ?? '')?.[1] ?? '';
    const body = m[3] ?? '';
    const failure = /<(failure|error)\b[^>]*>([\s\S]*?)<\/\1>/.exec(body);
    const status = /\bstatus="([^"]*)"/.exec(m[1] ?? '')?.[1];
    const ok = !failure && status !== 'ERROR' && status !== 'FAILURE';
    cases.push({ name, ok, message: failure ? unescapeXml(failure[2] ?? '').trim() : '' });
  }
  return cases;
}

function unescapeXml(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

// Maestro's thresholdPercentage over the measured noise (maestroMatch of two photos of the same
// state, the worst of them): as far below it again as the noise itself, as margin, rounded down to
// a tenth; never above 99.9.
export function thresholdFor(worstNoisePercent: number): number {
  const noise = 100 - worstNoisePercent;
  return Math.min(99.9, Math.floor((100 - 2 * noise - 0.05) * 10) / 10);
}
