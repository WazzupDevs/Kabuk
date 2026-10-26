import { type ReactNode, useState } from 'react';
import {
  type LayoutChangeEvent,
  type LayoutRectangle,
  type TextLayoutLine,
  View,
} from 'react-native';

import { Button } from '@/components/Button';
import { IconButton } from '@/components/IconButton';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { tr } from '@/i18n/tr';
import { FRIEND, FRIEND_LOOKS, placeFriend, type Rect } from '@/lib/signupFriend';
import { SIGNUP_STEPS, SIGNUP_TOTAL, type SignupStep as Step, stepNumber } from '@/lib/signupSteps';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

import { type FriendReaction, SignupFriend } from './SignupFriend';

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

const NO_MOVES = { jump: false, shake: false, nod: false } as const;

// The friend's box rests this far above the title's first line (v45: 64 px against the title at
// 72), and may not rise into the top row.
const FRIEND_ABOVE_TITLE = 8;

type Layouts = {
  // The top row and its "2/7" (the friend's jump must not cover it).
  row?: LayoutRectangle;
  counter?: LayoutRectangle;
  wrapper?: LayoutRectangle;
  head?: LayoutRectangle;
  title?: LayoutRectangle;
  body?: LayoutRectangle;
  fields?: LayoutRectangle;
  error?: LayoutRectangle;
  titleLines?: TextLayoutLine[];
  bodyLines?: TextLayoutLine[];
};

// One sign-up step (v44/v45: .sup): the back button, seven bars that fill up to this step and
// "2/7"; the title and a line under it; the step's fields; the button at the bottom. The bars are
// decoration: a screen reader hears "Adım 2/7". On the seven steps a capsule friend peeks from the
// right edge, kept off every word, field and error (v45 report §3).
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
  const { colors, shape } = useTheme();
  const n = step ? stepNumber(step) : 0;
  const withFriend = step !== undefined;
  const [layouts, setLayouts] = useState<Layouts>({});
  const keep =
    <K extends keyof Layouts>(key: K) =>
    (value: Layouts[K]) =>
      setLayouts((l) => ({ ...l, [key]: value }));
  const onLayout =
    (key: 'row' | 'counter' | 'wrapper' | 'head' | 'title' | 'body' | 'fields' | 'error') =>
    (e: LayoutChangeEvent) =>
      keep(key)(e.nativeEvent.layout);

  // Everything the friend must stay off, in the wrapper's coordinates.
  const head = layouts.head;
  const lines = (box: LayoutRectangle | undefined, list: TextLayoutLine[] | undefined): Rect[] =>
    box && head && list
      ? list.map((l) => ({
          x: head.x + box.x + l.x,
          y: head.y + box.y + l.y,
          width: l.width,
          height: l.height,
        }))
      : [];
  const titleRects = lines(layouts.title, layouts.titleLines);
  // The counter, from the top row into the wrapper's coordinates.
  const { row, counter, wrapper } = layouts;
  const counterRect: Rect[] =
    row && counter && wrapper
      ? [
          {
            x: row.x + counter.x - wrapper.x,
            y: row.y + counter.y - wrapper.y,
            width: counter.width,
            height: counter.height,
          },
        ]
      : [];
  const blockers: Rect[] = [
    ...titleRects,
    ...lines(layouts.body, layouts.bodyLines),
    ...(layouts.fields ? [toRect(layouts.fields)] : []),
    ...(error && layouts.error ? [toRect(layouts.error)] : []),
    ...counterRect,
  ];
  const right = (wrapper?.width ?? 0) + shape.screenPadding;
  const friendTop = head && layouts.title ? head.y + layouts.title.y - FRIEND_ABOVE_TITLE : null;
  // Placed only once every word it must stay off has been measured: the title's lines, the body's,
  // the counter. Before that it could show over the title for a frame (with reduce motion there is
  // no slide in to hide it).
  const measured =
    layouts.titleLines !== undefined &&
    (!body || layouts.bodyLines !== undefined) &&
    counterRect.length > 0;
  const place =
    withFriend && measured && friendTop !== null && wrapper && layouts.fields
      ? placeFriend(right, friendTop, blockers, head?.y ?? 0)
      : null;
  const shift = place?.shift ?? null;
  const moves = place?.moves ?? NO_MOVES;
  const inset = withFriend ? FRIEND.textInset : 0;

  return (
    <Screen>
      <View testID={testID} collapsable={false} className="flex-1">
        <View
          className="flex-row items-center gap-2.5"
          style={{ minHeight: SPACING[11] }}
          onLayout={onLayout('row')}
        >
          {onBack ? (
            <IconButton round icon="chevron-back" label={tr.common.back} onPress={onBack} />
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
                      // skall tuvali (skall.css → `.steps`): 5 high on the track, done ones primary.
                      height: SPACING[1] + 1,
                      borderRadius: shape.radius.pill,
                      backgroundColor: i < n ? colors.primary : colors.track,
                    }}
                  />
                ))}
              </View>
              <View style={{ minWidth: SPACING[8] }} onLayout={onLayout('counter')}>
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
        <View className="flex-1" onLayout={onLayout('wrapper')}>
          <View className="gap-2.5 pt-4" onLayout={onLayout('head')}>
            <View onLayout={onLayout('title')} style={{ paddingRight: inset }}>
              <Text
                variant="display"
                accessibilityRole="header"
                onTextLayout={(e) => keep('titleLines')(e.nativeEvent.lines)}
              >
                {title}
              </Text>
            </View>
            {body ? (
              <View onLayout={onLayout('body')} style={{ paddingRight: inset }}>
                <Text variant="fine" onTextLayout={(e) => keep('bodyLines')(e.nativeEvent.lines)}>
                  {body}
                </Text>
              </View>
            ) : null}
          </View>
          <View className="mt-5" onLayout={onLayout('fields')}>
            {children}
          </View>
          {error ? (
            <View onLayout={onLayout('error')} className="mt-4">
              <Text variant="fine" tone="danger">
                {error}
              </Text>
            </View>
          ) : null}
          {withFriend && measured && friendTop !== null ? (
            <SignupFriend
              look={FRIEND_LOOKS[step]}
              top={friendTop}
              right={right}
              shift={shift}
              moves={moves}
              reaction={friend?.reaction ?? null}
              looking={friend?.looking ?? false}
              bubble={friend?.bubble ?? null}
              titleLine={titleRects[0] ?? null}
              blockers={blockers}
              puffKey={friend?.puffKey}
            />
          ) : null}
          <View className="mt-auto pt-8">
            <Button
              size="lg"
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

function toRect(l: LayoutRectangle): Rect {
  return { x: l.x, y: l.y, width: l.width, height: l.height };
}
