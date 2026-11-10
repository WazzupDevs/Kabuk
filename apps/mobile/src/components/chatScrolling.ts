import { createContext, useContext } from 'react';

// The stream is being scrolled (ChatList gives it): true from a drag or a fling's start to a moment
// after it ends. What moves in a bubble (a set balloon's ornaments) stands still meanwhile.
export const ChatScrollingContext = createContext(false);

export function useChatScrolling(): boolean {
  return useContext(ChatScrollingContext);
}

// The rows whose face moves (ChatList gives it, lib/faceMovers.ts); a face outside it is drawn still.
export const ChatMoversContext = createContext<ReadonlySet<string>>(new Set());

export function useChatMovers(): ReadonlySet<string> {
  return useContext(ChatMoversContext);
}
