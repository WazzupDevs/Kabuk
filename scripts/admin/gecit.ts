// Geçit questions (docs/SPEC_V4.md §4.V): the file the owner keeps outside this repo, checked before
// anything is written. Real questions never enter the repo; the tests use made-up ones.
export type GecitRow = { day: string; prompt: string; options: string[]; answer: number };

export type GecitParse = { ok: true; rows: GecitRow[] } | { ok: false; problems: string[] };

const DAY = /^\d{4}-\d{2}-\d{2}$/;

// [{ "day": "2026-11-09", "prompt": "…", "options": ["…", "…", "…", "…"], "answer": 0..3 }, …]
export function parseGecitFile(text: string): GecitParse {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, problems: ['not JSON'] };
  }
  if (!Array.isArray(json) || json.length === 0) {
    return { ok: false, problems: ['must be a non-empty list'] };
  }
  const problems: string[] = [];
  const rows: GecitRow[] = [];
  const days = new Set<string>();
  json.forEach((item: unknown, i) => {
    const r = item as Partial<GecitRow> | null;
    const at = `#${i + 1}`;
    if (typeof r !== 'object' || r === null) return void problems.push(`${at}: not an object`);
    if (typeof r.day !== 'string' || !DAY.test(r.day) || Number.isNaN(Date.parse(r.day))) {
      return void problems.push(`${at}: day must be YYYY-MM-DD`);
    }
    if (days.has(r.day)) return void problems.push(`${at}: day ${r.day} twice`);
    days.add(r.day);
    if (typeof r.prompt !== 'string' || r.prompt.trim().length < 1 || r.prompt.length > 300) {
      return void problems.push(`${at}: prompt must be 1 to 300 characters`);
    }
    if (
      !Array.isArray(r.options) ||
      r.options.length !== 4 ||
      !r.options.every((o) => typeof o === 'string' && o.trim().length > 0 && o.length <= 80)
    ) {
      return void problems.push(`${at}: options must be four short texts`);
    }
    if (
      typeof r.answer !== 'number' ||
      !Number.isInteger(r.answer) ||
      r.answer < 0 ||
      r.answer > 3
    ) {
      return void problems.push(`${at}: answer must be 0, 1, 2 or 3`);
    }
    rows.push({
      day: r.day,
      prompt: r.prompt.trim(),
      options: r.options.map((o) => o.trim()),
      answer: r.answer,
    });
  });
  return problems.length ? { ok: false, problems } : { ok: true, rows };
}
