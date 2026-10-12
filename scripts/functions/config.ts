// The Edge Functions named in supabase/config.toml: one `[functions.<name>]` block each. The single
// list `pnpm functions:deploy` publishes, so a new function needs only its block (and its folder).

const BLOCK = /^\[functions\.([a-z0-9][a-z0-9_-]*)\]\s*(?:#.*)?$/gm;

export function functionNames(configToml: string): string[] {
  const names = [...configToml.matchAll(BLOCK)].map((m) => m[1] ?? '');
  return [...new Set(names)].sort();
}

// The project `supabase link` stored (supabase/.temp/project-ref); null when none is linked.
export function linkedProjectRef(fileContent: string | null): string | null {
  const ref = fileContent?.trim() ?? '';
  return /^[a-z0-9]{20}$/.test(ref) ? ref : null;
}
