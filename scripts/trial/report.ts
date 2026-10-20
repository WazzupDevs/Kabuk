// TRIAL ONLY (claude/visual-trial): turns the trial's raw outputs into the job summary.
// node --experimental-strip-types scripts/trial/report.ts cizim|narrow <OUT>
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import sharp from 'sharp';

const [what, out] = process.argv.slice(2);
if (!what || !out) throw new Error('usage: report.ts cizim|narrow <OUT>');

type Box = [number, number, number, number];
type Rgb = [number, number, number];

// The bounds of the view with this testID in a uiautomator dump.
function bounds(xml: string, id: string): Box | null {
  const m = new RegExp(
    `resource-id="${id}"[^>]*bounds="\\[(\\d+),(\\d+)\\]\\[(\\d+),(\\d+)\\]"`,
  ).exec(xml);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])] : null;
}

async function screen(file: string): Promise<(x: number, y: number) => Rgb> {
  const { data, info } = await sharp(file)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return (x, y) => {
    const i = (Math.round(y) * info.width + Math.round(x)) * 3;
    return [data[i] ?? 0, data[i + 1] ?? 0, data[i + 2] ?? 0];
  };
}

const dist = (a: Rgb, b: Rgb) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const lum = (c: Rgb) => 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
const hex = (c: Rgb) => `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;

if (what === 'cizim') {
  // Each card photographed drawn (golge) and flat (duz, the same boxes without boxShadow and
  // experimental_backgroundImage): a check passes when the drawn card shows the effect where v46's
  // CSS puts it and the flat one does not. 1 dp = 2 px.
  type Check = {
    name: string;
    kart: string;
    id: string;
    // A number from the drawn and from the flat photo, given the view's bounds.
    measure: (px: (x: number, y: number) => Rgb, b: Box) => { value: number; note: string };
    drawn: (v: number) => boolean;
    flat: (v: number) => boolean;
    rule: string;
  };
  const between =
    (b: Box, a: [number, number], z: [number, number]) => (px: (x: number, y: number) => Rgb) => {
      const p = px(a[0], a[1]);
      const q = px(z[0], z[1]);
      return { value: dist(p, q), note: `${hex(p)} → ${hex(q)}` };
    };
  const checks: Check[] = [
    {
      name: 'Doğrusal gradyan (160deg #FF4F8B → #C51F62)',
      kart: 'sahtekar',
      id: 'deneme-imp',
      measure: (px, b) => between(b, [b[0] + 24, b[1] + 24], [b[2] - 24, b[3] - 24])(px),
      drawn: (v) => v >= 60,
      flat: (v) => v <= 10,
      rule: 'sol üst ile sağ alt arası renk uzaklığı: gölgeli ≥ 60, düz ≤ 10',
    },
    {
      name: 'İnce doğrusal gradyan (172deg #FFFFFF → #F3F0FB)',
      kart: 'tabu',
      id: 'deneme-tk',
      measure: (px, b) => between(b, [b[0] + 7, b[1] + 100], [(b[0] + b[2]) / 2, b[3] - 8])(px),
      drawn: (v) => v >= 8,
      flat: (v) => v <= 3,
      rule: 'üst kenar ile alt orta arası: gölgeli ≥ 8, düz ≤ 3',
    },
    {
      name: 'İç gölge (inset 0 2px 0 rgba(255,255,255,.25))',
      kart: 'sahtekar',
      id: 'deneme-imp',
      measure: (px, b) => {
        const cx = (b[0] + b[2]) / 2;
        const top = px(cx, b[1] + 2);
        const below = px(cx, b[1] + 12);
        return { value: lum(top) - lum(below), note: `${hex(top)} / ${hex(below)}` };
      },
      drawn: (v) => v >= 8,
      flat: (v) => Math.abs(v) <= 3,
      rule: 'üst kenardaki 2 dp ile altının parlaklık farkı: gölgeli ≥ 8, düz ≤ 3',
    },
    {
      name: 'Gölge (0 22px 44px rgba(0,0,0,.35))',
      kart: 'sahtekar',
      id: 'deneme-imp',
      measure: (px, b) => {
        const c = px((b[0] + b[2]) / 2, b[3] + 16);
        return { value: lum(c), note: hex(c) };
      },
      // Compared with each other below: the drawn one darker by at least 6.
      drawn: () => true,
      flat: () => true,
      rule: 'kartın 8 dp altı: gölgelide düzden en az 6 koyu',
    },
    {
      name: 'Radyal gradyan (köşe parıltısı)',
      kart: 'masa',
      id: 'deneme-mine',
      measure: (px, b) => {
        const c = px(b[2] - 70, b[1] + 30);
        return { value: dist(c, [255, 255, 255]), note: hex(c) };
      },
      drawn: (v) => v >= 8,
      flat: (v) => v <= 3,
      rule: 'parıltının ortası beyazdan: gölgeli ≥ 8, düz ≤ 3',
    },
    {
      name: 'Yayılım (0 0 0 3px beyaz halka)',
      kart: 'tabu',
      id: 'deneme-yasak',
      measure: (px, b) => {
        const c = px(b[0] - 3, (b[1] + b[3]) / 2);
        return { value: lum(c), note: hex(c) };
      },
      drawn: (v) => v >= 200,
      flat: (v) => v <= 150,
      rule: 'düğmenin 1,5 dp solu: gölgeli parlaklık ≥ 200, düz ≤ 150 (zemin #6A47F5)',
    },
  ];
  const lines = [
    '### Çizim: RN 0.86 boxShadow (inset, spread) ve experimental_backgroundImage',
    '',
    'Her kart gölgeli ve düz (aynı kutular, gölgesiz ve gradyansız) çekildi; ölçüm ekran ağacındaki sınırlara göre.',
    '',
    '| Denetim | Kart | Gölgeli | Düz | Ölçüt | Sonuç |',
    '| --- | --- | --- | --- | --- | --- |',
  ];
  let all = true;
  for (const c of checks) {
    const got: { value: number; note: string }[] = [];
    for (const variant of ['golge', 'duz']) {
      const base = join(out, `cizim-${c.kart}-${variant}`);
      const b = bounds(readFileSync(`${base}.xml`, 'utf8'), c.id);
      if (!b) throw new Error(`${c.id} not in ${base}.xml`);
      got.push(c.measure(await screen(`${base}.png`), b));
    }
    const [g, d] = got as [{ value: number; note: string }, { value: number; note: string }];
    const ok = c.name.startsWith('Gölge')
      ? d.value - g.value >= 6
      : c.drawn(g.value) && c.flat(d.value);
    all &&= ok;
    lines.push(
      `| ${c.name} | ${c.kart} | ${g.value.toFixed(1)} (${g.note}) | ${d.value.toFixed(1)} (${d.note}) | ${c.rule} | ${ok ? 'GEÇTİ' : 'KALDI'} |`,
    );
  }
  lines.push('', `Çizim: **${all ? 'GEÇTİ' : 'KALDI'}**`);
  console.log(lines.join('\n'));
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
