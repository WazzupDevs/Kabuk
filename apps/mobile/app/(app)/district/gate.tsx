import { upperTr } from '@shared/trText.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Btn, Round, T, useKit } from '@/aura/kit';
import { boxShadowParts } from '@/components/NativeShadow';
import { Screen } from '@/components/Screen';
import { districtScreen } from '@/features/district/flow';
import { Foot, RISO, StillScene, WarnRow } from '@/features/district/parts';
import { districtKeys, putDistrictState, useDistrictState } from '@/features/district/queries';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { track } from '@/lib/analytics';
import { ApiError, districtApi } from '@/lib/api';
import { isNetworkError } from '@/lib/connection';
import { useLabOff } from '@/lib/drawLab';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { SEMT } from '@/theme/semt';
import { SPACING } from '@/theme/tokens';

// Geçit (Gecit, GecitHal; docs/SPEC_V4.md §4.V): the day's question pinned to the door, four tickets.
// Choosing sends nothing; [Geçide söyle] sends, the tickets locked meanwhile, an error in the flow
// over the button with the choice kept. The right option never comes to the phone: the answer is
// only right or wrong.
export default function DistrictGateScreen() {
  const queryClient = useQueryClient();
  const state = useDistrictState();
  const [choice, setChoice] = useState<number | null>(null);
  const answer = useMutation({
    meta: FEEL_ERROR,
    mutationFn: ({ day, pick }: { day: string; pick: number }) => districtApi.answer(day, pick),
    onSuccess: (res) => {
      putDistrictState(queryClient, res.state);
      track('gecit_answered', { correct: res.correct });
      router.replace(res.correct ? '/district/open' : '/district/closed');
    },
    onError: (err) => {
      // The day changed under the question: the new one, chosen afresh.
      if (err instanceof ApiError && err.code === 'question_expired') {
        setChoice(null);
        void queryClient.invalidateQueries({ queryKey: districtKeys.state });
      }
    },
  });

  const s = state.data;
  // Answered elsewhere, or the gate open without a question: where the state goes now.
  if (s && !s.question && !answer.isPending && !answer.isSuccess) {
    const to = districtScreen(s);
    return <Redirect href={to && to !== '/district/gate' ? to : '/district/open'} />;
  }
  const q = s?.question ?? null;
  const sending = answer.isPending;

  return (
    <Screen
      top={
        <View
          style={{
            minHeight: TOP_BAR,
            flexDirection: 'row',
            alignItems: 'center',
            gap: SPACING[3],
          }}
        >
          <Round icon="back" label={tr.common.back} onPress={() => router.back()} />
          <View style={{ flex: 1 }}>
            {s?.district ? <T v="eyebrow">{s.district.name}</T> : null}
            <T v="h3" accessibilityRole="header">
              {tr.district.gate.title}
            </T>
          </View>
        </View>
      }
      footer={
        <Foot>
          {answer.isError ? (
            <WarnRow
              tone="danger"
              testID="gecit-error"
              text={
                isNetworkError(answer.error)
                  ? tr.district.gate.sendError
                  : errorMessage(answer.error)
              }
            />
          ) : null}
          {q || !state.isError ? (
            <Btn
              block
              label={tr.district.gate.send}
              testID="gecit-send"
              disabled={choice === null || !q}
              loading={sending}
              onPress={() => {
                if (q && choice !== null && !sending) answer.mutate({ day: q.day, pick: choice });
              }}
            />
          ) : (
            <Btn
              block
              label={tr.district.gate.retry}
              loading={state.isFetching}
              onPress={() => void state.refetch()}
            />
          )}
        </Foot>
      }
    >
      <View testID="district-gate">
        <StillScene
          source={RISO.closed}
          height={SEMT.scene.gecit}
          label={tr.district.gate.sceneLabel}
        />
        <View
          style={{
            marginTop: -SEMT.note.overlap,
            marginHorizontal: SEMT.note.inset,
          }}
        >
          {q ? (
            <Paper prompt={q.prompt} />
          ) : state.isError ? (
            <WarnRow tone="danger" text={tr.district.gate.loadError} />
          ) : (
            <PaperSkeleton />
          )}
        </View>
        {q ? (
          <View
            accessibilityRole="radiogroup"
            accessibilityLabel={tr.district.gate.options}
            style={{
              marginTop: SEMT.ticket.top,
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: SEMT.ticket.gap,
            }}
          >
            {q.options.map((text, i) => (
              <Ticket
                key={i}
                letter={tr.district.gate.letters[i] ?? ''}
                text={text}
                on={choice === i}
                locked={sending}
                onPress={() => setChoice(i)}
              />
            ))}
          </View>
        ) : null}
      </View>
    </Screen>
  );
}
const TOP_BAR = 56;

// `.note`: the question's paper, the same in both schemes, tilted, its pin at the top.
function Paper({ prompt }: { prompt: string }) {
  const { scheme } = useKit();
  const n = SEMT.note;
  const shadow = boxShadowParts(
    useLabOff('golge'),
    scheme === 'light' ? n.shadow : `0px 0px 0px 1px ${n.darkEdge}`,
    n.radius,
  );
  return (
    <View
      style={{
        transform: [{ rotate: `${n.rotateDeg}deg` }],
        borderRadius: n.radius,
        boxShadow: shadow.boxShadow,
      }}
    >
      {shadow.node}
      <View
        style={{
          backgroundColor: n.paper,
          borderRadius: n.radius,
          paddingTop: n.padTop,
          paddingHorizontal: n.padX,
          paddingBottom: n.padBottom,
        }}
      >
        <T v="eyebrow" color={n.label}>
          {upperTr(tr.district.gate.paper)}
        </T>
        <View style={{ marginTop: n.questionTop }}>
          <T v="title" color={n.ink} testID="gecit-question">
            {prompt}
          </T>
        </View>
      </View>
      <View
        accessible={false}
        style={{
          position: 'absolute',
          top: n.pin.top,
          left: '50%',
          marginLeft: -n.pin.size / 2,
          width: n.pin.size,
          height: n.pin.size,
          borderRadius: n.pin.size / 2,
          backgroundColor: n.pin.color,
          boxShadow: n.pin.shadow,
        }}
      />
    </View>
  );
}

function PaperSkeleton() {
  const { scheme } = useKit();
  const n = SEMT.note;
  const sk = SEMT.skeleton[scheme];
  return (
    <View
      accessible
      accessibilityLabel={tr.district.gate.loading}
      style={{
        transform: [{ rotate: `${n.rotateDeg}deg` }],
        backgroundColor: n.paper,
        borderRadius: n.radius,
        paddingTop: n.padTop,
        paddingHorizontal: n.padX,
        paddingBottom: n.padBottom,
        gap: SEMT.card.skeleton.gap,
      }}
    >
      {[SEMT.card.skeleton.eyebrow, SEMT.card.skeleton.title, SEMT.card.skeleton.line].map(
        (b, i) => (
          <View
            key={i}
            style={{
              width: b.width,
              height: b.height,
              borderRadius: SEMT.card.skeleton.radius,
              backgroundColor: sk.ground,
              borderWidth: 1,
              borderColor: sk.edge,
            }}
          />
        ),
      )}
    </View>
  );
}

// `.tk`: a ticket, its letter on the stub behind a dashed line; chosen in the soft green with the
// primary's ring. Locked while sending: the chosen one stays, the others' words go muted.
function Ticket({
  letter,
  text,
  on,
  locked,
  onPress,
}: {
  letter: string;
  text: string;
  on: boolean;
  locked: boolean;
  onPress: () => void;
}) {
  const { scheme, c } = useKit();
  const t = SEMT.ticket;
  const k = t[scheme];
  const ink = locked && !on ? c.muted : c.ink;
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: on, disabled: locked }}
      accessibilityLabel={`${letter}, ${text}`}
      testID={`gecit-option-${letter}`}
      disabled={locked}
      onPress={onPress}
      style={{
        flexBasis: '45%',
        flexGrow: 1,
        minHeight: t.minHeight,
        flexDirection: 'row',
        alignItems: 'stretch',
        borderRadius: t.radius,
        backgroundColor: on ? k.onGround : k.ground,
        borderWidth: on ? 2 : 1,
        borderColor: on ? k.onEdge : k.edge,
      }}
    >
      <View
        style={{
          width: t.stub,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <T v="h3" color={on ? k.onLetter : c.muted}>
          {letter}
        </T>
      </View>
      <View
        accessible={false}
        style={{
          width: 2,
          marginVertical: SPACING[1],
          borderWidth: 1,
          borderStyle: 'dashed',
          borderColor: on ? k.onDash : k.dash,
        }}
      />
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          paddingHorizontal: t.textPadX,
          paddingVertical: t.textPadY,
        }}
      >
        <T v="body" strong color={ink}>
          {text}
        </T>
      </View>
    </Pressable>
  );
}
