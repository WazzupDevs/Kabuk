import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

// The merged tables this phone has opened (docs/SPEC_V3.md §23.E, the owner's answer 1): the table
// card says "Kabul edildi, X masasının yanına git" or "Y geliyor, N kişi" until the phone opens the
// merged table once, then "Birleşti". Kept on this device only; the server has no such state.
const KEY = 'kabuk.openedTables';
// A table lives at most a check-in; the last few are enough.
const KEEP = 20;

type OpenedState = {
  ids: readonly string[] | null;
  load: () => void;
  markOpened: (roomId: string) => void;
};

export const useOpenedTables = create<OpenedState>((set, get) => ({
  ids: null,
  load: () => {
    if (get().ids !== null) return;
    AsyncStorage.getItem(KEY)
      // A table opened meanwhile is kept.
      .then((value) => set((s) => ({ ids: [...new Set([...(s.ids ?? []), ...parseIds(value)])] })))
      .catch(() => set((s) => ({ ids: s.ids ?? [] })));
  },
  markOpened: (roomId) => {
    const ids = get().ids;
    if (ids?.includes(roomId)) return;
    const write = (base: readonly string[]) => {
      const next = [...base.filter((id) => id !== roomId), roomId].slice(-KEEP);
      set({ ids: next });
      void AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => undefined);
    };
    // Not read yet: the stored ones first, so none is written over.
    if (ids !== null) {
      write(ids);
      return;
    }
    AsyncStorage.getItem(KEY)
      .then((value) => write(parseIds(value)))
      .catch(() => write([]));
  },
}));

function parseIds(value: string | null): string[] {
  try {
    const parsed: unknown = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}
