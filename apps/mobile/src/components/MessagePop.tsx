import { REACTIONS, type Reaction } from '@shared/reactions.ts';
import { type ReactNode, useState } from 'react';
import { Modal, Pressable, useWindowDimensions, View } from 'react-native';
import Reanimated, { withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { tr } from '@/i18n/tr';
import { haptic } from '@/lib/haptics';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { withAlpha } from '@/theme/contrast';
import { useTheme } from '@/theme/ThemeProvider';
import { OPACITY, SPACING } from '@/theme/tokens';

import type { IconName } from './Button';
import { Menu, MenuItem } from './Menu';
import { ReactionFace } from './ReactionFace';
import { useLabOff } from '@/lib/drawLab';
import { boxShadowParts } from './NativeShadow';

const BAR_FROM = 0.6;
const FACE_FROM = 0.3;
const MENU_FROM = 0.85;

export type BubbleAction = {
  label: string;
  icon: IconName;
  onPress: () => void;
  negative?: boolean;
  testID?: string;
};

// Where the held bubble is on the screen (measureInWindow).
export type PopAnchor = { x: number; y: number; width: number; height: number };

// The picker's height: 40 high faces in 5 of padding (skall.css → `.emopick`).
const PICK_HEIGHT = SPACING[10] + SPACING[2.5];

// Telegram Android's message menu opening: the reaction bar grows from the message's side, its
// faces pop in one after the other, the menu unfolds from its top corner (the owner's call, 30
// Ekim). None with reduce motion.
const POP_SPRING = { damping: 16, stiffness: 280, mass: 0.8 } as const;
const FACE_STEP_MS = 28;
function popIn(from: number, delay = 0) {
  return () => {
    'worklet';
    return {
      initialValues: { opacity: 0, transform: [{ scale: from }] },
      animations: {
        opacity: withDelay(delay, withTiming(1, { duration: 120 })),
        transform: [{ scale: withDelay(delay, withSpring(1, POP_SPRING)) }],
      },
    };
  };
}

// A held message (skall tuvali: SohbetBasiliTut, SohbetKendiMesaj): the screen dims, the message
// stays where it was with a ring, the six faces over it and its actions under it; the viewer's own
// on the right. A tap outside or back closes it. Moved up when the menu would leave the screen.
export function MessagePop({
  at,
  mine,
  current,
  onClose,
  onReact,
  actions,
  children,
}: {
  at: PopAnchor;
  mine: boolean;
  // The viewer's reaction on it, marked in the picker.
  current?: string | null;
  onClose: () => void;
  onReact?: (emoji: Reaction) => void;
  actions: readonly BubbleAction[];
  // The bubble, drawn again over the scrim.
  children: ReactNode;
}) {
  const { colors, shape } = useTheme();
  const reduce = useReduceMotion();
  // The reaction bar's soft shadow natively (NativeShadow.tsx): it pops in.
  const shadowOff = useLabOff('golge');
  const barShadow = boxShadowParts(shadowOff, shape.shadow.sheet, shape.radius.pill);
  const screen = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [height, setHeight] = useState<number | null>(null);
  const gap = SPACING[2];
  const want = at.y - (onReact ? PICK_HEIGHT + gap : 0);
  const top =
    height === null
      ? want
      : Math.max(insets.top + gap, Math.min(want, screen.height - insets.bottom - gap - height));
  const side = shape.screenPadding;
  return (
    <Modal transparent visible animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={tr.common.close}
        onPress={onClose}
        style={{ flex: 1, backgroundColor: withAlpha(colors.scrim, OPACITY.scrim) }}
      />
      <View
        pointerEvents="box-none"
        onLayout={(e) => setHeight(e.nativeEvent.layout.height)}
        style={{
          position: 'absolute',
          left: side,
          right: side,
          top,
          gap,
          alignItems: mine ? 'flex-end' : 'flex-start',
          opacity: height === null ? 0 : 1,
        }}
      >
        {onReact ? (
          <Reanimated.View
            testID="reaction-bar"
            accessibilityRole="menu"
            accessibilityLabel={tr.chat.react}
            entering={reduce ? undefined : popIn(BAR_FROM)}
            style={{
              flexDirection: 'row',
              gap: SPACING[0.5],
              padding: SPACING[1],
              borderRadius: shape.radius.pill,
              backgroundColor: colors.surface,
              boxShadow: barShadow.boxShadow,
              transformOrigin: mine ? 'right bottom' : 'left bottom',
            }}
          >
            {barShadow.node}
            {REACTIONS.map((emoji, i) => (
              <Pressable
                key={emoji}
                testID={`react-${i}`}
                accessibilityRole="menuitem"
                accessibilityLabel={tr.chat.reactWith(tr.chat.reactions[emoji])}
                accessibilityState={{ selected: current === emoji }}
                onPress={() => {
                  haptic('selection');
                  onClose();
                  onReact(emoji);
                }}
              >
                {({ pressed }) => (
                  <Reanimated.View
                    entering={reduce ? undefined : popIn(FACE_FROM, (i + 1) * FACE_STEP_MS)}
                    className="items-center justify-center"
                    style={{
                      width: SPACING[10] + SPACING[0.5],
                      height: SPACING[10],
                      borderRadius: SPACING[5],
                      backgroundColor:
                        pressed || current === emoji ? colors.surface2 : 'transparent',
                      transform: [{ scale: pressed ? 1.12 : 1 }],
                    }}
                  >
                    <ReactionFace emoji={emoji} size="pick" />
                  </Reanimated.View>
                )}
              </Pressable>
            ))}
          </Reanimated.View>
        ) : null}
        <View
          pointerEvents="none"
          style={{
            width: at.width,
            marginLeft: mine ? 0 : at.x - side,
            marginRight: mine ? screen.width - side - at.x - at.width : 0,
          }}
        >
          {children}
        </View>
        {actions.length > 0 ? (
          <Reanimated.View
            entering={reduce ? undefined : popIn(MENU_FROM)}
            style={{ transformOrigin: mine ? 'right top' : 'left top' }}
          >
            <Menu float>
              {actions.map((a) => (
                <MenuItem
                  key={a.label}
                  label={a.label}
                  icon={a.icon}
                  negative={a.negative}
                  testID={a.testID}
                  onPress={() => {
                    onClose();
                    a.onPress();
                  }}
                />
              ))}
            </Menu>
          </Reanimated.View>
        ) : null}
      </View>
    </Modal>
  );
}
