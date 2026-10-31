import { useQueryClient } from '@tanstack/react-query';
import {
  Children,
  isValidElement,
  type ReactNode,
  type RefObject,
  useEffect,
  useState,
} from 'react';
import { ScrollView, View } from 'react-native';
import { type Edge, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuraBackground, AuraBand } from '@/aura/AuraBackground';
import { useTabFocus } from '@/aura/motion';
import { Reveal } from '@/aura/Reveal';
import { AURA } from '@/theme/aura';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';
import { PullScroll } from '@/components/PullScroll';

import { useTabBarSpace } from './TabBar';
// Frame by frame with the keyboard (react-native-keyboard-controller): the bar rises with it.
import { KeyboardAvoidingView, useKeyboardState } from 'react-native-keyboard-controller';

type Props = {
  children: ReactNode;
  // Tab screens leave the bottom edge to the tab bar.
  edges?: readonly Edge[];
  // For a screen that moves its own scroll (the venue goes back to its table card).
  scrollRef?: RefObject<ScrollView | null>;
  // Children that stay at the top while the rest scrolls under them (the venue's cards).
  stickyHeaderIndices?: number[];
  // Pull to refresh (the brand's pull, PullScroll): the screen's lists fetched again.
  onRefresh?: () => Promise<unknown>;
  // Pull to refresh that fetches again every list the screen shows.
  refreshable?: boolean;
  // A bar that stays at the top while the page scrolls (Mekan's top row, the owner's call, 27
  // Ekim), on the screen's ground.
  top?: ReactNode;
  // The space between the screen's parts (the canvas's `.content` gap).
  gap?: number;
  // A screen whose content is a list (rows one under another: the lobby, Keşfet, Mesajlar). Only
  // these scroll; every other screen stays still (the owner's call, 28 Ekim). A fixed screen
  // scrolls only when its content does not fit (the keyboard up, the largest text size), so nothing
  // is cut. A screen that refreshes or moves its own scroll is a list.
  list?: boolean;
  // Buttons that stay at the screen's foot under a fixed screen (Profili düzenle, aura v50): 12
  // above the tab bar, and 12 above the keyboard while it is up (the screen's own keyboard padding
  // lifts it; no second offset). What does not fit scrolls above it and fades into its top edge.
  footer?: ReactNode;
};

// A scrolling screen on the colour clouds (docs/design/aura) with the theme's side padding. Under
// the tabs the floating tab bar covers the bottom: the content scrolls behind it and ends above it.
// Its parts arrive one after another (the film's cascade), again each time its tab is opened.
const TOP_FADE = SPACING[5];
// The footer: 12 above the tab bar or the keyboard, its parts 8 apart, 24 of fade over it.
const FOOTER_LIFT = 12;
const FOOTER_GAP = 8;
const FOOTER_FADE = 24;

export function Screen({
  children,
  edges,
  scrollRef,
  stickyHeaderIndices,
  onRefresh,
  refreshable,
  top,
  gap,
  list,
  footer,
}: Props) {
  const queryClient = useQueryClient();
  const refresh =
    onRefresh ?? (refreshable ? () => queryClient.refetchQueries({ type: 'active' }) : undefined);
  const { shape, scheme } = useTheme();
  const focus = useTabFocus();
  const barSpace = useTabBarSpace();
  const insets = useSafeAreaInsets();
  const keyboardUp = useKeyboardState((s) => s.isVisible);
  // The footer's top on the screen and whether the content above it overflows (its fade).
  const [bodyTop, setBodyTop] = useState(0);
  const [footTop, setFootTop] = useState(0);
  const [overflows, setOverflows] = useState(false);
  const safe: readonly Edge[] = barSpace
    ? (edges ?? ['top', 'left', 'right', 'bottom']).filter((e) => e !== 'bottom')
    : (edges ?? ['top', 'left', 'right', 'bottom']);
  // Under a fixed top the page fades out softly instead of being cut at the bar's foot (the
  // owner's report, 28 Ekim); it starts below the fade, so nothing is faded at rest.
  const [topFoot, setTopFoot] = useState(0);
  const content = {
    flexGrow: 1,
    paddingHorizontal: shape.screenPadding,
    paddingTop: top ? TOP_FADE : SPACING[3],
    // Under the tabs the last row ends 26 above the bar (aura.css `.scroll-pad`; barSpace holds 16
    // of it and the navigation area under the bar).
    paddingBottom: footer ? SPACING[4] : barSpace ? barSpace + SPACING[2.5] : SPACING[8],
    gap,
  };
  return (
    <SafeAreaView edges={safe} style={{ flex: 1, backgroundColor: AURA[scheme].ground }}>
      <AuraBackground />
      {top ? (
        <View
          onLayout={(e) => {
            const { y, height } = e.nativeEvent.layout;
            setTopFoot(y + height);
          }}
          style={{
            paddingHorizontal: shape.screenPadding,
            paddingTop: SPACING[2],
            paddingBottom: SPACING[1],
          }}
        >
          {top}
        </View>
      ) : null}
      <KeyboardAvoidingView
        onLayout={footer ? (e) => setBodyTop(e.nativeEvent.layout.y) : undefined}
        style={{ flex: 1 }}
        // Android is edge-to-edge: the window no longer resizes for the keyboard, so pad here too.
        behavior="padding"
      >
        {!(list || refresh || scrollRef || stickyHeaderIndices) ? (
          <FixedBody content={content} onOverflow={footer ? setOverflows : undefined}>
            {cascade(children, focus.opened)}
          </FixedBody>
        ) : refresh && !scrollRef && !stickyHeaderIndices ? (
          <PullScroll
            onRefresh={refresh}
            contentContainerStyle={content}
            keyboardShouldPersistTaps="handled"
          >
            {cascade(children, focus.opened)}
          </PullScroll>
        ) : (
          <ScrollView
            showsHorizontalScrollIndicator={false}
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={content}
            keyboardShouldPersistTaps="handled"
            stickyHeaderIndices={stickyHeaderIndices}
          >
            {cascade(children, focus.opened)}
          </ScrollView>
        )}
        {footer ? (
          <View
            onLayout={(e) => setFootTop(e.nativeEvent.layout.y)}
            style={{
              paddingHorizontal: shape.screenPadding,
              gap: FOOTER_GAP,
              paddingBottom:
                FOOTER_LIFT +
                (keyboardUp || !barSpace
                  ? 0
                  : insets.bottom + AURA.tabBar.bottom + AURA.tabBar.height),
            }}
          >
            {footer}
          </View>
        ) : null}
      </KeyboardAvoidingView>
      {footer && overflows && footTop > 0 ? (
        <AuraBand top={bodyTop + footTop} height={0} fade={FOOTER_FADE} direction="up" />
      ) : null}
      {top && topFoot > 0 ? (
        <AuraBand top={topFoot} height={0} fade={TOP_FADE} direction="down" />
      ) : null}
    </SafeAreaView>
  );
}

// A screen that is not a list: still, no bounce and no scroll bar. It scrolls only while its content
// is taller than the screen (the keyboard up, the largest text size: nothing is cut, CLAUDE.md →
// Ekran davranışı).
function FixedBody({
  content,
  onOverflow,
  children,
}: {
  content: { flexGrow: number; gap?: number };
  // Told whether the content overflows (Screen → `footer`'s fade).
  onOverflow?: (overflows: boolean) => void;
  children: ReactNode;
}) {
  const [box, setBox] = useState(0);
  const [inner, setInner] = useState(0);
  const overflows = box > 0 && inner > box + 1;
  useEffect(() => {
    onOverflow?.(overflows);
  }, [overflows, onOverflow]);
  return (
    <ScrollView
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={content}
      keyboardShouldPersistTaps="handled"
      scrollEnabled={overflows}
      bounces={false}
      overScrollMode="never"
      showsVerticalScrollIndicator={false}
      onLayout={(e) => setBox(e.nativeEvent.layout.height)}
      onContentSizeChange={(_w, h) => setInner(h)}
    >
      {children}
    </ScrollView>
  );
}

// Each part of the screen in its own arrival, the n-th a step after the one before. A part that
// fills the screen (`flex-1`, as the empty and error states do) keeps filling it.
function cascade(children: ReactNode, replay: number) {
  return Children.toArray(children).map((child, i) => (
    <Reveal
      key={isValidElement(child) && child.key !== null ? child.key : i}
      index={i}
      replay={replay}
      style={fills(child) ? { flexGrow: 1 } : undefined}
    >
      {child}
    </Reveal>
  ));
}

function fills(child: ReactNode): boolean {
  if (!isValidElement<{ className?: unknown; style?: unknown }>(child)) return false;
  const { className, style } = child.props;
  if (typeof className === 'string' && /(?:^|\s)flex-1(?:\s|$)/.test(className)) return true;
  const flat = Array.isArray(style) ? Object.assign({}, ...style.filter(Boolean)) : style;
  return (
    typeof flat === 'object' &&
    flat !== null &&
    (('flex' in flat && Number(flat.flex) > 0) || ('flexGrow' in flat && Number(flat.flexGrow) > 0))
  );
}
