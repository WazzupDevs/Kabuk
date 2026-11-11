// Pure helpers of the workshop (UI Workshop in the design preview): no React, so vitest can read them.
export type DraftStatus = 'draft' | 'approved' | 'rejected';

type DraftShape = { key: string; variants: { key: string }[] };

// The variant shown next to the selected one: the next in the list, wrapping around. Null when
// there is nothing to compare (a single variant, or an unknown key).
export function nextVariantKey(variants: { key: string }[], selected: string): string | null {
  if (variants.length < 2) return null;
  const at = variants.findIndex((v) => v.key === selected);
  if (at < 0) return null;
  return variants[(at + 1) % variants.length]?.key ?? null;
}

// The selected key if it exists, else the first variant (a draft switch keeps the screen valid).
export function resolveVariantKey(variants: { key: string }[], selected: string): string {
  return variants.some((v) => v.key === selected) ? selected : (variants[0]?.key ?? '');
}

// Problems of a registry: duplicate draft or variant keys, a draft without variants.
export function validateDrafts(drafts: DraftShape[]): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const d of drafts) {
    if (seen.has(d.key)) problems.push(`duplicate draft key: ${d.key}`);
    seen.add(d.key);
    if (d.variants.length === 0) problems.push(`no variants: ${d.key}`);
    const vSeen = new Set<string>();
    for (const v of d.variants) {
      if (vSeen.has(v.key)) problems.push(`duplicate variant key: ${d.key}/${v.key}`);
      vSeen.add(v.key);
    }
  }
  return problems;
}
