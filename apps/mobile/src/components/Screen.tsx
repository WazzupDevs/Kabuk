import { useQueryClient } from '@tanstack/react-query';
import type { ReactNode, RefObject } from 'react';
import { ScrollView, View } from 'react-native';
import { type Edge, SafeAreaView } from 'react-native-safe-area-context';

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

// A scrolling screen on the canvas with the theme's side padding. Under the tabs the floating tab
// bar covers the bottom: the content scrolls behind it and ends above it.
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
  const { colors, shape } = useTheme();
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
    <SafeAreaView edges={safe} style={{ flex: 1, backgroundColor: colors.canvas }}>
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
            {children}
          </PullScroll>
        ) : (
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={content}
            keyboardShouldPersistTaps="handled"
            stickyHeaderIndices={stickyHeaderIndices}
          >
            {children}
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
