import { Ionicons } from '@expo/vector-icons';
import { createContext, type ReactNode, useContext, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  View,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { sameDay } from '@shared/chatRuns.ts';

import { tr } from '@/i18n/tr';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, SPACING } from '@/theme/tokens';

import { useDepth } from './Depth';
import { useTabBarSpace } from './TabBar';
import { Text } from './Text';

// How close to the end counts as "at the bottom" (a message's last line may sit under the edge).
const BOTTOM_SLACK = SPACING[12];

// Jumping to a message (docs/SPEC_V3.md §21.1: a tap on a quote): each row reports where it sits
// in the stream; jumpTo scrolls there, and does nothing for a message the page has not loaded.
export type ChatJump = {
  row: (id: string) => (e: LayoutChangeEvent) => void;
  jumpTo: (id: string) => boolean;
};
const ChatJumpContext = createContext<ChatJump | null>(null);

export function useChatJump(): ChatJump | null {
  return useContext(ChatJumpContext);
}

// One message's row in the stream: reports its place for jumpTo and hands jumpTo to its bubble
// (a quote's tap). Outside a ChatScroll it is a plain View and jumpTo does nothing.
export function ChatRow({
  id,
  className,
  children,
}: {
  id: string;
  className?: string;
  children: (jumpTo: (id: string) => void) => ReactNode;
}) {
  const jump = useChatJump();
  return (
    <View className={className} onLayout={jump?.row(id)}>
      {children((target) => void jump?.jumpTo(target))}
    </View>
  );
}

type ScrollProps = {
  children: ReactNode;
  // The newest message: when it changes, a viewer at the bottom follows it; one who scrolled up
  // gets the "Yeni mesaj" button instead. The viewer's own message is always followed.
  newestKey?: string;
  newestMine?: boolean;
  // Open at the newest message (DMs, the venue chat). The room opens at its top: the game.
  startAtEnd?: boolean;
  contentContainerStyle?: ViewStyle;
  testID?: string;
};

// A chat's message stream (canvas: Aşama 8 · Saha → Sohbet): at the bottom (the keyboard open too)
// it follows each new message; scrolled up it stays where the reader is and offers "Yeni mesaj".
export function ChatScroll({
  children,
  newestKey,
  newestMine,
  startAtEnd,
  contentContainerStyle,
  testID,
}: ScrollProps) {
  const { colors, shape } = useTheme();
  const depth = useDepth();
  const scroll = useRef<ScrollView>(null);
  // Where the reader is: offset, visible height and content height, from the last events.
  const metrics = useRef({ offset: 0, height: 0, content: 0 });
  const opened = useRef(false);
  const followed = useRef(newestKey);
  const [atBottom, setAtBottom] = useState(true);
  const [pending, setPending] = useState(0);
  const rows = useRef(new Map<string, number>());
  const jump = useMemo<ChatJump>(
    () => ({
      row: (id) => (e) => void rows.current.set(id, e.nativeEvent.layout.y),
      jumpTo: (id) => {
        const y = rows.current.get(id);
        if (y === undefined) return false;
        scroll.current?.scrollTo({ y: Math.max(0, y - SPACING[4]), animated: true });
        return true;
      },
    }),
    [],
  );

  // A new message while the reader is up the stream: count it for the button.
  const [seenKey, setSeenKey] = useState(newestKey);
  if (newestKey !== seenKey) {
    setSeenKey(newestKey);
    if (seenKey !== undefined && newestKey !== undefined && !atBottom && !newestMine) {
      setPending((n) => n + 1);
    }
  }

  const bottomOf = (content: number) =>
    metrics.current.offset + metrics.current.height >= content - BOTTOM_SLACK;
  const toEnd = (animated: boolean) => {
    scroll.current?.scrollToEnd({ animated });
    setAtBottom(true);
    setPending(0);
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
    metrics.current = {
      offset: contentOffset.y,
      height: layoutMeasurement.height,
      content: contentSize.height,
    };
    const bottom = bottomOf(contentSize.height);
    if (bottom !== atBottom) setAtBottom(bottom);
    if (bottom && pending > 0) setPending(0);
  };

  const onContentSizeChange = (_w: number, h: number) => {
    // Measured against the content before it grew: was the reader at the bottom?
    const wasBottom = bottomOf(metrics.current.content);
    metrics.current.content = h;
    if (!opened.current) {
      opened.current = true;
      if (startAtEnd) toEnd(false);
      else setAtBottom(bottomOf(h));
      return;
    }
    const own = !!newestMine && newestKey !== followed.current;
    followed.current = newestKey;
    if (wasBottom || own) toEnd(true);
    else setAtBottom(false);
  };

  return (
    <View className="flex-1">
      <ScrollView
        ref={scroll}
        testID={testID}
        className="flex-1"
        contentContainerStyle={contentContainerStyle}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={64}
        onScroll={onScroll}
        onContentSizeChange={onContentSizeChange}
        // The keyboard shrinks the stream: a reader at the bottom stays at the bottom.
        onLayout={(e) => {
          const wasBottom = bottomOf(metrics.current.content);
          metrics.current.height = e.nativeEvent.layout.height;
          if (opened.current && wasBottom) scroll.current?.scrollToEnd({ animated: false });
        }}
      >
        <ChatJumpContext.Provider value={jump}>{children}</ChatJumpContext.Provider>
      </ScrollView>
      {pending > 0 ? (
        <View
          pointerEvents="box-none"
          className="absolute inset-x-0 items-center"
          style={{ bottom: SPACING[3] }}
        >
          <Pressable
            testID="chat-new-messages"
            accessibilityRole="button"
            accessibilityLabel={tr.chat.newMessagesLabel(pending)}
            onPress={() => toEnd(true)}
          >
            {({ pressed }) => (
              <View
                className="flex-row items-center"
                style={[
                  {
                    gap: SPACING[1.5],
                    minHeight: SPACING[10],
                    paddingHorizontal: SPACING[4],
                    borderRadius: shape.radius.pill,
                    backgroundColor: colors.violet,
                  },
                  depth({ pressed }),
                ]}
              >
                <Ionicons name="arrow-down" size={ICON.sm} color={colors.onViolet} />
                <Text variant="buttonSmall" tone="onViolet">
                  {tr.chat.newMessages(pending)}
                </Text>
              </View>
            )}
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

type Props = {
  top: ReactNode;
  children: ReactNode;
  // The message bar, fixed at the bottom.
  composer: ReactNode;
  // See ChatScroll.
  newestKey?: string;
  newestMine?: boolean;
  startAtEnd?: boolean;
  testID?: string;
};

// A chat app's screen (canvas: Aşama 4 · Yenileme): the top bar, the scrolling stream, the message
// bar at the bottom above the keyboard.
export function ChatScreen({
  top,
  children,
  composer,
  newestKey,
  newestMine,
  startAtEnd,
  testID,
}: Props) {
  const { colors, shape } = useTheme();
  // Under the tabs (a DM) the floating tab bar covers the bottom: the message bar sits above it.
  const barSpace = useTabBarSpace();
  return (
    <SafeAreaView
      edges={barSpace ? ['top', 'left', 'right'] : ['top', 'left', 'right', 'bottom']}
      style={{ flex: 1, backgroundColor: colors.canvas }}
    >
      {top}
      <KeyboardAvoidingView className="flex-1" behavior="padding">
        <ChatScroll
          testID={testID}
          newestKey={newestKey}
          newestMine={newestMine}
          startAtEnd={startAtEnd}
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: shape.screenPadding - SPACING[1],
            paddingTop: SPACING[4],
            paddingBottom: SPACING[4],
            gap: SPACING[2],
          }}
        >
          {children}
        </ChatScroll>
        <View style={{ paddingBottom: barSpace }}>{composer}</View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// "Bugün" or "3 Ekim" over a day's first message.
export function DayLine({ label }: { label: string }) {
  const { colors, shape } = useTheme();
  return (
    <View
      className="my-1 self-center"
      style={{
        backgroundColor: colors.surface2,
        borderRadius: shape.radius.pill,
        paddingHorizontal: SPACING[2.5],
        paddingVertical: SPACING[0.5],
      }}
    >
      <Text variant="caption" tone="text">
        {label}
      </Text>
    </View>
  );
}

export function dayLabel(day: Date, now = new Date()): string {
  return sameDay(day, now) ? tr.chat.today : tr.chat.day(day.toISOString());
}
