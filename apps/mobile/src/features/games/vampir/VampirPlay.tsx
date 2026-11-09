import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  aliveSeats,
  nightTargets,
  type VampirPhase,
  type VampirState,
  type VampirView,
  voteTally,
  votersFor,
} from '@shared/vampir.ts';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { Button } from '@/components/Button';
import { CachedSvg } from '@/components/CachedSvg';
import { Loader } from '@/components/Loader';
import { roomKeys } from '@/features/rooms/queries';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { vampirApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { haptic } from '@/lib/haptics';
import { NativeShadow } from '@/components/NativeShadow';
import { BRAND } from '@/theme/brand';
import { gradientStyle } from '@/theme/gradient';
import { MOON_SVG, SUN_SVG } from '@/theme/vampir';
import { type ScenePhase } from '@/theme/vampirScene';
import { scaleType, TABLE, TABLE_INK as INK, TABLE_SHADOW, TABLE_TYPE } from '@/theme/vampirTable';
import { useAdvanceClock } from '@/features/games/useAdvanceClock';

import { DialNumber } from './Dial';
import { PeekRole } from './RoleCard';
import {
  type DialAt,
  FootShade,
  GlassBtn,
  GlassSign,
  NamePill,
  NARROW_FONT,
  narrowScale,
  RingedFace,
  type SeatMark,
  TableCard,
  TableRound,
  TableScene,
  Voter,
  voterAt,
  X_SVG,
} from './RoundTable';
import { type Faces, nameOf } from './VampirParts';

const MAX_FONT = 1.3;

// Each phase's scene (Aura v93: Gece for the role and the night, Şafak for the morning and the
// verdict, Gündüz for the day and the vote; Son for the end, VampirGame → End).
const SCENE_OF: Record<VampirPhase, ScenePhase> = {
  role: 'night',
  night: 'night',
  morning: 'dawn',
  day: 'day',
  vote: 'day',
  verdict: 'dawn',
};

const vampirKeys = {
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
  useAdvanceClock(roomId, state.endsAt, state.step, () => vampirApi.advance(roomId));
}

// The game at the capsule table (Aura v83 and v93: VampirRolKarti, VampirRolun, VampirGece,
// VampirSabah, VampirGunduz, VampirOylama, VampirEleme, VampirOylama12, VampirOylamaDar,
// VampirYukleniyor, VampirHata): the room and the table, everyone round it with their card and
// candle, the phase's content at the table's middle, the close and "Rolüm" at the top, the buttons
// at the foot.
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
  const queryClient = useQueryClient();
  useAdvance(roomId, state);
  const view = useView(roomId, state);
  const my = view.data;
  const role = my?.role ?? null;
  const me = faces.me;
  const alive = aliveSeats(state);
  const amAlive = role !== null && alive.includes(me);
  const endsAt = Date.parse(state.endsAt);
  // The large type (VampirOylamaDar): the scene fills the screen, so its scale is the window's.
  const win = useWindowDimensions();
  const k = Math.min(win.width / TABLE.frame.width, win.height / TABLE.frame.height);
  const narrow = win.fontScale >= NARROW_FONT ? narrowScale(win.fontScale, k) : undefined;

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
  // The role card held, and whether it has been (the card is seen before "Hazırım").
  const [holding, setHolding] = useState(false);
  const [seenRole, setSeenRole] = useState(false);
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
    if (held) {
      setSeenRole(true);
      haptic('selection');
    }
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

  // The phase's pill at the top of the stage.
  const pillLabel =
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
  const pillTone = state.phase === 'role' || state.phase === 'night' ? 'night' : 'day';

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

  let words: Words = {};
  let seats: SeatMark[] = seated.map((s) => mark(s));
  let dial: DialAt | null = null;
  let middle: ReactNode = null;
  let below: ReactNode = null;
  let foot: ReactNode = null;
  let onChoose: ((sid: string) => void) | undefined;
  let top: number = TABLE.stageTop.night;

  if (!my) {
    // The phone's own view is on its way (VampirYukleniyor): the night's table with no one at it,
    // the loader at its middle, no words; nothing that would show a watcher's screen to a player.
    // If it cannot be read, the error over the darkened scene (VampirHata).
    return (
      <GamePage
        testID="vampir-game"
        faces={faces}
        seats={seated.map((s) => mark(s))}
        phase="night"
        dial={null}
        onExit={onExit}
        empty
        stage={
          view.isError ? null : (
            <View style={[styles.under, { top: TABLE.loader.top }]}>
              <Loader kind="seesaw" size={TABLE.loader.size} label={tr.common.loading} />
            </View>
          )
        }
        cover={
          view.isError ? (
            <ViewError retrying={view.isFetching} onRetry={() => void view.refetch()} />
          ) : null
        }
      />
    );
  } else if (state.phase === 'role') {
    top = holding ? TABLE.stageTop.role : TABLE.stageTop.card;
    if (role === null) {
      words = { title: tr.vampir.dealing, note: tr.vampir.dealingNote };
    } else {
      const amReady = state.ready.includes(me);
      const vampire = role === 'vampir';
      words = holding
        ? { title: tr.vampir.roleIs(tr.vampir.roles[role].name), note: tr.vampir.roles[role].about }
        : { title: tr.vampir.cardTitle, note: tr.vampir.cardNote };
      seats = seated.map((s) =>
        mark(s, { slot: s === me, ally: holding && vampire && mates.includes(s) }),
      );
      middle = (
        <View style={{ marginTop: CARD_GAP }}>
          <TableCard role={role} open={holding} onHold={hold} label={tr.vampir.cardLabel} />
        </View>
      );
      below = (
        <>
          {holding && vampire && mates.length > 0 ? <Mates faces={faces} mates={mates} /> : null}
          <Text
            maxFontSizeMultiplier={MAX_FONT}
            style={[TABLE_TYPE.ready, { color: INK.stageSoft, marginTop: 6, textAlign: 'center' }]}
          >
            {tr.vampir.readyCount(state.ready.length, seated.length)}
          </Text>
        </>
      );
      // "Geceyi başlat" once everyone is ready (VampirRolKarti; the owner's choice, 5 Kasım: only
      // the phone holds it back, the server and the role's 30 seconds stay as they are).
      const allReady = seated.every((s) => state.ready.includes(s));
      const readyOff = amReady || !seenRole;
      const readyLabel = amReady ? tr.vampir.waitingOthers : tr.vampir.ready;
      foot = (
        <View style={{ flexDirection: 'row', gap: TABLE.footGap }}>
          {owner ? (
            <GlassBtn
              testID="vampir-begin"
              label={tr.vampir.beginNight}
              width={TABLE.begin}
              off={!allReady}
              loading={begin.isPending}
              onPress={() => begin.mutate()}
            />
          ) : null}
          {readyOff ? (
            <GlassBtn testID="vampir-ready" label={readyLabel} off onPress={() => undefined} />
          ) : (
            <View style={{ flex: 1 }}>
              <Button
                testID="vampir-ready"
                size="lg"
                label={readyLabel}
                loading={ready.isPending}
                onPress={() => ready.mutate()}
              />
            </View>
          )}
        </View>
      );
    }
  } else if (state.phase === 'night') {
    dial = TABLE.dial.night;
    if (!amAlive || my.role === null) {
      words =
        role === null
          ? { title: tr.vampir.nightGoesOn, note: tr.vampir.everyoneChooses }
          : { title: tr.vampir.deadTalk, note: tr.vampir.deadNight };
    } else {
      const myRole = my.role;
      const vampire = myRole === 'vampir';
      // A vampire sees the other vampires' picks (rule 3): their faces at the seat they chose.
      const pickedBy = new Map<string, string[]>();
      if (vampire) {
        for (const [v, t] of Object.entries(my.matePicks)) {
          pickedBy.set(t, [...(pickedBy.get(t) ?? []), v]);
        }
      }
      const target = my.pick ?? sel;
      if (my.pick) {
        const chosen = my.pick;
        const seen = myRole === 'gozcu' ? my.seen.find((s) => s.sid === chosen) : undefined;
        words = seen
          ? {
              title: seen.vampire
                ? tr.vampir.seerYes(nameOf(faces, chosen))
                : tr.vampir.seerNo(nameOf(faces, chosen)),
              note: seen.vampire ? tr.vampir.seerYesNote : tr.vampir.seerNoNote,
            }
          : {
              title: tr.vampir.choiceOf(nameOf(faces, chosen)),
              note: vampire
                ? tr.vampir.choiceVampir
                : myRole === 'doktor'
                  ? tr.vampir.choiceDoktor
                  : tr.vampir.choiceHidden,
            };
        seats = seated.map((s) =>
          mark(s, {
            pick: s === chosen,
            ally: vampire && mates.includes(s),
            pickedBy: pickedBy.get(s),
          }),
        );
        foot = <GlassSign>{tr.vampir.everyoneChooses}</GlassSign>;
      } else {
        const targets = nightTargets(state, me, myRole, my.mates, my.lastSave);
        words = { title: tr.vampir.roles[myRole].ask, note: tr.vampir.roles[myRole].askNote };
        seats = seated.map((s) => {
          const ally = vampire && mates.includes(s);
          return mark(s, {
            pick: sel === s,
            ally,
            pickedBy: pickedBy.get(s),
            dim: !ally && s !== me && !deadSet.has(s) && !targets.includes(s),
            choosable: targets.includes(s),
          });
        });
        onChoose = choose;
        foot = (
          <Button
            testID="vampir-pick"
            size="lg"
            label={tr.vampir.choose}
            disabled={!sel || !targets.includes(sel)}
            loading={pick.isPending}
            onPress={() => sel && pick.mutate(sel)}
          />
        );
      }
      if (target) {
        below = <Target faces={faces} sid={target} />;
      }
    }
  } else if (state.phase === 'morning') {
    top = TABLE.stageTop.morning;
    dial = TABLE.dial.morning;
    // The dead person's role stays hidden until the end (K-80).
    const v = state.victim;
    words = v
      ? v === me
        ? { title: tr.vampir.youDied, note: tr.vampir.youDiedNote }
        : { title: tr.vampir.died(nameOf(faces, v)), note: tr.vampir.roleHidden }
      : { title: tr.vampir.nobodyDied, note: tr.vampir.nobodyDiedNote };
    middle = (
      <View style={{ marginTop: VICTIM_GAP }}>
        {v ? (
          <RingedFace
            faces={faces}
            sid={v}
            size={TABLE.victim}
            ring={{ color: INK.victimEdge, inner: 2, outer: 2 }}
            dead
          />
        ) : (
          <CachedSvg xml={SUN_SVG} width={TABLE.victim} height={TABLE.victim / 2} />
        )}
      </View>
    );
    foot = <GlassSign>{state.winner ? tr.vampir.result : tr.vampir.dayStarts}</GlassSign>;
  } else if (state.phase === 'day') {
    top = TABLE.stageTop.day;
    dial = TABLE.dial.day;
    words = { title: tr.vampir.whoIs, note: tr.vampir.talk };
    foot =
      role === null || !amAlive ? (
        <GlassSign>{role === null ? tr.vampir.watchTalk : tr.vampir.deadWatch}</GlassSign>
      ) : owner ? (
        <Button
          testID="vampir-to-vote"
          size="lg"
          label={tr.vampir.toVote}
          loading={toVote.isPending}
          onPress={() => toVote.mutate()}
        />
      ) : (
        <GlassSign>{tr.vampir.voteOpensNote}</GlassSign>
      );
  } else if (state.phase === 'vote') {
    top = TABLE.stageTop.vote;
    dial = narrow ? TABLE.dial.narrow : TABLE.dial.vote;
    const tally = voteTally(state);
    const mine = state.votes[me];
    const canVote = amAlive && !mine;
    const living = new Set(alive);
    words = {
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
    onChoose = canVote ? choose : undefined;
    // Who got the most votes at the middle with those who voted for them round them, the next
    // ones under it (the panels' .cand); with the large type only the first, the others' votes in
    // their seats' amber counts (VampirOylamaDar).
    const ranked = seated
      .filter((s) => (tally[s] ?? 0) > 0)
      .sort((a, b) => (tally[b] ?? 0) - (tally[a] ?? 0));
    below = (
      <Candidates
        faces={faces}
        top={top}
        ranked={ranked.slice(0, narrow ? 1 : 1 + MAX_NEXT)}
        votersOf={(s) => votersFor(state, s)}
        narrow={narrow}
      />
    );
    foot = canVote ? (
      <Button
        testID="vampir-vote"
        size="lg"
        label={tr.vampir.giveVote}
        disabled={!sel || sel === me}
        loading={vote.isPending}
        onPress={() => sel && vote.mutate(sel)}
      />
    ) : null;
  } else if (state.phase === 'verdict') {
    top = TABLE.stageTop.verdict;
    dial = TABLE.dial.verdict;
    // The one voted out keeps their role hidden until the end (K-80): their face greyed with the
    // votes under it (VampirEleme); a tie, the moon where the morning has its sun.
    const o = state.out;
    words = o
      ? {
          title: o === me ? tr.vampir.youOut : tr.vampir.out(nameOf(faces, o)),
          note: tr.vampir.roleHidden,
        }
      : { title: tr.vampir.tie, note: tr.vampir.tieNote };
    middle = (
      <View style={{ marginTop: VICTIM_GAP }}>
        {o ? (
          <OutFace faces={faces} sid={o} votes={votersFor(state, o).length} />
        ) : (
          <CachedSvg xml={MOON_SVG} width={TABLE.victim} height={TABLE.victim} />
        )}
      </View>
    );
    foot = <GlassSign>{state.winner ? tr.vampir.result : tr.vampir.nightComes}</GlassSign>;
  }

  // The vote's words sit under its dial; every other phase's under its pill. With the large type
  // the vote's pill and dial share a row, the words under them (VampirOylamaDar).
  const voteWords = state.phase === 'vote';
  const wide = voteWords && narrow !== undefined;
  const n = TABLE.narrow;
  return (
    <GamePage
      testID="vampir-game"
      faces={faces}
      seats={seats}
      phase={SCENE_OF[state.phase]}
      dial={dial}
      onChoose={onChoose}
      onExit={onExit}
      right={right}
      error={failed ? errorMessage(failed) : null}
      foot={foot}
      narrow={voteWords ? narrow : undefined}
      stage={
        wide ? (
          <>
            <Stage top={n.pill.top} left={n.pill.left} width={n.pill.width}>
              <Pill label={pillLabel} tone={pillTone} big={narrow} />
            </Stage>
            {dial ? <DialNumber endsAt={endsAt} at={dial} big={narrow} /> : null}
            <Stage top={n.words.top} left={n.words.left} width={n.words.width}>
              <StageWords words={words} first big={narrow} />
            </Stage>
            {below}
          </>
        ) : (
          <>
            <Stage top={top}>
              <Pill label={pillLabel} tone={pillTone} />
              {middle}
              {voteWords ? null : <StageWords words={words} />}
              {voteWords ? null : below}
            </Stage>
            {dial ? <DialNumber endsAt={endsAt} at={dial} /> : null}
            {voteWords ? (
              <>
                <Stage top={TABLE.stageTop.voteText}>
                  <StageWords words={words} first />
                </Stage>
                {below}
              </>
            ) : null}
          </>
        )
      }
    />
  );
}

// The verdict's voted out (VampirEleme .vict): the face greyed, the votes in amber over its foot.
function OutFace({ faces, sid, votes }: { faces: Faces; sid: string; votes: number }) {
  const v = TABLE.votes;
  return (
    <View style={{ alignItems: 'center', paddingBottom: v.height - v.over }}>
      <RingedFace
        faces={faces}
        sid={sid}
        size={TABLE.victim}
        ring={{ color: INK.victimEdge, inner: 2, outer: 2 }}
        dead
      />
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          height: v.height,
          paddingHorizontal: 7,
          borderRadius: v.height / 2,
          backgroundColor: INK.amber,
          justifyContent: 'center',
        }}
      >
        <NativeShadow css={INK.votesShadow} radius={v.height / 2} />
        <Text maxFontSizeMultiplier={1} style={[TABLE_TYPE.votes, { color: INK.amberInk }]}>
          {tr.vampir.votes(votes)}
        </Text>
      </View>
    </View>
  );
}

// The phone's own view could not be read (VampirHata): the scene darkened, the glass block at its
// middle with the app's error mark, its words and "Tekrar dene" (MekanHata's; no new words).
function ViewError({ retrying, onRetry }: { retrying: boolean; onRetry: () => void }) {
  const e = TABLE.error;
  return (
    <View style={StyleSheet.absoluteFill}>
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, gradientStyle(INK.dim)]} />
      <View
        accessibilityRole="alert"
        style={{
          position: 'absolute',
          left: e.side,
          right: e.side,
          top: e.top,
          paddingTop: e.padTop,
          paddingHorizontal: e.padSide,
          paddingBottom: e.padBottom,
          borderRadius: e.radius,
          backgroundColor: INK.errGlass,
          borderWidth: 1,
          borderColor: INK.errEdge,
          alignItems: 'center',
        }}
      >
        <NativeShadow css={INK.errShadow} radius={e.radius} border={1} />
        <CachedSvg xml={ERROR_MARK} width={e.mark} height={e.mark} />
        <Text
          maxFontSizeMultiplier={MAX_FONT}
          style={[TABLE_TYPE.error, { color: INK.stage, textAlign: 'center', marginTop: 12 }]}
        >
          {tr.common.genericError}
        </Text>
        <Pressable
          testID="vampir-retry"
          accessibilityRole="button"
          accessibilityLabel={tr.common.retry}
          accessibilityState={{ busy: retrying }}
          disabled={retrying}
          onPress={onRetry}
          style={{
            marginTop: 16,
            height: TABLE.sign,
            paddingHorizontal: 20,
            borderRadius: TABLE.sign / 2,
            backgroundColor: INK.errBtn,
            borderWidth: 1,
            borderColor: INK.errBtnEdge,
            justifyContent: 'center',
          }}
        >
          <Text
            maxFontSizeMultiplier={MAX_FONT}
            numberOfLines={1}
            adjustsFontSizeToFit
            style={[TABLE_TYPE.errorBtn, { color: INK.white }]}
          >
            {retrying ? '…' : tr.common.retry}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
// The app's error mark (MekanHata: the two capsules, 40).
const ERROR_MARK = `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><rect x="7" y="7" width="11" height="26" rx="5.5" fill="${BRAND.purple}"/><rect x="20" y="9" width="11" height="26" rx="5.5" fill="${BRAND.pink}"/></svg>`;
const CARD_GAP = 10;
const VICTIM_GAP = 12;
// The vote's candidates under the first: up to three.
const MAX_NEXT = 3;

// The page: the scene full screen; over it the close and "Rolüm" (or a chip) at the top, the
// foot's dark fall with the buttons and an error over them.
export function GamePage({
  testID,
  faces,
  seats,
  phase,
  dial,
  stage,
  onChoose,
  onExit,
  right,
  error,
  foot,
  empty,
  narrow,
  cover,
}: {
  testID: string;
  faces: Faces;
  seats: readonly SeatMark[];
  phase: ScenePhase;
  dial: DialAt | null;
  stage: ReactNode;
  onChoose?: (sid: string) => void;
  onExit?: () => void;
  right?: ReactNode;
  error?: string | null;
  foot?: ReactNode;
  // No one at the table yet (VampirYukleniyor); the large type's scale; over everything but the
  // close (VampirHata).
  empty?: boolean;
  narrow?: number;
  cover?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1 }} testID={testID}>
      {/* The room is dark in every phase and theme: light clock and battery over it. */}
      <StatusBar style="light" />
      <TableScene
        faces={faces}
        seats={seats}
        phase={phase}
        dial={dial}
        stage={stage}
        onChoose={onChoose}
        empty={empty}
        narrow={narrow}
      />
      <FootShade />
      {cover}
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          left: TABLE.side,
          right: TABLE.side,
          top: insets.top + TABLE.roundTop,
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          zIndex: 3,
        }}
      >
        {onExit ? (
          <TableRound label={tr.vampir.exit} xml={X_SVG} onPress={onExit} testID="vampir-exit" />
        ) : (
          <View />
        )}
        {right ?? null}
      </View>
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          left: FOOT_SIDE,
          right: FOOT_SIDE,
          bottom: Math.max(TABLE.footBottom, insets.bottom + FOOT_OVER_BAR),
          gap: TABLE.footGap,
        }}
      >
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
const FOOT_SIDE = 20;
const FOOT_OVER_BAR = 10;

// ---- The stage at the table's middle (the panels' .stage) ----

export type Words = { title?: string; note?: string; big?: boolean };

export function Stage({
  top,
  left = TABLE.stage.left,
  width = TABLE.stage.width,
  children,
}: {
  top: number;
  left?: number;
  width?: number;
  children: ReactNode;
}) {
  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', left, width, top, alignItems: 'center' }}
    >
      {children}
    </View>
  );
}

// `big` the large type's scale (.ph.big .stage .pill).
export function Pill({
  label,
  tone,
  big,
}: {
  label: string;
  tone: 'night' | 'day' | 'end';
  big?: number;
}) {
  const p = INK.pill[tone];
  const h = big ? BIG.pill.height * big : PILL;
  return (
    <View
      style={{
        height: h,
        paddingHorizontal: big ? BIG.pill.pad * big : 8,
        borderRadius: h / 2,
        backgroundColor: p.fill,
        borderWidth: 1,
        borderColor: p.edge,
        justifyContent: 'center',
      }}
    >
      <Text
        maxFontSizeMultiplier={1}
        style={[TABLE_TYPE.pill, { color: p.ink }, big ? scaleType(TABLE_TYPE.bigPill, big) : null]}
      >
        {label}
      </Text>
    </View>
  );
}
const PILL = 18;
// The large type's stage (.ph.big .stage .pill, .h, .s; .cand .cl), at the panel's scale.
const BIG = { pill: { height: 26, pad: 12 }, noteGap: 6 };

// `big` the large type's scale (.ph.big .stage .h, .s): its own sizes, not the system's again.
export function StageWords({ words, first, big }: { words: Words; first?: boolean; big?: number }) {
  return (
    <>
      {words.title ? (
        <Text
          maxFontSizeMultiplier={big ? 1 : MAX_FONT}
          style={[
            words.big ? TABLE_TYPE.big : TABLE_TYPE.title,
            { color: INK.stage, textAlign: 'center', marginTop: first ? 0 : 8 },
            big ? scaleType(words.big ? TABLE_TYPE.big : TABLE_TYPE.bigTitle, big) : null,
          ]}
        >
          {words.title}
        </Text>
      ) : null}
      {words.note ? (
        <Text
          maxFontSizeMultiplier={big ? 1 : MAX_FONT}
          style={[
            TABLE_TYPE.note,
            { color: INK.stageNote, textAlign: 'center', marginTop: big ? BIG.noteGap : 5 },
            big ? scaleType(TABLE_TYPE.bigNote, big) : null,
          ]}
        >
          {words.note}
        </Text>
      ) : null}
    </>
  );
}

// A vampire's mates under the card while it is held (the panels' .mate).
function Mates({ faces, mates }: { faces: Faces; mates: readonly string[] }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 9 }}>
      <View style={{ flexDirection: 'row', gap: 2 }}>
        {mates.map((m) => (
          <RingedFace
            key={m}
            faces={faces}
            sid={m}
            size={TABLE.mate - 3}
            ring={{ color: INK.pink, inner: 1.5, outer: 1.5 }}
          />
        ))}
      </View>
      <Text
        maxFontSizeMultiplier={MAX_FONT}
        style={[TABLE_TYPE.mate, { color: INK.stageNote, flexShrink: 1 }]}
      >
        {tr.vampir.mates(mates.map((m) => nameOf(faces, m)))}
      </Text>
    </View>
  );
}

// The night's chosen one under the dial (the panels' .tgt, .tn): the face in pink, the name.
function Target({ faces, sid }: { faces: Faces; sid: string }) {
  return (
    <View
      pointerEvents="none"
      style={[styles.under, { top: TABLE.target.top - TABLE.stageTop.night }]}
    >
      <RingedFace
        faces={faces}
        sid={sid}
        size={TABLE.target.face}
        ring={{ color: INK.pink, inner: 3, outer: 3 }}
        shadow={TABLE_SHADOW.target}
      />
      <View style={{ marginTop: 8 }}>
        <NamePill name={nameOf(faces, sid)} pick tag />
      </View>
    </View>
  );
}

// The vote's candidates (the panels' .cand): the first at the middle with those who voted for
// them round their face, the next ones under it, smaller; with three or more next ones only their
// counts.
function Candidates({
  faces,
  top,
  ranked,
  votersOf,
  narrow,
}: {
  faces: Faces;
  top: number;
  ranked: readonly string[];
  votersOf: (sid: string) => readonly string[];
  narrow?: number;
}) {
  const c = TABLE.candidates;
  const [first, ...rest] = ranked;
  if (!first) return null;
  const firstY = narrow ? TABLE.narrow.candidate : c.top;
  const xs = rest.length === 1 ? [0] : rest.length === 2 ? [-46, 46] : [-56, 0, 56];
  const short = rest.length > 2;
  return (
    <>
      <Candidate
        faces={faces}
        sid={first}
        x={0}
        y={firstY - top}
        top={top}
        size={c.face}
        voter={c.voter}
        voters={votersOf(first)}
        big={narrow}
      />
      {rest.map((s, i) => (
        <Candidate
          key={s}
          faces={faces}
          sid={s}
          x={xs[i] ?? 0}
          y={c.top + c.below - top}
          top={top}
          size={c.small}
          voter={c.smallVoter}
          voters={votersOf(s)}
          short={short}
        />
      ))}
    </>
  );
}

function Candidate({
  faces,
  sid,
  x,
  y,
  top,
  size,
  voter,
  voters,
  short,
  big,
}: {
  faces: Faces;
  sid: string;
  x: number;
  y: number;
  top: number;
  size: number;
  voter: number;
  voters: readonly string[];
  short?: boolean;
  big?: number;
}) {
  const out = size + 4;
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: TABLE.frame.cx + x - out / 2,
        top: top + y - out / 2,
        width: out,
        height: out,
      }}
    >
      <RingedFace
        faces={faces}
        sid={sid}
        size={size}
        ring={{ color: INK.cream, inner: 2, outer: 2 }}
        shadow={TABLE_SHADOW.candidate}
      />
      {voters.map((v, j) => (
        <Voter
          key={v}
          faces={faces}
          sid={v}
          at={voterAt(j, voters.length, size / 2, voter)}
          size={voter}
          color={INK.amber}
          center={out / 2}
        />
      ))}
      <View
        style={{
          position: 'absolute',
          left: out / 2 - NAME_W / 2,
          width: NAME_W,
          top: out / 2 + size / 2 + (short ? 5 : 6),
          alignItems: 'center',
        }}
      >
        <NamePill name={short ? undefined : nameOf(faces, sid)} count={voters.length} big={big} />
      </View>
    </View>
  );
}
const NAME_W = 120;

// A chip at the top right in place of "Rolüm": "Öldün", "İzliyorsun".
function Chip({ label }: { label: string }) {
  return (
    <View
      style={{
        height: TABLE.round,
        paddingHorizontal: 16,
        borderRadius: TABLE.round / 2,
        backgroundColor: INK.round,
        borderWidth: 1.5,
        borderColor: INK.roundEdge,
        justifyContent: 'center',
      }}
    >
      <Text maxFontSizeMultiplier={1} style={[TABLE_TYPE.foot, { color: INK.roundInk }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Under the stage's words, at a height of its own, across the stage.
  under: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
});
