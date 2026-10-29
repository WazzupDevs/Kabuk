import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  aliveSeats,
  nightTargets,
  VAMPIR,
  type VampirPhase,
  type VampirRole,
  type VampirState,
  type VampirView,
  voteTally,
  votersFor,
} from '@shared/vampir.ts';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { Loader } from '@/components/Loader';
import { roomKeys } from '@/features/rooms/queries';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { vampirApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { haptic } from '@/lib/haptics';
import { MOON_SVG, SUN_SVG } from '@/theme/vampir';
import {
  type SandTone,
  TABLE,
  TABLE_INK as INK,
  TABLE_TYPE,
  type TableTime,
} from '@/theme/vampirTable';

import { Medal, MiniGlass } from './Hourglass';
import { PeekRole } from './RoleCard';
import {
  MedalWith,
  RoundTable,
  type SeatMark,
  TableBtn,
  TableCard,
  TableGround,
  type TableLine,
  TableRound,
  X_SVG,
} from './RoundTable';
import { type Faces, nameOf } from './VampirParts';

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

// Each phase's room (the file's .m.night, .dawn, .day, .dusk) and its sand.
const TIME_OF: Record<VampirPhase, TableTime> = {
  role: 'night',
  night: 'night',
  morning: 'dawn',
  day: 'day',
  vote: 'day',
  verdict: 'dusk',
};
const SAND_OF: Record<VampirPhase, SandTone> = {
  role: 'night',
  night: 'night',
  morning: 'day',
  day: 'day',
  vote: 'vote',
  verdict: 'night',
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
// asks before the server's time is up). Nothing on the screen counts, so nothing draws again.
function useAdvance(roomId: string, state: VampirState) {
  const queryClient = useQueryClient();
  useEffect(() => {
    const ask = () =>
      void vampirApi
        .advance(roomId)
        .catch(() => undefined)
        .finally(() => void queryClient.invalidateQueries({ queryKey: roomKeys.room(roomId) }));
    let again: ReturnType<typeof setInterval> | undefined;
    const first = setTimeout(
      () => {
        ask();
        again = setInterval(ask, ADVANCE_AGAIN_MS);
      },
      Math.max(0, Date.parse(state.endsAt) - Date.now()),
    );
    return () => {
      clearTimeout(first);
      clearInterval(again);
    };
  }, [roomId, state.step, state.endsAt, queryClient]);
}
const ADVANCE_AGAIN_MS = 2500;

// The game at the round table (the owner's choice, 29 Ekim: docs/design/vampir/yuvarlak-masa.html):
// the round's name at the top, what to do now under it, the table with everyone round it and the
// hourglass at its middle, the buttons at the foot.
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
  useAdvance(roomId, state);
  const view = useView(roomId, state);
  const my = view.data;
  const role = my?.role ?? null;
  const me = faces.me;
  const alive = aliveSeats(state);
  const amAlive = role !== null && alive.includes(me);
  const endsAt = Date.parse(state.endsAt);
  const totalMs = TOTAL[state.phase] * 1000;

  // The person's own death or elimination is felt once.
  const gone = state.dead.some((d) => d.sid === me);
  const wasGone = useRef(gone);
  useEffect(() => {
    if (gone && !wasGone.current) haptic('timeUp');
    wasGone.current = gone;
  }, [gone]);

  // A choice at the table, for the night's pick or the day's vote; a new phase clears it.
  const [sel, setSel] = useState<string | null>(null);
  const [selStep, setSelStep] = useState(state.step);
  // The role card held.
  const [holding, setHolding] = useState(false);
  if (selStep !== state.step) {
    setSelStep(state.step);
    setSel(null);
    setHolding(false);
  }
  const choose = (sid: string) => {
    setSel(sid);
    haptic('selection');
  };
  const hold = (held: boolean) => {
    setHolding(held);
    if (held) haptic('selection');
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

  const barTitle =
    state.phase === 'role'
      ? tr.vampir.seeRole
      : state.phase === 'night'
        ? tr.vampir.night(state.round)
        : state.phase === 'morning'
          ? tr.vampir.morningTitle
          : state.phase === 'vote'
            ? tr.vampir.voting
            : state.phase === 'verdict'
              ? tr.vampir.voteOver
              : tr.vampir.day(state.round);

  const right = !my ? null : role === null ? (
    <Chip label={tr.vampir.watching} />
  ) : !amAlive && state.phase !== 'role' ? (
    <Chip label={tr.vampir.dead} />
  ) : state.phase === 'role' ? null : (
    <PeekRole role={role} />
  );

  const deadSet = new Set(state.dead.map((d) => d.sid));
  const seated = state.seats.filter((s) => faces.people.has(s) || deadSet.has(s));
  const mates = my && my.role !== null ? my.mates : [];
  const mark = (sid: string, extra?: Partial<SeatMark>): SeatMark => ({
    sid,
    dead: deadSet.has(sid),
    ...extra,
  });
  const medal = <Medal endsAt={endsAt} totalMs={totalMs} tone={SAND_OF[state.phase]} />;
  const mini = <MiniGlass endsAt={endsAt} totalMs={totalMs} tone={SAND_OF[state.phase]} />;

  let prompt: Prompt = { title: '' };
  let seats: SeatMark[] = seated.map((s) => mark(s));
  let lines: TableLine[] = [];
  let center: ReactNode = medal;
  let foot: ReactNode = null;
  let onChoose: ((sid: string) => void) | undefined;

  if (!my) {
    // The phone's own view is on its way: nothing that would show a watcher's screen to a player.
    center = <Loader />;
  } else if (state.phase === 'role') {
    if (role === null) {
      prompt = { title: tr.vampir.dealing, note: tr.vampir.dealingNote };
    } else {
      const amReady = state.ready.includes(me);
      const vampire = role === 'vampir';
      prompt = holding
        ? { role, note: tr.vampir.roles[role].about }
        : { title: tr.vampir.cardTitle, note: tr.vampir.cardNote };
      seats = seated.map((s) =>
        mark(s, {
          tick: state.ready.includes(s),
          ally: holding && vampire && (s === me || mates.includes(s)),
          fang: holding && vampire && mates.includes(s),
        }),
      );
      center = <TableCard role={role} open={holding} onHold={hold} label={tr.vampir.cardLabel} />;
      foot = (
        <>
          <Note>
            {holding && vampire && mates.length > 0
              ? tr.vampir.mates(mates.map((m) => nameOf(faces, m)))
              : tr.vampir.readyCount(state.ready.length, seated.length)}
          </Note>
          <View style={{ flexDirection: 'row', gap: TABLE.footGap }}>
            <TableBtn
              testID="vampir-ready"
              label={amReady ? tr.vampir.waitingOthers : tr.vampir.ready}
              disabled={amReady}
              loading={ready.isPending}
              onPress={() => ready.mutate()}
            />
            {owner ? (
              <TableBtn
                ghost
                testID="vampir-begin"
                label={tr.vampir.beginNight}
                loading={begin.isPending}
                onPress={() => begin.mutate()}
              />
            ) : null}
          </View>
        </>
      );
    }
  } else if (state.phase === 'night') {
    if (!amAlive || my.role === null) {
      prompt =
        role === null
          ? { title: tr.vampir.nightGoesOn, note: tr.vampir.everyoneChooses }
          : { title: tr.vampir.deadTalk, note: tr.vampir.deadNight };
    } else {
      const myRole = my.role;
      const vampire = myRole === 'vampir';
      const mateLines: TableLine[] = vampire
        ? Object.entries(my.matePicks).map(([v, t]) => ({ from: v, to: t, color: INK.line.mate }))
        : [];
      if (my.pick) {
        const target = my.pick;
        const seen = myRole === 'gozcu' ? my.seen.find((s) => s.sid === target) : undefined;
        prompt = seen
          ? {
              title: seen.vampire
                ? tr.vampir.seerYes(nameOf(faces, target))
                : tr.vampir.seerNo(nameOf(faces, target)),
              note: seen.vampire ? tr.vampir.seerYesNote : tr.vampir.seerNoNote,
            }
          : {
              title: tr.vampir.choiceOf(nameOf(faces, target)),
              note: vampire
                ? tr.vampir.choiceVampir
                : myRole === 'doktor'
                  ? tr.vampir.choiceDoktor
                  : tr.vampir.choiceHidden,
            };
        seats = seated.map((s) =>
          mark(s, {
            pick: s === target,
            ally: vampire && (s === me || mates.includes(s)),
            fang: vampire && mates.includes(s),
          }),
        );
        lines = [...mateLines, { from: me, to: target, color: INK.line.mine }];
        foot = <Note>{tr.vampir.everyoneChooses}</Note>;
      } else {
        const targets = nightTargets(state, me, myRole, my.mates, my.lastSave);
        prompt = { title: tr.vampir.roles[myRole].ask, note: tr.vampir.roles[myRole].askNote };
        seats = seated.map((s) => {
          const ally = vampire && (s === me || mates.includes(s));
          return mark(s, {
            pick: sel === s,
            ally,
            fang: vampire && mates.includes(s),
            dim: !ally && !deadSet.has(s) && !targets.includes(s),
            choosable: targets.includes(s),
          });
        });
        lines = [
          ...mateLines,
          ...(sel ? [{ from: me, to: sel, color: INK.line.mine, flow: true }] : []),
        ];
        onChoose = choose;
        foot = (
          <TableBtn
            testID="vampir-pick"
            label={tr.vampir.choose}
            disabled={!sel || !targets.includes(sel)}
            loading={pick.isPending}
            onPress={() => sel && pick.mutate(sel)}
          />
        );
      }
    }
  } else if (state.phase === 'morning') {
    // The dead person's role stays hidden until the end (K-80).
    const v = state.victim;
    prompt = v
      ? v === me
        ? { title: tr.vampir.youDied, note: tr.vampir.youDiedNote }
        : { title: tr.vampir.died(nameOf(faces, v)), note: tr.vampir.roleHidden }
      : { title: tr.vampir.nobodyDied, note: tr.vampir.nobodyDiedNote };
    center = v ? (
      <MedalWith faces={faces} sid={v} label={tr.vampir.gone} />
    ) : (
      <MedalWith faces={faces} mark={SUN_SVG} />
    );
    foot = <Note after={mini}>{state.winner ? tr.vampir.result : tr.vampir.dayStarts}</Note>;
  } else if (state.phase === 'day') {
    prompt = { title: tr.vampir.whoIs, note: tr.vampir.talk };
    foot =
      role === null || !amAlive ? (
        <Note>{role === null ? tr.vampir.watchTalk : tr.vampir.deadWatch}</Note>
      ) : owner ? (
        <TableBtn
          testID="vampir-to-vote"
          label={tr.vampir.toVote}
          loading={toVote.isPending}
          onPress={() => toVote.mutate()}
        />
      ) : (
        <Note>{tr.vampir.voteOpensNote}</Note>
      );
  } else if (state.phase === 'vote') {
    const tally = voteTally(state);
    const mine = state.votes[me];
    const canVote = amAlive && !mine;
    const living = new Set(alive);
    prompt = {
      title: canVote
        ? tr.vampir.whoOut
        : mine
          ? tr.vampir.yourVote(nameOf(faces, mine))
          : role === null
            ? tr.vampir.voteGoesOn
            : tr.vampir.deadNoVote,
      note: canVote ? tr.vampir.voteNote : tr.vampir.everyoneVotes,
    };
    seats = seated.map((s) =>
      mark(s, {
        pick: canVote ? sel === s : mine === s,
        count: tally[s] ?? 0,
        choosable: canVote && living.has(s) && s !== me,
      }),
    );
    lines = [
      ...Object.entries(state.votes)
        .filter(([v, t]) => living.has(v) && living.has(t))
        .map(([v, t]) => ({ from: v, to: t, color: INK.line.vote })),
      ...(canVote && sel ? [{ from: me, to: sel, color: INK.line.myVote, flow: true }] : []),
    ];
    onChoose = canVote ? choose : undefined;
    foot = canVote ? (
      <TableBtn
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
    prompt = o
      ? {
          title: o === me ? tr.vampir.youOut : tr.vampir.out(nameOf(faces, o)),
          note: tr.vampir.roleHidden,
        }
      : { title: tr.vampir.tie, note: tr.vampir.tieNote };
    center = o ? (
      <MedalWith faces={faces} sid={o} label={tr.vampir.votes(votersFor(state, o).length)} />
    ) : (
      <MedalWith faces={faces} mark={MOON_SVG} />
    );
    foot = <Note after={mini}>{state.winner ? tr.vampir.result : tr.vampir.nightComes}</Note>;
  }

  return (
    <View style={{ flex: 1 }} testID="vampir-game">
      {/* The room is dark in every phase and theme: light clock and battery over it. */}
      <StatusBar style="light" />
      <TableGround time={TIME_OF[state.phase]} />
      <TablePage
        insetTop={insets.top}
        insetBottom={insets.bottom}
        title={barTitle}
        onExit={onExit}
        right={right}
        prompt={prompt}
        table={
          <RoundTable
            faces={faces}
            seats={seats}
            lines={lines}
            time={TIME_OF[state.phase]}
            center={center}
            onChoose={onChoose}
          />
        }
        error={failed ? errorMessage(failed) : null}
        foot={foot}
      />
    </View>
  );
}

// What to do now, over the table: a line and a note under it; while the role card is held, the
// role's name in its colour instead of the line.
export type Prompt = { title?: string; role?: VampirRole; note?: string };

// The page (the file's .m): the bar, the prompt, the table in the room left, the foot. The prompt's
// room only grows in a game, so the table does not jump when a shorter line comes.
export function TablePage({
  insetTop,
  insetBottom,
  title,
  onExit,
  right,
  prompt,
  table,
  error,
  foot,
}: {
  insetTop: number;
  insetBottom: number;
  title: string;
  onExit?: () => void;
  right?: ReactNode;
  prompt: Prompt;
  table: ReactNode;
  error?: string | null;
  foot?: ReactNode;
}) {
  const [room, setRoom] = useState(0);
  return (
    <View
      style={{
        flex: 1,
        paddingTop: insetTop + TABLE.barTop,
        paddingBottom: insetBottom + TABLE.footBottom,
      }}
    >
      <View
        style={{
          height: TABLE.bar,
          marginHorizontal: TABLE.side,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          // "Rolüm"'s card opens over what is under it.
          zIndex: 3,
        }}
      >
        {onExit ? (
          <TableRound label={tr.vampir.exit} xml={X_SVG} onPress={onExit} testID="vampir-exit" />
        ) : (
          <View style={{ width: TABLE.bar }} />
        )}
        <View
          pointerEvents="none"
          style={{ position: 'absolute', left: TABLE.bar + 8, right: TABLE.bar + 8 }}
        >
          <Text
            maxFontSizeMultiplier={MAX_FONT}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
            style={[TABLE_TYPE.bar, { color: INK.white, textAlign: 'center' }]}
          >
            {title}
          </Text>
        </View>
        <View style={{ zIndex: 2 }}>{right ?? <View style={{ width: TABLE.bar }} />}</View>
      </View>
      <View
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          setRoom((r) => (h > r ? h : r));
        }}
        style={{
          marginTop: TABLE.promptTop,
          paddingHorizontal: TABLE.promptSide,
          minHeight: room,
          alignItems: 'center',
        }}
      >
        {prompt.role ? (
          <View
            style={{
              paddingHorizontal: 16,
              paddingVertical: 4,
              borderRadius: 999,
              backgroundColor: INK.roles[prompt.role],
              marginBottom: 2,
            }}
          >
            <Text
              maxFontSizeMultiplier={MAX_FONT}
              style={[TABLE_TYPE.roleName, { color: INK.white }]}
            >
              {tr.vampir.roles[prompt.role].name}
            </Text>
          </View>
        ) : prompt.title ? (
          <Text
            maxFontSizeMultiplier={MAX_FONT}
            style={[TABLE_TYPE.title, { color: INK.white, textAlign: 'center' }]}
          >
            {prompt.title}
          </Text>
        ) : null}
        {prompt.note ? (
          <Text
            maxFontSizeMultiplier={MAX_FONT}
            style={[
              TABLE_TYPE.note,
              { color: INK.white, textAlign: 'center', marginTop: prompt.role ? 2 : 6 },
            ]}
          >
            {prompt.note}
          </Text>
        ) : null}
      </View>
      {table}
      <View style={{ marginHorizontal: TABLE.side, gap: TABLE.footGap }}>
        {error ? (
          <Text
            maxFontSizeMultiplier={MAX_FONT}
            style={[TABLE_TYPE.foot, { color: INK.danger, textAlign: 'center' }]}
          >
            {error}
          </Text>
        ) : null}
        {foot}
      </View>
    </View>
  );
}

// The foot's note (the file's .note), with a small hourglass after it when the next phase comes.
export function Note({ children, after }: { children: ReactNode; after?: ReactNode }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }}
    >
      <Text
        maxFontSizeMultiplier={MAX_FONT}
        style={[TABLE_TYPE.foot, { color: INK.white, textAlign: 'center', flexShrink: 1 }]}
      >
        {children}
      </Text>
      {after}
    </View>
  );
}

// A chip at the top right in place of "Rolüm": "Öldün", "İzliyorsun".
function Chip({ label }: { label: string }) {
  return (
    <View
      style={{
        height: TABLE.bar,
        paddingHorizontal: 16,
        borderRadius: TABLE.bar / 2,
        backgroundColor: INK.round,
        justifyContent: 'center',
      }}
    >
      <Text maxFontSizeMultiplier={1} style={[TABLE_TYPE.foot, { color: INK.white }]}>
        {label}
      </Text>
    </View>
  );
}
