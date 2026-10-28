import { create } from 'zustand';

// The table chat's newest message the person has seen, by table, while the app runs: Masa's chat
// button counts what came after it from the others (the owner's call, 28 Ekim: the chat on its
// own screen, its unread count on the button).
type Seen = { seen: Record<string, string>; mark: (roomId: string, at: string) => void };

export const useRoomChatSeen = create<Seen>((set) => ({
  seen: {},
  mark: (roomId, at) =>
    set((s) =>
      s.seen[roomId] && s.seen[roomId] >= at ? s : { seen: { ...s.seen, [roomId]: at } },
    ),
}));

export function unreadCount(
  messages: readonly { created_at: string; session_id: string | null }[],
  seenAt: string | undefined,
  me: string | undefined,
): number {
  return messages.filter((m) => m.session_id !== me && (!seenAt || m.created_at > seenAt)).length;
}
