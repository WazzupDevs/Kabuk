import { createContext, useContext } from 'react';

import type { ChatWallKind } from '@/theme/chatWallpaper';

// Which chat a bubble is in (ChatScreen gives it): another's bubbles take the chat's colour (the
// owner's call, 29 Ekim: DM blue, Mekan sohbeti green, Masa sohbeti purple).
export const ChatKindContext = createContext<ChatWallKind>('dm');

export function useChatKind(): ChatWallKind {
  return useContext(ChatKindContext);
}
