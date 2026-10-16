import type { Side } from '@shared/teams.ts';
import { useQueries } from '@tanstack/react-query';
import { useEffect } from 'react';
import { create } from 'zustand';

import { profileViewQuery } from '@/features/profile/queries';

import type { RoomPhone } from './queries';

// A phone of the other side as this phone saw it at the table: its alias, and while the table ran
// its profile if it joined with one (rule 4). The table's end is built from this; the server sends
// no profile after the close (docs/SPEC_V3.md §23.G, the owner's answer 4).
export type EndPerson = {
  sessionId: string;
  alias: string;
  name: string | null;
  age: number | null;
  photoUrl: string | null;
};

type SeenTable = {
  // The other side's leader when the table was last seen: "X masasıyla oynadınız."
  otherAlias: string;
  // Every phone of the other side seen at the table, also the ones that left before the end.
  people: EndPerson[];
  // This phone left on its own (Masadan çık, a block): its end shows only with a record.
  left: boolean;
};

type TableEndState = {
  tables: Record<string, SeenTable>;
  remember: (roomId: string, otherAlias: string, people: EndPerson[]) => void;
  markLeft: (roomId: string) => void;
  forget: (roomId: string) => void;
};

// Phone memory only, for this run of the app.
export const useTableEndStore = create<TableEndState>((set) => ({
  tables: {},
  remember: (roomId, otherAlias, people) =>
    set((s) => {
      const before = s.tables[roomId];
      const merged = new Map((before?.people ?? []).map((p) => [p.sessionId, p]));
      for (const p of people) {
        const old = merged.get(p.sessionId);
        // A profile read once is kept: the profile query of a phone that left is gone.
        merged.set(p.sessionId, old && p.name === null ? { ...p, ...pickProfile(old) } : p);
      }
      const next = [...merged.values()];
      if (before && before.otherAlias === otherAlias && same(before.people, next)) return s;
      return {
        tables: {
          ...s.tables,
          [roomId]: { otherAlias, people: next, left: before?.left ?? false },
        },
      };
    }),
  markLeft: (roomId) =>
    set((s) => {
      const before = s.tables[roomId];
      return before ? { tables: { ...s.tables, [roomId]: { ...before, left: true } } } : s;
    }),
  forget: (roomId) =>
    set((s) => {
      const { [roomId]: _gone, ...rest } = s.tables;
      return { tables: rest };
    }),
}));

function pickProfile(p: EndPerson) {
  return { name: p.name, age: p.age, photoUrl: p.photoUrl };
}

function same(a: readonly EndPerson[], b: readonly EndPerson[]): boolean {
  return (
    a.length === b.length &&
    a.every((p, i) => {
      const q = b[i];
      return (
        !!q &&
        p.sessionId === q.sessionId &&
        p.alias === q.alias &&
        p.name === q.name &&
        p.age === q.age &&
        p.photoUrl === q.photoUrl
      );
    })
  );
}

// While the table runs, what this phone sees of the other side goes into the table's memory.
export function useRememberTable(
  roomId: string,
  otherAlias: string | null,
  phones: readonly RoomPhone[] | undefined,
  side: Side | undefined,
  profiles: ReadonlyMap<string, string> | undefined,
) {
  const remember = useTableEndStore((s) => s.remember);
  const others = (phones ?? []).filter((p) => side !== undefined && p.side !== side);
  const views = useQueries({
    queries: others.map((p) =>
      profileViewQuery(p.profiled ? (profiles?.get(p.sessionId) ?? null) : null),
    ),
  });
  const people: EndPerson[] = others.map((p, i) => {
    const view = views[i]?.data;
    return {
      sessionId: p.sessionId,
      alias: p.alias,
      name: view?.displayName ?? null,
      age: view?.age ?? null,
      photoUrl: view && !view.photoHidden ? view.photoUrl : null,
    };
  });
  // `people` is new on every render; remember() leaves the store as it is when nothing changed.
  useEffect(() => {
    if (otherAlias && people.length > 0) remember(roomId, otherAlias, people);
  }, [roomId, otherAlias, people, remember]);
}
