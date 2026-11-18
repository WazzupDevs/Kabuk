import { REACTIONS, type Reaction } from '@shared/reactions.ts';
import { type ReactNode, useState } from 'react';
import { Modal, Pressable, StatusBar, StyleSheet, useWindowDimensions, View } from 'react-native';
import Reanimated, { withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { tr } from '@/i18n/tr';
import { haptic } from '@/lib/haptics';
import { useLeaveKeyboard } from '@/lib/modalKeyboard';
import { useOverlaySlot } from '@/lib/useOverlaySlot';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { KIT } from '@/theme/auraKit';
import { DM } from '@/theme/dm';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

import type { IconName } from './Button';
import { Menu, MenuItem, MenuNote } from './Menu';
import { ReactionFace } from './ReactionFace';
import { useLabOff } from '@/lib/drawLab';
import { boxShadowParts } from './NativeShadow';
import { SheetScrim } from './SheetScrim';

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
// stays where it was as it is (no ring, ui 1.1), the six faces over it and its actions under it; the viewer's own
// on the right. A tap outside or back closes it. Moved up when the menu would leave the screen.
// Its scrim and menu are the long-press menu's (MesajlarUzunBas: SheetScrim → hold, Menu → float);
// it holds its place in the one store (lib/overlayStore.ts), so anything opening closes it.
export function MessagePop({
  at,
  mine,
  current,
  onClose,
  onReact,
  actions,
  note,
  children,
}: {
  at: PopAnchor;
  mine: boolean;
  // The viewer's reaction on it, marked in the picker.
  current?: string | null;
  onClose: () => void;
  onReact?: (emoji: Reaction) => void;
  actions: readonly BubbleAction[];
  // Under the actions (tuval DmMenuSureDoldu: "Mesajın 15 dakika içinde düzenlenebilir.").
  note?: string;
  // The bubble, drawn again over the scrim.
  children: ReactNode;
}) {
  const { colors, shape, scheme } = useTheme();
  const look = DM[scheme].pick;
  const reduce = useReduceMotion();
  useLeaveKeyboard(true);
  useOverlaySlot('hold', true, onClose);
  // The reaction bar's soft shadow natively (NativeShadow.tsx): it pops in.
  const shadowOff = useLabOff('golge');
  const barShadow = boxShadowParts(shadowOff, look.shadow || undefined, shape.radius.pill);
  const screen = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [height, setHeight] = useState<number | null>(null);
  const gap = SPACING[2];
  const want = at.y - (onReact ? PICK_HEIGHT + gap : 0);
  // Inside a status-bar-translucent Modal the safe area can come back 0: the status bar's own height
  // keeps the faces out from under it (ui, 4 Kasım: the bar stood over the clock).
  const topInset = Math.max(insets.top, StatusBar.currentHeight ?? 0);
  const top =
    height === null
      ? want
      : Math.max(topInset + gap, Math.min(want, screen.height - insets.bottom - gap - height));
  // The bar and the menu pop in only once the stack stands where it goes: started in the measuring
  // pass, their entering animations stayed where the stack first stood (the owner's report, 4 Kasım:
  // the faces and the menu at the screen's top, the message at its foot). `placed` mounts them anew.
  const placed = height !== null;
  // DmMesajMenu `.hold>.rbar`, `.hold>.pop`: the faces and the menu at the bubble's own edge (left
  // 0, or right 0 on the viewer's own), not the screen's padding; never nearer the far edge.
  const side = shape.screenPadding;
  const left = mine ? side : Math.min(at.x, side);
  const right = mine ? Math.min(screen.width - at.x - at.width, side) : side;
  return (
    <Modal transparent visible animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <SheetScrim hold opacity={1} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={tr.common.close}
        onPress={onClose}
        style={StyleSheet.absoluteFill}
      />
      <View
        pointerEvents="box-none"
        onLayout={(e) => setHeight(e.nativeEvent.layout.height)}
        style={{
          position: 'absolute',
          left,
          right,
          top,
          gap,
          alignItems: mine ? 'flex-end' : 'flex-start',
          opacity: height === null ? 0 : 1,
        }}
      >
        {onReact ? (
          <Reanimated.View
            key={placed ? 'bar' : 'bar-measure'}
            testID="reaction-bar"
            accessibilityRole="menu"
            accessibilityLabel={tr.chat.react}
            entering={reduce || !placed ? undefined : popIn(BAR_FROM)}
            // DmMesajMenu `.rbar`: the surface, 4 inside, the faces 2 apart.
            style={{
              flexDirection: 'row',
              gap: DM.pick.gap,
              padding: DM.pick.pad,
              borderRadius: shape.radius.pill,
              backgroundColor: look.fill,
              borderWidth: look.edge ? KIT.size.edge : 0,
              borderColor: look.edge || undefined,
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
                    entering={
                      reduce || !placed ? undefined : popIn(FACE_FROM, (i + 1) * FACE_STEP_MS)
                    }
                    className="items-center justify-center"
                    // `.f` 40, `.f.sel` on --surface2 in a 2 ring of the ink.
                    style={{
                      width: DM.pick.slot,
                      height: DM.pick.slot,
                      borderRadius: DM.pick.slot / 2,
                      borderWidth: current === emoji ? DM.pick.ring : 0,
                      borderColor: look.selRing,
                      backgroundColor:
                        current === emoji ? look.sel : pressed ? colors.surface2 : 'transparent',
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
            marginLeft: mine ? 0 : at.x - left,
            marginRight: mine ? screen.width - right - at.x - at.width : 0,
          }}
        >
          {children}
        </View>
        {actions.length > 0 ? (
          <Reanimated.View
            key={placed ? 'menu' : 'menu-measure'}
            entering={reduce || !placed ? undefined : popIn(MENU_FROM)}
            style={{ transformOrigin: mine ? 'right top' : 'left top' }}
          >
            <Menu float floatWidth={DM.pick.menu}>
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
              {note ? <MenuNote>{note}</MenuNote> : null}
            </Menu>
          </Reanimated.View>
        ) : null}
      </View>
    </Modal>
  );
}
