import { useProfile } from '@/features/account/useProfile';

import { useProfileView } from './queries';

// The viewer's own capsule look (docs/SPEC_V4.md §4.D): their anonymous face, read from their own
// profile view; null until it loads.
export function useOwnLook(): string | null {
  const own = useProfile();
  return useProfileView(own.data?.public_id).data?.capsuleLook ?? null;
}
