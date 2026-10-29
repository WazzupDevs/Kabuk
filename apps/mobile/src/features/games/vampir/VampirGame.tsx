import { useMutation, useQueryClient } from '@tanstack/react-query';
import { readPregame } from '@shared/gameFrame.ts';
import {
  readVampirResult,
  readVampirState,
  VAMPIR,
  type VampirResult,
  wonGame,
} from '@shared/vampir.ts';
import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuraBackground } from '@/aura/AuraBackground';
import { Btn, Glass, Round, T, Tag } from '@/aura/kit';
import { Button } from '@/components/Button';
import { CachedSvg } from '@/components/CachedSvg';
import { Sheet } from '@/components/Sheet';
import { Text as AppText } from '@/components/Text';
import { roomKeys, type TablePerson } from '@/features/rooms/queries';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { roomsApi, vampirApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { AURA } from '@/theme/aura';
import { KIT, KIT_TYPE } from '@/theme/auraKit';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';
import { ROLE_ICON, VAMPIR_LOOK as L } from '@/theme/vampir';

import { Confetti, type Faces, Face, nameOf, VampirGround, VBtn, VText } from './VampirParts';
import { VampirPlay } from './VampirPlay';

const MAX_FONT = 1.3;

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
        <AppText variant="fine">{sheet.body}</AppText>
        {(endGame.error ?? leaveGame.error) ? (
          <AppText variant="fine" tone="danger">
            {errorMessage(endGame.error ?? leaveGame.error)}
          </AppText>
        ) : null}
        <Button
          size="lg"
          variant={owner || playing ? 'danger' : 'primary'}
          icon="exit-outline"
          testID="vampir-exit-confirm"
          label={sheet.confirm}
          loading={pending}
          onPress={() =>
            owner ? endGame.mutate() : playing ? leaveGame.mutate() : (setExit(false), onHide())
          }
        />
        <Button
          size="lg"
          variant="neutral"
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
}: {
  roomId: string;
  state: unknown;
  faces: Faces;
  owner: boolean;
  onClose: () => void;
  closing: boolean;
}) {
  const { scheme } = useTheme();
  const insets = useSafeAreaInsets();
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
  const failed = pick.error ?? start.error;
  // Two even columns, the same in every count (the owner's report, 29 Ekim).
  const list = (sids: string[]) => {
    const rows: string[][] = [];
    for (let i = 0; i < sids.length; i += 2) rows.push(sids.slice(i, i + 2));
    return (
      <View style={{ gap: LIST_GAP }}>
        {rows.map((row, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: KIT.size.rowGap }}>
            {[0, 1].map((j) => {
              const s = row[j];
              return (
                <View
                  key={j}
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}
                >
                  {s ? (
                    <>
                      <Face faces={faces} sid={s} size="sm" />
                      <View style={{ flex: 1 }}>
                        <T v="fine" strong ink lines={1} fit>
                          {nameOf(faces, s)}
                        </T>
                      </View>
                    </>
                  ) : null}
                </View>
              );
            })}
          </View>
        ))}
      </View>
    );
  };
  return (
    <View testID="vampir-pregame" style={{ flex: 1, backgroundColor: AURA[scheme].ground }}>
      <AuraBackground />
      {/* Still: it scrolls only when it does not fit (the largest text), without a bounce. */}
      <ScrollView
        bounces={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + SPACING[3],
          paddingHorizontal: KIT.size.side,
          paddingBottom: SPACING[6],
          gap: KIT.size.rowGap,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: KIT.size.rowGap }}>
          <Round
            icon="back"
            label={owner ? tr.vampir.closePage : tr.vampir.backToTable}
            loading={closing}
            onPress={onClose}
            testID="vampir-pregame-close"
          />
          <View style={{ flex: 1 }}>
            <T v="h3">{tr.vampir.name}</T>
            <T v="fine">{tr.vampir.whoPlays}</T>
          </View>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: KIT.size.chipGap }}>
          {tr.vampir.rules.map((r) => (
            <Tag key={r} tone="purple" label={r} />
          ))}
        </View>
        <Glass pad="pad" style={{ gap: KIT.size.rowGap }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'baseline',
              justifyContent: 'space-between',
            }}
          >
            <T v="h3">{tr.vampir.players}</T>
            <T v="fine">{tr.vampir.count(players.length)}</T>
          </View>
          {list(players)}
        </Glass>
        <Glass pad="pad" style={{ gap: KIT.size.rowGap }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: KIT.size.rowGap }}>
            <View style={{ flex: 1 }}>
              <T v="h3">{tr.vampir.watchers}</T>
              <T v="fine">{tr.vampir.watchersNote}</T>
            </View>
            <Btn
              sm
              variant="glassy"
              testID="vampir-watch"
              label={watching ? tr.vampir.play : tr.vampir.watch}
              loading={pick.isPending}
              onPress={() => pick.mutate()}
            />
          </View>
          {watchers.length > 0 ? list(watchers) : null}
        </Glass>
        <T v="fine">{tr.vampir.how}</T>
      </ScrollView>
      <View
        style={{
          paddingHorizontal: KIT.size.side,
          paddingTop: SPACING[2],
          paddingBottom: insets.bottom + SPACING[4],
          gap: SPACING[2],
        }}
      >
        {failed ? (
          <T v="fine" color={KIT.danger} center>
            {errorMessage(failed)}
          </T>
        ) : null}
        <T v="fine" center>
          {!owner
            ? tr.vampir.hintGuest
            : enough
              ? tr.vampir.hintOwner
              : tr.vampir.needs(VAMPIR.minPlayers)}
        </T>
        {owner ? (
          <Btn
            block
            testID="vampir-start"
            label={tr.vampir.start}
            disabled={!enough}
            loading={start.isPending}
            onPress={() => start.mutate()}
          />
        ) : null}
      </View>
    </View>
  );
}

// The end (the file's .tgf): the winner, the person's own line, everyone's role and whether they
// lived; confetti for the winners; "Masaya dön", and the owner's "Yeniden oyna".
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
  const insets = useSafeAreaInsets();
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
  const winIcon = result.winner === 'j' ? 'soytari' : result.winner === 'k' ? 'koylu' : 'vampir';
  const seats = result.seats.filter((s) => result.roles[s]);
  return (
    <View testID="vampir-end" style={{ flex: 1 }}>
      <StatusBar style="light" />
      <VampirGround
        time={result.winner === 'v' ? 'night' : result.winner === 'j' ? 'dusk' : 'day'}
      />
      {won ? <Confetti /> : null}
      <ScrollView
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          paddingTop: insets.top + SPACING[6],
          paddingHorizontal: KIT.size.side,
          paddingBottom: SPACING[4],
          gap: SPACING[3],
        }}
      >
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              padding: 5,
              backgroundColor: L.tileOn,
            }}
          >
            <CachedSvg xml={ROLE_ICON[winIcon]} width="100%" height="100%" />
          </View>
          <Text maxFontSizeMultiplier={MAX_FONT} style={[KIT_TYPE.displaySm, { color: L.ink }]}>
            {tr.vampir.won[result.winner]}
          </Text>
        </View>
        {myRole && line ? (
          <VText v="body">{tr.vampir.mine(tr.vampir.roles[myRole].name, line)}</VText>
        ) : null}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {seats.map((s) => {
            const role = result.roles[s];
            if (!role) return null;
            return (
              <View
                key={s}
                style={{
                  width: '48.5%',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  minHeight: 44,
                  paddingVertical: 4,
                  paddingLeft: 4,
                  paddingRight: 10,
                  borderRadius: 16,
                  backgroundColor: L.tile,
                }}
              >
                <Face faces={faces} sid={s} size="sm" dim={dead.has(s)} />
                <View style={{ flex: 1 }}>
                  <Text
                    maxFontSizeMultiplier={MAX_FONT}
                    style={[KIT_TYPE.fine, KIT_TYPE.strong, { color: L.ink }]}
                  >
                    {nameOf(faces, s)}
                  </Text>
                  <Text
                    maxFontSizeMultiplier={MAX_FONT}
                    style={[KIT_TYPE.eyebrow, { color: L.inkSoft }]}
                  >
                    {`${tr.vampir.roles[role].name} · ${dead.has(s) ? tr.vampir.gone : tr.vampir.alive}`}
                  </Text>
                </View>
                <View
                  style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: L.roles[role] }}
                />
              </View>
            );
          })}
        </View>
        {again.error ? <VText v="fine">{errorMessage(again.error)}</VText> : null}
      </ScrollView>
      <View
        style={{
          flexDirection: 'row',
          gap: 10,
          paddingHorizontal: KIT.size.side,
          paddingBottom: insets.bottom + KIT.size.side,
        }}
      >
        <View style={{ flex: 1 }}>
          <VBtn
            ghost
            tint={result.winner === 'v' ? L.night.tint : L.day.tint}
            testID="vampir-back"
            label={tr.vampir.backToTable}
            onPress={onBack}
          />
        </View>
        {owner ? (
          <View style={{ flex: 1 }}>
            <VBtn
              tint={result.winner === 'v' ? L.night.tint : L.day.tint}
              testID="vampir-again"
              label={tr.vampir.again}
              loading={again.isPending}
              onPress={() => again.mutate()}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}
const LIST_GAP = 6;
