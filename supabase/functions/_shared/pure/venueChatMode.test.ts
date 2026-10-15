import { describe, expect, it } from 'vitest';

import { venueChatMode } from './venueChat.ts';

// docs/SPEC_V3.md §22.G: the mode venue-chat/page returns, from table_sessions.venue_chat_profiled.
describe('venueChatMode', () => {
  it('reads the choice made with the first message', () => {
    expect(venueChatMode(true)).toBe('profiled');
    expect(venueChatMode(false)).toBe('anonymous');
  });

  it('is null before the first message and from a server before the choice existed', () => {
    expect(venueChatMode(null)).toBeNull();
    expect(venueChatMode(undefined)).toBeNull();
  });
});
