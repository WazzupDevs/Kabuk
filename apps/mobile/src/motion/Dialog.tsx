import { useEffect, useEffectEvent } from 'react';
import { AccessibilityInfo, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Reanimated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Btn, T, useKit } from '@/aura/kit';
import { CapIcon } from '@/aura/CapIcon';
import { tr } from '@/i18n/tr';
import type { ConfirmOptions } from '@/lib/overlayStore';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { type Bezier, MOTION } from '@/theme/aura';
import { DIALOG } from '@/theme/overlay';
import { useTheme } from '@/theme/ThemeProvider';

const curve = (b: Bezier) => Easing.bezier(b[0], b[1], b[2], b[3]);
const ARRIVE = curve(MOTION.curves.arrive);
const LEAVE = curve(MOTION.curves.leave);

type Props = {
  options: ConfirmOptions;
  visible: boolean;
  // The action runs: its button waits, nothing else closes the dialog.
  pending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  // Off the screen after its leave (OverlayHost unmounts its window).
  onHidden: () => void;
};

// The centred confirmation (yeni arayüz tuvali, Ortak kurallar C1; AyarlarCikis, MesajlarSohbetSil,
// EngelleOnay): over a flat scrim (C2, no blur), a card 28 in from either side, the optional icon
// disc, the title, one sentence, what the caller puts under it, the action and under it the way
// out. Hareket tablosu A2: it arrives on MOTION.dissolve (the scrim and the card fade in, the card
// from 0.97 and 12 below, 240 on the arriving curve) and leaves in 150 on the leaving curve (faded,
// back to 0.97); with reduce motion at once. When it does not fit (320 dp, the largest text) the
// card scrolls inside itself; nothing is cut.
export function Dialog({ options, visible, pending, onConfirm, onCancel, onHidden }: Props) {
  const { scheme, colors } = useTheme();
  const { c: kit } = useKit();
  const look = DIALOG[scheme];
  const insets = useSafeAreaInsets();
  const reduce = useReduceMotion();
  const d = MOTION.dissolve;
  const shown = useSharedValue(0);
  const rise = useSharedValue<number>(d.rise);
  const gone = useEffectEvent(() => onHidden());

  useEffect(() => {
    if (visible) {
      if (reduce) {
        shown.value = 1;
        rise.value = 0;
      } else {
        rise.value = d.rise;
        shown.value = withTiming(1, { duration: d.inMs, easing: ARRIVE });
        rise.value = withTiming(0, { duration: d.inMs, easing: ARRIVE });
      }
      return;
    }
    if (reduce) {
      shown.value = 0;
      gone();
      return;
    }
    shown.value = withTiming(0, { duration: d.outMs, easing: LEAVE }, (finished) => {
      if (finished) runOnJS(gone)();
    });
  }, [visible, reduce, shown, rise, d]);

  const title = options.title;
  // The screen reader says what it asks as it opens.
  useEffect(() => {
    if (visible) AccessibilityInfo.announceForAccessibility(title);
  }, [visible, title]);

  const scrimStyle = useAnimatedStyle(() => ({ opacity: shown.value }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: shown.value,
    transform: [
      { translateY: rise.value },
      { scale: d.fromScale + (1 - d.fromScale) * shown.value },
    ],
  }));

  const danger = options.tone === 'danger';
  const testID = options.testID;
  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: insets.top + DIALOG.inset,
          paddingBottom: insets.bottom + DIALOG.inset,
          paddingHorizontal: DIALOG.inset,
        },
      ]}
    >
      <Reanimated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: look.scrim }, scrimStyle]}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={tr.common.close}
        disabled={pending}
        onPress={onCancel}
        style={StyleSheet.absoluteFill}
      />
      <Reanimated.View
        accessibilityViewIsModal
        style={[
          styles.card,
          {
            backgroundColor: look.surface,
            borderRadius: DIALOG.radius,
            boxShadow: look.shadow,
          },
          cardStyle,
        ]}
      >
        <ScrollView
          bounces={false}
          overScrollMode="never"
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: DIALOG.padTop,
            paddingHorizontal: DIALOG.padX,
            paddingBottom: DIALOG.padBottom,
            alignItems: 'center',
          }}
        >
          {options.icon ? (
            <View
              style={[
                styles.disc,
                { backgroundColor: danger ? look.dangerDisc : colors.surface2 },
                { marginBottom: DIALOG.titleGap },
              ]}
            >
              <CapIcon
                name={options.icon}
                size={DIALOG.discIcon}
                color={danger ? look.dangerIcon : colors.accent}
                soft={1}
              />
            </View>
          ) : null}
          <T v="title" center color={kit.ink} style={DIALOG.title} accessibilityRole="header">
            {title}
          </T>
          <T v="body" center style={[DIALOG.note, { marginTop: DIALOG.noteGap }]}>
            {options.note}
          </T>
          {options.children ? (
            <View style={{ alignSelf: 'stretch', marginTop: DIALOG.actionsGap }}>
              {options.children}
            </View>
          ) : null}
          <View
            style={{ alignSelf: 'stretch', marginTop: DIALOG.actionsGap, gap: DIALOG.buttonGap }}
          >
            <Btn
              block
              variant={danger ? 'danger' : 'primary'}
              icon={options.confirmIcon}
              testID={testID}
              label={options.confirmLabel}
              onPress={onConfirm}
              loading={pending}
            />
            <Btn
              block
              variant="glassy"
              testID={testID ? `${testID}-cancel` : undefined}
              label={options.cancelLabel}
              onPress={onCancel}
            />
          </View>
        </ScrollView>
      </Reanimated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'center' },
  card: { maxHeight: '100%' },
  disc: {
    width: DIALOG.disc,
    height: DIALOG.disc,
    borderRadius: DIALOG.disc / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
