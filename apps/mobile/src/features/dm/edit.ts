import type { DmPageRow } from '@shared/dmInbox.ts';
import { canEditDm, DM_EDIT_WINDOW_MS } from '@shared/dmManage.ts';
import { type InfiniteData, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { friendKeys } from '@/features/friends/queries';
import { tr } from '@/i18n/tr';
import { ApiError, dmApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';

// docs/SPEC_V4.md §4.X: editing one's own DM message. dm_messages_page sends `edited_at` (null
// until the message is edited); the earlier text is never kept or shown, only that it was edited.
export function editedAt(m: DmPageRow): string | null {
  return 'edited_at' in m && typeof m.edited_at === 'string' ? m.edited_at : null;
}

// Whether the own message's edit window is still open: asked when it is drawn and closed by a timer
// when the 15 minutes end, so a bubble that stays on screen loses "Düzenle" in time. The server
// decides with its own clock (edit_expired).
export function useCanEdit(createdAt: string, mine: boolean): boolean {
  const [open, setOpen] = useState(() => mine && canEditDm(createdAt, Date.now()));
  // A message on its way becomes the server's copy in the same bubble (DmBubble): asked again
  // when what it is asked about changes.
  const [askedFor, setAskedFor] = useState(`${createdAt}|${mine}`);
  if (askedFor !== `${createdAt}|${mine}`) {
    setAskedFor(`${createdAt}|${mine}`);
    // Open if it is one's own; the timer below closes it at once if its window has passed.
    setOpen(mine);
  }
  useEffect(() => {
    if (!open) return;
    const left = Date.parse(createdAt) + DM_EDIT_WINDOW_MS - Date.now();
    const timer = setTimeout(() => setOpen(false), Math.max(left, 0));
    return () => clearTimeout(timer);
  }, [createdAt, open]);
  return open;
}

// A message its sender deleted (dm_messages_page `deleted`); an older server sends no field: false.
export function isDeleted(m: DmPageRow): boolean {
  return 'deleted' in m && m.deleted === true;
}

// What the person reads for a refused edit. A code this build does not know (a newer server's) gets
// the general text.
export function editErrorText(err: unknown): string {
  if (err instanceof ApiError) {
    const known = tr.errors as Record<string, string | undefined>;
    return known[err.code] ?? tr.common.genericError;
  }
  return tr.common.genericError;
}

type Pages = InfiniteData<DmPageRow[], string | null>;

// The edit as the server answered it, put into the cached pages (and so the phone's copy, which
// follows the newest page) at once; the other member's phone reads it on the dm_edit broadcast.
export function useEditDm(threadId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    meta: FEEL_ERROR,
    mutationFn: ({ messageId, body }: { messageId: string; body: string }) =>
      dmApi.edit(messageId, body),
    onSuccess: (res, { messageId }) => {
      queryClient.setQueryData<Pages>(friendKeys.dm(threadId), (data) =>
        data
          ? {
              ...data,
              pages: data.pages.map((page) =>
                page.map((m) =>
                  m.id === messageId
                    ? { ...m, body: res.body, edited_at: res.editedAt ?? editedAt(m) }
                    : m,
                ),
              ),
            }
          : data,
      );
      void queryClient.invalidateQueries({ queryKey: friendKeys.inbox });
    },
  });
}

// docs/SPEC_V4.md §4.X: deleting one's own message. The cached pages show it gone at once (empty
// text, no reactions); the other member's phone reads it on the dm_edit broadcast.
export function useDeleteDm(threadId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    meta: FEEL_ERROR,
    mutationFn: (messageId: string) => dmApi.delete(messageId),
    onSuccess: (_res, messageId) => {
      queryClient.setQueryData<Pages>(friendKeys.dm(threadId), (data) =>
        data
          ? {
              ...data,
              pages: data.pages.map((page) =>
                page.map((m) =>
                  m.id === messageId ? { ...m, body: '', deleted: true, reactions: [] } : m,
                ),
              ),
            }
          : data,
      );
      void queryClient.invalidateQueries({ queryKey: friendKeys.inbox });
    },
  });
}
