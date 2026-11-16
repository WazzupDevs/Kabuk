import type { DmInboxThread } from '@shared/api/friends.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useSessionStore } from '@/features/auth/session';
import { dropDmCache } from '@/features/friends/dmCache';
import { friendKeys, readDmPage } from '@/features/friends/queries';
import { dmApi } from '@/lib/api';
import { type DmManageKind, newestSeen, withManaged } from '@/lib/dmManage';
import { FEEL_ERROR } from '@/lib/hapticMoments';

export type DmManage = { kind: DmManageKind; threadId: string; lastMessageAt: string | null };

// Sabitle, Arşivle and Sohbeti sil from Mesajlar (docs/SPEC_V4.md §4.X): the dm function only; the
// cached inbox takes the change at once and is read again for the server's order. Clearing sends
// the newest message the list showed (upTo), and the conversation's copies in memory and on the
// phone go: its messages were hidden from the caller, not deleted, and are read again if it opens.
export function useDmManage() {
  const queryClient = useQueryClient();
  const userId = useSessionStore((s) => s.session?.user.id);
  return useMutation({
    meta: FEEL_ERROR,
    mutationFn: async ({ kind, threadId, lastMessageAt }: DmManage) => {
      switch (kind) {
        case 'pin':
          return dmApi.pin(threadId);
        case 'unpin':
          return dmApi.unpin(threadId);
        case 'archive':
          return dmApi.archive(threadId);
        case 'unarchive':
          return dmApi.unarchive(threadId);
        case 'clear': {
          const upTo =
            lastMessageAt === null
              ? null
              : newestSeen(await readDmPage(threadId, null), lastMessageAt);
          return dmApi.clear(threadId, upTo);
        }
      }
    },
    onSuccess: async (_data, { kind, threadId }) => {
      queryClient.setQueryData<DmInboxThread[]>(friendKeys.inbox, (threads) =>
        threads ? withManaged(threads, threadId, kind) : threads,
      );
      if (kind === 'clear') {
        queryClient.removeQueries({ queryKey: friendKeys.dm(threadId) });
        if (userId) await dropDmCache(userId, threadId);
      }
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: friendKeys.inbox }),
  });
}
