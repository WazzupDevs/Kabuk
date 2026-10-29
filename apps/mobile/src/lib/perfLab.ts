// perf/trace branch only (not merged): parts the perf lab (app/perf.tsx) turns off to measure
// what each costs. Read at render time.
export const PERF_OFF = new Set<string>();
export const perfOff = (k: string): boolean => PERF_OFF.has(k);
