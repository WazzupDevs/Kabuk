// Semte Git (docs/SPEC_V4.md §4.V, K-90): a person at home joins their district's chat through the
// day's question (Geçit). The numbers here are the only source: the Edge Functions pass them to SQL.
// Finding the district happens on the server from a coordinate it never keeps (rule 6); the
// boundaries are our own rough drawings (content/districts.json), so a person near a shared border
// chooses between the districts within BORDER_TOLERANCE_M.

export const DISTRICT = {
  // People per room; the count goes to nobody (rule 4).
  roomCapacity: 15,
  // A session's length, and the extra time after it to answer "Devam?".
  sessionMinutes: 120,
  graceMinutes: 10,
  // A person this close to a district's edge may be in it (shared and outer borders alike).
  borderToleranceM: 500,
  // Four options, one try a day.
  options: 4,
} as const;

// The room chat's limits are the venue chat's (§4.V: "mekan sohbetindeki gibi").
export const DISTRICT_CHAT_BROADCAST = 'district_chat';
export const DISTRICT_CHAT_REACTION_BROADCAST = 'district_chat_reaction';

export function districtChatChannel(roomId: string): string {
  return `district_chat:${roomId}`;
}

// Istanbul keeps UTC+3 all year (no daylight saving since 2016).
const ISTANBUL_OFFSET_MS = 3 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

// The Istanbul calendar day of an instant, as YYYY-MM-DD.
export function istanbulDay(now: Date): string {
  return new Date(now.getTime() + ISTANBUL_OFFSET_MS).toISOString().slice(0, 10);
}

// The next 00:00 in Istanbul after an instant: when the question changes and the rooms close.
export function nextIstanbulMidnight(now: Date): Date {
  const shifted = now.getTime() + ISTANBUL_OFFSET_MS;
  return new Date(Math.floor(shifted / DAY_MS) * DAY_MS + DAY_MS - ISTANBUL_OFFSET_MS);
}

// Whole seconds from now until a moment, never below zero (the countdowns).
export function secondsUntil(moment: string | Date, now: Date): number {
  const at = typeof moment === 'string' ? Date.parse(moment) : moment.getTime();
  return Math.max(0, Math.ceil((at - now.getTime()) / 1000));
}

// "sa:dk:sn", two digits each (GecitKapali).
export function clockText(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const two = (n: number): string => String(n).padStart(2, '0');
  return `${two(Math.floor(s / 3600))}:${two(Math.floor((s % 3600) / 60))}:${two(s % 60)}`;
}

// --- Finding the district ------------------------------------------------------------------------

export type LngLat = readonly [number, number];
export type DistrictShape = { ref: string; name: string; ring: readonly LngLat[] };

// Meters on a local flat projection around the point: enough for districts a few kilometres wide.
function project(p: LngLat, origin: LngLat): [number, number] {
  const k = (Math.PI / 180) * 6371000;
  return [(p[0] - origin[0]) * k * Math.cos((origin[1] * Math.PI) / 180), (p[1] - origin[1]) * k];
}

// Ray casting; a ring is closed implicitly (last point back to the first).
export function insideRing(p: LngLat, ring: readonly LngLat[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i] as LngLat;
    const [xj, yj] = ring[j] as LngLat;
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

// Distance in meters from a point to a ring's edge.
export function distanceToRing(p: LngLat, ring: readonly LngLat[]): number {
  let best = Infinity;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [ax, ay] = project(ring[j] as LngLat, p);
    const [bx, by] = project(ring[i] as LngLat, p);
    const dx = bx - ax;
    const dy = by - ay;
    const len = dx * dx + dy * dy;
    const t = len === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len));
    best = Math.min(best, Math.hypot(ax + t * dx, ay + t * dy));
  }
  return best;
}

export type Located =
  { kind: 'found'; ref: string } | { kind: 'choose'; refs: string[] } | { kind: 'outside' };

// The districts a point may be in: those it is inside or within the tolerance of. One is the
// district; more than one the person chooses (in the order of the content file); none is outside.
export function locate(p: LngLat, shapes: readonly DistrictShape[]): Located {
  const refs = shapes
    .filter((s) => insideRing(p, s.ring) || distanceToRing(p, s.ring) <= DISTRICT.borderToleranceM)
    .map((s) => s.ref);
  if (refs.length === 0) return { kind: 'outside' };
  if (refs.length === 1) return { kind: 'found', ref: refs[0] as string };
  return { kind: 'choose', refs };
}

// A ring as the content and the database keep it: at least three [lng, lat] pairs in range.
export function parseRing(value: unknown): LngLat[] | null {
  if (!Array.isArray(value) || value.length < 3) return null;
  const ring: LngLat[] = [];
  for (const pt of value) {
    if (
      !Array.isArray(pt) ||
      pt.length !== 2 ||
      typeof pt[0] !== 'number' ||
      typeof pt[1] !== 'number' ||
      !Number.isFinite(pt[0]) ||
      !Number.isFinite(pt[1]) ||
      Math.abs(pt[0]) > 180 ||
      Math.abs(pt[1]) > 90
    ) {
      return null;
    }
    ring.push([pt[0], pt[1]]);
  }
  return ring;
}

// --- Placing a person in a room (the SQL does the same under the district-day lock) --------------

export type RoomFill = { id: string; people: number; createdAt: string };

// The fullest room with a free seat (the older on a tie); null means a new room.
export function pickRoom(rooms: readonly RoomFill[]): string | null {
  const open = rooms
    .filter((r) => r.people < DISTRICT.roomCapacity)
    .sort((a, b) => b.people - a.people || a.createdAt.localeCompare(b.createdAt));
  return open[0]?.id ?? null;
}
