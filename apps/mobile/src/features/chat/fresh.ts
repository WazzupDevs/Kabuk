import { useEffect, useState } from 'react';
import { create } from 'zustand';

// The newest message each chat showed, while the app runs: the next visit marks the first message
// after it "Yeni mesajlar" (skall tuvali: `.day.new`).
const useSeen = create<{ at: Record<string, string> }>(() => ({ at: {} }));

type Item = { id: string; createdAt: string; fromMe: boolean };

// The id of the first message from someone else that came after the last visit, or null (the first
// visit since the app opened, or nothing new).
export function useFreshLine(chat: string | undefined, messages: readonly Item[] | undefined) {
  // The last visit's newest, read once when the chat is known (derived state: set while rendering).
  const [since, setSince] = useState<{ chat?: string; at?: string }>({});
  if (chat && since.chat !== chat) setSince({ chat, at: useSeen.getState().at[chat] });
  const newest = messages?.[messages.length - 1]?.createdAt;
  useEffect(() => {
    if (chat && newest) useSeen.setState((s) => ({ at: { ...s.at, [chat]: newest } }));
  }, [chat, newest]);
  if (!since.at || !messages) return null;
  const at = since.at;
  return messages.find((m) => !m.fromMe && m.createdAt > at)?.id ?? null;
}
