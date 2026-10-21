import type { GameFlowReportReason, ReportReason } from '../chat.ts';
import type { Reaction } from '../reactions.ts';

// `chat` and `safety` Edge Functions, shared with the mobile app.
export type ChatRequest =
  // replyTo: a message of the same room the sender can read (docs/SPEC_V3.md §21.1).
  | { action: 'send'; roomId: string; body: string; replyTo?: string }
  // The caller's table's one reaction on a message; null takes it back (§21.2).
  | { action: 'react'; messageId: string; emoji: Reaction | null };
export type ChatResponse = { messageId: string };
export type ReactResponse = { ok: true };

export type SafetyRequest =
  // A table (docs/SPEC_V4.md §4.E): the person named by its table session id, at the table now or
  // before (`not_found` without one); the copy is the chat from the reporter's own seat on. A
  // person met in the game flow (a table or a history row) can also be reported for a wrong gender
  // (docs/SPEC_V3.md §23.D).
  | {
      action: 'report';
      target?: 'room';
      roomId: string;
      reason: GameFlowReportReason;
      sessionId?: string;
    }
  // A profile the reporter can see now (docs/SPEC_V2.md §5.3); otherwise `not_found`, the same
  // answer profile/get gives.
  | { action: 'report'; target: 'profile'; publicId: string; reason: ReportReason }
  // Step 4: a DM thread (last 50 messages) or an encounter of the caller's own history. A history
  // report works after the room has ended; it copies the profile only if that table joined with
  // it. Nothing is written for an unknown row, and the answer does not change.
  | { action: 'report'; target: 'dm'; threadId: string; reason: ReportReason }
  | { action: 'report'; target: 'history'; historyId: string; reason: GameFlowReportReason }
  // Venue chat (docs/SPEC_V3.md §7.4): a message (with a copy of the venue's last 50), or a friend
  // request that came from the chat. Nothing is written for a message the caller cannot see.
  | { action: 'report'; target: 'venue_chat'; messageId: string; reason: ReportReason }
  | { action: 'report'; target: 'friend_request'; requestId: string; reason: ReportReason }
  // At a table (docs/SPEC_V4.md §4.E, K-13): a person there by its table session id
  // (`nothing_to_block` without one). The owner's block takes that person out; anyone else's block
  // takes the blocker out.
  | { action: 'block'; roomId: string; sessionId?: string }
  // Step 4: a friend (ends the friendship, silently) or the account behind a history row. With
  // `report`, the report is written in the same transaction before anything is deleted.
  | { action: 'block'; publicId: string; report?: ReportReason }
  | { action: 'block'; historyId: string; report?: GameFlowReportReason }
  // The sender of a venue chat message, or of a friend request from the chat.
  | { action: 'block'; venueChatMessageId: string; report?: ReportReason }
  | { action: 'block'; friendRequestId: string; report?: ReportReason }
  | { action: 'unblock'; blockId: string };
export type SafetyResponse = { ok: true };
