import { useMutation, useQueryClient } from '@tanstack/react-query';
import { readPregame } from '@shared/gameFrame.ts';
import {
  readVampirResult,
  readVampirState,
  VAMPIR,
  type VampirResult,
  wonGame,
} from '@shared/vampir.ts';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { Btn, T } from '@/aura/kit';
import { Button } from '@/components/Button';
import { Sheet } from '@/components/Sheet';
import { roomKeys, type TablePerson } from '@/features/rooms/queries';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { roomsApi, vampirApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { KIT } from '@/theme/auraKit';
import { SPACING } from '@/theme/tokens';
import { TABLE, TABLE_INK as INK, TABLE_SHADOW } from '@/theme/vampirTable';

import {
  GameLobby,
  LobbyCard,
  type LobbyPerson,
  LobbyPeople,
  LobbyRules,
  LobbyWatchers,
} from '../GameLobby';
import { GlassBtn, RingedFace, type SeatMark } from './RoundTable';
import { VAMPIR_POSTER } from './roleArt';
import { Confetti, type Faces, Face, nameOf } from './VampirParts';
import { GamePage, Pill, Stage, StageWords, VampirPlay } from './VampirPlay';

type Room = {
  id: string;
  concept: string | null;
  game_state: unknown;
  owner_session_id: string;
};

// What of Vampir Köylü the table shows now: its pre-game page, the running game, or the end of the
// last one (until the person goes back to the table). Null: none of them.
export type VampirMode = 'pregame' | 'play' | 'end' | null;

export function vampirMode(room: Room): VampirMode {
  if (room.concept === 'vampir' && readVampirState(room.game_state)) return 'play';
  if (readPregame(room.game_state)?.concept === 'vampir') return 'pregame';
  if (readVampirResult(room.game_state)) return 'end';
  return null;
}

// The game's number now (the running one's, or the last one's): the person's "Masaya dön" is
// remembered for it.
export function gameNoOf(state: unknown): number {
  return typeof state === 'object' && state !== null && 'gameNo' in state
    ? Number((state as { gameNo: unknown }).gameNo) || 0
    : 0;
}

// Vampir Köylü at the table (docs/SPEC_V4.md §4.F "Adım 4.6.6"): the pre-game page, the game and its
// end. Everyone at the table is taken into it; a watcher or someone out of it may go back to the
// table (`onHide`), which then offers to look in again.
export function VampirGame({
  room,
  me,
  people,
  profiles,
  onHide,
}: {
  room: Room;
  me: string;
  people: readonly TablePerson[];
  profiles: ReadonlyMap<string, string> | undefined;
  onHide: () => void;
}) {
  const owner = room.owner_session_id === me;
  const faces = useMemo<Faces>(
    () => ({ me, people: new Map(people.map((p) => [p.sessionId, p])), profiles }),
    [me, people, profiles],
  );
  const mode = vampirMode(room);
  const [exit, setExit] = useState(false);
  const queryClient = useQueryClient();
  const reread = () => {
    void queryClient.invalidateQueries({ queryKey: roomKeys.room(room.id) });
    void queryClient.invalidateQueries({ queryKey: roomKeys.people(room.id) });
  };
  const endGame = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () => roomsApi.endGame(room.id),
    onSuccess: () => setExit(false),
    onSettled: reread,
  });
  const leaveGame = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () => roomsApi.leaveGame(room.id),
    onSuccess: () => {
      setExit(false);
      onHide();
    },
    onSettled: reread,
  });

  if (mode === 'pregame') {
    return (
      <Pregame
        roomId={room.id}
        state={room.game_state}
        faces={faces}
        owner={owner}
        onClose={() => (owner ? endGame.mutate() : onHide())}
        closing={endGame.isPending}
        closeError={endGame.error}
        onChat={() => router.push({ pathname: '/room-chat/[id]', params: { id: room.id } })}
      />
    );
  }

  if (mode === 'end') {
    const result = readVampirResult(room.game_state);
    if (!result) return null;
    return <End roomId={room.id} result={result} faces={faces} owner={owner} onBack={onHide} />;
  }

  const state = readVampirState(room.game_state);
  if (mode !== 'play' || !state) return null;
  const playing = state.seats.includes(me) && !state.gone.includes(me);
  const sheet = owner
    ? { title: tr.vampir.endTitle, body: tr.vampir.endBody, confirm: tr.vampir.endConfirm }
    : playing
      ? { title: tr.vampir.leaveTitle, body: tr.vampir.leaveBody, confirm: tr.vampir.leaveConfirm }
      : { title: tr.vampir.watchTitle, body: tr.vampir.watchBody, confirm: tr.vampir.watchConfirm };
  const pending = endGame.isPending || leaveGame.isPending;
  return (
    <View style={{ flex: 1 }}>
      <VampirPlay
        roomId={room.id}
        state={state}
        faces={faces}
        owner={owner}
        onExit={() => setExit(true)}
      />
      <Sheet
        visible={exit}
        onClose={() => (pending ? undefined : setExit(false))}
        title={sheet.title}
      >
        <T v="fine">{sheet.body}</T>
        {(endGame.error ?? leaveGame.error) ? (
          <T v="fine" color={KIT.danger}>
            {errorMessage(endGame.error ?? leaveGame.error)}
          </T>
        ) : null}
        <Btn
          block
          variant={owner || playing ? 'danger' : 'primary'}
          icon="logout"
          testID="vampir-exit-confirm"
          label={sheet.confirm}
          loading={pending}
          onPress={() =>
            owner ? endGame.mutate() : playing ? leaveGame.mutate() : (setExit(false), onHide())
          }
        />
        <Btn
          block
          variant="glassy"
          label={tr.common.cancel}
          disabled={pending}
          onPress={() => setExit(false)}
        />
        <View style={{ height: SPACING[1] }} />
      </Sheet>
    </View>
  );
}

// The pre-game page (the file's "Kimler oynuyor"): the rules in short, the players and the
// watchers, "Gözlemci ol", how it plays; the owner's "Oyunu başlat" once five play.
function Pregame({
  roomId,
  state,
  faces,
  owner,
  onClose,
  closing,
  closeError,
  onChat,
}: {
  roomId: string;
  state: unknown;
  faces: Faces;
  owner: boolean;
  onClose: () => void;
  closing: boolean;
  closeError: unknown;
  onChat: () => void;
}) {
  const queryClient = useQueryClient();
  const picks = readPregame(state)?.picks ?? {};
  const everyone = [...faces.people.keys()];
  const watchers = everyone.filter((s) => picks[s] === 'obs');
  const players = everyone.filter((s) => picks[s] !== 'obs');
  const watching = picks[faces.me] === 'obs';
  const enough = players.length >= VAMPIR.minPlayers;
  const reread = () => void queryClient.invalidateQueries({ queryKey: roomKeys.room(roomId) });
  const pick = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () => roomsApi.pick(roomId, watching ? null : 'obs'),
    onSettled: reread,
  });
  const start = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () => vampirApi.start(roomId),
    onSettled: reread,
  });
  const person = (s: string): LobbyPerson => ({
    key: s,
    face: <Face faces={faces} sid={s} size="sm" />,
    name: nameOf(faces, s),
    me: s === faces.me,
  });
  return (
    <GameLobby
      testID="vampir-pregame"
      game="vampir"
      poster={VAMPIR_POSTER}
      name={tr.vampir.name}
      close={{
        label: owner ? tr.vampir.closePage : tr.vampir.backToTable,
        onPress: onClose,
        loading: closing,
        testID: 'vampir-pregame-close',
      }}
      onChat={onChat}
      chips={tr.vampir.rules}
      foot={{
        owner,
        warning: enough ? null : tr.vampir.needs(VAMPIR.minPlayers),
        error: pick.error ?? start.error ?? closeError,
        start: {
          label: tr.vampir.start,
          testID: 'vampir-start',
          loading: start.isPending,
          onPress: () => start.mutate(),
        },
      }}
    >
      <LobbyCard title={tr.games.players} count={tr.games.count(players.length)}>
        <LobbyPeople people={players.map(person)} />
      </LobbyCard>
      <LobbyWatchers
        note={tr.vampir.watchersNote}
        watching={watching}
        loading={pick.isPending}
        onPress={() => pick.mutate()}
        testID="vampir-watch"
        people={watchers.map(person)}
      />
      <LobbyRules text={tr.vampir.how} />
    </GameLobby>
  );
}

// The end at the capsule table (Aura v83, VampirSonuc): every card open on its role (the
// vampires' glowing; those who left are not at the table), the winners' faces and who won at the
// middle, the person's own line; confetti for the winners; "Yeniden oyna" for the owner and "Masaya
// dön".
function End({
  roomId,
  result,
  faces,
  owner,
  onBack,
}: {
  roomId: string;
  result: VampirResult;
  faces: Faces;
  owner: boolean;
  onBack: () => void;
}) {
  const queryClient = useQueryClient();
  const myRole = result.roles[faces.me];
  const won = myRole ? wonGame(myRole, result.winner) : false;
  const again = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () => roomsApi.openGame(roomId, 'vampir', true),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: roomKeys.room(roomId) }),
  });
  const dead = new Set(result.dead.map((d) => d.sid));
  const line = !myRole
    ? null
    : result.winner === 'j'
      ? myRole === 'soytari'
        ? tr.vampir.lineFooledAll
        : tr.vampir.lineJesterWon
      : myRole === 'soytari'
        ? tr.vampir.lineJesterLost
        : won
          ? tr.vampir.lineWon
          : tr.vampir.lineLost;
  const seats: SeatMark[] = result.seats.flatMap((s) => {
    const role = result.roles[s];
    return role ? [{ sid: s, role, dead: dead.has(s), win: wonGame(role, result.winner) }] : [];
  });
  const winners = seats.filter((s) => s.win).map((s) => s.sid);
  const big = winners.length <= 2;
  const face = big ? TABLE.winners : TABLE.candidates.small;
  return (
    <View testID="vampir-end" style={{ flex: 1 }}>
      <GamePage
        testID="vampir-end-table"
        faces={faces}
        seats={seats}
        phase="end"
        dial={null}
        onExit={onBack}
        error={again.error ? errorMessage(again.error) : null}
        stage={
          <Stage top={TABLE.stageTop.end}>
            <Pill label={tr.vampir.over} tone="end" />
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: WINNER_GAP,
                marginTop: 12,
              }}
            >
              {winners.map((s) => (
                <RingedFace
                  key={s}
                  faces={faces}
                  sid={s}
                  size={face}
                  ring={{ color: INK.pink, inner: 2.5, outer: 2.5 }}
                  shadow={TABLE_SHADOW.winner}
                />
              ))}
            </View>
            <StageWords
              words={{
                title: tr.vampir.won[result.winner],
                note:
                  myRole && line ? tr.vampir.mine(tr.vampir.roles[myRole].name, line) : undefined,
                big: true,
              }}
            />
          </Stage>
        }
        foot={
          <View style={{ flexDirection: 'row', gap: TABLE.footGap }}>
            {owner ? (
              <>
                <GlassBtn
                  testID="vampir-back"
                  label={tr.vampir.backToTable}
                  width={TABLE.secondary}
                  onPress={onBack}
                />
                <View style={{ flex: 1 }}>
                  <Button
                    testID="vampir-again"
                    size="lg"
                    label={tr.vampir.again}
                    loading={again.isPending}
                    onPress={() => again.mutate()}
                  />
                </View>
              </>
            ) : (
              <View style={{ flex: 1 }}>
                <Button
                  testID="vampir-back"
                  size="lg"
                  label={tr.vampir.backToTable}
                  onPress={onBack}
                />
              </View>
            )}
          </View>
        }
      />
      {won ? <Confetti /> : null}
    </View>
  );
}
const WINNER_GAP = 6;
