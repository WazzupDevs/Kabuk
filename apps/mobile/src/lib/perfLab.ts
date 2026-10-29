// perf/mount branch only (not merged): parts the mount lab (app/perf.tsx) leaves out, to measure
// what each costs to put on the screen.
export const PERF_OFF = new Set<string>();
export const perfOff = (k: string): boolean => PERF_OFF.has(k);
