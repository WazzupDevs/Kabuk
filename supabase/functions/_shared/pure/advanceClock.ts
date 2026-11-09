// When a game phase's time is up any phone moves it on (`<game>/advance`, idempotent). Every phone
// at the table would ask in the same instant and then again in step; each waits a little more at
// random, so the first ask usually moves the phase and the others never go (the new step stops
// them). The phase still moves within about a second of its time.
export const ADVANCE_SPREAD_MS = 800;
export const ADVANCE_AGAIN_MS = 2500;
export const ADVANCE_AGAIN_SPREAD_MS = 1000;

// The wait before the first ask: until the phase's end, then a spread at random.
export function firstAdvanceDelay(endsAt: string, now: number, random: number): number {
  return Math.max(0, Date.parse(endsAt) - now) + Math.floor(random * ADVANCE_SPREAD_MS);
}

// The wait before asking again while the phase stays.
export function nextAdvanceDelay(random: number): number {
  return ADVANCE_AGAIN_MS + Math.floor(random * ADVANCE_AGAIN_SPREAD_MS);
}
