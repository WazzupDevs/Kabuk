import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  type RefObject,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  BackHandler,
  Keyboard,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  View,
  type ViewStyle,
  Text as RNText,
} from 'react-native';
import Reanimated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { sameDay } from '@shared/chatRuns.ts';

import { tr } from '@/i18n/tr';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, SPACING, TOUCH } from '@/theme/tokens';

import type { ChatWallKind } from '@/theme/chatWallpaper';

import { AuraBackground } from '@/aura/AuraBackground';
import { AURA } from '@/theme/aura';
import { useKit } from '@/aura/kit';
import { KIT, KIT_TYPE } from '@/theme/auraKit';

import { ChatWallpaper } from './ChatWallpaper';
import { CountBadge } from './CountBadge';
import { useTabBarSpace } from './TabBar';
import { usePressScale } from './motion';
import { AppIcon } from './AppIcon';
// Frame by frame with the keyboard (react-native-keyboard-controller): the bar rises with it.
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import { GlassTarget } from '@/ui/LiquidGlass';

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

// Sending goes to the end of the stream (every chat; the owner's call, 27 Ekim): the message bar
// calls it after its send, the stream follows its end from then on.
const ChatEndContext = createContext<(() => void) | null>(null);

export function useChatEnd(): (() => void) | null {
  return useContext(ChatEndContext);
}

// Whether the stream has settled after opening: a row that comes after it is a new message and
// rises in (the ones the page opened with stand still).
const ChatLiveContext = createContext(false);
const SETTLE_MS = 800;
const ARRIVE_MS = 220;

// One message's row in the stream: reports its place for jumpTo and hands jumpTo to its bubble
// (a quote's tap). Outside a ChatScroll it is a plain View and jumpTo does nothing. A message that
// arrives while the chat is open fades up into place (none with reduce motion).
export function ChatRow({
  id,
  first,
  children,
}: {
  id: string;
  // A run's first message: a little more room above it.
  first?: boolean;
  children: (jumpTo: (id: string) => void) => ReactNode;
}) {
  const jump = useChatJump();
  const live = useContext(ChatLiveContext);
  const reduce = useReduceMotion();
  const [arriving] = useState(live && !reduce);
  return (
    <Reanimated.View
      entering={arriving ? FadeInDown.duration(ARRIVE_MS) : undefined}
      onLayout={jump?.row(id)}
      style={{ gap: SPACING[2], marginTop: first ? SPACING[1.5] : 0 }}
    >
      {children((target) => void jump?.jumpTo(target))}
    </Reanimated.View>
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
  // The message bar floating over the stream's bottom: the "Yeni mesaj" button stays above it.
  bottomInset?: number;
  // Set to this stream's "go to the end" (ChatScreen hands it to the message bar).
  endRef?: RefObject<(() => void) | null>;
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
  bottomInset = 0,
  endRef,
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
  const [live, setLive] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setLive(true), SETTLE_MS);
    return () => clearTimeout(timer);
  }, []);
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
  useEffect(() => {
    if (!endRef) return undefined;
    endRef.current = () => toEnd(true);
    return () => {
      endRef.current = null;
    };
  });

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
        // Dragging the messages puts the keyboard away, like any chat app.
        keyboardDismissMode="on-drag"
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
          <ChatJumpContext.Provider value={jump}>
            <ChatLiveContext.Provider value={live}>{children}</ChatLiveContext.Provider>
          </ChatJumpContext.Provider>
        </ChatBarContext.Provider>
      </ScrollView>
      {pending > 0 ? (
        // skall tuvali (SohbetYeniMesaj, skall.css → `.jump`): a round surface button at the right,
        // the count of new messages in a badge on its corner.
        <View
          pointerEvents="box-none"
          className="absolute"
          style={{ right: SPACING[4], bottom: SPACING[3] + bottomInset }}
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
                <AppIcon name="chevron-down" size={ICON.md} color={colors.text} />
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

// The stream a chat's message bar shows through its glass (the owner's call, 27 Ekim): the id of
// the GlassTarget around the wallpaper and the stream; null where there is none.
const ComposerGlassContext = createContext<string | null>(null);

export function useComposerGlass(): string | null {
  return useContext(ComposerGlassContext);
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
  const { shape, scheme } = useTheme();
  // Under the tabs (a DM) the floating tab bar covers the bottom: the message bar sits above it.
  const barSpace = useTabBarSpace();
  // The reaction bar's state for the whole screen: a tap on the top bar or the message bar closes it
  // too.
  const reactions = useChatBarState();
  // The message bar floats over the stream (the owner's call, 27 Ekim: the messages run on under
  // it); the stream keeps its last message clear of it.
  const [barHeight, setBarHeight] = useState(0);
  const end = useRef<(() => void) | null>(null);
  const followEnd = useCallback(() => end.current?.(), []);
  const under = composer ? barHeight : barSpace;
  const glassId = useId();
  return (
    <ChatEndContext.Provider value={followEnd}>
      <ChatBarContext.Provider value={reactions.bar}>
        <SafeAreaView
          edges={barSpace ? ['top', 'left', 'right'] : ['top', 'left', 'right', 'bottom']}
          style={{ flex: 1, backgroundColor: AURA[scheme].ground }}
          onTouchStart={reactions.onTouchStart}
        >
          {/* The colour clouds under the whole chat (docs/design/aura → DM, Mekan sohbeti, Masa). */}
          <AuraBackground />
          {top}
          <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
            {/* The wallpaper under the stream and the message bar (v45: .chatpane); the bar floats on
              it, over the stream. */}
            <View className="flex-1">
              <GlassTarget targetId={glassId} style={{ flex: 1 }}>
                {/* Each chat's dense doodles over the clouds (DM, Masa, Mekan; light and dark; the
                    owner's call, 28 Ekim). */}
                {wall ? <ChatWallpaper kind={wall} /> : null}
                <ChatScroll
                  testID={testID}
                  newestKey={newestKey}
                  newestMine={newestMine}
                  startAtEnd={startAtEnd}
                  bottomInset={under}
                  endRef={end}
                  contentContainerStyle={{
                    flexGrow: 1,
                    // skall tuvali (skall.css → `.stream`): 16 at the sides, 6 between messages.
                    paddingHorizontal: shape.screenPadding,
                    paddingTop: SPACING[2],
                    paddingBottom: SPACING[3] + under,
                    gap: SPACING[1.5],
                  }}
                >
                  {children}
                </ChatScroll>
              </GlassTarget>
              {composer ? (
                <View
                  className="absolute bottom-0 left-0 right-0"
                  style={{ paddingBottom: barSpace }}
                  onLayout={(e) => setBarHeight(e.nativeEvent.layout.height)}
                >
                  <ComposerGlassContext.Provider value={glassId}>
                    {composer}
                  </ComposerGlassContext.Provider>
                </View>
              ) : null}
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </ChatBarContext.Provider>
    </ChatEndContext.Provider>
  );
}

// "Bugün" or "3 Ekim" over a day's first message; fresh: "Yeni mesajlar" over the first message
// that came while the chat was closed, in the link colour (skall.css → `.day.new`).
export function DayLine({ label, fresh }: { label: string; fresh?: boolean }) {
  const { c, scheme, tags } = useKit();
  if (fresh) {
    // docs/design/aura → Mekan sohbeti: "Yeni mesaj" in pink between two soft pink lines.
    const ink = scheme === 'dark' ? tags.pink.fg : KIT.nameInk;
    const line = { flex: 1, height: KIT.size.hair, backgroundColor: KIT.freshLine };
    return (
      <View
        className="flex-row items-center"
        style={{ gap: KIT.size.barGap, marginVertical: SPACING[1.5] }}
      >
        <View style={line} />
        <RNText
          maxFontSizeMultiplier={DAY_SCALE}
          style={[KIT_TYPE.fine, KIT_TYPE.strong, { color: ink }]}
        >
          {label}
        </RNText>
        <View style={line} />
      </View>
    );
  }
  return (
    <View
      className="self-center"
      // docs/design/aura → Dm (`.day`): a soft white pill.
      style={{
        marginTop: SPACING[2.5],
        marginBottom: SPACING[1.5],
        backgroundColor: c.day,
        borderRadius: KIT.size.chip,
        paddingHorizontal: KIT.size.dayPadX,
        paddingVertical: KIT.size.dayPadY,
      }}
    >
      <RNText
        maxFontSizeMultiplier={DAY_SCALE}
        style={[KIT_TYPE.day, { color: fresh ? KIT.primary : c.muted }]}
      >
        {label}
      </RNText>
    </View>
  );
}
const DAY_SCALE = 1.3;

export function dayLabel(day: Date, now = new Date()): string {
  return sameDay(day, now) ? tr.chat.today : tr.chat.day(day.toISOString());
}
