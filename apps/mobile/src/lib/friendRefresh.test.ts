import { describe, expect, it } from 'vitest';

import { type FriendEvent, friendReads } from './friendRefresh';

const EVENTS: readonly FriendEvent[] = ['request', 'pressed', 'friendship'];

describe('what a friends event reads again (B3)', () => {
  it('no event reads a conversation again', () => {
    for (const e of EVENTS) expect(friendReads(e)).not.toContain('dm');
  });

  it('a request coming in shows on the bell and its badge, and nothing else', () => {
    expect([...friendReads('request')].sort()).toEqual([
      'incoming',
      'incomingChat',
      'notifications',
    ]);
  });

  it('a press reads its record, and a match’s friend in the lists', () => {
    expect(friendReads('pressed')).toEqual(expect.arrayContaining(['history', 'list', 'inbox']));
    expect(friendReads('pressed')).not.toContain('incoming');
  });

  it('a friendship begun or ended reads every list it shows in, the requests and the bell', () => {
    expect([...friendReads('friendship')].sort()).toEqual([
      'history',
      'inbox',
      'incoming',
      'incomingChat',
      'list',
      'notifications',
    ]);
  });
});
