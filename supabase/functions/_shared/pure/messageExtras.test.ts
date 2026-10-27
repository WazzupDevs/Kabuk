import { describe, expect, it } from 'vitest';

import {
  myReaction,
  nextReaction,
  parseDmReactions,
  parseQuote,
  parseReactionCounts,
  withMyReaction,
} from './messageExtras.ts';

describe('parseQuote', () => {
  it('reads a quote, a gone one and no reply', () => {
    expect(parseQuote({ id: 'm1', body: 'selam', from_me: true })).toEqual({
      gone: false,
      id: 'm1',
      body: 'selam',
      fromMe: true,
      name: null,
    });
    expect(parseQuote({ id: 'm1', body: 'selam', from_me: false, name: 'Mor Kedi' })).toEqual({
      gone: false,
      id: 'm1',
      body: 'selam',
      fromMe: false,
      name: 'Mor Kedi',
    });
    expect(parseQuote({ gone: true })).toEqual({ gone: true });
    expect(parseQuote({ body: 'eksik' })).toEqual({ gone: true });
    expect(parseQuote(null)).toBeNull();
  });
});

describe('reaction lists', () => {
  it('counts the DM rows per emoji and keeps the reader’s own', () => {
    expect(
      parseDmReactions([
        { emoji: 'begen', from_me: false },
        { emoji: 'begen', from_me: true },
        { emoji: '💩', from_me: false },
      ]),
    ).toEqual([{ emoji: 'begen', count: 2, mine: true }]);
    expect(parseDmReactions('x')).toEqual([]);
  });

  it('reads counts, with the room’s aliases, and leaves out an emoji outside the set', () => {
    expect(
      parseReactionCounts([
        { emoji: 'kizgin', count: 2, mine: false, aliases: ['Mor Kedi', 'Sarı Ayı'] },
        { emoji: 'begen', count: 1, mine: true },
        { emoji: '💩', count: 3, mine: false },
      ]),
    ).toEqual([
      { emoji: 'kizgin', count: 2, mine: false, aliases: ['Mor Kedi', 'Sarı Ayı'] },
      { emoji: 'begen', count: 1, mine: true },
    ]);
  });
});

describe('a tap on an emoji', () => {
  it('takes the same emoji back and replaces another', () => {
    expect(nextReaction(null, 'begen')).toBe('begen');
    expect(nextReaction('begen', 'begen')).toBeNull();
    expect(nextReaction('begen', 'kizgin')).toBe('kizgin');
  });

  it('moves the reader’s reaction in the list at once', () => {
    const list = [
      { emoji: 'begen' as const, count: 2, mine: true },
      { emoji: 'kizgin' as const, count: 1, mine: false },
    ];
    expect(myReaction(list)).toBe('begen');
    expect(withMyReaction(list, 'kizgin')).toEqual([
      { emoji: 'begen', count: 1, mine: false },
      { emoji: 'kizgin', count: 2, mine: true },
    ]);
    expect(withMyReaction(list, null)).toEqual([
      { emoji: 'begen', count: 1, mine: false },
      { emoji: 'kizgin', count: 1, mine: false },
    ]);
    expect(withMyReaction([], 'kahkaha')).toEqual([{ emoji: 'kahkaha', count: 1, mine: true }]);
    expect(myReaction([])).toBeNull();
  });

  it('moves the reader’s table alias with it in the room chat', () => {
    const list = [{ emoji: 'begen' as const, count: 2, mine: true, aliases: ['Mor Kedi', 'Ben'] }];
    expect(withMyReaction(list, 'kizgin', 'Ben')).toEqual([
      { emoji: 'begen', count: 1, mine: false, aliases: ['Mor Kedi'] },
      { emoji: 'kizgin', count: 1, mine: true, aliases: ['Ben'] },
    ]);
  });
});

// A server from before replies and reactions (docs/SPEC_V3.md §21) sends a page without them; a
// tap on an emoji then crashed the app (myReaction on undefined).
describe('a page without replies and reactions', () => {
  it('reads as no quote and no reactions in the DM and the room chat', () => {
    expect(parseQuote(undefined)).toBeNull();
    expect(parseDmReactions(undefined)).toEqual([]);
    expect(parseReactionCounts(undefined)).toEqual([]);
  });

  it('takes a tap on an emoji over a missing list', () => {
    expect(myReaction(undefined)).toBeNull();
    expect(nextReaction(myReaction(undefined), 'begen')).toBe('begen');
    expect(withMyReaction(undefined, 'begen')).toEqual([{ emoji: 'begen', count: 1, mine: true }]);
    expect(withMyReaction(undefined, null)).toEqual([]);
  });
});
