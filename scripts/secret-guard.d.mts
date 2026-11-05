export const SAMPLE_DECK: string;
export const ALLOW_FILE: string;
export const MAX_TEXT_BYTES: number;
export const MAX_BINARY_BYTES: number;
/** Known binary formats: extension → does the buffer start with that format's bytes. */
export const BINARY_FORMATS: Record<string, (buf: Buffer) => boolean>;
export interface Hit {
  rule: string;
  fp?: string;
}
export interface Finding extends Hit {
  path: string;
}
export interface Result {
  findings: Finding[];
  errors: string[];
}
/** 16 hex characters of SHA-256: what an allow-list line names. */
export function fingerprint(text: string): string;
/** The path rule a file breaks, or null. */
export function checkPath(path: string): string | null;
/** The sample deck's own rules. */
export function checkSample(text: string): string | null;
/** The content findings of a text file, with fingerprints. */
export function contentHits(path: string, text: string): Hit[];
/** The rule names a text breaks. */
export function checkContent(path: string, text: string): string[];
/** The findings for one file's bytes (binary policy included). */
export function bufferHits(path: string, buf: Buffer): Hit[];
/** The allow list's `path rule fingerprint` entries and its own errors. */
export function parseAllow(
  text: string,
  exists: (path: string) => boolean,
): { entries: Set<string>; errors: string[] };
/**
 * Every finding for these files. `read` gives the bytes, a finding rule when the file cannot be
 * read, or undefined for a file deleted in the work tree.
 */
export function scan(
  paths: string[],
  read: (path: string) => Buffer | string | undefined,
  allow?: Set<string>,
): { findings: Finding[]; used: Set<string> };
/** Runs the gate in a repository. */
export function run(
  cwd: string,
  options?: { mode?: 'tracked' | 'staged' | 'files'; files?: string[] },
): Result;
/** The report lines: path, rule and count; fingerprints only when asked. */
export function report(result: Result, options?: { withFingerprints?: boolean }): string[];
