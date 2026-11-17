import { createContext, useContext } from 'react';

import type { ChatWallKind } from '@/theme/chatWallpaper';

// Which chat a bubble is in (ChatScreen gives it): another's bubbles take the chat's colour (the
// owner's call, 29 Ekim: DM green, Mekan sohbeti green, Masa sohbeti pink).
export const ChatKindContext = createContext<ChatWallKind>('dm');

export function useChatKind(): ChatWallKind {
  return useContext(ChatKindContext);
}

// A chat's wall: its kind's, or the district's own picture (yeni arayüz tuvali, SemtSohbet); the
// semt chat's bubbles, bar and field are the venue chat's.
export type ChatWall = ChatWallKind | 'semt';

export function kindOfWall(wall: ChatWall): ChatWallKind {
  return wall === 'semt' ? 'mekan' : wall;
}
