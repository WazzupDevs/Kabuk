// A boxShadow string's outer shadows ("0px 18px 44px rgba(54, 36, 140, 0.10), 0px 2px 6px …") as
// numbers, for the native shadow (components/NativeShadow.tsx). Null when it holds anything the native
// shadow does not draw (an inset shadow, a unit other than px), so the caller keeps boxShadow.
export type ShadowSpec = { x: number; y: number; blur: number; spread: number; color: string };

// A boxShadow list split at its top-level commas.
function shadowItems(css: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < css.length; i++) {
    const ch = css[i];
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    else if (ch === ',' && depth === 0) {
      parts.push(css.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(css.slice(start));
  return parts.map((p) => p.trim()).filter((p) => p.length > 0);
}

// A boxShadow string in its outer shadows and its inset ones, each kept in order (the native
// shadow draws the outer ones, boxShadow keeps the inset light edges).
export function splitShadows(css: string | null | undefined): {
  outer: string | undefined;
  inset: string | undefined;
} {
  const items = css ? shadowItems(css) : [];
  const outer = items.filter((p) => !/\binset\b/.test(p));
  const inset = items.filter((p) => /\binset\b/.test(p));
  return {
    outer: outer.length > 0 ? outer.join(', ') : undefined,
    inset: inset.length > 0 ? inset.join(', ') : undefined,
  };
}

export function parseShadows(css: string): ShadowSpec[] | null {
  const parts = shadowItems(css);
  const out: ShadowSpec[] = [];
  for (const raw of parts) {
    const part = raw.trim();
    if (!part) continue;
    if (/\binset\b/.test(part)) return null;
    const color = part.match(/(rgba?\([^)]*\)|#[0-9a-fA-F]{3,8}|\b[a-z]+\b)\s*$/);
    if (!color || color.index === undefined) return null;
    const lengths = part.slice(0, color.index).trim().split(/\s+/);
    if (lengths.length < 2 || lengths.length > 4) return null;
    const nums: number[] = [];
    for (const l of lengths) {
      const m = l.match(/^(-?\d*\.?\d+)(px)?$/);
      if (!m) return null;
      nums.push(Number(m[1]));
    }
    out.push({
      x: nums[0] ?? 0,
      y: nums[1] ?? 0,
      blur: nums[2] ?? 0,
      spread: nums[3] ?? 0,
      color: color[1] ?? '',
    });
  }
  return out;
}
