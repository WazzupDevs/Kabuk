import {
  createContext,
  type ReactElement,
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
  type CellRendererProps,
  Keyboard,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Animated,
  FlatList,
  type ViewToken,
  ScrollView,
  type ScrollViewProps,
  StyleSheet,
  View,
  type ViewStyle,
  Text as RNText,
} from 'react-native';
import Reanimated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { sameDay } from '@shared/chatRuns.ts';

import { tr } from '@/i18n/tr';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { withAlpha } from '@/theme/contrast';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, SPACING } from '@/theme/tokens';

import { type ChatWallKind, type WallpaperCanvas, wallpaperCanvas } from '@/theme/chatWallpaper';

import { AuraBackground } from '@/aura/AuraBackground';
import { AURA } from '@/theme/aura';
import { Round, useKit } from '@/aura/kit';
import { KIT, KIT_TYPE } from '@/theme/auraKit';

import { ChatWallpaper, WallBand } from './ChatWallpaper';
import { SPLIT_PILL } from './ChatTopBar';
import { useTabBarSpace } from './TabBar';
import { AppIcon } from './AppIcon';
// Frame by frame with the keyboard (react-native-keyboard-controller), on the UI thread: the
// message bar rises with it (KeyboardStickyView) and the stream keeps its end above it
// (KeyboardChatScrollView), without laying the screen out again on every frame of the keyboard.
import { KeyboardChatScrollView, KeyboardStickyView } from 'react-native-keyboard-controller';

import { GlassTarget } from '@/components/LiquidGlass';
import { ChatKindContext } from './chatKind';
import { ChatMetaContext } from './chatMeta';
import { metaHiddenAt } from '@/lib/chatMeta';

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

// The down arrow (Telegram Android's: shown whenever the reader is up the stream, the count of new
// messages on its corner; the owner's call, 30 Ekim). A chat screen draws it over the stream, out of
// the stream's glass so it can frost the messages under it; the stream reports to it here.
type JumpState = { show: boolean; count: number };
const JumpSlotContext = createContext<((state: JumpState) => void) | null>(null);

// Whether the stream has settled after opening: a row that comes after it is a new message and
// rises in (the ones the page opened with stand still).
const ChatLiveContext = createContext(false);
// The stream's newest message: the only row that arrives with a slide. Rows put on the screen in a
// batch (older messages from "Daha eski mesajlar", the rest of the first page) come up above the
// reader and are not watched arriving; each one animating made the batch stall the screen (the
// owner's video, 29 Ekim: 0.9 s).
const ChatNewestContext = createContext<string | undefined>(undefined);
const SETTLE_MS = 800;
// Whether the stream is drawn from the bottom up: a row's arrival then rises from below in its
// flipped cell.
const ChatInvertedContext = createContext(false);
// The message a quote's tap went to (the owner's call, 30 Ekim: Telegram Android flashes it); `n`
// counts the jumps, so a second jump to the same message flashes it again.
const ChatHighlightContext = createContext<{ id: string | null; n: number }>({ id: null, n: 0 });
const FLASH_MS = 1400;
// A message the reader sent rises from the message bar into its place (Telegram Android; the
// owner's call, 30 Ekim); another's fades up a little.
const SEND_RISE = SPACING[16];
const SEND_MS = 260;

function riseFrom(distance: number) {
  return () => {
    'worklet';
    return {
      initialValues: { opacity: 0, transform: [{ translateY: distance }] },
      animations: {
        opacity: withTiming(1, { duration: SEND_MS / 2 }),
        transform: [
          { translateY: withTiming(0, { duration: SEND_MS, easing: Easing.out(Easing.cubic) }) },
        ],
      },
    };
  };
}
const KEEP_VISIBLE = { minIndexForVisible: 0 } as const;
const ARRIVE_MS = 220;

// One message's row in the stream: reports its place for jumpTo and hands jumpTo to its bubble
// (a quote's tap). Outside a ChatScroll it is a plain View and jumpTo does nothing. A message that
// arrives while the chat is open fades up into place (none with reduce motion).
export function ChatRow({
  id,
  first,
  mine,
  children,
}: {
  id: string;
  // A run's first message: a little more room above it.
  first?: boolean;
  // The reader's own: it rises from the message bar when sent.
  mine?: boolean;
  children: (jumpTo: (id: string) => void) => ReactNode;
}) {
  const jump = useChatJump();
  const live = useContext(ChatLiveContext);
  const newest = useContext(ChatNewestContext);
  const inverted = useContext(ChatInvertedContext);
  const highlight = useContext(ChatHighlightContext);
  const reduce = useReduceMotion();
  const [arriving] = useState(live && !reduce && id === newest);
  // In a list drawn from the bottom up the cell is flipped: a rise from below is a move up in it.
  const entering = !arriving
    ? undefined
    : mine
      ? riseFrom(inverted ? -SEND_RISE : SEND_RISE)
      : (inverted ? FadeInUp : FadeInDown).duration(ARRIVE_MS);
  return (
    <Reanimated.View
      entering={entering}
      onLayout={jump?.row(id)}
      style={{ gap: SPACING[2], marginTop: first ? SPACING[2] : 0 }}
    >
      {highlight.id === id && highlight.n > 0 ? <Flash key={highlight.n} /> : null}
      {children((target) => void jump?.jumpTo(target))}
    </Reanimated.View>
  );
}

// The flash over a message a quote's tap went to: the row's whole width in the accent, fading out.
function Flash() {
  const { shape } = useTheme();
  const [fade] = useState(() => new Animated.Value(1));
  useEffect(() => {
    const anim = Animated.timing(fade, {
      toValue: 0,
      duration: FLASH_MS,
      easing: (u) => u * u,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [fade]);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: -SPACING[1],
        bottom: -SPACING[1],
        left: -shape.screenPadding,
        right: -shape.screenPadding,
        backgroundColor: withAlpha(KIT.primary, FLASH_ALPHA),
        opacity: fade,
      }}
    />
  );
}
const FLASH_ALPHA = 0.22;

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
  // A chat screen's stream above the keyboard: the distance from its bottom to the screen's bottom
  // (ChatScreen). At its end it rises with the keyboard; scrolled up it stays where the reader is
  // and the keyboard covers its foot, as the screen shrinking did. Without it a plain stream.
  keyboardOffset?: number;
  // What lies over the stream's top (the chat's top bar): a jump stops under it.
  topInset?: number;
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
  keyboardOffset,
  topInset = 0,
}: ScrollProps) {
  const scroll = useRef<ScrollView>(null);
  // The screen's reaction bar (ChatScreen), or this stream's own (the game's chat panel).
  const outerBar = useChatBar();
  const ownBar = useChatBarState();
  const bar = outerBar ?? ownBar.bar;
  // Where the reader is: offset, visible height and content height, from the last events, and the
  // room the keyboard adds under the content (KeyboardChatScrollView; not in the scroll events).
  const metrics = useRef({ offset: 0, height: 0, content: 0, inset: 0 });
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
  const [highlight, setHighlight] = useState<{ id: string | null; n: number }>({
    id: null,
    n: 0,
  });
  const jump = useMemo<ChatJump>(
    () => ({
      row: (id) => (e) => void rows.current.set(id, e.nativeEvent.layout.y),
      jumpTo: (id) => {
        const y = rows.current.get(id);
        if (y === undefined) return false;
        pinned.current = false;
        scroll.current?.scrollTo({ y: Math.max(0, y - SPACING[4] - topInset), animated: true });
        setHighlight((h) => ({ id, n: h.n + 1 }));
        return true;
      },
    }),
    [topInset],
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
    metrics.current.offset + metrics.current.height >=
    content + metrics.current.inset - BOTTOM_SLACK;
  // To the end now, and again two frames later: on Android a scroll asked for in the same breath as
  // new content can run before the content's new height reaches the screen, and stops at the old
  // end, somewhere up the stream (the owner's report, 29 Ekim: chats opened in the middle). Not
  // while the reader's finger is on it.
  const dragging = useRef(false);
  const settleFrame = useRef<number | null>(null);
  const stayAtEnd = () => {
    scroll.current?.scrollToEnd({ animated: false });
    if (settleFrame.current !== null) cancelAnimationFrame(settleFrame.current);
    settleFrame.current = requestAnimationFrame(() => {
      settleFrame.current = requestAnimationFrame(() => {
        settleFrame.current = null;
        if (pinned.current && !dragging.current) scroll.current?.scrollToEnd({ animated: false });
      });
    });
  };
  useEffect(
    () => () => {
      if (settleFrame.current !== null) cancelAnimationFrame(settleFrame.current);
    },
    [],
  );
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
    stayAtEnd();
  }, [startAtEnd]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
    metrics.current = {
      offset: contentOffset.y,
      height: layoutMeasurement.height,
      content: contentSize.height,
      inset: metrics.current.inset,
    };
    const bottom = bottomOf(contentSize.height);
    if (bottom !== atBottom) setAtBottom(bottom);
    if (bottom && pending > 0) setPending(0);
  };
  const slot = useContext(JumpSlotContext);
  useEffect(() => {
    slot?.({ show: !atBottom, count: pending });
  }, [slot, atBottom, pending]);
  // The reader's own drag: lets go of the end, or takes it again when it ends at the bottom.
  const onDragEnd = () => {
    dragging.current = false;
    pinned.current = bottomOf(metrics.current.content);
  };

  const onContentSizeChange = (_w: number, h: number) => {
    metrics.current.content = h;
    if (pinned.current) {
      stayAtEnd();
      if (!atBottom) setAtBottom(true);
      return;
    }
    const own = !!newestMine && newestKey !== followed.current;
    followed.current = newestKey;
    if (own) toEnd(true);
    else setAtBottom(bottomOf(h));
  };

  const streamProps = {
    testID,
    // Rows put above what is shown (the rest of the first page, "Daha eski mesajlar") leave what
    // is shown where it is, in the same frame: the stream opened at its end and showed older
    // messages for a frame or two before coming back (the owner's video, 29 Ekim).
    maintainVisibleContentPosition: startAtEnd ? KEEP_VISIBLE : undefined,
    // Dragging the messages puts the keyboard away, like any chat app.
    keyboardDismissMode: 'on-drag' as const,
    style: { flex: 1 },
    contentContainerStyle,
    keyboardShouldPersistTaps: 'handled' as const,
    scrollEventThrottle: 64,
    onScroll,
    onScrollBeginDrag: () => {
      dragging.current = true;
      touched.current = true;
      bar.setOpen(null);
    },
    onScrollEndDrag: onDragEnd,
    onMomentumScrollEnd: onDragEnd,
    onContentSizeChange,
    // A new height (a stream not under the keyboard shrinks with it): one following the end stays
    // at the end.
    onLayout: (e: LayoutChangeEvent) => {
      metrics.current.height = e.nativeEvent.layout.height;
      if (pinned.current) stayAtEnd();
    },
  };
  const stream = (
    <ChatBarContext.Provider value={bar}>
      <ChatJumpContext.Provider value={jump}>
        <ChatLiveContext.Provider value={live}>
          <ChatNewestContext.Provider value={newestKey}>
            <ChatHighlightContext.Provider value={highlight}>
              {children}
            </ChatHighlightContext.Provider>
          </ChatNewestContext.Provider>
        </ChatLiveContext.Provider>
      </ChatJumpContext.Provider>
    </ChatBarContext.Provider>
  );

  return (
    <View className="flex-1" onTouchStart={outerBar ? undefined : ownBar.onTouchStart}>
      {keyboardOffset !== undefined ? (
        <KeyboardChatScrollView
          // At the end it rises with the keyboard; scrolled up it stays (the reader's place).
          keyboardLiftBehavior="whenAtEnd"
          offset={keyboardOffset}
          onContentInsetChange={(inset) => {
            metrics.current.inset = inset.bottom;
          }}
          ref={scroll as RefObject<never>}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          {...streamProps}
        >
          {stream}
        </KeyboardChatScrollView>
      ) : (
        <ScrollView
          ref={scroll}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          {...streamProps}
        >
          {stream}
        </ScrollView>
      )}
      {slot ? null : (
        <NewMessages
          show={!atBottom}
          count={pending}
          bottom={SPACING[3] + bottomInset}
          keyboardOffset={keyboardOffset}
          onPress={() => toEnd(true)}
        />
      )}
    </View>
  );
}

// The down arrow (Telegram Android's chat): a frosted round at the right over the message bar,
// shown whenever the reader is up the stream; the count of new messages that came meanwhile in a
// badge on its corner. It rises with the message bar when the keyboard opens.
function NewMessages({
  show,
  count,
  bottom,
  keyboardOffset,
  onPress,
}: {
  show: boolean;
  count: number;
  bottom: number;
  keyboardOffset: number | undefined;
  onPress: () => void;
}) {
  const { c } = useKit();
  if (!show) return null;
  return (
    <KeyboardStickyView
      pointerEvents="box-none"
      enabled={keyboardOffset !== undefined}
      offset={{ closed: 0, opened: keyboardOffset ?? 0 }}
      style={{ position: 'absolute', right: SPACING[4], bottom }}
    >
      <Reanimated.View
        entering={FadeIn.duration(JUMP_FADE_MS)}
        exiting={FadeOut.duration(JUMP_FADE_MS)}
      >
        <Round
          testID="chat-new-messages"
          label={count > 0 ? tr.chat.newMessagesLabel(count) : tr.chat.toLatest}
          badge={count}
          onPress={onPress}
        >
          <AppIcon name="chevron-down" size={ICON.md} color={c.ink} />
        </Round>
      </Reanimated.View>
    </KeyboardStickyView>
  );
}
const JUMP_FADE_MS = 150;

// A row of a ChatList: `key` stays the same for a message from its first draw (a message being
// sent keeps the key it was drawn with when the server's copy takes its place); `id` is what a
// quote jumps to.
export type ChatListItem = { key: string; id: string };

export type ChatListProps<T extends ChatListItem> = {
  // Newest first: the list is drawn from the bottom up (Telegram Android's chat).
  items: readonly T[];
  renderItem: (item: T) => ReactElement;
  // Near the oldest loaded message: the caller loads the page before it.
  onReachOld?: () => void;
  // Over the oldest message (its loading mark).
  older?: ReactNode;
  // Under the newest message (the other side's typing dots).
  latest?: ReactNode;
  // Instead of the list when there are no items (loading, an error, empty).
  empty?: ReactNode;
  // The first unread message: the chat opens there, its "Okunmamış mesajlar" line under the top
  // bar, instead of at the newest (the owner's call, 30 Ekim).
  openAt?: string | null;
  // A message's time (ms): while the reader scrolls, the day of the oldest one on the screen floats
  // at the top (Telegram Android).
  timeOf?: (item: T) => number;
};

// The newest message's cell and where its time line starts above the cell's foot (chatMeta.ts).
type MetaCellReport = { cellHeight: number; metaTop: number | null };
const MetaReportContext = createContext<((report: MetaCellReport) => void) | null>(null);

// A stream cell (FlatList's own, its style and layout kept): the newest one (index 0, the bottom
// row) hands its bubble a ref for the time line and reports the line's place.
function MetaCell({ index, style, onLayout, children }: CellRendererProps<unknown>) {
  const report = useContext(MetaReportContext);
  const newest = index === 0 && report !== null;
  const cell = useRef<View>(null);
  const meta = useRef<View | null>(null);
  const height = useRef(0);
  const measure = () => {
    const c = cell.current;
    if (!newest || !report || !c || height.current <= 0) return;
    const m = meta.current;
    if (!m) {
      report({ cellHeight: height.current, metaTop: null });
      return;
    }
    m.measureLayout(
      c,
      (_x, y) => report({ cellHeight: height.current, metaTop: Math.max(0, height.current - y) }),
      () => report({ cellHeight: height.current, metaTop: null }),
    );
  };
  const measureRef = useRef(measure);
  useEffect(() => {
    measureRef.current = measure;
  });
  const [metaRef] = useState(() => (node: View | null) => {
    meta.current = node;
    measureRef.current();
  });
  useEffect(() => {
    if (newest) measureRef.current();
  }, [newest]);
  return (
    <ChatMetaContext.Provider value={newest ? metaRef : null}>
      <View
        ref={cell}
        style={style}
        onLayout={(e) => {
          height.current = e.nativeEvent.layout.height;
          onLayout?.(e);
          measure();
        }}
      >
        {children}
      </View>
    </ChatMetaContext.Provider>
  );
}

// A chat's message stream as Telegram Android draws it (the owner's call, 29 Ekim): from the
// newest message up, only the rows on the screen and a little round it drawn, older messages loaded
// as the reader nears them, each message keeping its row while it changes. At the bottom (the
// keyboard open too) the stream follows each new message; scrolled up it stays where the reader is
// (the list keeps the first row on the screen in place) and offers "Yeni mesaj". Its scroll view
// keeps its end above the keyboard (KeyboardChatScrollView).
function ChatList<T extends ChatListItem>({
  items,
  renderItem,
  onReachOld,
  older,
  latest,
  empty,
  openAt,
  timeOf,
  newestKey,
  newestMine,
  contentContainerStyle,
  testID,
  bottomInset = 0,
  endRef,
  keyboardOffset = 0,
  topInset = 0,
}: ChatListProps<T> &
  Omit<ScrollProps, 'children' | 'startAtEnd' | 'keyboardOffset'> & {
    keyboardOffset?: number;
  }) {
  const list = useRef<FlatList<T>>(null);
  const outerBar = useChatBar();
  const ownBar = useChatBarState();
  const bar = outerBar ?? ownBar.bar;
  const [atBottom, setAtBottom] = useState(true);
  const [pending, setPending] = useState(0);
  const [live, setLive] = useState(false);
  // The down arrow (P1c): shown only once the newest message's time line is wholly under the
  // message bar. Apart from `atBottom`, which follows new messages and counts the unread.
  const [metaCell, setMetaCell] = useState<MetaCellReport | null>(null);
  const [latestHeight, setLatestHeight] = useState(0);
  const [metaHidden, setMetaHidden] = useState(false);
  const scrollY = useRef(0);
  const [reportMeta] = useState(() => (next: MetaCellReport) => {
    setMetaCell((prev) =>
      prev && prev.cellHeight === next.cellHeight && prev.metaTop === next.metaTop ? prev : next,
    );
  });
  const padUnder =
    typeof contentContainerStyle?.paddingTop === 'number' ? contentContainerStyle.paddingTop : 0;
  const rowGap = typeof contentContainerStyle?.gap === 'number' ? contentContainerStyle.gap : 0;
  const hiddenAt = metaCell
    ? metaHiddenAt({
        gapUnder: padUnder - bottomInset,
        latest: latest && latestHeight > 0 ? latestHeight + rowGap : 0,
        cellHeight: metaCell.cellHeight,
        metaTop: metaCell.metaTop,
      })
    : BOTTOM_SLACK;
  useEffect(() => {
    setMetaHidden(items.length > 0 && scrollY.current >= hiddenAt);
  }, [hiddenAt, items.length]);
  useEffect(() => {
    const timer = setTimeout(() => setLive(true), SETTLE_MS);
    return () => clearTimeout(timer);
  }, []);

  const toEnd = (animated: boolean) => {
    list.current?.scrollToOffset({ offset: 0, animated });
    setAtBottom(true);
    setPending(0);
    scrollY.current = 0;
    setMetaHidden(false);
  };
  useEffect(() => {
    if (!endRef) return undefined;
    endRef.current = () => toEnd(true);
    return () => {
      endRef.current = null;
    };
  });

  // A new message: the reader's own goes to the end; another's, with the reader up the stream, is
  // counted for the button (at the bottom the list follows it by itself).
  const [seenKey, setSeenKey] = useState(newestKey);
  if (newestKey !== seenKey) {
    setSeenKey(newestKey);
    if (seenKey !== undefined && newestKey !== undefined && !atBottom && !newestMine) {
      setPending((n) => n + 1);
    }
  }
  const followed = useRef(newestKey);
  useEffect(() => {
    if (newestKey === followed.current) return;
    followed.current = newestKey;
    if (newestMine) list.current?.scrollToOffset({ offset: 0, animated: true });
  }, [newestKey, newestMine]);

  // The same for the whole list (a new one would draw every row again): it reads the rows as they
  // are when a quote is tapped.
  const shownItems = useRef(items);
  useEffect(() => {
    shownItems.current = items;
  });
  const [highlight, setHighlight] = useState<{ id: string | null; n: number }>({
    id: null,
    n: 0,
  });
  const jump = useMemo<ChatJump>(
    () => ({
      row: () => () => undefined,
      jumpTo: (id) => {
        const index = shownItems.current.findIndex((i) => i.id === id);
        if (index < 0) return false;
        list.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
        setHighlight((h) => ({ id, n: h.n + 1 }));
        return true;
      },
    }),
    [],
  );

  // Opening at the first unread message: once, when it is among the rows, its top under the top
  // bar (in a list drawn from the bottom up a negative offset puts it lower).
  const opened = useRef(false);
  useEffect(() => {
    if (opened.current || !openAt || items.length === 0) return undefined;
    opened.current = true;
    const index = items.findIndex((i) => i.id === openAt);
    if (index <= 0) return undefined;
    const frame = requestAnimationFrame(() =>
      list.current?.scrollToIndex({
        index,
        animated: false,
        viewPosition: 1,
        viewOffset: -(topInset + SPACING[2]),
      }),
    );
    return () => cancelAnimationFrame(frame);
  }, [openAt, items, topInset]);

  // The floating day: the oldest message on the screen, shown while the reader scrolls and a
  // moment after.
  const [floatDay, setFloatDay] = useState<number | null>(null);
  const [scrolling, setScrolling] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timeOfRef = useRef(timeOf);
  useEffect(() => {
    timeOfRef.current = timeOf;
  });
  // The same function for the list's life (FlatList takes no new one).
  const [onViewable] = useState(() => ({ viewableItems }: { viewableItems: ViewToken<T>[] }) => {
    const time = timeOfRef.current;
    if (!time) return;
    let oldest: T | null = null;
    let at = -1;
    for (const v of viewableItems) {
      if (v.index !== null && v.index > at) {
        at = v.index;
        oldest = v.item;
      }
    }
    const ms = oldest ? time(oldest) : NaN;
    if (oldest && Number.isFinite(ms)) {
      const d = new Date(ms);
      setFloatDay(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime());
    }
  });
  const showDay = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setScrolling(true);
  };
  const hideDaySoon = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setScrolling(false), DAY_HIDE_MS);
  };
  useEffect(
    () => () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    },
    [],
  );

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const bottom = y <= BOTTOM_SLACK;
    if (bottom !== atBottom) setAtBottom(bottom);
    if (bottom && pending > 0) setPending(0);
    scrollY.current = y;
    const hidden = y >= hiddenAt;
    if (hidden !== metaHidden) setMetaHidden(hidden);
  };
  const slot = useContext(JumpSlotContext);
  useEffect(() => {
    slot?.({ show: metaHidden, count: pending });
  }, [slot, metaHidden, pending]);

  const renderScroll = useCallback(
    (props: ScrollViewProps) => (
      <KeyboardChatScrollView
        {...props}
        inverted
        // At the end it rises with the keyboard; scrolled up it stays (the reader's place).
        keyboardLiftBehavior="whenAtEnd"
        offset={keyboardOffset}
      />
    ),
    [keyboardOffset],
  );

  return (
    <View className="flex-1" onTouchStart={outerBar ? undefined : ownBar.onTouchStart}>
      <ChatBarContext.Provider value={bar}>
        <ChatJumpContext.Provider value={jump}>
          <ChatLiveContext.Provider value={live}>
            <ChatNewestContext.Provider value={newestKey}>
              <ChatInvertedContext.Provider value>
                <ChatHighlightContext.Provider value={highlight}>
                  {items.length === 0 && empty ? (
                    // Clear of the top bar and the message bar (the list's own padding, unflipped).
                    <View
                      style={{
                        flex: 1,
                        paddingTop: contentContainerStyle?.paddingBottom,
                        paddingBottom: contentContainerStyle?.paddingTop,
                        paddingHorizontal: contentContainerStyle?.paddingHorizontal,
                      }}
                    >
                      {empty}
                    </View>
                  ) : (
                    <MetaReportContext.Provider value={reportMeta}>
                      <FlatList
                        ref={list}
                        testID={testID}
                        data={items}
                        inverted
                        keyExtractor={(item) => item.key}
                        renderItem={({ item }) => renderItem(item)}
                        renderScrollComponent={renderScroll}
                        CellRendererComponent={MetaCell}
                        showsVerticalScrollIndicator={false}
                        showsHorizontalScrollIndicator={false}
                        // The first screenful at once, from the newest up; the rest as it nears.
                        initialNumToRender={INITIAL_ROWS}
                        maxToRenderPerBatch={BATCH_ROWS}
                        windowSize={WINDOW}
                        // Rows added under the reader leave what is shown where it is; at the bottom the
                        // list goes on to the new one.
                        maintainVisibleContentPosition={FOLLOW}
                        onEndReached={onReachOld}
                        onEndReachedThreshold={OLD_THRESHOLD}
                        ListFooterComponent={older ? <>{older}</> : null}
                        ListHeaderComponent={
                          latest ? (
                            <View onLayout={(e) => setLatestHeight(e.nativeEvent.layout.height)}>
                              {latest}
                            </View>
                          ) : null
                        }
                        // Dragging the messages puts the keyboard away, like any chat app.
                        keyboardDismissMode="on-drag"
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={contentContainerStyle}
                        scrollEventThrottle={64}
                        onScroll={onScroll}
                        onScrollBeginDrag={() => {
                          bar.setOpen(null);
                          showDay();
                        }}
                        onScrollEndDrag={hideDaySoon}
                        onMomentumScrollBegin={showDay}
                        onMomentumScrollEnd={hideDaySoon}
                        onViewableItemsChanged={onViewable}
                        viewabilityConfig={VIEWABLE}
                        onScrollToIndexFailed={(info) => {
                          // A row not drawn yet: near it first, then to it.
                          list.current?.scrollToOffset({
                            offset: info.averageItemLength * info.index,
                            animated: true,
                          });
                          setTimeout(
                            () =>
                              list.current?.scrollToIndex({
                                index: info.index,
                                animated: true,
                                viewPosition: 0.5,
                              }),
                            JUMP_RETRY_MS,
                          );
                        }}
                      />
                    </MetaReportContext.Provider>
                  )}
                </ChatHighlightContext.Provider>
              </ChatInvertedContext.Provider>
            </ChatNewestContext.Provider>
          </ChatLiveContext.Provider>
        </ChatJumpContext.Provider>
      </ChatBarContext.Provider>
      {timeOf && scrolling && floatDay !== null ? (
        <Reanimated.View
          pointerEvents="none"
          entering={FadeIn.duration(JUMP_FADE_MS)}
          exiting={FadeOut.duration(JUMP_FADE_MS)}
          style={{ position: 'absolute', left: 0, right: 0, top: topInset, alignItems: 'center' }}
        >
          <DayLine label={dayLabel(new Date(floatDay))} />
        </Reanimated.View>
      ) : null}
      {slot ? null : (
        <NewMessages
          show={metaHidden}
          count={pending}
          bottom={SPACING[3] + bottomInset}
          keyboardOffset={keyboardOffset}
          onPress={() => toEnd(true)}
        />
      )}
    </View>
  );
}

// A row counts as on the screen when half of it shows.
const VIEWABLE = { itemVisiblePercentThreshold: 50 } as const;
const DAY_HIDE_MS = 1200;

const INITIAL_ROWS = 15;
const BATCH_ROWS = 10;
const WINDOW = 11;
const OLD_THRESHOLD = 0.6;
const JUMP_RETRY_MS = 120;
const FOLLOW = { minIndexForVisible: 0, autoscrollToTopThreshold: BOTTOM_SLACK } as const;

// The stream a chat's message bar shows through its glass (the owner's call, 27 Ekim): the id of
// the GlassTarget around the wallpaper and the stream; null where there is none.
const ComposerGlassContext = createContext<string | null>(null);

export function useComposerGlass(): string | null {
  return useContext(ComposerGlassContext);
}

type Props<T extends ChatListItem> = {
  top: ReactNode;
  // The stream's rows; with `list`, what lies over the screen instead (its sheets).
  children?: ReactNode;
  // The stream drawn as Telegram Android draws its chat (ChatList): from the newest message up,
  // only the rows on the screen.
  list?: ChatListProps<T>;
  // The message bar, fixed at the bottom.
  composer: ReactNode;
  // See ChatScroll.
  newestKey?: string;
  newestMine?: boolean;
  startAtEnd?: boolean;
  testID?: string;
  // The chat's wall (skall tuvali: dm, masa, mekan); null: none (the table's games).
  wall?: ChatWallKind | null;
  // The screen hides the tab bar while it is open (a DM, useHideTabBar): laid out without the
  // bar's room from its first frame, not again once the bar has gone (mid-slide).
  hidesTabBar?: boolean;
};

// A chat app's screen as Telegram Android draws its chat (the owner's call, 30 Ekim): one wallpaper
// from the top of the screen to its foot, the stream over all of it, running on under the top bar's
// frosted pills and under the message bar; the down arrow over the stream; the message bar floating
// at the bottom above the keyboard.
export function ChatScreen<T extends ChatListItem>({
  top,
  children,
  list,
  composer,
  newestKey,
  newestMine,
  startAtEnd,
  testID,
  wall = 'dm',
  hidesTabBar = false,
}: Props<T>) {
  const { shape, scheme } = useTheme();
  // Under the tabs (a DM) the floating tab bar covers the bottom: the message bar sits above it.
  const tabSpace = useTabBarSpace();
  const barSpace = hidesTabBar ? 0 : tabSpace;
  // The reaction bar's state for the whole screen: a tap on the top bar or the message bar closes it
  // too.
  const reactions = useChatBarState();
  const insets = useSafeAreaInsets();
  // The system's navigation bar under the message bar (none under the tab bar, which has its own).
  const bottomPad = barSpace ? 0 : insets.bottom;
  // The message bar floats over the stream (the owner's call, 27 Ekim: the messages run on under
  // it); the stream keeps its last message clear of it.
  const [barHeight, setBarHeight] = useState(0);
  const under = composer ? barHeight : barSpace + bottomPad;
  // The top bar floats over the stream too (30 Ekim): the stream keeps its first message clear of
  // it; before it is measured, the status bar and a bar of pills.
  const [topHeight, setTopHeight] = useState(insets.top + SPLIT_PILL + SPACING[1.5] * 2);
  const end = useRef<(() => void) | null>(null);
  const followEnd = useCallback(() => end.current?.(), []);
  const glassId = useId();
  const [jump, setJump] = useState<JumpState>({ show: false, count: 0 });
  // The wallpaper's size: the area's width and the tallest it has been (the keyboard never scales
  // it), and the area's height now (the navigation bar's strip at its foot).
  const [canvas, setCanvas] = useState<WallpaperCanvas | null>(null);
  const [areaHeight, setAreaHeight] = useState(0);
  return (
    <ChatEndContext.Provider value={followEnd}>
      <ChatKindContext.Provider value={wall ?? 'dm'}>
        <ChatBarContext.Provider value={reactions.bar}>
          <JumpSlotContext.Provider value={setJump}>
            <SafeAreaView
              edges={['left', 'right']}
              style={{ flex: 1, backgroundColor: AURA[scheme].ground }}
              onTouchStart={reactions.onTouchStart}
              onLayout={(e) => {
                const { width, height } = e.nativeEvent.layout;
                setAreaHeight(height);
                setCanvas((prev) => wallpaperCanvas(prev, width, height));
              }}
            >
              {/* The stream and what lies under it: what the frosted pills, the message bar and the
                  down arrow show through their glass. */}
              <GlassTarget targetId={glassId} backdrop style={StyleSheet.absoluteFill}>
                {wall && canvas ? <ChatWallpaper kind={wall} canvas={canvas} /> : null}
                {wall ? null : <AuraBackground />}
                {list ? (
                  <ChatList
                    {...list}
                    testID={testID}
                    newestKey={newestKey}
                    newestMine={newestMine}
                    bottomInset={under}
                    topInset={topHeight}
                    endRef={end}
                    keyboardOffset={bottomPad}
                    // Drawn from the bottom up: its start is the screen's foot.
                    contentContainerStyle={{
                      flexGrow: 1,
                      paddingHorizontal: shape.screenPadding,
                      paddingTop: SPACING[3] + under,
                      paddingBottom: SPACING[2] + topHeight,
                      // Telegram Android: a run's bubbles close together, runs apart (ChatRow).
                      gap: SPACING[0.5],
                    }}
                  />
                ) : (
                  <ChatScroll
                    testID={testID}
                    newestKey={newestKey}
                    newestMine={newestMine}
                    startAtEnd={startAtEnd}
                    bottomInset={under}
                    topInset={topHeight}
                    endRef={end}
                    keyboardOffset={bottomPad}
                    contentContainerStyle={{
                      flexGrow: 1,
                      // skall tuvali (skall.css → `.stream`): 16 at the sides, 6 between messages.
                      paddingHorizontal: shape.screenPadding,
                      paddingTop: SPACING[2] + topHeight,
                      paddingBottom: SPACING[3] + under,
                      gap: SPACING[0.5],
                    }}
                  >
                    {children}
                  </ChatScroll>
                )}
              </GlassTarget>
              {/* The wallpaper again under the status bar's words and the navigation bar's buttons,
                  fading into the stream: messages pass under the system bars unseen. */}
              {wall && canvas ? (
                <WallBand
                  kind={wall}
                  canvas={canvas}
                  top={0}
                  height={insets.top}
                  fade={SPACING[3]}
                  direction="down"
                />
              ) : null}
              {wall && canvas && bottomPad > 0 && areaHeight > 0 ? (
                <WallBand
                  kind={wall}
                  canvas={canvas}
                  top={areaHeight - bottomPad}
                  height={bottomPad}
                  fade={SPACING[3]}
                  direction="up"
                />
              ) : null}
              <View
                style={{ position: 'absolute', left: 0, right: 0, top: 0, paddingTop: insets.top }}
                onLayout={(e) => setTopHeight(e.nativeEvent.layout.height)}
              >
                {top}
              </View>
              {composer ? (
                <KeyboardStickyView
                  offset={{ closed: 0, opened: bottomPad }}
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    paddingBottom: barSpace + bottomPad,
                  }}
                  onLayout={(e) => setBarHeight(e.nativeEvent.layout.height)}
                >
                  <ComposerGlassContext.Provider value={glassId}>
                    {composer}
                  </ComposerGlassContext.Provider>
                </KeyboardStickyView>
              ) : null}
              <NewMessages
                show={jump.show}
                count={jump.count}
                bottom={SPACING[3] + under}
                keyboardOffset={bottomPad}
                onPress={followEnd}
              />
              {list ? children : null}
            </SafeAreaView>
          </JumpSlotContext.Provider>
        </ChatBarContext.Provider>
      </ChatKindContext.Provider>
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
