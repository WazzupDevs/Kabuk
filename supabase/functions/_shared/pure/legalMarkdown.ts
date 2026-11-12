// The legal texts (docs/legal/*.md) as blocks the app can draw natively (LegalText.tsx). Only the
// markdown those files use: #, ## and ### headings, paragraphs, "- " and "1. " lists, pipe tables,
// **bold** and [links](href). The site renders the same files with `marked` (scripts/site).
export type LegalSpan = { text: string; bold?: true; href?: string };

export type LegalBlock =
  | { type: 'heading'; level: 1 | 2 | 3; spans: LegalSpan[] }
  | { type: 'paragraph'; spans: LegalSpan[] }
  | { type: 'list'; ordered: boolean; items: LegalSpan[][] }
  // `head` is the header row; each row has a cell for each header.
  | { type: 'table'; head: string[]; rows: LegalSpan[][][] };

const INLINE = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)]+)\)/g;

export function parseLegalInline(text: string): LegalSpan[] {
  const spans: LegalSpan[] = [];
  let at = 0;
  for (const match of text.matchAll(INLINE)) {
    if (match.index > at) spans.push({ text: text.slice(at, match.index) });
    const [whole, bold, label, href] = match;
    if (bold !== undefined) spans.push({ text: bold, bold: true });
    else if (label !== undefined && href !== undefined) spans.push({ text: label, href });
    at = match.index + whole.length;
  }
  if (at < text.length) spans.push({ text: text.slice(at) });
  return spans;
}

function plain(spans: LegalSpan[]): string {
  return spans.map((span) => span.text).join('');
}

function cells(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

const BULLET = /^- (.*)$/;
const NUMBERED = /^\d+\. (.*)$/;
const HEADING = /^(#{1,3}) (.*)$/;
const TABLE_RULE = /^\|[\s|:-]+\|$/;

export function parseLegalMarkdown(markdown: string): LegalBlock[] {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const blocks: LegalBlock[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = (lines[i] ?? '').trimEnd();
    if (line.trim() === '') {
      i += 1;
      continue;
    }
    const heading = HEADING.exec(line);
    if (heading) {
      const level = (heading[1] ?? '#').length as 1 | 2 | 3;
      blocks.push({ type: 'heading', level, spans: parseLegalInline(heading[2] ?? '') });
      i += 1;
      continue;
    }
    if (line.startsWith('|')) {
      const table: string[] = [];
      while (i < lines.length && (lines[i] ?? '').trim().startsWith('|')) {
        table.push((lines[i] ?? '').trim());
        i += 1;
      }
      const [first, ...rest] = table;
      const head = cells(first ?? '').map((cell) => plain(parseLegalInline(cell)));
      const rows = rest
        .filter((row) => !TABLE_RULE.test(row))
        .map((row) => cells(row).map((cell) => parseLegalInline(cell)));
      blocks.push({ type: 'table', head, rows });
      continue;
    }
    const ordered = NUMBERED.test(line);
    if (ordered || BULLET.test(line)) {
      const marker = ordered ? NUMBERED : BULLET;
      const items: LegalSpan[][] = [];
      while (i < lines.length) {
        const item = marker.exec((lines[i] ?? '').trimEnd());
        if (!item) break;
        items.push(parseLegalInline(item[1] ?? ''));
        i += 1;
      }
      blocks.push({ type: 'list', ordered, items });
      continue;
    }
    const paragraph: string[] = [];
    while (i < lines.length) {
      const next = (lines[i] ?? '').trimEnd();
      if (
        next.trim() === '' ||
        HEADING.test(next) ||
        next.startsWith('|') ||
        BULLET.test(next) ||
        NUMBERED.test(next)
      ) {
        break;
      }
      paragraph.push(next.trim());
      i += 1;
    }
    blocks.push({ type: 'paragraph', spans: parseLegalInline(paragraph.join(' ')) });
  }
  return blocks;
}
