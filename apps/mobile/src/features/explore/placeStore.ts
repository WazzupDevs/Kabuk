import type { ExplorePlace } from '@shared/explore.ts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

// Keşfet's city and district (docs/SPEC_V4.md K-38): the last choice, in this phone's storage only;
// it never goes to the server.
const KEY = 'skall.explore.place';

type PlaceState = {
  saved: ExplorePlace | null;
  loaded: boolean;
  load: () => void;
  choose: (place: ExplorePlace) => void;
};

function parse(value: string | null): ExplorePlace | null {
  if (!value) return null;
  try {
    const p: unknown = JSON.parse(value);
    if (typeof p !== 'object' || p === null) return null;
    const { city, district } = p as Record<string, unknown>;
    if (typeof city !== 'string') return null;
    return { city, district: typeof district === 'string' ? district : null };
  } catch {
    return null;
  }
}

export const useExplorePlace = create<PlaceState>((set, get) => ({
  saved: null,
  loaded: false,
  load: () => {
    if (get().loaded) return;
    AsyncStorage.getItem(KEY)
      .then((value) => set({ saved: get().saved ?? parse(value), loaded: true }))
      .catch(() => set({ loaded: true }));
  },
  choose: (place) => {
    set({ saved: place, loaded: true });
    void AsyncStorage.setItem(KEY, JSON.stringify(place)).catch(() => undefined);
  },
}));
