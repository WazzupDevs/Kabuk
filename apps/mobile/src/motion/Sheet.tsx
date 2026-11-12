import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, useWindowDimensions, View } from 'react-native';
import type Reanimated from 'react-native-reanimated';
import type { AnimatedRef } from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { InSheet, T, useKit } from '@/aura/kit';
import { Peek, type PeekKind } from '@/aura/Peek';
import { AppIcon } from '@/components/AppIcon';
import type { IconName } from '@/components/Button';
import { InSheetLoops, useSheetsOpen } from '@/components/Loader';
import { Quiet } from '@/components/Quiet';
import { useSheetCloser } from '@/components/sheetCloser';
import { SheetCard, type SheetLook } from '@/components/SheetCard';
import { SheetScrim } from '@/components/SheetScrim';
import { tr } from '@/i18n/tr';
import { ACTIVITIES } from '@/theme/activities';
import { KIT, type KitTextVariant } from '@/theme/auraKit';
import { runSheetSlide } from '@/lib/sheetSlide';
import { useLeaveKeyboard } from '@/lib/modalKeyboard';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON } from '@/theme/tokens';

import { useSheetFrost, useSheetMotion } from './useSheetMotion';

// A closing slide that never reports its end: off the screen this long after it should have ended.
const SLIDE_FALLBACK_MS = 250;
const ICON_DISC = 56;
const SUBTITLE_GAP = 4;
// The title's line with a picture (`titleArt`): only the game's sheet has one (tuval Sohbet).
const ART = ACTIVITIES.sheet;

type Props = {
  visible: boolean;
  // Without it the sheet can only be left through its own buttons (the join request).
  onClose?: () => void;
  // Unset: the content starts under the handle (a person's card opens with their face).
  title?: string;
  // Beside the title, small (skall tuvali, MasaKisiler: "Masadakiler 6 kişi").
  titleNote?: string;
  // Under the title, 4 apart (U24, Masadakiler: "12 kişi · …").
  subtitle?: string;
  icon?: IconName;
  // Aura v71 (SikayetEt): a 24 icon in the title's line, 10 before it, no disc.
  titleIcon?: IconName;
  // A picture in the title's line before it, the title and the subtitle beside it (iskelet.md →
  // 5.3: a game's picture over its record).
  titleArt?: ReactNode;
  // Centered text for a single decision (the join request); menus stay left-aligned.
  centered?: boolean;
  // Buddies looking over the sheet's top edge (docs/design/aura → CheckIn, Bildirimler).
  peek?: PeekKind;
  // The title larger (Masa kur: 24).
  titleLarge?: boolean;
  // The sheet reaches this far from the screen's top whatever its content (Masa kur: 96), which
  // then fills it; a `flexGrow` spacer in it keeps the last button at its foot.
  top?: number;
  // Buttons and notes that stay at the sheet's foot under the scrolling content (Masa kur, aura v47):
  // what scrolls fades out into them only while it does not fit.
  footer?: ReactNode;
  // The content's scroll, for a sheet that moves it itself (Kapsülünü süsle's pack chips).
  scrollRef?: AnimatedRef<Reanimated.ScrollView>;
  // A board's own sheet (SheetCard → look; tuval Dm's block).
  look?: SheetLook;
  // The title's type where a board gives one (tuval Mekan's invite: 22/800).
  titleType?: KitTextVariant;
  children: ReactNode;
};

// A bottom sheet over a scrim (iskelet.md → 3.5): menus, confirmations and the join request.
// Always a trust surface (`Quiet`): hairlines, one clear action. Its handle and title stay put, the
// close button at the title's right; no "Tamam" or "Kapat" of its own. It opens on springs.sheet
// from 80 below and faded to 0.3 (useSheetMotion), the scrim fading in; it leaves down off the
// screen; with reduce motion it appears and goes at once. A tap outside, Android's back button, a
// pull down and its close button close it. Its card is on the live glass where it can be.
export function Sheet({
  visible,
  onClose,
  title,
  titleNote,
  subtitle,
  icon,
  titleIcon,
  titleArt,
  centered,
  peek,
  titleLarge,
  top,
  footer,
  scrollRef,
  look,
  titleType,
  children,
}: Props) {
  const { colors, shape } = useTheme();
  const { c: kit } = useKit();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const motion = useSheetMotion();
  const frost = useSheetFrost();
  const [mounted, setMounted] = useState(visible);
  useLeaveKeyboard(visible);
  // While the sheet is on the screen the screen behind holds its loops (Loader.tsx → useLoopActive).
  useEffect(() => {
    if (!mounted) return undefined;
    useSheetsOpen.setState((s) => ({ count: s.count + 1 }));
    return () => useSheetsOpen.setState((s) => ({ count: Math.max(0, s.count - 1) }));
  }, [mounted]);
  if (visible && !mounted) setMounted(true);
  // closeAllSheets: an open sheet closes as if tapped outside.
  const round = useSheetCloser((s) => s.round);
  const handled = useRef(round);
  useEffect(() => {
    if (round === handled.current) return;
    handled.current = round;
    if (visible) onClose?.();
  }, [round, visible, onClose]);

  const { show, hide, reset, leaveMs, reduce } = motion;
  useEffect(() => {
    if (!mounted) return undefined;
    // Closing, it leaves the screen even when the slide was cut short (sheetSlide.ts).
    return runSheetSlide(
      visible ? show(reduce) : hide(reduce),
      !visible,
      () => {
        reset();
        setMounted(false);
      },
      leaveMs + SLIDE_FALLBACK_MS,
    );
  }, [visible, mounted, reduce, show, hide, reset, leaveMs]);

  const head =
    title || icon ? (
      <View className={`gap-3 ${centered ? 'items-center' : ''}`}>
        {icon ? (
          <View
            className="mt-2 items-center justify-center"
            style={{
              width: ICON_DISC,
              height: ICON_DISC,
              borderRadius: shape.radius.pill,
              backgroundColor: colors.surface2,
            }}
          >
            <AppIcon name={icon} size={ICON.lg} color={colors.accent} />
          </View>
        ) : null}
        {title ? (
          <View
            style={
              titleArt
                ? { flexDirection: 'row', alignItems: 'center', gap: ART.artGap }
                : { alignSelf: 'stretch' }
            }
          >
            {titleArt}
            {/* With a picture (tuval Sohbet, the game's sheet): the title 22/800, its line 13/600,
                3 apart. */}
            <View
              style={{
                gap: titleArt ? ART.titleGap : SUBTITLE_GAP,
                alignSelf: 'stretch',
                flex: titleArt ? 1 : undefined,
                justifyContent: 'center',
              }}
            >
              <View className="flex-row items-center" style={{ gap: KIT.size.titleIconGap }}>
                {titleIcon ? (
                  <AppIcon name={titleIcon} size={KIT.size.titleIcon} color={colors.accent} />
                ) : null}
                <View className="flex-1">
                  <T
                    v={
                      titleType ?? (titleArt ? 'sheetGame' : titleLarge ? 'sheetTitleLg' : 'title')
                    }
                    center={centered}
                    accessibilityRole="header"
                  >
                    {title}
                    {titleNote ? <T v="fine">{`  ${titleNote}`}</T> : null}
                  </T>
                </View>
              </View>
              {subtitle ? (
                <T
                  v={titleArt ? 'exploreCount' : 'fine'}
                  color={titleArt ? kit.muted : undefined}
                  center={centered}
                >
                  {subtitle}
                </T>
              ) : null}
            </View>
          </View>
        ) : null}
      </View>
    ) : undefined;

  return (
    <Modal
      transparent
      animationType="none"
      visible={mounted}
      onRequestClose={onClose ?? (() => undefined)}
    >
      {/* A Modal is a window of its own: the sheet's pull needs its own gesture root there. */}
      <InSheetLoops.Provider value>
        <GestureHandlerRootView style={{ flex: 1, justifyContent: 'flex-end' }}>
          <SheetScrim opacity={motion.scrim} glass={frost} />
          <Pressable
            accessibilityRole={onClose ? 'button' : undefined}
            accessibilityLabel={onClose ? tr.common.close : undefined}
            disabled={!onClose}
            onPress={onClose}
            className="absolute inset-0"
          />
          <Animated.View
            accessibilityViewIsModal
            // iskelet.md → 3.5, down to the screen's foot as Telegram Android's sheets (the owner's
            // call, 30 Ekim). Pulled down, it closes like a tap outside (SheetCard).
            style={{
              ...(top !== undefined ? { height: height - top } : { maxHeight: '90%' }),
              opacity: motion.opacity,
              transform: [{ translateY: motion.translateY }],
            }}
          >
            <SheetCard
              onClose={onClose}
              bottomInset={insets.bottom}
              above={peek ? <Peek kind={peek} /> : null}
              head={
                head ? (
                  <InSheet>
                    <Quiet value>{head}</Quiet>
                  </InSheet>
                ) : undefined
              }
              balance={centered}
              frost={frost}
              fill={top !== undefined}
              scrollRef={scrollRef}
              look={look}
              footer={
                footer ? (
                  <InSheet>
                    <Quiet value>{footer}</Quiet>
                  </InSheet>
                ) : undefined
              }
            >
              <InSheet>
                <Quiet value>
                  <View
                    style={{
                      gap: KIT.size.rowGap,
                      flexGrow: top !== undefined ? 1 : undefined,
                    }}
                  >
                    {children}
                  </View>
                </Quiet>
              </InSheet>
            </SheetCard>
          </Animated.View>
        </GestureHandlerRootView>
      </InSheetLoops.Provider>
    </Modal>
  );
}
