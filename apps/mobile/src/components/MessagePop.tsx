import type { Reaction } from '@shared/reactions.ts';
import { type ReactNode, useEffect, useState } from 'react';
import {
  Animated,
  Easing as RNEasing,
  Pressable,
  StatusBar,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import Reanimated, { Easing, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { tr } from '@/i18n/tr';
import { haptic } from '@/lib/haptics';
import { useLeaveKeyboard } from '@/lib/modalKeyboard';
import { useOverlaySlot } from '@/lib/useOverlaySlot';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { holdPlace } from '@/lib/holdPlace';
import { Layer } from '@/motion/menuLayer';
import { useMarkPopOpen } from './popHost';
import { MOTION } from '@/theme/aura';
import { KIT } from '@/theme/auraKit';
import { DM } from '@/theme/dm';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

import type { IconName } from './Button';
import { Menu, MenuItem, MenuNote } from './Menu';
import { ReactionFaces } from './ReactionBar';
import { useLabOff } from '@/lib/drawLab';
import { boxShadowParts } from './NativeShadow';
import { SheetScrim } from './SheetScrim';

const BAR_FROM = 0.6;
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

// Telegram Android's message menu opening (ReactionsContainerLayout: the bar's transition 250 ms on
// an OvershootInterpolator(0.5), its faces with it, none one by one; the owner's report, 21 Kasım:
// the faces arriving one after the other made the layer slow to draw). The menu unfolds from its
// corner on the side it opens to. None with reduce motion.
const OPEN_MS = 250;
const MENU_MS = 200;
function popIn(from: number, ms: number, overshoot: number) {
  return () => {
    'worklet';
    return {
      initialValues: { opacity: 0, transform: [{ scale: from }] },
      animations: {
        opacity: withTiming(1, { duration: ms / 2 }),
        transform: [
          {
            scale: withTiming(1, {
              duration: ms,
              easing: overshoot > 0 ? Easing.out(Easing.back(overshoot)) : Easing.out(Easing.cubic),
            }),
          },
        ],
      },
    };
  };
}

// A held message (skall tuvali: SohbetBasiliTut, SohbetKendiMesaj): the screen dims, the message
// stays where it was as it is (no ring, ui 1.1), the six faces over it and its actions under it; the viewer's own
// on the right. A tap outside or back closes it. The message never moves: the faces and the menu
// go over or under it by where it stands (lib/holdPlace.ts).
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
  const { shape, scheme } = useTheme();
  const look = DM[scheme].pick;
  const reduce = useReduceMotion();
  useLeaveKeyboard(true);
  useOverlaySlot('hold', true, onClose);
  // The stream holds still under it (popHost.tsx).
  useMarkPopOpen();
  // The reaction bar's soft shadow natively (NativeShadow.tsx): it pops in.
  const shadowOff = useLabOff('golge');
  const barShadow = boxShadowParts(shadowOff, look.shadow || undefined, shape.radius.pill);
  const screen = useWindowDimensions();
  const insets = useSafeAreaInsets();
  // The menu's height, measured unseen once; the bar's is known (PICK_HEIGHT).
  const [menuHeight, setMenuHeight] = useState<number | null>(null);
  const gap = SPACING[2];
  // Inside a status-bar-translucent Modal the safe area can come back 0: the status bar's own height
  // keeps the faces out from under it (ui, 4 Kasım: the bar stood over the clock).
  const topInset = Math.max(insets.top, StatusBar.currentHeight ?? 0);
  const hasMenu = actions.length > 0 || !!note;
  // Without a note its height is its rows' (Menu → MenuCard, the long-press look: 6 inside, a row
  // 44, the red rows apart on a 6 band), so it is placed on its first frame; a note's words set its
  // height, measured unseen first.
  const L = KIT.layer.size;
  const red = actions.filter((a) => a.negative).length;
  const guess = note
    ? null
    : 2 * L.holdPad +
      actions.length * L.holdRow +
      (red > 0 && red < actions.length ? L.holdBand : 0);
  const menuH = menuHeight ?? guess;
  // The bar is drawn once it stands where it goes; the menu, drawn once (measured unseen first when
  // it carries a note), unfolds from there on the same instance (CLAUDE.md → Çizim bütçesi: no
  // second mount to replay an entering animation).
  const placed = !hasMenu || menuH !== null;
  const [menuIn] = useState(() => new Animated.Value(reduce ? 1 : 0));
  useEffect(() => {
    if (!placed || reduce) return undefined;
    const run = Animated.timing(menuIn, {
      toValue: 1,
      duration: MENU_MS,
      easing: RNEasing.out(RNEasing.cubic),
      useNativeDriver: true,
    });
    run.start();
    return () => run.stop();
  }, [placed, reduce, menuIn]);
  // The message stays where it is; the bar and the menu go over or under it (lib/holdPlace.ts).
  const place = holdPlace(
    at,
    onReact ? PICK_HEIGHT : null,
    hasMenu ? (menuH ?? 0) : null,
    { top: topInset + gap, bottom: screen.height - insets.bottom - gap },
    gap,
  );
  // DmMesajMenu `.hold>.rbar`, `.hold>.pop`: the faces and the menu at the bubble's own edge (left
  // 0, or right 0 on the viewer's own), not the screen's padding; never nearer the far edge.
  const side = shape.screenPadding;
  const left = mine ? side : Math.min(at.x, side);
  const right = mine ? Math.min(screen.width - at.x - at.width, side) : side;
  const column = {
    position: 'absolute' as const,
    left,
    right,
    alignItems: mine ? ('flex-end' as const) : ('flex-start' as const),
  };
  const corner = (below: boolean) =>
    `${mine ? 'right' : 'left'} ${below ? 'top' : 'bottom'}` as const;
  // The scrim comes in quickly; the held message stands at once where it was and the faces and the
  // menu pop in (Telegram Android: the message's menu in the chat's own window, no window to wait
  // for; the owner's report, 21 Kasım: the Modal's own fade made the press feel slow).
  const [dim] = useState(() => new Animated.Value(reduce ? 1 : 0));
  useEffect(() => {
    if (reduce) return undefined;
    const run = Animated.timing(dim, {
      toValue: 1,
      duration: MOTION.dissolve.outMs,
      useNativeDriver: true,
    });
    run.start();
    return () => run.stop();
  }, [dim, reduce]);
  const layer = (
    <>
      <SheetScrim hold opacity={dim} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={tr.common.close}
        onPress={onClose}
        style={StyleSheet.absoluteFill}
      />
      {/* The held message, drawn again over the scrim exactly where it stands. */}
      <View
        pointerEvents="none"
        style={{ position: 'absolute', left: at.x, top: at.y, width: at.width }}
      >
        {children}
      </View>
      {/* Drawn once, where it goes: only after the menu is measured. */}
      {onReact && placed && place.barTop !== null ? (
        <View pointerEvents="box-none" style={{ ...column, top: place.barTop }}>
          <Reanimated.View
            testID="reaction-bar"
            accessibilityRole="menu"
            accessibilityLabel={tr.chat.react}
            entering={reduce ? undefined : popIn(BAR_FROM, OPEN_MS, 0.5)}
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
              transformOrigin: corner(place.barBelow),
            }}
          >
            {barShadow.node}
            <ReactionFaces
              current={current}
              reduce={reduce}
              look={look}
              onPick={(emoji) => {
                haptic('selection');
                onClose();
                onReact(emoji);
              }}
            />
          </Reanimated.View>
        </View>
      ) : null}
      {hasMenu ? (
        <View
          pointerEvents="box-none"
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            if (menuH === null || Math.abs(menuH - h) > 1) setMenuHeight(h);
          }}
          style={{
            ...column,
            top: menuH === null ? 0 : (place.menuTop ?? 0),
            opacity: menuH === null ? 0 : 1,
          }}
        >
          <Animated.View
            style={{
              transformOrigin: corner(place.menuBelow),
              opacity: menuIn.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1, 1] }),
              transform: [
                {
                  scale: menuIn.interpolate({ inputRange: [0, 1], outputRange: [MENU_FROM, 1] }),
                },
              ],
            }}
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
          </Animated.View>
        </View>
      ) : null}
    </>
  );
  // In the app's layer (motion/menuLayer.tsx → Layer); back closes it.
  return (
    <Layer visible onBack={onClose}>
      {layer}
    </Layer>
  );
}
