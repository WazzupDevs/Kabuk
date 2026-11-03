import { type ReactNode, useState } from 'react';
import { Text, View } from 'react-native';

import { Btn, Round, T, useKit } from '@/aura/kit';
import { RisoFieldPeek, RisoSayScene } from '@/aura/Peek';
import { RisoKanki } from '@/aura/RisoKanki';
import { type CapIconName } from '@/aura/CapIcon';
import { Screen } from '@/components/Screen';
import { tr } from '@/i18n/tr';
import { SIGNUP_STEPS, SIGNUP_TOTAL, type SignupStep as Step, stepNumber } from '@/lib/signupSteps';
import { KIT, KIT_TYPE } from '@/theme/auraKit';
import { RECONSENT_KANKI, RECONSENT_KANKI_FOOT, SIGNUP_KANKI } from '@/theme/kankiMotion';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

import { type FriendReaction } from './useFriend';

type Action = {
  label: string;
  // Aura v71: "Devam" and "Kod gönder" go forward, the last of a part (Onayla, Doğrula, Bitir) ticks.
  icon?: CapIconName;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
};

// What the step's friend does.
export type FriendState = {
  reaction?: FriendReaction | null;
  looking?: boolean;
  bubble?: string | null;
  puffKey?: number;
};

type Props = {
  // The step this screen is (its dots, its buddies); none for a one-time question outside
  // sign-up (the gender gate, new consents).
  step?: Step;
  title: string;
  body?: string;
  onBack?: () => void;
  action: Action;
  // An error the step shows above its button.
  error?: string | null;
  friend?: FriendState;
  // KayitMetinler: one riso buddy standing over the button (outside sign-up only).
  standing?: boolean;
  children?: ReactNode;
  testID?: string;
};

const STEP_ON = 22;
const STEP_DOT = 6;
const STEP_SCALE = 1.3;

// One sign-up step (docs/design/aura → Telefon, Kod; Aura v71 KayitOnay … KayitFoto): the round back
// button and the step's dots; the title; the step's fields with the riso buddies looking over them
// (each step its own distance under the title); the riso scene where the step's buddy says the
// step's line (or its own words: "Merhaba"), jumping when it goes right and shaking when it goes
// wrong; the button at the bottom. The dots are decoration: a screen reader hears "Adım 2/7".
// Outside sign-up (the gender gate, new consents) no dots and no scene: the line stays under the
// title, and without a back button no top row either (KayitMetinler: the title 8 down).
export function SignupStep({
  step,
  title,
  body,
  onBack,
  action,
  error,
  friend,
  standing,
  children,
  testID,
}: Props) {
  const k = useKit();
  const { colors, scheme } = useTheme();
  const n = step ? stepNumber(step) : 0;
  const say = friend?.bubble ?? body ?? null;
  // Done and current dots: the primary, in dark the accent (#3DDC84).
  const dotOn = scheme === 'dark' ? colors.accent : KIT.primary;
  const topRow = !!step || !!onBack;
  const [room, setRoom] = useState(0);

  return (
    <Screen>
      <View testID={testID} collapsable={false} className="flex-1">
        {topRow ? (
          <View className="flex-row items-center gap-2.5" style={{ minHeight: KIT.size.round }}>
            {onBack ? (
              <Round icon="back" label={tr.common.back} onPress={onBack} />
            ) : (
              <View style={{ width: KIT.size.round }} />
            )}
            {step ? (
              <>
                {/* Aura v71: no "n/7" beside the dots, the room kept; a screen reader hears the step. */}
                <View
                  className="flex-1 flex-row items-center justify-center"
                  style={{ gap: KIT.size.chipGap }}
                  accessible
                  accessibilityLabel={tr.signup.stepLabel(n, SIGNUP_TOTAL)}
                >
                  {SIGNUP_STEPS.map((s, i) => (
                    <View
                      key={s}
                      style={{
                        width: i === n - 1 ? STEP_ON : STEP_DOT,
                        height: STEP_DOT,
                        borderRadius: STEP_DOT / 2,
                        backgroundColor: i < n ? dotOn : k.c.stepDot,
                      }}
                    />
                  ))}
                </View>
                <View style={{ width: KIT.size.round }} />
              </>
            ) : null}
          </View>
        ) : null}
        <View className="flex-1" style={{ paddingTop: topRow ? SPACING[7] : SPACING[2] }}>
          <Text
            accessibilityRole="header"
            maxFontSizeMultiplier={STEP_SCALE}
            style={[KIT_TYPE.display, { color: k.c.ink }]}
          >
            {title}
          </Text>
          {/* Outside sign-up (the gender gate, new consents) the line stays under the title. */}
          {!step && body ? (
            <T v="body" style={{ marginTop: SPACING[2.5] }}>
              {body}
            </T>
          ) : null}
          <View style={{ marginTop: step ? SIGNUP_KANKI[step].fieldTop : SPACING[6] }}>
            {step ? <RisoFieldPeek kind={step} /> : null}
            {children}
          </View>
          {error ? (
            <View className="mt-4">
              <T v="fine" color={KIT.danger}>
                {error}
              </T>
            </View>
          ) : null}
          {step ? (
            <View style={{ flexGrow: 1, marginTop: SPACING[3] }}>
              <RisoSayScene kind={step} text={say ?? ''} reaction={friend?.reaction ?? null} />
            </View>
          ) : (
            <View
              style={{ flexGrow: 1 }}
              onLayout={standing ? (e) => setRoom(e.nativeEvent.layout.height) : undefined}
            >
              {/* Only where it fits whole: never over the boxes. */}
              {standing && room >= RECONSENT_KANKI.height + RECONSENT_KANKI_FOOT ? (
                <Standing />
              ) : null}
            </View>
          )}
          <View style={{ paddingTop: SPACING[5] }}>
            <Btn
              block
              testID={action.testID}
              label={action.label}
              icon={action.icon}
              onPress={action.onPress}
              disabled={action.disabled}
              loading={action.loading}
            />
          </View>
        </View>
      </View>
    </Screen>
  );
}

// KayitMetinler: the buddy in the middle, its feet 28 over the button (the button's row starts 20
// over it).
function Standing() {
  const over = RECONSENT_KANKI_FOOT - SPACING[5];
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        bottom: over,
        left: 0,
        right: 0,
        height: RECONSENT_KANKI.height,
        alignItems: 'center',
      }}
    >
      <View style={{ width: RECONSENT_KANKI.width, height: RECONSENT_KANKI.height }}>
        <RisoKanki place={{ ...RECONSENT_KANKI, left: 0, bottom: 0 }} scale={1} />
      </View>
    </View>
  );
}
