import {
  IBRE_CONFIG,
  ibreAutoLockDue,
  ibrePhoneRole,
  type IbreReveal,
  type IbreSide,
  type IbreState,
} from '@shared/ibre.ts';
import type { TableSide } from '@shared/tabu.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';

import { Button } from '@/components/Button';
import { Text } from '@/components/Text';
import { roomKeys } from '@/features/rooms/queries';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { gamesApi } from '@/lib/api';
import { useNow } from '@/lib/useNow';
import { FEEL_ERROR } from '@/lib/hapticMoments';

import { useTheme } from '@/theme/ThemeProvider';
import { SPACING, type TypeVariant } from '@/theme/tokens';

import { ClockPill, TeamScore } from '../GameBits';
import { StageFit, useStageRoom } from '../GameStage';
import { TURN_CIRCLE_MIN, TurnReady } from '../TurnReady';
import { Dial, DialColumnContext, NeedleDial, NeedleReveal, SideChoice, TargetHold } from './Ibre';

// The dials' widest; a phone narrower than this gets its own width (measured, not assumed).
const DIAL_MAX = 360;
// The narrowest a dial gets on a short screen; below it the middle scrolls instead.
const DIAL_MIN = 120;

// The dials take the width their column really has, and on a timed screen no more than the height
// left lets them have (CLAUDE.md → Ekran davranışı). `dials` half dials are stacked in the block;
// `outside` is the height of what else shares the middle (TurnReady, a line of text).
export function DialWidth({
  children,
  dials = 1,
  outside = 0,
}: {
  children: (width: number) => ReactNode;
  dials?: number;
  outside?: number;
}) {
  const room = useStageRoom();
  const [width, setWidth] = useState(0);
  // The block's own height at the width it was drawn at: what it holds besides the half dials (the
  // hubs, the ends, the target's number, the − / + row, a reveal's points) is measured, not guessed;
  // narrower dials only ever make that taller, so the width settles in a step or two.
  const [drawn, setDrawn] = useState<{ w: number; h: number } | null>(null);
  let w = Math.min(width, DIAL_MAX);
  if (room !== null) {
    const besides = drawn ? drawn.h - (drawn.w / 2) * dials : 0;
    w = Math.min(w, Math.max(DIAL_MIN, Math.floor(((room - outside - besides) / dials) * 2)));
  }
  return (
    <View
      onLayout={(e) => setWidth(Math.min(DIAL_MAX, Math.floor(e.nativeEvent.layout.width)))}
      testID="ibre-dial-area"
    >
      <DialColumnContext.Provider value={width}>
        {w > 0 ? (
          <View onLayout={(e) => setDrawn({ w, h: Math.ceil(e.nativeEvent.layout.height) })}>
            {children(w)}
          </View>
        ) : null}
      </DialColumnContext.Provider>
    </View>
  );
}

// Heights of what shares a timed screen's middle with the dials (DialWidth's `outside`); texts grow
// with the font scale.
export function useDialReserve() {
  const { typography } = useTheme();
  const { fontScale } = useWindowDimensions();
  const line = (variant: TypeVariant, lines = 1) =>
    Math.ceil(typography[variant].lineHeight * Math.max(1, fontScale)) * lines;
  return {
    // TurnReady at its smallest (the circle, a line and a two-line hint), and the gap before it.
    ready: SPACING[2] + TURN_CIRCLE_MIN + SPACING[3] * 2 + line('heading') + line('fine', 2),
    // A text of `lines` lines, and the gap before it.
    text: (lines: number, variant: TypeVariant = 'bodyStrong') => SPACING[2] + line(variant, lines),
  };
}

// A round's reveal (canvas: İbrenin açılışı): the bands, the needle, the points and the side guess.
export function RoundReveal({
  reveal,
  guesser,
  brand,
  outside,
}: {
  reveal: IbreReveal;
  // The other table's alias, or Takım A / B.
  guesser: string;
  brand?: string;
  // Height of what else shares the screen's middle (DialWidth).
  outside?: number;
}) {
  return (
    <DialWidth outside={outside}>
      {(w) => (
        <NeedleReveal
          width={w}
          left={reveal.scale.left}
          right={reveal.scale.right}
          target={reveal.target}
          needle={reveal.needle}
          points={reveal.band}
          detail={tr.ibre.revealDetail(
            reveal.target,
            reveal.needle,
            guesser,
            reveal.side,
            reveal.sidePoint,
          )}
          brand={brand}
        />
      )}
    </DialWidth>
  );
}

const other = (side: TableSide): TableSide => (side === 'owner' ? 'guest' : 'owner');

// The round's header: where it is, the clock, both scores.
export function IbreHeader({
  state,
  now,
  names,
  mine,
}: {
  state: IbreState;
  now: number;
  names: Record<TableSide, string>;
  mine: TableSide | null;
}) {
  const secondsLeft = Math.max(0, Math.ceil(((state.endsAt ?? now) - now) / 1000));
  return (
    <>
      <View className="flex-row items-center justify-between">
        <Text variant="overline" tone="muted">
          {tr.ibre.round(state.roundNo, state.totalRounds)}
        </Text>
        <ClockPill seconds={secondsLeft} />
      </View>
      <View className="flex-row gap-2.5">
        {(['owner', 'guest'] as const).map((side) => (
          // Straight in the row: TeamScore fills its half (a wrapper collapsed it to a strip).
          <TeamScore
            key={side}
            name={names[side]}
            note={side === mine ? tr.games.you : ''}
            score={state.scores[side]}
            active={side === state.turnTable}
          />
        ))}
      </View>
    </>
  );
}

type Props = {
  roomId: string;
  state: IbreState | null;
  side: TableSide;
  // This phone, the phones on its side now, and a phone's alias in the room (docs/SPEC_V3.md §22.E).
  sessionId: string;
  sidePhones: number;
  aliasOf: (sessionId: string) => string | undefined;
  aliases: Record<TableSide, string>;
};

// Two-table İbre (docs/SPEC_V3.md §20.5): the server keeps the target, the clocks and the points.
// Başla on the describing table; when a clock runs out either phone moves the game on
// (ibre/advance, idempotent; the ready clock starts the turn from readyEndsAt). Faz 2 (§22.E): the
// phone that starts the round describes it and alone sees the target; its teammates move and lock
// the needle (the describer when it was alone, or once its teammates left).
export function IbreGame({ roomId, state, side, sessionId, sidePhones, aliasOf, aliases }: Props) {
  const now = useNow(200);
  const queryClient = useQueryClient();
  const refresh = () => void queryClient.invalidateQueries({ queryKey: roomKeys.room(roomId) });
  const begin = useMutation({ mutationFn: () => gamesApi.ibreBegin(roomId), onSettled: refresh });
  const advance = useMutation({
    mutationFn: () => gamesApi.ibreAdvance(roomId),
    onSettled: refresh,
  });
  const lock = useMutation({
    meta: FEEL_ERROR,
    mutationFn: (v: { round: number; value: number }) =>
      gamesApi.ibreLock(roomId, v.round, v.value),
    onSettled: refresh,
  });
  const choose = useMutation({
    meta: FEEL_ERROR,
    mutationFn: (v: { round: number; side: IbreSide }) =>
      gamesApi.ibreSide(roomId, v.round, v.side),
    onSettled: refresh,
  });
  // The target, asked for while held (ibre/target) and kept for the round.
  const [target, setTarget] = useState<{ round: number; value: number } | null>(null);
  const ask = useMutation({
    mutationFn: (round: number) => gamesApi.ibreTarget(roomId, round),
    onSuccess: (res) => setTarget({ round: res.roundNo, value: res.target }),
  });
  // This phone's needle and side guess, per round.
  const [needle, setNeedle] = useState<{ round: number; value: number }>({ round: 0, value: 50 });
  const sizes = useDialReserve();
  const [picked, setPicked] = useState<{ round: number; side: IbreSide } | null>(null);

  // Once per clock: advance after readyEndsAt or endsAt.
  const { mutate: advanceNow } = advance;
  const fired = useRef<string | null>(null);
  const clock = state?.turnPhase === 'ready' ? state.readyEndsAt : (state?.endsAt ?? null);
  const clockKey = state ? `${state.roundNo}:${state.turnPhase}:${clock}` : '';
  useEffect(() => {
    if (!state || clock === null || now < clock || fired.current === clockKey) return;
    fired.current = clockKey;
    advanceNow();
  }, [now, clock, clockKey, state, advanceNow]);

  // The needle, locked where it stands in the last 3 seconds unless locked by hand (docs/SPEC_V3.md
  // §20.5a), by a phone that may lock it. Once per round; the server ignores a second lock (the
  // first of the teammates wins).
  const { mutate: lockNow } = lock;
  const lockedRound = useRef<number | null>(null);
  const autoValue = state && needle.round === state.roundNo ? needle.value : 50;
  const role = state
    ? ibrePhoneRole(state, side, sessionId, sidePhones)
    : { seesTarget: false, locks: false };
  const locks = role.locks;
  useEffect(() => {
    if (!state || !locks || !ibreAutoLockDue(state, now)) return;
    if (lockedRound.current === state.roundNo) return;
    lockedRound.current = state.roundNo;
    lockNow({ round: state.roundNo, value: autoValue });
  }, [now, state, locks, autoValue, lockNow]);

  if (!state) {
    return (
      <Text tone="muted" align="center">
        {tr.activities.ibre.body}
      </Text>
    );
  }

  const describing = state.turnTable === side;
  const round = state.roundNo;
  const value = needle.round === round ? needle.value : 50;
  const error = lock.error ?? choose.error ?? ask.error;

  if (state.turnPhase === 'ready') {
    const last = state.reveal;
    return (
      <StageFit>
        {last ? (
          <RoundReveal reveal={last} guesser={aliases[other(last.table)]} outside={sizes.ready} />
        ) : (
          <DialWidth outside={sizes.ready}>
            {(w) => (
              <Dial
                width={w}
                left={state.scale.left}
                right={state.scale.right}
                accessibilityLabel={tr.ibre.scale(state.scale.left, state.scale.right)}
              />
            )}
          </DialWidth>
        )}
        <TurnReady
          testID="ibre-ready"
          describing={describing}
          describingAlias={aliases[state.turnTable]}
          secondsLeft={Math.max(0, Math.ceil(((state.readyEndsAt ?? now) - now) / 1000))}
          totalSeconds={IBRE_CONFIG.readySeconds}
          onStart={() => begin.mutate()}
          starting={begin.isPending}
          hint={tr.ibre.readyHint}
          waitingHint={tr.ibre.readyWaitingHint}
        />
      </StageFit>
    );
  }

  const header = (
    <View className="gap-2.5">
      <IbreHeader state={state} now={now} names={aliases} mine={side} />
    </View>
  );
  const errorLine = error ? (
    <Text variant="fine" tone="danger">
      {errorMessage(error)}
    </Text>
  ) : null;

  if (state.turnPhase === 'running') {
    const describer =
      (state.describer ? aliasOf(state.describer) : undefined) ?? aliases[state.turnTable];
    // The describer whose teammates lock: the target only, and who locks it.
    if (describing && role.seesTarget && !role.locks) {
      return (
        <StageFit testID="ibre-round" status={header} actions={errorLine}>
          <DialWidth outside={sizes.text(2, 'fine')}>
            {(w) => (
              <TargetHold
                width={w}
                left={state.scale.left}
                right={state.scale.right}
                target={target?.round === round ? target.value : null}
                onHoldStart={() => {
                  if (target?.round !== round && !ask.isPending) ask.mutate(round);
                }}
                onHoldEnd={() => undefined}
              />
            )}
          </DialWidth>
          <Text variant="fine" tone="text" align="center" testID="ibre-team-locks">
            {tr.ibre.teamLocks}
          </Text>
        </StageFit>
      );
    }
    // A teammate who locks: the needle and "İbreyi onayla", no target.
    if (describing && role.locks && !role.seesTarget) {
      return (
        <StageFit
          testID="ibre-round"
          status={header}
          actions={
            <>
              <Button
                testID="ibre-lock"
                size="lg"
                label={tr.ibre.lock}
                onPress={() => {
                  lockedRound.current = round;
                  lock.mutate({ round, value });
                }}
                loading={lock.isPending}
                disabled={lock.isPending}
              />
              {errorLine}
            </>
          }
        >
          <Text variant="bodyStrong" align="center" accessibilityLiveRegion="polite">
            {tr.ibre.teamClue(describer)}
          </Text>
          <DialWidth outside={sizes.text(1)}>
            {(w) => (
              <NeedleDial
                width={w}
                left={state.scale.left}
                right={state.scale.right}
                value={value}
                onChange={(v) => setNeedle({ round, value: v })}
                disabled={lock.isPending}
              />
            )}
          </DialWidth>
        </StageFit>
      );
    }
    // The describing table: the hold-to-see dial over the needle's, "İbreyi onayla" at the bottom.
    // The clue's rules are on the ready screen (readyHint), not under the clock.
    return describing && role.seesTarget ? (
      <StageFit
        testID="ibre-round"
        status={header}
        actions={
          <>
            <Button
              testID="ibre-lock"
              size="lg"
              label={tr.ibre.lock}
              onPress={() => {
                lockedRound.current = round;
                lock.mutate({ round, value });
              }}
              loading={lock.isPending}
              disabled={lock.isPending}
            />
            {errorLine}
          </>
        }
      >
        <DialWidth dials={2}>
          {(w) => (
            <View className="gap-2">
              <TargetHold
                width={w}
                left={state.scale.left}
                right={state.scale.right}
                target={target?.round === round ? target.value : null}
                onHoldStart={() => {
                  if (target?.round !== round && !ask.isPending) ask.mutate(round);
                }}
                onHoldEnd={() => undefined}
              />
              <NeedleDial
                width={w}
                left={state.scale.left}
                right={state.scale.right}
                value={value}
                onChange={(v) => setNeedle({ round, value: v })}
                disabled={lock.isPending}
              />
            </View>
          )}
        </DialWidth>
      </StageFit>
    ) : (
      <StageFit testID="ibre-round" status={header} actions={errorLine}>
        <DialWidth outside={sizes.text(2)}>
          {(w) => (
            <Dial
              width={w}
              left={state.scale.left}
              right={state.scale.right}
              accessibilityLabel={tr.ibre.scale(state.scale.left, state.scale.right)}
            />
          )}
        </DialWidth>
        <Text variant="bodyStrong" align="center" accessibilityLiveRegion="polite">
          {describing ? tr.ibre.teamClue(describer) : tr.ibre.otherClue(aliases[state.turnTable])}
        </Text>
      </StageFit>
    );
  }

  // The other table's 15 seconds: the locked needle, "Solunda / Sağında" at the bottom.
  const mine = picked?.round === round ? picked.side : null;
  return (
    <StageFit
      testID="ibre-side-phase"
      status={header}
      actions={
        <>
          {describing ? (
            <Text variant="bodyStrong" align="center" accessibilityLiveRegion="polite">
              {tr.ibre.sideWaiting(aliases[other(side)])}
            </Text>
          ) : (
            <>
              <Text variant="bodyStrong" align="center">
                {tr.ibre.sideTitle}
              </Text>
              <SideChoice
                selected={mine}
                onSelect={(s) => {
                  setPicked({ round, side: s });
                  choose.mutate({ round, side: s });
                }}
                disabled={choose.isPending || mine !== null}
              />
              <Text variant="fine" align="center">
                {tr.ibre.sideHint(IBRE_CONFIG.sideSeconds)}
              </Text>
            </>
          )}
          {errorLine}
        </>
      }
    >
      <DialWidth>
        {(w) => (
          <Dial
            width={w}
            left={state.scale.left}
            right={state.scale.right}
            needle={state.needle ?? 50}
            accessibilityLabel={tr.ibre.needleLabel(
              state.needle ?? 50,
              state.scale.left,
              state.scale.right,
            )}
          />
        )}
      </DialWidth>
    </StageFit>
  );
}
