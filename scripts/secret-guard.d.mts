export const SAMPLE_DECK: string;
export const ALLOW_FILE: string;
export interface Finding {
  path: string;
  rule: string;
}
export interface Result {
  findings: Finding[];
  errors: string[];
}
/** The path rule a file breaks, or null. */
export function checkPath(path: string): string | null;
/** The sample deck's own rules. */
export function checkSample(text: string): string | null;
/** The content rules a file breaks (empty when clean). */
export function checkContent(path: string, text: string): string[];
/** The allow list's paths and its own errors. */
export function parseAllow(
  text: string,
  exists: (path: string) => boolean,
): { paths: Set<string>; errors: string[] };
/** Every finding for these files; `read` gives null for a binary file. */
export function scan(
  paths: string[],
  read: (path: string) => string | null,
  allow?: Set<string>,
): Finding[];
/** Runs the gate in a repository. */
export function run(
  cwd: string,
  options?: { mode?: 'tracked' | 'staged' | 'files'; files?: string[] },
): Result;
/** The report lines: path and rule only. */
export function report(result: Result): string[];
