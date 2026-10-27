import type { QueryClient } from '@tanstack/react-query';

// A setting shown as chosen at once (the owner's report, 27 Ekim: Profilli and Anonim flipped back
// and forth): the own profile's cached row takes the change while it is sent, the read after it
// confirms it; a failed send reads the row again.
export function patchProfile(client: QueryClient, patch: Record<string, unknown>): void {
  void client.cancelQueries({ queryKey: ['profile'] });
  client.setQueriesData<Record<string, unknown> | null>(
    { queryKey: ['profile'], predicate: (q) => q.queryKey.length === 2 },
    (old) => (old && typeof old === 'object' ? { ...old, ...patch } : old),
  );
}
