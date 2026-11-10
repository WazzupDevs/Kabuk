import { create } from 'zustand';

// What this person last saw of a table: Masa bitti shows its name and people after the table
// closes, and after the person leaves it ("Masadan ayrıldın"), when its row can no longer be read
// (docs/SPEC_V4.md §4.E). `profiled` holds the names of the people seen sitting there with their
// profile (Masadakiler), for Masa bitti's avatars and "Anonim katıldı". Memory only.
export type SeenTable = {
  name: string;
  phones: number;
  profiled: readonly string[];
  left: boolean;
};

type TableEndState = {
  tables: Record<string, SeenTable>;
  remember: (roomId: string, name: string, phones: number, profiled: readonly string[]) => void;
  markLeft: (roomId: string) => void;
  forget: (roomId: string) => void;
};

export const useTableEndStore = create<TableEndState>((set) => ({
  tables: {},
  remember: (roomId, name, phones, profiled) =>
    set((s) => {
      const known = s.tables[roomId];
      // Someone who left keeps the name they were seen with.
      const seen = [...new Set([...(known?.profiled ?? []), ...profiled])].sort();
      if (
        known &&
        known.name === name &&
        known.phones === phones &&
        known.profiled.join('\n') === seen.join('\n')
      )
        return s;
      return {
        tables: {
          ...s.tables,
          [roomId]: { name, phones, profiled: seen, left: known?.left ?? false },
        },
      };
    }),
  markLeft: (roomId) =>
    set((s) => {
      const known = s.tables[roomId];
      return known ? { tables: { ...s.tables, [roomId]: { ...known, left: true } } } : s;
    }),
  forget: (roomId) =>
    set((s) => {
      const { [roomId]: _gone, ...rest } = s.tables;
      return { tables: rest };
    }),
}));
