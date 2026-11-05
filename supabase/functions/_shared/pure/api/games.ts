import type { TabuCard } from '../tabu.ts';
import type { TabuMark } from '../tabuGame.ts';

// `tabu` (Kapsül Anlat, docs/SPEC_V4.md §4.F "Adım 4.6.1") and `sohbet` Edge Functions, shared with
// the mobile app. `step` is game_state.step of the phase the press belongs to; a press on another
// step changes nothing.
export type TabuRequest =
  // The owner, from the pre-game page.
  | { action: 'start'; roomId: string }
  // Tur öncesi: the describer's "Turu başlat".
  | { action: 'begin-turn'; roomId: string; step: number }
  // The running turn's ordered card list: the describer, the other team and the watchers.
  | { action: 'turn-cards'; roomId: string }
  // A press on card `cardIndex`: Doğru and Pas the describer, Yasak! the other team; a second press
  // on the same card is ignored.
  | { action: 'mark'; roomId: string; step: number; cardIndex: number; result: TabuMark }
  // Tur sonu: the owner's "Sonraki tura geç".
  | { action: 'next'; roomId: string; step: number }
  // Any phone once the phase's time is up; idempotent.
  | { action: 'advance'; roomId: string };

export type TabuTurnCardsResponse = { turnNo: number; cards: TabuCard[] };
export type GameOkResponse = { ok: true };

export type SohbetRequest = { action: 'next-card'; roomId: string };

// `sahtekar` (Krot, docs/SPEC_V4.md §4.F "Adım 4.6.3"). Targets are table session ids (rule 4);
// `step` is the phase's number in rooms.game_state, so a press from a phase already over changes
// nothing.
export type SahtekarRequest =
  // The owner, from the pre-game page.
  | { action: 'start'; roomId: string }
  // The caller's own role (Rolünü gör, Rolüm); idempotent.
  | { action: 'view'; roomId: string }
  // The role card: Hazırım.
  | { action: 'ready'; roomId: string; step: number }
  // The speaker's Söyledim.
  | { action: 'said'; roomId: string; step: number }
  // One ballot: as many others as there are impostors.
  | { action: 'vote'; roomId: string; step: number; targets: string[] }
  // Son şans: a caught impostor's written guess (never kept).
  | { action: 'guess'; roomId: string; step: number; text: string }
  // Anyone at the table once the phase's time is up; idempotent.
  | { action: 'advance'; roomId: string };

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

// `signum` (docs/SPEC_V4.md §4.F "Adım 4.6.7"). Session ids for people (rule 4); `step` is the
// game's step in rooms.game_state; `actionId` a UUID the phone makes for one press (sent again only
// as the same press); `seq` grows with each of the caller's marks. Every game answer is a
// SignumAnswer (pure/signum.ts): `applied: false` with a reason is not an error (the phone
// refreshes, no failure haptic).
export type SignumRequest =
  // The pre-game page: Kaptan olurum; the owner's offer, random offer and approval; the answer.
  | { action: 'volunteer'; roomId: string; on: boolean }
  | { action: 'offer-captain'; roomId: string; sessionId: string }
  | { action: 'random-offer'; roomId: string; team: 'a' | 'b' }
  | { action: 'answer-offer'; roomId: string; accept: boolean }
  | { action: 'approve-captain'; roomId: string; team: 'a' | 'b'; sessionId: string }
  // The owner starts.
  | { action: 'start'; roomId: string }
  // The caller's own view; idempotent.
  | { action: 'view'; roomId: string }
  | { action: 'ready'; roomId: string; step: number }
  | { action: 'clue'; roomId: string; step: number; word: string; n: number; actionId: string }
  | { action: 'point'; roomId: string; step: number; tile: number | null; seq: number }
  | { action: 'reveal'; roomId: string; step: number; tile: number; actionId: string }
  | { action: 'end-turn'; roomId: string; step: number; actionId: string }
  // Anyone at the table once the phase's time is up; idempotent.
  | { action: 'advance'; roomId: string; step: number };

// A pre-game action's and the start's answer: applied, or `busy` (changed at the same moment three
// times; the phone reads the table again).
export type SignumPageAnswer = { applied: true } | { applied: false; reason: 'busy' };

// `sprengja` (docs/SPEC_V4.md §4.F "Adım 4.6.8", K-85). `round` and `step` are game_state's, so a
// press from a state already gone changes nothing. No answer carries the hidden fuse: a throw
// answers { ok: true } whether it moved the bomb or was a second press, and turn_over once the
// round's bomb has gone off (which the table already sees).
export type SprengjaRequest =
  // The owner, on the pre-game page: the throwing order at random; then the start.
  | { action: 'shuffle'; roomId: string }
  | { action: 'start'; roomId: string }
  // The round's starter: open the card, light the fuse; idempotent.
  | { action: 'reveal'; roomId: string; round: number }
  | { action: 'light'; roomId: string; round: number }
  // Another player still in the game, once the starter has been idle past game_state.startBy.
  | { action: 'take-over'; roomId: string; round: number; step: number }
  // The holder's throw to the next player.
  | { action: 'pass'; roomId: string; round: number; step: number }
  // Anyone at the table while the fuse burns, as often as game_state.poll says; idempotent.
  | { action: 'poll'; roomId: string; round: number }
  // Tur sonu: ready; anyone once its time is up; idempotent.
  | { action: 'ready'; roomId: string; step: number }
  | { action: 'advance'; roomId: string };

// `kaupholl` (docs/SPEC_V4.md §4.F "Adım 4.6.10", K-87). `step` is the phase's number in
// rooms.game_state; `seq` grows with each of the caller's guesses or placements in a step (1 to
// 10.000, gaps allowed). Every play answer is a KauphollAnswer (pure/kaupholl.ts): `applied: false`
// with a reason is not an error (the phone shows the server's state, no failure haptic).
export type KauphollRequest =
  // The owner, from the pre-game page; `questions_exhausted` when no valid five is left.
  | { action: 'start'; roomId: string }
  // The owner, on the pre-game page: how many questions this table has not had; idempotent.
  | { action: 'pool'; roomId: string }
  // The caller's own guess and placement, and the open state; idempotent.
  | { action: 'view'; roomId: string }
  // Any player: open the card.
  | { action: 'reveal'; roomId: string; step: number }
  // A player's guess (at most 6 whole digits and 1 decimal); `lock` is Kesinleştir.
  | { action: 'guess'; roomId: string; step: number; seq: number; value: number; lock: boolean }
  // A player's whole placement (two coins, each a slice or none); `lock` is Yatırdım.
  | {
      action: 'bet';
      roomId: string;
      step: number;
      seq: number;
      coins: [number | null, number | null];
      lock: boolean;
    }
  // Hazırım on the answer and the end of a question.
  | { action: 'ready'; roomId: string; step: number }
  // Anyone at the table once the phase's time is up; idempotent.
  | { action: 'advance'; roomId: string; step: number };

export type KauphollPool = { unused: number };

// The start's answer: applied, or `busy` (the table changed at the same moment three times).
export type KauphollStartAnswer = { applied: true } | { applied: false; reason: 'busy' };

// `kibrit` (docs/SPEC_V4.md §4.F "Adım 4.6.9", K-86). Targets are table session ids (rule 4);
// `step` is the phase's number in rooms.game_state, so a press from a phase already over changes
// nothing. `rev` is the phone's own counter for its paper or vote in the step (rule 3's exception):
// the server keeps the greatest, a call with a rev not greater changes nothing.
export type KibritRequest =
  // The owner, from the pre-game page; the round limit (1 to the players, min(5, players) without).
  | { action: 'start'; roomId: string; rounds?: number }
  // What only the caller's phone may know; idempotent.
  | { action: 'view'; roomId: string }
  // A player's paper, while the table writes; the answer is the caller's view.
  | { action: 'write'; roomId: string; step: number; rev: number; text: string }
  // The drawer's draw; the drawer or the owner opens the vote.
  | { action: 'draw'; roomId: string; step: number }
  | { action: 'to-vote'; roomId: string; step: number }
  // A player's secret vote (themselves too); the answer is the caller's view.
  | { action: 'vote'; roomId: string; step: number; rev: number; target: string }
  // The owner skips the open paper; the result's Hazır and the owner's Sonraki kâğıt.
  | { action: 'skip'; roomId: string; step: number }
  | { action: 'ready'; roomId: string; step: number }
  | { action: 'next'; roomId: string; step: number }
  // Anyone at the table once the phase's time is up; idempotent.
  | { action: 'advance'; roomId: string };
