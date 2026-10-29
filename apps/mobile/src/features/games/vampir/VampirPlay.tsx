import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  aliveSeats,
  nightTargets,
  VAMPIR,
  type VampirPhase,
  type VampirState,
  type VampirView,
  voteTally,
  votersFor,
} from '@shared/vampir.ts';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { CachedSvg } from '@/components/CachedSvg';
import { Loader } from '@/components/Loader';
import { roomKeys } from '@/features/rooms/queries';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { vampirApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { haptic } from '@/lib/haptics';
import { useNow } from '@/lib/useNow';
import { KIT, KIT_TYPE } from '@/theme/auraKit';
import { MOON_SVG, SUN_SVG, VAMPIR_LOOK as L } from '@/theme/vampir';

import { PeekRole, RoleCard } from './RoleCard';
import {
  CloseRound,
  DayClock,
  type Faces,
  nameOf,
  NextBar,
  PeopleGrid,
  ReadyRow,
  ResultCard,
  type TileState,
  TimerPill,
  VampirGround,
  type VampirTime,
  VBtn,
  VText,
} from './VampirParts';

const MAX_FONT = 1.3;

// Each phase's clock in seconds (the server's, pure/vampir.ts → VAMPIR).
const TOTAL: Record<VampirPhase, number> = {
  role: VAMPIR.roleSeconds,
  night: VAMPIR.nightSeconds,
  morning: VAMPIR.morningSeconds,
  day: VAMPIR.daySeconds,
  vote: VAMPIR.voteSeconds,
  verdict: VAMPIR.verdictSeconds,
};

const DAYTIME: readonly VampirPhase[] = ['morning', 'day', 'vote', 'verdict'];

// Each phase's time of day on the ground (the owner's call, 29 Ekim).
const TIME_OF: Record<VampirPhase, VampirTime> = {
  role: 'night',
  night: 'night',
  morning: 'dawn',
  day: 'day',
  vote: 'day',
  verdict: 'dusk',
};

export const vampirKeys = {
  view: (roomId: string, gameNo: number, step: number) =>
    ['vampirView', roomId, gameNo, step] as const,
};

// What only this phone may know (vampir/view): read again with every new phase; a vampire's at
// night also with every choice someone makes (the table sees only that one more chose).
function useView(roomId: string, state: VampirState) {
  const queryClient = useQueryClient();
  const key = vampirKeys.view(roomId, state.gameNo, state.step);
  const query = useQuery({
    queryKey: key,
    queryFn: () => vampirApi.view(roomId),
    staleTime: Infinity,
    placeholderData: (previous) => previous,
  });
  const vampire = query.data?.role === 'vampir';
  const acted = state.phase === 'night' ? state.acted : 0;
  useEffect(() => {
    if (vampire && acted > 0) void queryClient.invalidateQueries({ queryKey: key });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the key is the step's, `acted` moves
  }, [vampire, acted]);
  return query;
}

// The server's clock: when the phase's time is up any phone moves it on (vampir/advance,
// idempotent); while the phase stays, again every few seconds (a phone's clock a little ahead
// asks before the server's time is up).
function useAdvance(roomId: string, state: VampirState, now: number) {
  const queryClient = useQueryClient();
  const asked = useRef<{ step: number; at: number } | null>(null);
  const due = now >= Date.parse(state.endsAt);
  useEffect(() => {
    if (!due) return;
    const last = asked.current;
    if (last && last.step === state.step && now - last.at < ADVANCE_AGAIN_MS) return;
    asked.current = { step: state.step, at: now };
    void vampirApi
      .advance(roomId)
      .catch(() => undefined)
      .finally(() => void queryClient.invalidateQueries({ queryKey: roomKeys.room(roomId) }));
  }, [due, now, roomId, state.step, queryClient]);
}
const ADVANCE_AGAIN_MS = 2500;

export function VampirPlay({
  roomId,
  state,
  faces,
  owner,
  onExit,
}: {
  roomId: string;
  state: VampirState;
  faces: Faces;
  owner: boolean;
  onExit: () => void;
}) {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const now = useNow(250);
  useAdvance(roomId, state, now);
  const view = useView(roomId, state);
  const my = view.data;
  const role = my?.role ?? null;
  const me = faces.me;
  const alive = aliveSeats(state);
  const amAlive = role !== null && alive.includes(me);
  const left = Math.max(0, Math.ceil((Date.parse(state.endsAt) - now) / 1000));
  const total = TOTAL[state.phase];
  const day = DAYTIME.includes(state.phase);
  const tint = day ? L.day.tint : L.night.tint;

  // The person's own death or elimination is felt once.
  const gone = state.dead.some((d) => d.sid === me);
  const wasGone = useRef(gone);
  useEffect(() => {
    if (gone && !wasGone.current) haptic('timeUp');
    wasGone.current = gone;
  }, [gone]);

  // A choice in the grid, for the night's pick or the day's vote; a new phase clears it.
  const [sel, setSel] = useState<string | null>(null);
  const [selStep, setSelStep] = useState(state.step);
  if (selStep !== state.step) {
    setSelStep(state.step);
    setSel(null);
  }
  const choose = (sid: string) => {
    setSel(sid);
    haptic('selection');
  };

  const reread = () => void queryClient.invalidateQueries({ queryKey: roomKeys.room(roomId) });
  const ready = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () => vampirApi.ready(roomId, state.step),
    onSettled: reread,
  });
  const begin = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () => vampirApi.begin(roomId, state.step),
    onSettled: reread,
  });
  const pick = useMutation({
    meta: FEEL_ERROR,
    mutationFn: (target: string) => vampirApi.pick(roomId, state.step, target),
    onSuccess: (next: VampirView) =>
      queryClient.setQueryData(vampirKeys.view(roomId, state.gameNo, state.step), next),
    onSettled: reread,
  });
  const toVote = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () => vampirApi.toVote(roomId, state.step),
    onSettled: reread,
  });
  const vote = useMutation({
    meta: FEEL_ERROR,
    mutationFn: (target: string) => vampirApi.vote(roomId, state.step, target),
    onSettled: reread,
  });
  const failed = ready.error ?? begin.error ?? pick.error ?? toVote.error ?? vote.error;

  const roundTitle =
    state.phase === 'role'
      ? tr.vampir.seeRole
      : state.phase === 'night'
        ? tr.vampir.night(state.round)
        : state.phase === 'morning'
          ? tr.vampir.morningTitle
          : state.phase === 'vote'
            ? tr.vampir.voting
            : tr.vampir.day(state.round);

  const right = !my ? null : role === null ? (
    <Chip label={tr.vampir.watching} />
  ) : !amAlive && state.phase !== 'role' ? (
    <Chip label={tr.vampir.dead} />
  ) : state.phase === 'role' ? null : (
    <PeekRole role={role} />
  );

  const dead = (sid: string) => !alive.includes(sid);
  const seated = state.seats.filter(
    (s) => faces.people.has(s) || state.dead.some((d) => d.sid === s),
  );
  const everyone = (extra?: (sid: string) => Partial<TileState>): TileState[] =>
    seated.map((sid) => ({ sid, dead: dead(sid), ...(extra ? extra(sid) : {}) }));

  let body: ReactNode = null;
  let foot: ReactNode = null;
  let timed = false;

  if (!my) {
    // The phone's own view is on its way: nothing that would show a watcher's screen to a player.
    body = (
      <Middle>
        <Loader />
      </Middle>
    );
  } else if (state.phase === 'role') {
    if (role === null) {
      body = (
        <Middle>
          <CachedSvg xml={MOON_SVG} width={L.size.moon} height={L.size.moon} />
          <VText v="title">{tr.vampir.dealing}</VText>
          <VText v="body" soft>
            {tr.vampir.dealingNote}
          </VText>
        </Middle>
      );
    } else {
      const amReady = state.ready.includes(me);
      body = (
        <Middle>
          <RoleCard role={role} mates={my?.role === 'vampir' ? my.mates : []} faces={faces} />
          <VText v="fine">{tr.vampir.cardHint}</VText>
          <ReadyRow faces={faces} seats={seated} ready={state.ready} />
        </Middle>
      );
      foot = (
        <View style={{ gap: KIT.size.rowGap }}>
          <VBtn
            tint={tint}
            testID="vampir-ready"
            label={amReady ? tr.vampir.waitingOthers : tr.vampir.ready}
            disabled={amReady}
            loading={ready.isPending}
            onPress={() => ready.mutate()}
          />
          {owner ? (
            <VBtn
              ghost
              tint={tint}
              testID="vampir-begin"
              label={tr.vampir.beginNight}
              loading={begin.isPending}
              onPress={() => begin.mutate()}
            />
          ) : null}
        </View>
      );
    }
    timed = true;
  } else if (state.phase === 'night') {
    timed = true;
    if (!amAlive || !my || my.role === null) {
      body = (
        <Middle>
          <CachedSvg xml={MOON_SVG} width={L.size.moon} height={L.size.moon} />
          <VText v="title">{role === null ? tr.vampir.nightGoesOn : tr.vampir.deadTalk}</VText>
          <VText v="body" soft>
            {role === null ? tr.vampir.everyoneChooses : tr.vampir.deadNight}
          </VText>
          <PeopleGrid faces={faces} tiles={everyone()} />
        </Middle>
      );
    } else if (my.pick) {
      const target = my.pick;
      const seen = my.role === 'gozcu' ? my.seen.find((s) => s.sid === target) : undefined;
      body = (
        <Middle>
          {seen ? (
            <ResultCard
              faces={faces}
              sid={target}
              title={
                seen.vampire
                  ? tr.vampir.seerYes(nameOf(faces, target))
                  : tr.vampir.seerNo(nameOf(faces, target))
              }
              note={seen.vampire ? tr.vampir.seerYesNote : tr.vampir.seerNoNote}
            />
          ) : (
            <ResultCard
              faces={faces}
              sid={target}
              title={tr.vampir.choiceOf(nameOf(faces, target))}
              note={
                my.role === 'vampir'
                  ? tr.vampir.choiceVampir
                  : my.role === 'doktor'
                    ? tr.vampir.choiceDoktor
                    : tr.vampir.choiceHidden
              }
            />
          )}
          <VText v="fine">{tr.vampir.everyoneChooses}</VText>
        </Middle>
      );
    } else {
      const targets = nightTargets(state, me, my.role, my.mates, my.lastSave);
      const matesOn = (sid: string) =>
        Object.entries(my.matePicks)
          .filter(([, t]) => t === sid)
          .map(([v]) => v);
      body = (
        <Top>
          <CachedSvg xml={MOON_SVG} width={L.size.moon} height={L.size.moon} />
          <VText v="title">{tr.vampir.roles[my.role].ask}</VText>
          <VText v="body" soft>
            {tr.vampir.roles[my.role].askNote}
          </VText>
          <PeopleGrid
            faces={faces}
            tiles={alive
              .filter((s) => seated.includes(s))
              .map((sid) => ({
                sid,
                chosen: sel === sid,
                off: !targets.includes(sid),
                small: my.role === 'vampir' ? matesOn(sid) : undefined,
              }))}
            onChoose={choose}
          />
        </Top>
      );
      foot = (
        <VBtn
          tint={tint}
          testID="vampir-pick"
          label={tr.vampir.choose}
          disabled={!sel || !targets.includes(sel)}
          loading={pick.isPending}
          onPress={() => sel && pick.mutate(sel)}
        />
      );
    }
  } else if (state.phase === 'morning') {
    // The dead person's role stays hidden until the end (K-80).
    const v = state.victim;
    body = (
      <Middle>
        <CachedSvg xml={SUN_SVG} width={L.size.sun} height={L.size.sun / 2} />
        <VText v="title">{tr.vampir.morning}</VText>
        {v ? (
          <ResultCard
            faces={faces}
            sid={v}
            dead
            title={v === me ? tr.vampir.youDied : tr.vampir.died(nameOf(faces, v))}
            note={v === me ? tr.vampir.youDiedNote : tr.vampir.roleHidden}
          />
        ) : (
          <ResultCard faces={faces} title={tr.vampir.nobodyDied} note={tr.vampir.nobodyDiedNote} />
        )}
      </Middle>
    );
    foot = <NextBar label={state.winner ? tr.vampir.result : tr.vampir.dayStarts} left={left} />;
  } else if (state.phase === 'day') {
    body = (
      <Middle>
        <DayClock left={left} endsAt={Date.parse(state.endsAt)} total={total} now={now} />
        <VText v="title">{tr.vampir.whoIs}</VText>
        <VText v="body" soft>
          {tr.vampir.talk}
        </VText>
        <PeopleGrid faces={faces} tiles={everyone()} />
      </Middle>
    );
    foot =
      role === null || !amAlive ? (
        <VText v="fine">{role === null ? tr.vampir.watchTalk : tr.vampir.deadWatch}</VText>
      ) : owner ? (
        <VBtn
          tint={tint}
          testID="vampir-to-vote"
          label={tr.vampir.toVote}
          loading={toVote.isPending}
          onPress={() => toVote.mutate()}
        />
      ) : (
        <VText v="fine">{tr.vampir.voteOpensNote}</VText>
      );
  } else if (state.phase === 'vote') {
    timed = true;
    const tally = voteTally(state);
    const mine = state.votes[me];
    const canVote = amAlive && !mine;
    body = (
      <Top>
        <VText v="title">
          {canVote
            ? tr.vampir.whoOut
            : mine
              ? tr.vampir.yourVote(nameOf(faces, mine))
              : role === null
                ? tr.vampir.voteGoesOn
                : tr.vampir.deadNoVote}
        </VText>
        <VText v="body" soft>
          {canVote ? tr.vampir.voteNote : tr.vampir.everyoneVotes}
        </VText>
        <PeopleGrid
          faces={faces}
          tiles={alive
            .filter((s) => seated.includes(s))
            .map((sid) => ({
              sid,
              chosen: canVote ? sel === sid : mine === sid,
              off: canVote && sid === me,
              count: tally[sid] ?? 0,
              small: votersFor(state, sid),
            }))}
          onChoose={canVote ? choose : undefined}
        />
      </Top>
    );
    foot = canVote ? (
      <VBtn
        tint={tint}
        testID="vampir-vote"
        label={tr.vampir.giveVote}
        disabled={!sel || sel === me}
        loading={vote.isPending}
        onPress={() => sel && vote.mutate(sel)}
      />
    ) : null;
  } else if (state.phase === 'verdict') {
    // The one voted out keeps their role hidden until the end (K-80).
    const o = state.out;
    body = (
      <Middle>
        <VText v="title">{tr.vampir.voteOver}</VText>
        {o ? (
          <ResultCard
            faces={faces}
            sid={o}
            dead
            title={o === me ? tr.vampir.youOut : tr.vampir.out(nameOf(faces, o))}
            note={tr.vampir.roleHidden}
          />
        ) : (
          <ResultCard faces={faces} title={tr.vampir.tie} note={tr.vampir.tieNote} />
        )}
      </Middle>
    );
    foot = <NextBar label={state.winner ? tr.vampir.result : tr.vampir.nightComes} left={left} />;
  }

  return (
    <View style={{ flex: 1 }} testID="vampir-game">
      {/* The ground is dark in every phase and theme: light clock and battery over it. */}
      <StatusBar style="light" />
      <VampirGround time={TIME_OF[state.phase]} />
      <View
        style={{
          flex: 1,
          paddingTop: insets.top + TOP_GAP,
          paddingBottom: insets.bottom + KIT.size.side,
          paddingHorizontal: KIT.size.side,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            // "Rolüm"'s card opens over the phase under it.
            zIndex: 3,
          }}
        >
          <CloseRound label={tr.vampir.exit} onPress={onExit} />
          <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0 }}>
            <Text
              maxFontSizeMultiplier={MAX_FONT}
              style={[KIT_TYPE.h3, { color: L.ink, textAlign: 'center' }]}
            >
              {roundTitle}
            </Text>
          </View>
          <View style={{ zIndex: 2 }}>{right}</View>
        </View>
        {timed ? (
          <View style={{ marginTop: BAR_GAP }}>
            <TimerPill left={left} />
          </View>
        ) : null}
        <View style={{ flex: 1 }}>{body}</View>
        {failed ? (
          <Text
            maxFontSizeMultiplier={MAX_FONT}
            style={[KIT_TYPE.fine, KIT_TYPE.strong, { color: L.team, textAlign: 'center' }]}
          >
            {errorMessage(failed)}
          </Text>
        ) : null}
        {foot ? <View style={{ marginTop: KIT.size.rowGap }}>{foot}</View> : null}
      </View>
    </View>
  );
}
const TOP_GAP = 8;
const BAR_GAP = 10;

// A white chip at the top right: "Öldün", "İzliyorsun".
function Chip({ label }: { label: string }) {
  return (
    <View
      style={{
        height: KIT.size.round,
        paddingHorizontal: 16,
        borderRadius: KIT.size.round / 2,
        backgroundColor: L.deadChip,
        justifyContent: 'center',
      }}
    >
      <Text maxFontSizeMultiplier={1} style={[KIT_TYPE.fine, KIT_TYPE.strong, { color: L.ink }]}>
        {label}
      </Text>
    </View>
  );
}

// The phase's content in the middle, or from the top (a grid to choose from); it scrolls only when
// it does not fit (the largest text, a full table).
function Middle({ children }: { children: ReactNode }) {
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: GAP,
      }}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      bounces={false}
      overScrollMode="never"
    >
      {children}
    </ScrollView>
  );
}

function Top({ children }: { children: ReactNode }) {
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ flexGrow: 1, alignItems: 'center', gap: GAP, paddingTop: GAP * 2 }}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      bounces={false}
      overScrollMode="never"
    >
      {children}
    </ScrollView>
  );
}
const GAP = 10;
