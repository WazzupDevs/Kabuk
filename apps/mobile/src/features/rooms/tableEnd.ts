import { create } from 'zustand';

// What this person last saw of a table: Masa bitti shows its name and people after the table
// closes, and after the person leaves it ("Masadan ayrıldın"), when its row can no longer be read
// (docs/SPEC_V4.md §4.E). Memory only.
export type SeenTable = { name: string; phones: number; left: boolean };

type TableEndState = {
  tables: Record<string, SeenTable>;
  remember: (roomId: string, name: string, phones: number) => void;
  markLeft: (roomId: string) => void;
  forget: (roomId: string) => void;
};

export const useTableEndStore = create<TableEndState>((set) => ({
  tables: {},
  remember: (roomId, name, phones) =>
    set((s) => {
      const known = s.tables[roomId];
      if (known && known.name === name && known.phones === phones) return s;
      return { tables: { ...s.tables, [roomId]: { name, phones, left: known?.left ?? false } } };
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
