import type { ExplorePlace } from '@shared/explore.ts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

// Keşfet's city and district (docs/SPEC_V4.md K-38): the last choice, in this phone's storage only;
// it never goes to the server. Every city (null) is the default and a choice of its own (the
// project owner's call, 5 Kasım). The stored value carries `v: 2`: a choice saved before every city
// became the default is not read back (the key stays the same).
const KEY = 'skall.explore.place';
const VERSION = 2;

type PlaceState = {
  saved: ExplorePlace | null;
  loaded: boolean;
  load: () => void;
  choose: (place: ExplorePlace | null) => void;
};

export function parsePlace(value: string | null): ExplorePlace | null {
  if (!value) return null;
  try {
    const p: unknown = JSON.parse(value);
    if (typeof p !== 'object' || p === null) return null;
    const { v, city, district } = p as Record<string, unknown>;
    if (v !== VERSION || typeof city !== 'string') return null;
    return { city, district: typeof district === 'string' ? district : null };
  } catch {
    return null;
  }
}

export function storedPlace(place: ExplorePlace | null): string {
  return JSON.stringify(place ? { v: VERSION, ...place } : { v: VERSION, city: null });
}

export const useExplorePlace = create<PlaceState>((set, get) => ({
  saved: null,
  loaded: false,
  load: () => {
    if (get().loaded) return;
    AsyncStorage.getItem(KEY)
      .then((value) => set({ saved: get().loaded ? get().saved : parsePlace(value), loaded: true }))
      .catch(() => set({ loaded: true }));
  },
  choose: (place) => {
    set({ saved: place, loaded: true });
    void AsyncStorage.setItem(KEY, storedPlace(place)).catch(() => undefined);
  },
}));
