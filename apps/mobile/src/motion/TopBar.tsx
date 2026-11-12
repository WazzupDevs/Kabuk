import { router } from 'expo-router';
import { createContext, type ReactNode, useState } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { Round } from '@/aura/kit';
import { Text } from '@/components/Text';
import { tr } from '@/i18n/tr';
import { AURA, barBandCss, MOTION } from '@/theme/aura';
import { KIT } from '@/theme/auraKit';
import { gradientStyle } from '@/theme/gradient';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

import { arriveAt, bandReachAt, fadeAt } from './scrollMath';
import { useScreenScroll } from './ScrollScreen';

// The top bars (docs/design/iskelet.md → 3.1): screens do not write their own. `buyukBaslik` (a
// tab's own screen): the large title scrolls with the content and fades over MOTION.scroll's
// titleFade, shrinking to 0.94 from its lower left. `sayfa` (Arkadaşlar, the settings pages): the
// 46 glass back button on the bar, the 34/800 large title under it; scrolled, the title fades over
// 5 to 50, the band comes in and the bar's centred small title over 40 to 70. The band and the bar
// stay; everything here follows the finger one to one on the UI thread (4.1). `sohbet` and `kapak`
// take the band and the back button from here (their own screens come later).
export type TopBarKind = 'buyukBaslik' | 'sayfa';

const t = AURA.topBar;

// The ranges of each kind: the large title's fade (and the band's arrival), the bar title's.
export const TOP_BAR: Record<
  TopBarKind,
  { title: readonly [number, number]; barTitle: readonly [number, number]; scale: number }
> = {
  buyukBaslik: {
    title: MOTION.scroll.titleFade,
    barTitle: [MOTION.scroll.titleFade[1] - t.largeBarTitlePx, MOTION.scroll.titleFade[1]],
    scale: t.largeTitleScale,
  },
  sayfa: { title: t.pageTitleFade, barTitle: t.pageBarTitle, scale: 1 },
};

// Which part of a `sayfa` top (PageTop) Screen draws where: on a scrolling screen the bar's row over
// the content and the large title as the content's first part; on a still one both, in place.
export const PageTopPart = createContext<'whole' | 'bar' | 'title'>('whole');

// The bar's row: the back button's height, 8 over it and 4 under it.
export const TOP_BAR_ROW = SPACING[2] + KIT.size.topBtn + SPACING[1];

// The band behind the bar (118 high with the status bar; the ground at 84 %, its foot fading out):
// drawn once, only its opacity moves with the scroll (0 → 1 over `from`–`to`). Under a pinned field
// it reaches below the field (StickyField). Nothing on a screen that does not scroll.
export function BarBand({ from, to }: { from: number; to: number }) {
  const scroll = useScreenScroll();
  const { scheme } = useTheme();
  const reach = scroll?.reach ?? 0;
  const style = useAnimatedStyle(() => {
    if (!scroll) return { opacity: 0 };
    const y = scroll.y.get();
    return {
      opacity: arriveAt(y, from, to),
      transform: [{ translateY: bandReachAt(y, scroll.stickyAt.get(), reach) }],
    };
  });
  if (!scroll) return null;
  const height = t.bandHeight + reach;
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: 'absolute', left: 0, right: 0, top: 0, height },
        gradientStyle(barBandCss(scheme, height)),
        style,
      ]}
    />
  );
}

// The bar's glass back button (46, iskelet.md → 2.1).
export function BarBack({ onBack }: { onBack?: () => void }) {
  return (
    <Round
      icon="back"
      side={KIT.size.topBtn}
      label={tr.common.back}
      onPress={onBack ?? (() => router.back())}
    />
  );
}

// The bar: the back button at the left, `trailing` at the right and the small title centred
// between them, coming in over `kind`'s range. Without a scroll the small title never shows (the
// large one stays in place).
export function TopBarRow({
  kind,
  title,
  back = true,
  onBack,
  trailing,
}: {
  kind: TopBarKind;
  title: string;
  back?: boolean;
  onBack?: () => void;
  trailing?: ReactNode;
}) {
  const scroll = useScreenScroll();
  const [side, setSide] = useState<number>(KIT.size.topBtn);
  const [from, to] = TOP_BAR[kind].barTitle;
  const titleStyle = useAnimatedStyle(() => ({
    opacity: scroll ? arriveAt(scroll.y.get(), from, to) : 0,
  }));
  return (
    <View
      className="flex-row items-center justify-between"
      style={{ minHeight: KIT.size.topBtn, gap: SPACING[3] }}
    >
      {back ? <BarBack onBack={onBack} /> : <View />}
      {scroll ? (
        <Animated.View
          pointerEvents="none"
          // The large title is what a screen reader reads; this is its copy on the bar.
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
          style={[
            {
              position: 'absolute',
              left: side + SPACING[2],
              right: side + SPACING[2],
              top: 0,
              bottom: 0,
              justifyContent: 'center',
            },
            titleStyle,
          ]}
        >
          {/* At most two lines, smaller if it does not fit (as the room's title, ChatTopBar). */}
          <Text variant="heading" align="center" numberOfLines={2} adjustsFontSizeToFit>
            {title}
          </Text>
        </Animated.View>
      ) : null}
      {trailing ? (
        <View
          onLayout={(e) =>
            setSide(Math.max(KIT.size.topBtn, Math.ceil(e.nativeEvent.layout.width)))
          }
        >
          {trailing}
        </View>
      ) : null}
    </View>
  );
}

// The large title (and a quieter line under it): it scrolls with the content and fades over
// `kind`'s range, a tab's shrinking from its lower left. Still on a screen that does not scroll.
// `children` stand for the title where a screen draws its own (Keşfet's line of the day over its
// question, 5.1); they fade the same way.
export function LargeTitle({
  kind,
  title,
  sub,
  children,
}: {
  kind: TopBarKind;
  title?: string;
  sub?: string;
  children?: ReactNode;
}) {
  const scroll = useScreenScroll();
  const { title: range, scale: scaleTo } = TOP_BAR[kind];
  const [from, to] = range;
  const style = useAnimatedStyle(() => {
    if (!scroll) return { opacity: 1, transform: [{ scale: 1 }] };
    const f = fadeAt(scroll.y.get(), from, to, scaleTo);
    return { opacity: f.opacity, transform: [{ scale: f.scale }] };
  });
  return (
    <Animated.View style={[{ transformOrigin: 'left bottom' }, style]}>
      {children ?? (
        <Text variant="largeTitle" accessibilityRole="header">
          {title}
        </Text>
      )}
      {sub ? <Text variant="fine">{sub}</Text> : null}
    </Animated.View>
  );
}
