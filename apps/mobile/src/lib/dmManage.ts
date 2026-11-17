import { archivedUnread, DM_PIN_MAX } from '@shared/dmManage.ts';

// Mesajlar's pin, archive and clear on the phone (docs/SPEC_V4.md §4.X). The server keeps them and
// orders the inbox (the pinned first, the last pinned on top); these only read its answer, and put
// what a press changed into the cached inbox until it is read again.

export type DmManageKind = 'pin' | 'unpin' | 'archive' | 'unarchive' | 'clear';

type Row = { threadId: string | null; pinned: boolean; archived: boolean; unreadCount: number };

// The inbox split for Mesajlar: the conversations out of the archive (in the server's order), the
// archived ones (Arşivlenenler) and their unread together (its row's badge).
export function splitInbox<T extends Row>(
  threads: readonly T[],
): { chats: T[]; archived: T[]; archivedUnread: number } {
  return {
    chats: threads.filter((t) => !t.archived),
    archived: threads.filter((t) => t.archived),
    archivedUnread: archivedUnread(threads),
  };
}

// The Mesajlar tab's (and the launcher's) badge: the unread of the conversations out of the
// archive only; an archived conversation's unread shows on Arşivlenenler alone (the owner's call,
// 17 Kasım).
export function tabUnread(threads: readonly { archived: boolean; unreadCount: number }[]): number {
  return threads.reduce((sum, t) => sum + (t.archived ? 0 : Math.max(0, t.unreadCount)), 0);
}

// Five pinned already: "Sabitle" is off (pin_limit).
export function pinsFull(threads: readonly Row[]): boolean {
  return threads.filter((t) => t.pinned).length >= DM_PIN_MAX;
}

// The cached inbox after a press answered, before the server's is read: archive takes the pin off,
// clear takes the conversation out (until a newer message). A pin's place is the server's: it is
// marked here and the inbox read again puts it in order.
export function withManaged<T extends Row>(
  threads: readonly T[],
  threadId: string,
  kind: DmManageKind,
): T[] {
  if (kind === 'clear') return threads.filter((t) => t.threadId !== threadId);
  return threads.map((t) => {
    if (t.threadId !== threadId) return t;
    switch (kind) {
      case 'pin':
        return { ...t, pinned: true };
      case 'unpin':
        return { ...t, pinned: false };
      case 'archive':
        return { ...t, pinned: false, archived: true };
      case 'unarchive':
        return { ...t, archived: false };
    }
  });
}

// The newest message the list showed (dm/clear's upTo): of the conversation's newest page (newest
// first), the first not after the inbox's last message. A message that came after the list was
// drawn stays visible; none shown, null (the server clears nothing more than there was).
export function newestSeen(
  page: readonly { id: string; created_at: string }[],
  lastMessageAt: string | null,
): string | null {
  if (lastMessageAt === null) return null;
  const shown = Date.parse(lastMessageAt);
  if (Number.isNaN(shown)) return null;
  return page.find((m) => Date.parse(m.created_at) <= shown)?.id ?? null;
}
