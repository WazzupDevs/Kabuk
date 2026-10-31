// What the table screen shows (app/(app)/room/[id].tsx). A first read that failed is an error with
// "Tekrar dene", never Masa bitti or Mekan: the table may well still be going on (a dropped
// connection must not send the person out of it).
export type TableScreenView = 'loading' | 'error' | 'end' | 'venue' | 'table';

export type TableScreenInput = {
  roomPending: boolean;
  roomError: boolean;
  roomFetching: boolean;
  hasRoom: boolean;
  closed: boolean;
  checkInPending: boolean;
  checkInError: boolean;
  hasCheckIn: boolean;
  movedTo: boolean;
  peopleRead: boolean;
  seated: boolean;
  seen: boolean;
};

export function tableScreenView(s: TableScreenInput): TableScreenView {
  if (s.roomPending || s.checkInPending || s.movedTo) return 'loading';
  if ((s.roomError && !s.hasRoom) || (s.checkInError && !s.hasCheckIn)) return 'error';
  if (s.hasCheckIn && s.hasRoom && !s.closed && !(s.peopleRead && !s.seated)) return 'table';
  if (s.seen) return 'end';
  if (!s.hasRoom && s.roomFetching) return 'loading';
  return 'venue';
}
