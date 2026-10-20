// TRIAL ONLY (claude/visual-trial): turns the trial's raw outputs into the job summary.
// node --experimental-strip-types scripts/trial/report.ts scroll|narrow <OUT>
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const [what, out] = process.argv.slice(2);
if (!what || !out) throw new Error('usage: report.ts scroll|narrow <OUT>');

type Gfx = { frames: number; janky: number; p50: number; p90: number; p95: number; p99: number };

function gfx(text: string): Gfx {
  const num = (re: RegExp) => Number(re.exec(text)?.[1] ?? NaN);
  return {
    frames: num(/Total frames rendered: (\d+)/),
    janky: num(/Janky frames: \d+ \(([\d.]+)%\)/),
    p50: num(/50th percentile: (\d+)ms/),
    p90: num(/90th percentile: (\d+)ms/),
    p95: num(/95th percentile: (\d+)ms/),
    p99: num(/99th percentile: (\d+)ms/),
  };
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)] ?? NaN;
};

if (what === 'scroll') {
  const rows: string[] = [];
  const by: Record<string, Gfx[]> = { golge: [], duz: [] };
  for (const f of readdirSync(out).filter((f) => f.startsWith('gfxinfo-') && !f.includes('ibre'))) {
    const [, variant, n] = /^gfxinfo-(\w+)-(\d+)\.txt$/.exec(f) ?? [];
    if (!variant || !n) continue;
    const g = gfx(readFileSync(join(out, f), 'utf8'));
    by[variant]?.push(g);
    rows.push(
      `| ${variant === 'golge' ? 'gölge + gradient' : 'düz'} | ${n} | ${g.frames} | ${g.janky}% | ${g.p50} | ${g.p90} | ${g.p95} | ${g.p99} |`,
    );
  }
  const m = (v: string, k: keyof Gfx) => median((by[v] ?? []).map((g) => g[k]));
  const dJank = m('golge', 'janky') - m('duz', 'janky');
  const rP90 = m('golge', 'p90') / m('duz', 'p90');
  const pass = dJank <= 5 && rP90 <= 1.25;
  console.log(
    [
      '### Kaydırma (20 kart, düşük profilli emülatör: 2 çekirdek, 4 GB, yazılım GPU, 360 dp)',
      '',
      '| Liste | Geçiş | Kare | Takılan | p50 ms | p90 ms | p95 ms | p99 ms |',
      '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
      ...rows.sort(),
      '',
      `Medyan: takılan kare farkı ${dJank.toFixed(1)} puan (ölçüt ≤ 5), p90 oranı ${rP90.toFixed(2)} (ölçüt ≤ 1,25): **${pass ? 'GEÇTİ' : 'KALDI'}**`,
    ].join('\n'),
  );
}

if (what === 'narrow') {
  // Every on-screen node inside the screen's width, and every text inside its parent: nothing
  // spills out and nothing is cut at 320 dp and font 1.3.
  const lines: string[] = ['### 320 dp ve yazı %130', ''];
  let spill = 0;
  let cut = 0;
  const dumps = readdirSync(out).filter((f) => /^kartlar-320-130-\d\.xml$/.test(f));
  for (const f of dumps) {
    const xml = readFileSync(join(out, f), 'utf8');
    type Box = [number, number, number, number];
    const stack: (Box | null)[] = [];
    for (const m of xml.matchAll(/<node ([^>]*?)(\/?)>|<\/node>/g)) {
      if (m[0] === '</node>') {
        stack.pop();
        continue;
      }
      const attrs = m[1] ?? '';
      const bm = /bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/.exec(attrs);
      const b: Box | null = bm
        ? [Number(bm[1]), Number(bm[2]), Number(bm[3]), Number(bm[4])]
        : null;
      const cls = /class="([^"]*)"/.exec(attrs)?.[1] ?? '';
      const text = /text="([^"]*)"/.exec(attrs)?.[1] ?? '';
      if (b && (b[0] < 0 || b[2] > 640)) {
        spill += 1;
        lines.push(`- taşma (${f}): ${cls} "${text}" ${JSON.stringify(b)}`);
      }
      const p = stack.at(-1);
      if (text && p && b && (b[0] < p[0] || b[2] > p[2] || b[1] < p[1] || b[3] > p[3])) {
        cut += 1;
        lines.push(`- kesik (${f}): "${text}" ${JSON.stringify(b)} ⊄ ${JSON.stringify(p)}`);
      }
      if (m[2] !== '/') stack.push(b);
    }
  }
  const ok = dumps.length > 0 && spill + cut === 0;
  lines.push(
    '',
    `Ekran dökümü ${dumps.length}, taşan: ${spill}, kesik: ${cut}: **${ok ? 'GEÇTİ' : 'KALDI'}**`,
  );
  console.log(lines.join('\n'));
}
