import type { SahtekarView } from '@shared/sahtekarGame.ts';
import { describe, expect, it } from 'vitest';

import {
  krotGuessLine,
  krotRoleShown,
  krotViewKey,
  krotViewsOf,
  krotVisibleView,
} from './krotView';

const state = { seats: ['a', 'b', 'c'], gone: [] as string[] };
const player = { role: 'player', category: 'İçecek', word: 'Kahve' } as const;
const impostor = { role: 'impostor', category: 'İçecek' } as const;
const watcher: SahtekarView = {
  role: 'watcher',
  category: 'İçecek',
  word: 'Kahve',
  impostorSeats: ['b'],
};

describe('krotVisibleView (rule 3)', () => {
  it('draws the phone own role while it plays', () => {
    expect(krotVisibleView(player, state, 'a')).toEqual(player);
    expect(krotVisibleView(impostor, state, 'b')).toEqual(impostor);
  });

  it('hides a cached word or role once the person left the game', () => {
    const left = { ...state, gone: ['a'] };
    expect(krotVisibleView(player, left, 'a')).toEqual({ role: null });
    expect(krotVisibleView(impostor, { ...state, gone: ['b'] }, 'b')).toEqual({ role: null });
    // Before the answer comes, too.
    expect(krotVisibleView(undefined, left, 'a')).toEqual({ role: null });
  });

  it('never shows a player answer to a session outside the seats (back with a new check-in)', () => {
    expect(krotVisibleView(player, state, 'z')).toEqual({ role: null });
    expect(krotVisibleView(impostor, state, 'z')).toEqual({ role: null });
  });

  it('keeps the watcher word and impostors, but not for a seat', () => {
    expect(krotVisibleView(watcher, state, 'w')).toEqual(watcher);
    expect(krotVisibleView(watcher, state, 'a')).toEqual({ role: null });
  });

  it('waits while the answer is on its way', () => {
    expect(krotVisibleView(undefined, state, 'a')).toBeUndefined();
  });
});

describe('krotRoleShown (Hazırım)', () => {
  it('counts only a face with a role', () => {
    expect(krotRoleShown(undefined)).toBe(false);
    expect(krotRoleShown({ role: null })).toBe(false);
    expect(krotRoleShown(player)).toBe(true);
    expect(krotRoleShown(impostor)).toBe(true);
    expect(krotRoleShown(watcher)).toBe(true);
  });
});

describe('krotViewKey', () => {
  it('belongs to one table session, under the table key that a leave drops', () => {
    expect(krotViewKey('r', 2, 'a')).not.toEqual(krotViewKey('r', 2, 'z'));
    expect(krotViewKey('r', 2, 'a').slice(0, 2)).toEqual([...krotViewsOf('r')]);
  });
});

describe('krotGuessLine (Oyun sonu)', () => {
  it('says whether the guess was right, never the guess', () => {
    expect(krotGuessLine(true)).toBe('guessedRight');
    expect(krotGuessLine(false)).toBe('guessedWrong');
  });

  it('draws no line when nobody was caught or no guess came', () => {
    expect(krotGuessLine(null)).toBeNull();
  });
});
