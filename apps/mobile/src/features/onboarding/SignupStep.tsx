import { type ReactNode } from 'react';
import { Text, View } from 'react-native';

import { Btn, Round, T, useKit } from '@/aura/kit';
import { Peek, type PeekKind, SayScene } from '@/aura/Peek';
import { Screen } from '@/components/Screen';
import { tr } from '@/i18n/tr';
import { SIGNUP_STEPS, SIGNUP_TOTAL, type SignupStep as Step, stepNumber } from '@/lib/signupSteps';
import { KIT, KIT_TYPE } from '@/theme/auraKit';
import { SPACING } from '@/theme/tokens';

import { type FriendReaction } from './SignupFriend';

type Action = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
};

// What the step's friend does (src/features/onboarding/SignupFriend.tsx).
export type FriendState = {
  reaction?: FriendReaction | null;
  looking?: boolean;
  bubble?: string | null;
  puffKey?: number;
};

type Props = {
  // The step this screen is ("2/7" over it, and its friend); none for a one-time question outside
  // sign-up (the gender gate, new consents).
  step?: Step;
  title: string;
  body?: string;
  onBack?: () => void;
  action: Action;
  // An error the step shows above its button.
  error?: string | null;
  friend?: FriendState;
  children?: ReactNode;
  testID?: string;
};

const STEP_ON = 22;
const STEP_DOT = 6;
const STEP_SCALE = 1.3;
// docs/design/aura → Telefon, Kod: the field 70 under the title, the buddies looking over it.
const FIELD_TOP = 70;

// The step's buddy in the scene under the field, the scene's side and who looks over the field.
const SCENE: Record<Step, { look: string; side: 'left' | 'right'; peek?: PeekKind }> = {
  consents: { look: 'c:gok e:klasik f:yuvarlak', side: 'left' },
  phone: { look: 'c:yesil e:klasik h:papatya m:gulumse', side: 'left', peek: 'phone' },
  code: { look: 'c:mor e:klasik f:maske', side: 'right', peek: 'code' },
  name: { look: 'c:pembe e:klasik h:kedi', side: 'left' },
  birth: { look: 'c:gok e:klasik h:parti', side: 'right' },
  gender: { look: 'c:krem e:koyu h:tavsan', side: 'left' },
  photo: { look: 'c:turkuaz e:klasik h:kovboy', side: 'right' },
};

// One sign-up step (docs/design/aura → Telefon, Kod): the round back button, the step's dots and
// "2/7"; the title; the step's fields with the buddies looking over them; a scene where the step's
// buddy says the step's line (or its own words: "Merhaba"), jumping when it goes right and shaking
// when it goes wrong; the button at the bottom. The dots are decoration: a screen reader hears "Adım
// 2/7".
export function SignupStep({
  step,
  title,
  body,
  onBack,
  action,
  error,
  friend,
  children,
  testID,
}: Props) {
  const k = useKit();
  const n = step ? stepNumber(step) : 0;
  const scene = step ? SCENE[step] : null;
  const say = friend?.bubble ?? body ?? null;

  return (
    <Screen>
      <View testID={testID} collapsable={false} className="flex-1">
        <View className="flex-row items-center gap-2.5" style={{ minHeight: KIT.size.round }}>
          {onBack ? (
            <Round icon="back" label={tr.common.back} onPress={onBack} />
          ) : (
            <View style={{ width: KIT.size.round }} />
          )}
          {step ? (
            <>
              <View
                className="flex-1 flex-row items-center justify-center"
                style={{ gap: KIT.size.chipGap }}
                importantForAccessibility="no-hide-descendants"
                accessibilityElementsHidden
              >
                {SIGNUP_STEPS.map((s, i) => (
                  <View
                    key={s}
                    style={{
                      width: i === n - 1 ? STEP_ON : STEP_DOT,
                      height: STEP_DOT,
                      borderRadius: STEP_DOT / 2,
                      backgroundColor: i < n ? KIT.primary : k.c.grab,
                    }}
                  />
                ))}
              </View>
              <View style={{ width: KIT.size.round }}>
                <Text
                  accessibilityLabel={tr.signup.stepLabel(n, SIGNUP_TOTAL)}
                  maxFontSizeMultiplier={STEP_SCALE}
                  style={[KIT_TYPE.stamp, { color: k.c.muted, textAlign: 'right' }]}
                >
                  {tr.signup.step(n, SIGNUP_TOTAL)}
                </Text>
              </View>
            </>
          ) : null}
        </View>
        <View className="flex-1" style={{ paddingTop: SPACING[7] }}>
          <Text
            accessibilityRole="header"
            maxFontSizeMultiplier={STEP_SCALE}
            style={[KIT_TYPE.display, { color: k.c.ink }]}
          >
            {title}
          </Text>
          {/* Outside sign-up (the gender gate, new consents) the line stays under the title. */}
          {!scene && body ? (
            <T v="body" style={{ marginTop: SPACING[2.5] }}>
              {body}
            </T>
          ) : null}
          <View style={{ marginTop: scene?.peek ? FIELD_TOP : SPACING[5] }}>
            {scene?.peek ? <Peek kind={scene.peek} /> : null}
            {children}
          </View>
          {error ? (
            <View className="mt-4">
              <T v="fine" color={KIT.danger}>
                {error}
              </T>
            </View>
          ) : null}
          {scene ? (
            <View style={{ flexGrow: 1, marginTop: SPACING[3] }}>
              <SayScene
                look={scene.look}
                side={scene.side}
                text={say ?? ''}
                reaction={friend?.reaction ?? null}
              />
            </View>
          ) : (
            <View style={{ flexGrow: 1 }} />
          )}
          <View style={{ paddingTop: SPACING[5] }}>
            <Btn
              block
              testID={action.testID}
              label={action.label}
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
