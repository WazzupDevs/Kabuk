import { Ionicons } from '@expo/vector-icons';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  BackHandler,
  Keyboard,
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
import { ICON, SPACING, TOUCH } from '@/theme/tokens';

import type { ChatWallKind } from '@/theme/chatWallpaper';

import { ChatWallpaper } from './ChatWallpaper';
import { CountBadge } from './CountBadge';
import { useTabBarSpace } from './TabBar';
import { Text } from './Text';
import { usePressScale } from './motion';

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

// The reaction bar (CLAUDE.md → Ekran davranışı): one open at a time, closed by a tap outside it, a
// scroll, the keyboard opening and the back button. A bubble opens it by its own id; the bar marks
// its own touches (`markInside`) so a tap on an emoji is not taken for a tap outside: touches reach the
// bar before the screen's handler.
export type ChatBar = {
  open: string | null;
  setOpen: (id: string | null) => void;
  // The bar's own touch: not a tap outside.
  markInside: () => void;
};
const ChatBarContext = createContext<ChatBar | null>(null);

export function useChatBar(): ChatBar | null {
  return useContext(ChatBarContext);
}

function useChatBarState() {
  const [open, setOpen] = useState<string | null>(null);
  const inside = useRef(false);
  const close = useCallback(() => setOpen(null), []);
  useEffect(() => {
    if (open === null) return undefined;
    const keyboard = Keyboard.addListener('keyboardDidShow', close);
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      close();
      return true;
    });
    return () => {
      keyboard.remove();
      back.remove();
    };
  }, [open, close]);
  const markInside = useCallback(() => {
    inside.current = true;
  }, []);
  const bar = useMemo<ChatBar>(() => ({ open, setOpen, markInside }), [open, markInside]);
  // On the screen's root: a touch that did not start on the bar closes it.
  const onTouchStart = () => {
    if (inside.current) inside.current = false;
    else if (open !== null) close();
  };
  return { bar, close, onTouchStart };
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
  const pressScale = usePressScale();
  const scroll = useRef<ScrollView>(null);
  // The screen's reaction bar (ChatScreen), or this stream's own (the game's chat panel).
  const outerBar = useChatBar();
  const ownBar = useChatBarState();
  const bar = outerBar ?? ownBar.bar;
  // Where the reader is: offset, visible height and content height, from the last events.
  const metrics = useRef({ offset: 0, height: 0, content: 0 });
  // Following the end: from the start for a stream that opens at the newest message, again after
  // the reader comes back down or sends. Only the reader's own drag away from the end lets go, so
  // late content (the first page, photos, quotes) never leaves the stream half way.
  const pinned = useRef(!!startAtEnd);
  const touched = useRef(false);
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
        pinned.current = false;
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
    pinned.current = true;
    scroll.current?.scrollToEnd({ animated });
    setAtBottom(true);
    setPending(0);
  };

  // The reaction bar opening over a message makes the stream taller, but it is not new content: the
  // stream stays where it is, so the message under the finger does not jump, and closing the bar
  // leaves no scroll to pull back (a long press right after it was lost). Following the end
  // resumes when the bar closes.
  const pinnedBeforeBar = useRef<boolean | null>(null);
  useLayoutEffect(() => {
    if (bar.open !== null) {
      if (pinnedBeforeBar.current === null) pinnedBeforeBar.current = pinned.current;
      pinned.current = false;
    } else if (pinnedBeforeBar.current !== null) {
      pinned.current = pinnedBeforeBar.current;
      pinnedBeforeBar.current = null;
    }
  }, [bar.open]);

  // A stream that starts opening at the end once it has messages (the room), before the reader
  // touched it.
  useEffect(() => {
    if (!startAtEnd || touched.current) return;
    pinned.current = true;
    scroll.current?.scrollToEnd({ animated: false });
  }, [startAtEnd]);

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
  // The reader's own drag: lets go of the end, or takes it again when it ends at the bottom.
  const onDragEnd = () => {
    pinned.current = bottomOf(metrics.current.content);
  };

  const onContentSizeChange = (_w: number, h: number) => {
    metrics.current.content = h;
    if (pinned.current) {
      scroll.current?.scrollToEnd({ animated: false });
      if (!atBottom) setAtBottom(true);
      return;
    }
    const own = !!newestMine && newestKey !== followed.current;
    followed.current = newestKey;
    if (own) toEnd(true);
    else setAtBottom(bottomOf(h));
  };

  return (
    <View className="flex-1" onTouchStart={outerBar ? undefined : ownBar.onTouchStart}>
      <ScrollView
        ref={scroll}
        testID={testID}
        className="flex-1"
        contentContainerStyle={contentContainerStyle}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={64}
        onScroll={onScroll}
        onScrollBeginDrag={() => {
          touched.current = true;
          bar.setOpen(null);
        }}
        onScrollEndDrag={onDragEnd}
        onMomentumScrollEnd={onDragEnd}
        onContentSizeChange={onContentSizeChange}
        // The keyboard shrinks the stream: a stream following the end stays at the end.
        onLayout={(e) => {
          metrics.current.height = e.nativeEvent.layout.height;
          if (pinned.current) scroll.current?.scrollToEnd({ animated: false });
        }}
      >
        <ChatBarContext.Provider value={bar}>
          <ChatJumpContext.Provider value={jump}>{children}</ChatJumpContext.Provider>
        </ChatBarContext.Provider>
      </ScrollView>
      {pending > 0 ? (
        // skall tuvali (SohbetYeniMesaj, skall.css → `.jump`): a round surface button at the right,
        // the count of new messages in a badge on its corner.
        <View
          pointerEvents="box-none"
          className="absolute"
          style={{ right: SPACING[4], bottom: SPACING[3] }}
        >
          <Pressable
            testID="chat-new-messages"
            accessibilityRole="button"
            accessibilityLabel={tr.chat.newMessagesLabel(pending)}
            onPress={() => toEnd(true)}
          >
            {({ pressed }) => (
              <View
                className="items-center justify-center"
                style={[
                  {
                    width: TOUCH.min,
                    height: TOUCH.min,
                    borderRadius: shape.radius.pill,
                    backgroundColor: pressed ? colors.surface2 : colors.surface,
                    boxShadow: shape.shadow.sheet,
                  },
                  pressScale(pressed),
                ]}
              >
                <Ionicons name="chevron-down" size={ICON.md} color={colors.text} />
                <View className="absolute" style={{ top: -SPACING[1.5], right: -SPACING[1.5] }}>
                  <CountBadge count={pending} />
                </View>
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
  // The chat's wall (skall tuvali: dm, masa, mekan); null: none (the table's games).
  wall?: ChatWallKind | null;
};

// A chat app's screen (v45: .dm): the top bar, the stream scrolling over the wallpaper, the
// message bar floating at the bottom above the keyboard.
export function ChatScreen({
  top,
  children,
  composer,
  newestKey,
  newestMine,
  startAtEnd,
  testID,
  wall = 'dm',
}: Props) {
  const { colors, shape } = useTheme();
  // Under the tabs (a DM) the floating tab bar covers the bottom: the message bar sits above it.
  const barSpace = useTabBarSpace();
  // The reaction bar's state for the whole screen: a tap on the top bar or the message bar closes it
  // too.
  const reactions = useChatBarState();
  return (
    <ChatBarContext.Provider value={reactions.bar}>
      <SafeAreaView
        edges={barSpace ? ['top', 'left', 'right'] : ['top', 'left', 'right', 'bottom']}
        style={{ flex: 1, backgroundColor: colors.canvas }}
        onTouchStart={reactions.onTouchStart}
      >
        {top}
        <KeyboardAvoidingView className="flex-1" behavior="padding">
          {/* The wallpaper under the stream and the message bar (v45: .chatpane); the bar floats on
              it. */}
          {wall ? <ChatWallpaper kind={wall} /> : null}
          <ChatScroll
            testID={testID}
            newestKey={newestKey}
            newestMine={newestMine}
            startAtEnd={startAtEnd}
            contentContainerStyle={{
              flexGrow: 1,
              // skall tuvali (skall.css → `.stream`): 16 at the sides, 6 between messages.
              paddingHorizontal: shape.screenPadding,
              paddingTop: SPACING[2],
              paddingBottom: SPACING[3],
              gap: SPACING[1.5],
            }}
          >
            {children}
          </ChatScroll>
          <View style={{ paddingBottom: barSpace }}>{composer}</View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ChatBarContext.Provider>
  );
}

// "Bugün" or "3 Ekim" over a day's first message; fresh: "Yeni mesajlar" over the first message
// that came while the chat was closed, in the link colour (skall.css → `.day.new`).
export function DayLine({ label, fresh }: { label: string; fresh?: boolean }) {
  const { colors, shape } = useTheme();
  return (
    <View
      className="self-center"
      // skall tuvali (skall.css → `.day`): a surface pill on the chip shadow.
      style={{
        marginTop: SPACING[2.5],
        marginBottom: SPACING[1.5],
        backgroundColor: colors.surface,
        borderRadius: shape.radius.pill,
        boxShadow: shape.shadow.raised,
        paddingHorizontal: SPACING[3],
        paddingVertical: SPACING[1],
      }}
    >
      <Text variant="caption" tone={fresh ? 'accent' : 'muted'}>
        {label}
      </Text>
    </View>
  );
}

export function dayLabel(day: Date, now = new Date()): string {
  return sameDay(day, now) ? tr.chat.today : tr.chat.day(day.toISOString());
}
