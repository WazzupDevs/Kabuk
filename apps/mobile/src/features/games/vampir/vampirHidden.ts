import { create } from 'zustand';

// The Vampir Köylü page a person sent back to the table ("Masaya dön", a watcher's close): by table,
// the page's key (its mode and game number). A new page (the game starts, a new game opens) has
// another key and shows again; the table offers to look in meanwhile.
type Hidden = {
  hidden: Record<string, string>;
  hide: (roomId: string, key: string) => void;
  show: (roomId: string) => void;
};

export const useVampirHidden = create<Hidden>((set) => ({
  hidden: {},
  hide: (roomId, key) => set((s) => ({ hidden: { ...s.hidden, [roomId]: key } })),
  show: (roomId) =>
    set((s) => {
      const { [roomId]: _, ...rest } = s.hidden;
      return { hidden: rest };
    }),
}));
