// content/districts.json (docs/SPEC_V4.md §4.V, K-90) → public.districts. The rings are our own
// rough drawings; the Edge Function finds the district from them (pure/district.ts → locate).
import { parseRing, type DistrictShape } from '../../supabase/functions/_shared/pure/district.ts';
import { sqlLiteral } from './sql.ts';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseDistricts(json: unknown): DistrictShape[] {
  if (!isRecord(json) || !Array.isArray(json.districts) || json.districts.length === 0) {
    throw new Error('districts.json must have a non-empty districts list');
  }
  const seen = new Set<string>();
  return json.districts.map((d: unknown, i: number) => {
    if (!isRecord(d)) throw new Error(`districts[${i}] must be an object`);
    const { ref, name } = d;
    if (typeof ref !== 'string' || !/^[a-z0-9-]{1,40}$/.test(ref)) {
      throw new Error(`districts[${i}].ref must be a lower-case id`);
    }
    if (seen.has(ref)) throw new Error(`districts: ${ref} twice`);
    seen.add(ref);
    if (typeof name !== 'string' || name.trim() === '' || name.length > 60) {
      throw new Error(`districts[${i}].name must be a short non-empty string`);
    }
    const ring = parseRing(d.ring);
    if (!ring) throw new Error(`districts[${i}].ring must be at least three [lng, lat] points`);
    return { ref, name, ring };
  });
}

export function districtsSql(districts: readonly DistrictShape[]): string {
  const rows = districts.map((d, i) =>
    [
      sqlLiteral(d.ref),
      sqlLiteral(d.name),
      `${sqlLiteral(JSON.stringify(d.ring))}::jsonb`,
      sqlLiteral(i),
    ].join(', '),
  );
  return [
    '-- content/districts.json: districts',
    'insert into public.districts (ref, name, ring, sort) values',
    `  (${rows.join('),\n  (')})`,
    'on conflict (ref) do update set',
    '  name = excluded.name, ring = excluded.ring, sort = excluded.sort;',
    '',
  ].join('\n');
}
