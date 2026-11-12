// The part of the day in Istanbul (UTC+3 all year since 2016), for Keşfet's question (the owner's
// call, 30 Ekim: "Bu akşam" showed in the morning too): 05:00 to 12:00 morning, 12:00 to 17:00 the
// day, 17:00 to 05:00 the evening (the night counts as the evening).
export type DayPart = 'morning' | 'day' | 'evening';

const ISTANBUL_OFFSET_HOURS = 3;

// Keşfet's line of the day over its question (iskelet.md → 5.1: "PERŞEMBE AKŞAMI"), from the
// phone's own clock: the weekday (0 Sunday) and the part of the day with the same hours. Before
// 05:00 it is still the evening before (Thursday 01:00 is "Çarşamba akşamı").
export function dayLine(now: Date): { weekday: number; part: DayPart } {
  const hour = now.getHours();
  if (hour < 5) return { weekday: (now.getDay() + 6) % 7, part: 'evening' };
  return { weekday: now.getDay(), part: hour < 12 ? 'morning' : hour < 17 ? 'day' : 'evening' };
}

export function dayPart(now: number): DayPart {
  const hour = (new Date(now).getUTCHours() + ISTANBUL_OFFSET_HOURS) % 24;
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'day';
  return 'evening';
}
