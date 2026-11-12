// The run's screenshots laid out for the design canvas (docs/decisions/tuval-goruntuleri.md): the
// tuval-goruntu job of .github/workflows/e2e.yml downloads this run's e2e-run-* artifacts and this
// file copies every screenshot into <out>/light, dark, large (the shards' takeScreenshot names) and
// <out>/visual (the visual gate's candidates), with a manifest.json beside them. The job then
// writes <out> as the only commit of the tuval-goruntuleri branch.
//   node --experimental-strip-types scripts/e2e/tuval-images.ts <repo> <artifacts> <out>
// Env: GITHUB_SHA, GITHUB_SERVER_URL, GITHUB_REPOSITORY, GITHUB_RUN_ID.
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { basename, join, relative, sep } from 'node:path';

export type Theme = 'light' | 'dark' | 'large' | 'visual';

// What an artifact is: e2e-run-light-1 … dark-4, large-1 … large-4 (a shard), e2e-run-visual.
export function artifactOf(name: string): { theme: Theme; shard: number | null } | null {
  const shard = /^e2e-run-(light|dark|large)-([1-4])$/.exec(name);
  if (shard) return { theme: shard[1] as Theme, shard: Number(shard[2]) };
  return name === 'e2e-run-visual' ? { theme: 'visual', shard: null } : null;
}

// A shard's screenshots are the PNGs under its screenshots/ folder, wherever Maestro puts them
// there; the first attempt's (attempt-1/, kept when the shard ran again) lie outside it and are
// not taken. The visual gate's are its candidates, aday/ (not aday2/, the second shot of each).
export function isShot(theme: Theme, path: string): boolean {
  const parts = path.split('/');
  if (!path.endsWith('.png') || parts.includes('attempt-1')) return false;
  // Maestro's own picture of a failed step (step-<n>-<command>.png) is not a takeScreenshot.
  if (/^step-\d+-/.test(parts[parts.length - 1] ?? '')) return false;
  return theme === 'visual'
    ? parts.length === 2 && parts[0] === 'aday'
    : parts[0] === 'screenshots';
}

// Whether the artifact's run passed: a shard by Maestro's JUnit report (no failure, no error), the
// visual gate by its own report. Null when the report is not there (the job died before it).
export function passedOf(theme: Theme, report: string | null): boolean | null {
  if (report === null) return null;
  if (theme !== 'visual') return /<testcase\b/.test(report) && !/<(failure|error)\b/.test(report);
  try {
    return (JSON.parse(report) as { ok?: unknown }).ok === true;
  } catch {
    return null;
  }
}

export type Shot = {
  name: string;
  theme: Theme;
  file: string;
  flow: string | null;
  shard: number | null;
  passed: boolean | null;
};
export type Found = { artifact: string; path: string; passed: boolean | null };

// One file a name and theme: every shard opens with the same setup flows, so the same name comes
// from several shards; the lowest shard's is kept. `flowOf`: the flow file that takes a shot.
export function planShots(
  found: readonly Found[],
  flowOf: (name: string) => string | null,
): (Shot & { from: Found })[] {
  const kept = new Map<string, Shot & { from: Found }>();
  const ordered = [...found].sort(
    (a, b) => a.artifact.localeCompare(b.artifact) || a.path.localeCompare(b.path),
  );
  for (const f of ordered) {
    const a = artifactOf(f.artifact);
    if (!a || !isShot(a.theme, f.path)) continue;
    const name = basename(f.path, '.png');
    const file = `${a.theme}/${name}.png`;
    if (kept.has(file)) continue;
    kept.set(file, {
      name,
      theme: a.theme,
      file,
      flow: a.theme === 'visual' ? null : flowOf(name),
      shard: a.shard,
      passed: f.passed,
      from: f,
    });
  }
  return [...kept.values()].sort((a, b) => a.file.localeCompare(b.file));
}

// A shot as the manifest lists it: without where it was copied from.
export function listed(shot: Shot & { from: Found }): Shot {
  const { name, theme, file, flow, shard, passed } = shot;
  return { name, theme, file, flow, shard, passed };
}

// The flow files' takeScreenshot names: name → file, relative to the repository.
export function shotFlows(files: readonly { path: string; text: string }[]): Map<string, string> {
  const flows = new Map<string, string>();
  for (const f of [...files].sort((a, b) => a.path.localeCompare(b.path))) {
    for (const m of f.text.matchAll(/^\s*- takeScreenshot:\s*(\S+)\s*$/gm)) {
      const name = m[1];
      if (name !== undefined && !flows.has(name)) flows.set(name, f.path);
    }
  }
  return flows;
}

function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
  );
}

const read = (path: string): string | null =>
  existsSync(path) ? readFileSync(path, 'utf8') : null;

function main(repo: string, artifacts: string, out: string): void {
  const flowDir = join(repo, 'e2e/maestro');
  const flows = shotFlows(
    walk(flowDir)
      .filter((p) => p.endsWith('.yaml'))
      .map((p) => ({
        path: relative(repo, p).split(sep).join('/'),
        text: readFileSync(p, 'utf8'),
      })),
  );
  const found: Found[] = [];
  for (const dir of existsSync(artifacts) ? readdirSync(artifacts) : []) {
    const a = artifactOf(dir);
    if (!a) continue;
    const root = join(artifacts, dir);
    const passed = passedOf(
      a.theme,
      read(join(root, a.theme === 'visual' ? 'kapi.json' : 'report.xml')),
    );
    for (const p of walk(root)) {
      found.push({ artifact: dir, path: relative(root, p).split(sep).join('/'), passed });
    }
  }
  const shots = planShots(found, (name) => flows.get(name) ?? null);
  for (const s of shots) {
    mkdirSync(join(out, s.theme), { recursive: true });
    copyFileSync(join(artifacts, s.from.artifact, s.from.path), join(out, s.file));
  }
  const env = process.env;
  const manifest = {
    sha: env.GITHUB_SHA ?? null,
    run:
      env.GITHUB_RUN_ID !== undefined
        ? `${env.GITHUB_SERVER_URL}/${env.GITHUB_REPOSITORY}/actions/runs/${env.GITHUB_RUN_ID}`
        : null,
    date: new Date().toISOString(),
    // `passed` is the result of the whole shard (or of the visual gate), not of the shot's flow.
    images: shots.map(listed),
  };
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, 'manifest.json'), `${JSON.stringify(manifest, null, 1)}\n`);
  console.log(`images: ${shots.length}`);
}

if (process.argv[1] !== undefined && basename(process.argv[1]) === 'tuval-images.ts') {
  const [repo, artifacts, out] = process.argv.slice(2);
  if (repo === undefined || artifacts === undefined || out === undefined) {
    console.error('usage: tuval-images.ts <repo> <artifacts> <out>');
    process.exit(2);
  }
  main(repo, artifacts, out);
}
