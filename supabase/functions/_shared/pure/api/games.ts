import type { MarkResult, TabuCard } from '../tabu.ts';

// `tabu` and `sohbet` Edge Functions, shared with the mobile app.
export type TabuRequest =
  // One-table room: the deck for the phone. A two-table game starts from rooms/answer-game.
  | { action: 'start'; roomId: string }
  // The ordered card list of the current turn, for the two tables of the room.
  | { action: 'turn-cards'; roomId: string }
  // A press on card `cardIndex` of turn `turnNo`; a second press on the same card is ignored.
  | { action: 'mark'; roomId: string; turnNo: number; cardIndex: number; result: MarkResult }
  | { action: 'end-turn'; roomId: string }
  // Starts the ready turn's clock: a phone on the describing side, which describes it, or any phone
  // after readyEndsAt (docs/SPEC_V3.md §19.1, §22.E). Idempotent.
  | { action: 'begin-turn'; roomId: string };

export type TabuStartResponse = { mode: 'local'; deck: TabuCard[] };
export type TabuTurnCardsResponse = { turnNo: number; cards: TabuCard[] };
export type GameOkResponse = { ok: true };

export type SohbetRequest = { action: 'next-card'; roomId: string };

// `sahtekar` (docs/SPEC_V3.md §20.2). A two-table game starts from rooms/answer-game.
export type SahtekarRequest =
  // One-table room: a word, its category and 6 options; the phone runs the game.
  | { action: 'start'; roomId: string }
  // One of the caller's seats holds its card.
  | { action: 'view'; roomId: string; seat: string }
  // The speaking seat's table: "Söyledi" on clue step `step`.
  | { action: 'said'; roomId: string; step: number }
  | { action: 'vote'; roomId: string; voter: string; target: string }
  // The caught impostor's table: the 6 options, then its guess.
  | { action: 'options'; roomId: string }
  | { action: 'guess'; roomId: string; option: string }
  // Either table once the phase's time is up; idempotent.
  | { action: 'advance'; roomId: string };

export type SahtekarStartResponse = { category: string; word: string; options: string[] };
export type SahtekarViewResponse = {
  seat: string;
  category: string;
  word: string | null;
  imposter: boolean;
};
export type SahtekarOptionsResponse = { options: string[] };

// `harf` and `sarki` (docs/SPEC_V3.md §20.3–20.4): the same engine. A two-table game starts from
// rooms/answer-game; begin and advance are idempotent.
export type SayRequest =
  // One-table room: one prompt per round; the phone runs the game for Takım A and B.
  | { action: 'start'; roomId: string }
  | { action: 'begin'; roomId: string }
  // Söyledik on step `step` of round `round`; Harf Kapmaca names the letter.
  | { action: 'claim'; roomId: string; round: number; step: number; letter: string }
  | { action: 'said'; roomId: string; round: number; step: number }
  | { action: 'object'; roomId: string; round: number; step: number }
  | { action: 'advance'; roomId: string };
export type HarfRequest = Exclude<SayRequest, { action: 'said' }>;
export type SarkiRequest = Exclude<SayRequest, { action: 'claim' }>;
export type SayStartResponse = { prompts: string[] };

// `ibre` (docs/SPEC_V3.md §20.5). A two-table game starts from rooms/answer-game; begin, target and
// advance are idempotent.
export type IbreRequest =
  // One-table room: one scale per round; the phone makes the targets and runs the game.
  | { action: 'start'; roomId: string }
  | { action: 'begin'; roomId: string }
  // The round's describer, while a clock runs on round `round` (docs/SPEC_V3.md §22.E).
  | { action: 'target'; roomId: string; round: number }
  | { action: 'lock'; roomId: string; round: number; value: number }
  | { action: 'side'; roomId: string; round: number; side: 'left' | 'right' }
  | { action: 'advance'; roomId: string };
export type IbreStartResponse = { scales: { left: string; right: string }[] };
export type IbreTargetResponse = { roundNo: number; target: number };

// `vampir` (docs/SPEC_V4.md §4.F "Adım 4.6.6"). Targets are table session ids (rule 4); `step` is
// the phase's number in rooms.game_state, so a press from a phase already over changes nothing.
export type VampirRequest =
  // The owner, from the pre-game page.
  | { action: 'start'; roomId: string }
  // What only the caller's phone may know; idempotent.
  | { action: 'view'; roomId: string }
  // The role card: ready; the owner starts the night early.
  | { action: 'ready'; roomId: string; step: number }
  | { action: 'begin'; roomId: string; step: number }
  // A living player's one choice tonight; the answer is the caller's view.
  | { action: 'pick'; roomId: string; step: number; target: string }
  // The owner ends the day's talk; a living player's one vote.
  | { action: 'to-vote'; roomId: string; step: number }
  | { action: 'vote'; roomId: string; step: number; target: string }
  // Anyone at the table once the phase's time is up; idempotent.
  | { action: 'advance'; roomId: string };
