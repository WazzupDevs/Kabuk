import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/Button';
import { IconButton } from '@/components/IconButton';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { tr } from '@/i18n/tr';
import { SIGNUP_STEPS, SIGNUP_TOTAL, type SignupStep as Step, stepNumber } from '@/lib/signupSteps';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

type Action = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
};

type Props = {
  // The step this screen is ("2/7" over it); none for a one-time question outside sign-up (the
  // gender gate, new consents).
  step?: Step;
  title: string;
  body?: ReactNode;
  onBack?: () => void;
  action: Action;
  // An error the step shows above its button.
  error?: string | null;
  children?: ReactNode;
  testID?: string;
};

// One sign-up step (v44/v45: .sup): the back button, seven bars that fill up to this step and
// "2/7"; the title and a line under it; the step's fields; the button at the bottom. The bars are
// decoration: a screen reader hears "Adım 2/7".
export function SignupStep({ step, title, body, onBack, action, error, children, testID }: Props) {
  const { colors, shape } = useTheme();
  const n = step ? stepNumber(step) : 0;
  return (
    <Screen>
      <View testID={testID} collapsable={false} className="flex-1">
        <View className="-mx-3 flex-row items-center gap-3" style={{ minHeight: SPACING[11] }}>
          {onBack ? (
            <IconButton icon="chevron-back" label={tr.common.back} onPress={onBack} />
          ) : (
            <View style={{ width: SPACING[11] }} />
          )}
          {step ? (
            <>
              <View
                className="flex-1 flex-row"
                style={{ gap: SPACING[1.5] }}
                importantForAccessibility="no-hide-descendants"
                accessibilityElementsHidden
              >
                {SIGNUP_STEPS.map((s, i) => (
                  <View
                    key={s}
                    className="flex-1"
                    style={{
                      height: SPACING[1.5],
                      borderRadius: shape.radius.pill,
                      backgroundColor: i < n ? colors.accent : colors.divider,
                    }}
                  />
                ))}
              </View>
              <View style={{ minWidth: SPACING[8], marginRight: SPACING[3] }}>
                <Text
                  variant="label"
                  tone="muted"
                  tabular
                  align="right"
                  accessibilityLabel={tr.signup.stepLabel(n, SIGNUP_TOTAL)}
                >
                  {tr.signup.step(n, SIGNUP_TOTAL)}
                </Text>
              </View>
            </>
          ) : null}
        </View>
        <View className="gap-2.5 pt-4">
          <Text variant="display" accessibilityRole="header">
            {title}
          </Text>
          {typeof body === 'string' ? <Text tone="muted">{body}</Text> : body}
        </View>
        <View className="mt-5">{children}</View>
        {error ? (
          <Text variant="fine" tone="danger" className="mt-4">
            {error}
          </Text>
        ) : null}
        <View className="mt-auto pt-8">
          <Button
            testID={action.testID}
            label={action.label}
            onPress={action.onPress}
            disabled={action.disabled}
            loading={action.loading}
          />
        </View>
      </View>
    </Screen>
  );
}
