import { createContext, type RefCallback, useContext } from 'react';
import type { View } from 'react-native';

// The newest message's time and ticks (Grup 3, P1c): the down arrow shows only once that line is
// wholly under the message bar, so it never covers them. The stream's newest cell gives its bubble a
// ref callback for the line; the cell measures where the line starts above its own foot. Every other
// cell gives null. Kept apart from the stream's "at the bottom" state, which follows new messages
// and counts the unread ones (the owner's note: that logic is left as it is).
export const ChatMetaContext = createContext<RefCallback<View> | null>(null);

export function useChatMetaRef(): RefCallback<View> | undefined {
  return useContext(ChatMetaContext) ?? undefined;
}
