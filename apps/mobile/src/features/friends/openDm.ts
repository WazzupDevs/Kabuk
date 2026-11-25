import { router } from 'expo-router';

import { showDm } from './DmSurface';
import { useDmSurface } from './dmSurfaceStore';

// From Mesajlar (its rows and its new-message list): on the DM surface over the tabs, opened at
// once (DmSurface.tsx); the route where the surface is not drawn.
export function openDmFromInbox(friend: {
  threadId: string;
  publicId: string;
  name: string | null;
}): void {
  if (!useDmSurface.getState().mounted) {
    openDm(friend);
    return;
  }
  showDm({ threadId: friend.threadId, publicId: friend.publicId, name: friend.name ?? '' });
}

// A DM lives under Mesajlar (docs/SPEC_V3.md §18.3), whichever screen opens it. The friend's photo
// is not in the route (its signed URL expires); the DM reads it from the friend list.
export function openDm(friend: { threadId: string; publicId: string; name: string | null }): void {
  router.navigate({
    pathname: '/messages/[threadId]',
    params: { threadId: friend.threadId, publicId: friend.publicId, name: friend.name ?? '' },
  });
}
