import { useQueryClient } from '@tanstack/react-query';
import { Children, isValidElement, type ReactNode, type RefObject } from 'react';
import { ScrollView, View } from 'react-native';
import { type Edge, SafeAreaView } from 'react-native-safe-area-context';

import { AuraBackground } from '@/aura/AuraBackground';
import { useTabFocus } from '@/aura/motion';
import { Reveal } from '@/aura/Reveal';
import { AURA } from '@/theme/aura';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';
import { PullScroll } from '@/ui/PullScroll';

import { useTabBarSpace } from './TabBar';
// Frame by frame with the keyboard (react-native-keyboard-controller): the bar rises with it.
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

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
};

// A scrolling screen on the colour clouds (docs/design/aura) with the theme's side padding. Under
// the tabs the floating tab bar covers the bottom: the content scrolls behind it and ends above it.
// Its parts arrive one after another (the film's cascade), again each time its tab is opened.
export function Screen({
  children,
  edges,
  scrollRef,
  stickyHeaderIndices,
  onRefresh,
  refreshable,
  top,
}: Props) {
  const queryClient = useQueryClient();
  const refresh =
    onRefresh ?? (refreshable ? () => queryClient.refetchQueries({ type: 'active' }) : undefined);
  const { shape, scheme } = useTheme();
  const focus = useTabFocus();
  const barSpace = useTabBarSpace();
  const safe: readonly Edge[] = barSpace
    ? (edges ?? ['top', 'left', 'right', 'bottom']).filter((e) => e !== 'bottom')
    : (edges ?? ['top', 'left', 'right', 'bottom']);
  const content = {
    flexGrow: 1,
    paddingHorizontal: shape.screenPadding,
    paddingTop: SPACING[3],
    paddingBottom: SPACING[8] + barSpace,
  };
  return (
    <SafeAreaView edges={safe} style={{ flex: 1, backgroundColor: AURA[scheme].ground }}>
      <AuraBackground running={focus.focused} />
      {top ? (
        <View
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
        style={{ flex: 1 }}
        // Android is edge-to-edge: the window no longer resizes for the keyboard, so pad here too.
        behavior="padding"
      >
        {refresh && !scrollRef && !stickyHeaderIndices ? (
          <PullScroll
            onRefresh={refresh}
            contentContainerStyle={content}
            keyboardShouldPersistTaps="handled"
          >
            {cascade(children, focus.opened)}
          </PullScroll>
        ) : (
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={content}
            keyboardShouldPersistTaps="handled"
            stickyHeaderIndices={stickyHeaderIndices}
          >
            {cascade(children, focus.opened)}
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
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
      blur={i < BLURRED_PARTS && replay === 0}
      style={fills(child) ? { flexGrow: 1 } : undefined}
    >
      {child}
    </Reveal>
  ));
}

// The first parts arrive through blur as well the first time (a tab opened again is blurred whole
// by TabScene); the rest without, since each blur costs a layer.
const BLURRED_PARTS = 2;

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
