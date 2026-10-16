import type { ReactNode, RefObject } from 'react';
import { KeyboardAvoidingView, ScrollView } from 'react-native';
import { type Edge, SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

import { useTabBarSpace } from './TabBar';

type Props = {
  children: ReactNode;
  // Tab screens leave the bottom edge to the tab bar.
  edges?: readonly Edge[];
  // For a screen that moves its own scroll (the venue goes back to its table card).
  scrollRef?: RefObject<ScrollView | null>;
};

// A scrolling screen on the canvas with the theme's side padding. Under the tabs the floating tab
// bar covers the bottom: the content scrolls behind it and ends above it.
export function Screen({ children, edges, scrollRef }: Props) {
  const { colors, shape } = useTheme();
  const barSpace = useTabBarSpace();
  const safe: readonly Edge[] = barSpace
    ? (edges ?? ['top', 'left', 'right', 'bottom']).filter((e) => e !== 'bottom')
    : (edges ?? ['top', 'left', 'right', 'bottom']);
  return (
    <SafeAreaView edges={safe} style={{ flex: 1, backgroundColor: colors.canvas }}>
      <KeyboardAvoidingView
        className="flex-1"
        // Android is edge-to-edge: the window no longer resizes for the keyboard, so pad here too.
        behavior="padding"
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: shape.screenPadding,
            paddingTop: SPACING[3],
            paddingBottom: SPACING[8] + barSpace,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
