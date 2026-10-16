// Chat rules (MVP_SPEC §7).
export const MAX_MESSAGE_LENGTH = 200;
export const MIN_MESSAGE_INTERVAL_MS = 1000;

// Trimmed message, or null when empty or longer than 200 characters (code points, like the
// database's char_length).
export function prepareMessage(raw: string): string | null {
  const body = raw.trim();
  const length = [...body].length;
  return length >= 1 && length <= MAX_MESSAGE_LENGTH ? body : null;
}

export const REPORT_REASONS = ['harassment', 'inappropriate', 'spam', 'other'] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];
// "Yanlış cinsiyet beyanı" (docs/SPEC_V3.md §23.D) is a reason only for a person met in the game
// flow: a phone in the room and a history row. The venue chat and DMs have no gender rule, so their
// reports keep REPORT_REASONS.
export const GAME_FLOW_REPORT_REASONS = [...REPORT_REASONS, 'wrong_gender'] as const;
export type GameFlowReportReason = (typeof GAME_FLOW_REPORT_REASONS)[number];
