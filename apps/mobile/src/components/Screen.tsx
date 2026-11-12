import { useQueryClient } from '@tanstack/react-query';
import {
  Children,
  createElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
  type RefObject,
  useEffect,
  useState,
} from 'react';
import { ScrollView, View, type ViewStyle } from 'react-native';
import { type Edge, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { SharedValue } from 'react-native-reanimated';

import { AuraBackground } from '@/aura/AuraBackground';
import { useTabOpenings } from '@/aura/motion';
import type { TabOpenings } from '@/lib/tabOpenings';
import { Reveal } from '@/aura/Reveal';
import {
  ScrollBody,
  ScrollScreen,
  ScrollViewport,
  useContentHeightFeed,
  useScrollOffset,
} from '@/motion/ScrollScreen';
import { StickyField } from '@/motion/StickyField';
import {
  BarBand,
  LargeTitle,
  PageTopPart,
  TOP_BAR,
  TOP_BAR_ROW,
  TopBarRow,
  type TopBarKind,
} from '@/motion/TopBar';
import { AURA } from '@/theme/aura';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';
import { PullScroll } from '@/components/PullScroll';

import { PageTop } from './PageTop';
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
  // A refreshing list's offset (PullScroll), and what is drawn over the list's top edge: a part
  // pinned once it reaches the top (Aktiviteler's tabs, the owner's call, 8 Kasım).
  scrollY?: SharedValue<number>;
  pinned?: ReactNode;
  // Drawn on the ground behind the page, placed against the whole screen (Aura v71: a riso buddy
  // standing in a corner of Gizlilik, Engellenenler).
  backdrop?: ReactNode;
  // The screen's top bar (docs/design/iskelet.md → 3.1) with its `title`: `buyukBaslik` (a tab's own
  // screen) or `sayfa` (as a PageTop in `top`, which takes the `sayfa` bar by itself).
  bar?: TopBarKind;
  title?: string;
};

// A scrolling screen on the colour clouds (docs/design/aura) with the theme's side padding. Under
// the tabs the floating tab bar covers the bottom: the content scrolls behind it and ends above it.
// Its parts arrive one after another (the film's cascade), again each time its tab is opened.
const TOP_FADE = SPACING[5];
// The footer (U9): 12 above the tab bar, the keyboard or the bottom safe area (46 from the foot on
// a 34 safe area, 122 over the tab bar), its parts 8 apart. No fades at the top and the bottom (the
// owner's call, 6 Kasım): the content ends where the bars begin.
const FOOTER_LIFT = 12;
const FOOTER_GAP = 8;
// Under the tabs the last row ends 124 from the screen's foot on the canvas's 34 safe area
// (ekran.css `.scroll-pad`): 90 over the safe area.
const SCROLL_PAD = 90;

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
  backdrop,
  scrollY,
  pinned,
  bar,
  title,
}: Props) {
  const queryClient = useQueryClient();
  const refresh =
    onRefresh ?? (refreshable ? () => queryClient.refetchQueries({ type: 'active' }) : undefined);
  const { shape, scheme } = useTheme();
  const openings = useTabOpenings();
  const barSpace = useTabBarSpace();
  const insets = useSafeAreaInsets();
  const keyboardUp = useKeyboardState((s) => s.isVisible);
  const y = useScrollOffset(scrollY);
  const safe: readonly Edge[] = barSpace
    ? (edges ?? ['top', 'left', 'right', 'bottom']).filter((e) => e !== 'bottom')
    : (edges ?? ['top', 'left', 'right', 'bottom']);
  const fixed = !(list || refresh || scrollRef || stickyHeaderIndices);
  // The top bar (iskelet.md → 3.1): a PageTop in `top` is the `sayfa` bar; `bar` names one.
  const page: ReactElement | null =
    isValidElement(top) && top.type === PageTop
      ? top
      : bar === 'sayfa' && title
        ? createElement(PageTop, { title })
        : null;
  const kind: TopBarKind | null = page ? 'sayfa' : bar === 'buyukBaslik' && title ? bar : null;
  // A scrolling screen with a top bar: the bar stays over the content (its band coming in), and
  // the large title is the content's first part, scrolling with it. A fixed screen keeps its top
  // where it was, the large title still under the bar's row.
  const overlay = !fixed && kind !== null;
  const head = !overlay ? null : page ? (
    <PageTopPart.Provider key="top-bar-title" value="title">
      {page}
    </PageTopPart.Provider>
  ) : (
    <LargeTitle key="top-bar-title" kind="buyukBaslik" title={title ?? ''} />
  );
  const flowTop =
    overlay || kind === null
      ? top
      : (page ?? <LargeTitle kind="buyukBaslik" title={title ?? ''} />);
  const body = head ? [head, ...cascade(children, openings)] : cascade(children, openings);
  // Under a fixed top the page starts 20 below the bar's foot; under the overlaid bar, below its row.
  const content = {
    flexGrow: 1,
    paddingHorizontal: shape.screenPadding,
    paddingTop: overlay ? TOP_BAR_ROW + SPACING[2] : flowTop ? TOP_FADE : SPACING[3],
    paddingBottom: footer ? SPACING[4] : barSpace ? insets.bottom + SCROLL_PAD : SPACING[8],
    gap,
  };
  // The large title goes before the screen's own parts: their sticky indices move by one.
  const sticky = head ? stickyHeaderIndices?.map((i) => i + 1) : stickyHeaderIndices;
  const range = kind ? TOP_BAR[kind].title : null;
  return (
    <ScrollScreen y={fixed ? null : y}>
      <SafeAreaView edges={safe} style={{ flex: 1, backgroundColor: AURA[scheme].ground }}>
        <AuraBackground />
        {backdrop}
        {flowTop ? (
          <View
            // Over the band below it (drawn last): its buttons' shadows reach past its foot and the
            // band's hard top edge cut them (the owner's report, 2 Kasım, 6.8).
            style={{
              paddingHorizontal: shape.screenPadding,
              paddingTop: SPACING[2],
              paddingBottom: SPACING[1],
              zIndex: 1,
            }}
          >
            {flowTop}
          </View>
        ) : null}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          // Android is edge-to-edge: the window no longer resizes for the keyboard, so pad here too.
          behavior="padding"
        >
          <ScrollViewport>
            {fixed ? (
              <FixedBody content={content}>{body}</FixedBody>
            ) : refresh && !scrollRef && !stickyHeaderIndices ? (
              <PullBody
                onRefresh={refresh}
                y={y}
                content={content}
                indicatorTop={overlay ? TOP_BAR_ROW : 0}
              >
                {body}
              </PullBody>
            ) : (
              <ScrollBody
                y={y}
                scrollRef={scrollRef}
                contentContainerStyle={content}
                keyboardShouldPersistTaps="handled"
                stickyHeaderIndices={sticky}
              >
                {body}
              </ScrollBody>
            )}
          </ScrollViewport>
          {pinned ? (
            <View
              pointerEvents="box-none"
              style={{ position: 'absolute', left: 0, right: 0, top: 0 }}
            >
              {pinned}
            </View>
          ) : null}
          {footer ? (
            <View
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
        {overlay && range ? (
          <>
            {/* The band from the screen's top edge (under the status bar too), then the bar's row
                where the top was. */}
            <BarBand from={range[0]} to={range[1]} />
            <View
              pointerEvents="box-none"
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: safe.includes('top') ? insets.top : 0,
                paddingHorizontal: shape.screenPadding,
                paddingTop: SPACING[2],
                paddingBottom: SPACING[1],
              }}
            >
              {page ? (
                <PageTopPart.Provider value="bar">{page}</PageTopPart.Provider>
              ) : (
                <TopBarRow kind="buyukBaslik" title={title ?? ''} back={false} />
              )}
            </View>
          </>
        ) : null}
      </SafeAreaView>
    </ScrollScreen>
  );
}

// The refreshing list (PullScroll) inside the screen's scroll holder: its offset is the screen's,
// its content's height goes to a sticky field.
function PullBody({
  onRefresh,
  y,
  content,
  indicatorTop,
  children,
}: {
  onRefresh: () => Promise<unknown>;
  y: SharedValue<number>;
  content: ViewStyle;
  indicatorTop: number;
  children: ReactNode;
}) {
  const onContentSizeChange = useContentHeightFeed();
  return (
    <PullScroll
      onRefresh={onRefresh}
      scrollY={y}
      indicatorTop={indicatorTop}
      contentContainerStyle={content}
      keyboardShouldPersistTaps="handled"
      onContentSizeChange={onContentSizeChange}
    >
      {children}
    </PullScroll>
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
function cascade(children: ReactNode, openings: TabOpenings | null) {
  return Children.toArray(children).map((child, i) => (
    <Reveal
      key={isValidElement(child) && child.key !== null ? child.key : i}
      index={i}
      openings={openings}
      style={[
        fills(child) ? { flexGrow: 1 } : null,
        // A sticky field is drawn over the parts that scroll under it once it is pinned.
        isValidElement(child) && child.type === StickyField ? { zIndex: 1 } : null,
      ]}
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
