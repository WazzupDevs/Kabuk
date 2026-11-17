import { type ReactNode } from 'react';
import { Text, View } from 'react-native';

import { Btn, Round } from '@/aura/kit';
import { Screen } from '@/components/Screen';
import { tr } from '@/i18n/tr';
import { SIGNUP_STEPS, SIGNUP_TOTAL, type SignupStep as Step, stepNumber } from '@/lib/signupSteps';
import { SIGNUP, SIGNUP_TYPE } from '@/theme/signup';

import { ErrorLine } from './ErrorLine';
import { SIGNUP_FONT_SCALE, useSignupLook } from './look';

type Action = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
};

type Props = {
  // The step this screen is (its bar and "n/7"); none for a one-time question outside sign-up
  // (the gender gate, new consents, under 18).
  step?: Step;
  title: string;
  // The line under the title (`.kd`); a node where a part of it is a link (the code's number).
  body?: ReactNode;
  onBack?: () => void;
  action: Action;
  // The quiet button under the main one (KayitFoto's "Fotoğrafsız bitir").
  secondary?: Action;
  // A line at the foot, over the buttons (KayitOnay `.nt2`).
  footnote?: string;
  // An error the step shows under its fields.
  error?: string | null;
  children?: ReactNode;
  testID?: string;
};

// One sign-up step (yeni arayüz tuvali: KayitOnay … KayitFoto): on the flat ground the top row (the
// round back button, the seven-part step bar and "n/7"), the title and the line under it, the
// step's fields, and the buttons at the foot, which rise with the keyboard. The bar is decoration:
// a screen reader hears "Adım 2/7".
export function SignupStep({
  step,
  title,
  body,
  onBack,
  action,
  secondary,
  footnote,
  error,
  children,
  testID,
}: Props) {
  const look = useSignupLook();
  const n = step ? stepNumber(step) : 0;
  const topRow = !!step || !!onBack;

  const top = topRow ? (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: SIGNUP.rowGap,
        minHeight: SIGNUP.topRow,
        paddingRight: SIGNUP.side - SIGNUP.barSide,
      }}
    >
      {onBack ? <Round icon="back" label={tr.common.back} onPress={onBack} /> : null}
      {step ? (
        <>
          <View
            accessible
            accessibilityLabel={tr.signup.stepLabel(n, SIGNUP_TOTAL)}
            style={{ flex: 1, flexDirection: 'row', gap: SIGNUP.step.gap }}
          >
            {SIGNUP_STEPS.map((s, i) => (
              <View
                key={s}
                style={{
                  flex: 1,
                  height: SIGNUP.step.height,
                  borderRadius: SIGNUP.step.radius,
                  backgroundColor: i < n ? look.stepDone : look.stepTrack,
                }}
              />
            ))}
          </View>
          <Text
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            maxFontSizeMultiplier={SIGNUP_FONT_SCALE}
            style={[SIGNUP_TYPE.stepCount, { color: look.muted }]}
          >
            {`${n}/${SIGNUP_TOTAL}`}
          </Text>
        </>
      ) : null}
    </View>
  ) : undefined;

  const foot = (
    <>
      {footnote ? (
        <Text
          maxFontSizeMultiplier={SIGNUP_FONT_SCALE}
          style={[SIGNUP_TYPE.foot, { color: look.muted, textAlign: 'center' }]}
        >
          {footnote}
        </Text>
      ) : null}
      <Btn
        block
        tall
        testID={action.testID}
        label={action.label}
        onPress={action.onPress}
        disabled={action.disabled}
        loading={action.loading}
      />
      {secondary ? (
        <Btn
          block
          tall
          variant="ghost"
          testID={secondary.testID}
          label={secondary.label}
          onPress={secondary.onPress}
          disabled={secondary.disabled}
          loading={secondary.loading}
        />
      ) : null}
    </>
  );

  return (
    <Screen
      plain
      top={top}
      footer={foot}
      side={SIGNUP.side}
      barSide={SIGNUP.barSide}
      barTop={SIGNUP.barTop}
      padTop={topRow ? SIGNUP.contentTop : SIGNUP.contentTopBare}
    >
      <View testID={testID} collapsable={false} style={{ flexGrow: 1 }}>
        <Text
          accessibilityRole="header"
          maxFontSizeMultiplier={SIGNUP_FONT_SCALE}
          style={[SIGNUP_TYPE.title, { color: look.ink }]}
        >
          {title}
        </Text>
        {body ? (
          <Text
            maxFontSizeMultiplier={SIGNUP_FONT_SCALE}
            style={[SIGNUP_TYPE.body, { color: look.muted, marginTop: SIGNUP.titleGap }]}
          >
            {body}
          </Text>
        ) : null}
        {children}
        {error ? <ErrorLine text={error} /> : null}
      </View>
    </Screen>
  );
}
