import { senderLabel, venueChatActive, type VenueChatMessage } from '@shared/venueChat.ts';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import Reanimated, {
  Easing,
  LayoutAnimationConfig,
  LinearTransition,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Av, Badge, Btn, Glass, Live, T, useKit } from '@/aura/kit';
import { LookAvatar } from '@/components/LookAvatar';
import { useLoaderHold } from '@/components/Loader';
import { tr } from '@/i18n/tr';
import { useNow } from '@/lib/useNow';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { MOTION, type Bezier } from '@/theme/aura';
import { KIT, KIT_TYPE } from '@/theme/auraKit';
import { LOADER_SHOW_AFTER_MS } from '@/theme/markMotion';

import { useVenueChatCard } from './queries';

// "Mekan sohbeti" on Mekan (docs/design/aura → Mekan, Galeri: Mekan sohbeti kartı): a glass card,
// its name with "şu an aktif" while the chat is active (a message in the last 10 minutes, K-12) and
// at the right the count of others' messages since the person last read it: two signs, apart. Then
// the last two messages as one line each: the writer's face, the name in its colour (a nick in
// amber, a name in pink) and the message. Loading: two still placeholder lines; an error: the
// message and "Tekrar dene", which reads the card again (a press elsewhere still opens the chat).
// Everyone checked in at the venue reads them (rule 4).
export function VenueChatCard({ venueId, sessionId }: { venueId: string; sessionId: string }) {
  const card = useVenueChatCard(venueId, sessionId);
  const now = useNow(30_000);
  const reduce = useReduceMotion();
  const loading = useLoaderHold(card.pending);
  const active = !loading && !card.failed && venueChatActive(card.lastAt, now);
  const unread = loading || card.failed ? 0 : card.unread;
  const motion = !reduce;
  return (
    <Pressable
      testID="venue-chat-open"
      accessibilityRole="button"
      accessibilityLabel={
        active ? `${tr.venueChat.open}, ${tr.venue.chatActive}` : tr.venueChat.open
      }
      onPress={() => router.push('/venue-chat')}
    >
      {({ pressed }) => (
        <Glass
          style={{
            paddingVertical: PAD_Y,
            paddingHorizontal: PAD_X,
            gap: GAP,
            opacity: pressed ? PRESSED : 1,
          }}
        >
          {/* What the card shows when Mekan opens stays put; what comes after moves. */}
          <LayoutAnimationConfig skipEntering>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: GAP,
              }}
            >
              {/* On a narrow screen "şu an aktif" goes under the name; neither is cut. */}
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  columnGap: GAP,
                  rowGap: HEAD_ROW_GAP,
                  flexShrink: 1,
                }}
              >
                <T v="sec">{tr.venueChat.open}</T>
                {active ? (
                  <Reanimated.View
                    testID="venue-chat-live"
                    entering={motion ? dissolveIn() : undefined}
                    exiting={motion ? fadeOut(MOTION.dissolve.outMs) : undefined}
                  >
                    <Live soft label={tr.venue.chatActive} />
                  </Reanimated.View>
                ) : null}
              </View>
              {unread > 0 ? (
                <Reanimated.View
                  entering={motion ? badgeIn : undefined}
                  exiting={motion ? badgeOut : undefined}
                  accessible
                  accessibilityLabel={tr.messages.unread(unread)}
                >
                  <Badge large swap={motion} count={unread} />
                </Reanimated.View>
              ) : null}
            </View>
            {loading ? (
              <Placeholder key="loading" motion={motion} />
            ) : card.failed ? (
              <Reanimated.View
                key="error"
                entering={motion ? dissolveIn() : undefined}
                style={{ gap: GAP, alignItems: 'flex-start' }}
              >
                <T v="fineLg">{tr.common.genericError}</T>
                <Btn
                  sm
                  variant="glassy"
                  label={tr.common.retry}
                  loading={card.retrying}
                  onPress={card.retry}
                />
              </Reanimated.View>
            ) : card.recent.length > 0 ? (
              card.recent.map((m) => (
                <Reanimated.View
                  key={m.id}
                  entering={motion ? dissolveIn(MOTION.stagger.part) : undefined}
                  exiting={motion ? fadeOut(MOTION.dissolve.outMs) : undefined}
                  layout={motion ? SWAP_LAYOUT : undefined}
                >
                  <Line message={m} />
                </Reanimated.View>
              ))
            ) : (
              <Reanimated.View
                key="empty"
                entering={motion ? dissolveIn() : undefined}
                exiting={motion ? fadeOut(MOTION.dissolve.outMs) : undefined}
              >
                <T v="fineLg">{tr.venue.chatEmpty}</T>
              </Reanimated.View>
            )}
          </LayoutAnimationConfig>
        </Glass>
      )}
    </Pressable>
  );
}

const PAD_Y = 16;
const PAD_X = 18;
const GAP = 10;
const HEAD_ROW_GAP = 4;
const PRESSED = 0.8;
const BADGE_RISE = 6;
const BADGE_FROM = 0.3;

// hareket.json's curves for Reanimated.
const curve = (b: Bezier) => Easing.bezier(b[0], b[1], b[2], b[3]);
const ARRIVE = curve(MOTION.curves.arrive);
const LEAVE = curve(MOTION.curves.leave);
// The lines' move up when a new one comes (hareket.json gives swap no duration: 300, as Mesajlar's
// disc).
const SWAP_MS = 300;
const SWAP_LAYOUT = LinearTransition.duration(SWAP_MS).easing(curve(MOTION.curves.swap));

// The dissolve's arrival (hareket.json → dissolve): from a little lower and smaller, faded in.
function dissolveIn(delay = 0) {
  const d = MOTION.dissolve;
  return () => {
    'worklet';
    return {
      initialValues: { opacity: 0, transform: [{ translateY: d.rise }, { scale: d.fromScale }] },
      animations: {
        opacity: withDelay(delay, withTiming(1, { duration: d.inMs, easing: ARRIVE })),
        transform: [
          { translateY: withDelay(delay, withTiming(0, { duration: d.inMs, easing: ARRIVE })) },
          { scale: withDelay(delay, withTiming(1, { duration: d.inMs, easing: ARRIVE })) },
        ],
      },
    };
  };
}

function fadeOut(ms: number) {
  return () => {
    'worklet';
    return {
      initialValues: { opacity: 1 },
      animations: { opacity: withTiming(0, { duration: ms, easing: LEAVE }) },
    };
  };
}

// The count arrives on the pop spring, 6 from below; it leaves smaller and faded.
const badgeIn = () => {
  'worklet';
  const pop = MOTION.springs.pop;
  return {
    initialValues: { opacity: 0, transform: [{ translateY: BADGE_RISE }, { scale: BADGE_FROM }] },
    animations: {
      opacity: withTiming(1, { duration: MOTION.dissolve.outMs }),
      transform: [{ translateY: withSpring(0, pop) }, { scale: withSpring(1, pop) }],
    },
  };
};
const badgeOut = () => {
  'worklet';
  const ms = MOTION.dissolve.outMs;
  return {
    initialValues: { opacity: 1, transform: [{ scale: 1 }] },
    animations: {
      opacity: withTiming(0, { duration: ms, easing: LEAVE }),
      transform: [{ scale: withTiming(BADGE_FROM, { duration: ms, easing: LEAVE }) }],
    },
  };
};

// Two still lines in the messages' place: a face's circle and a bar. They show 300 ms into the
// wait (a quick answer shows none) and stay at least 600 ms (useLoaderHold).
function Placeholder({ motion }: { motion: boolean }) {
  const { c } = useKit();
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setShown(true), LOADER_SHOW_AFTER_MS);
    return () => clearTimeout(id);
  }, []);
  if (!shown) return null;
  return (
    <Reanimated.View
      entering={motion ? dissolveIn() : undefined}
      exiting={motion ? fadeOut(MOTION.dissolve.outMs) : undefined}
      accessible
      accessibilityLabel={tr.common.loading}
      style={{ gap: GAP }}
    >
      {PLACEHOLDER_BARS.map((width) => (
        <View key={width} style={{ flexDirection: 'row', alignItems: 'center', gap: GAP }}>
          <View
            style={{
              width: KIT.size.av.sm,
              height: KIT.size.av.sm,
              borderRadius: KIT.size.av.sm / 2,
              backgroundColor: c.placeholder,
            }}
          />
          <View
            style={{
              width,
              height: PLACEHOLDER_BAR,
              borderRadius: PLACEHOLDER_BAR / 2,
              backgroundColor: c.placeholder,
            }}
          />
        </View>
      ))}
    </Reanimated.View>
  );
}
const PLACEHOLDER_BARS = ['58%', '40%'] as const;
const PLACEHOLDER_BAR = 12;

// A message as a line: the face, the writer in its colour and the message on one line; the card
// never grows with a long one. On Android a line longer than the card fades out over its last 44
// (the system's own fading edge, true transparency, only where the line runs past it; no "…" and no
// measuring); on iOS it ends in "…" for now (the canvas's open question).
function Line({ message }: { message: VenueChatMessage }) {
  const { c, scheme, tags } = useKit();
  const name = senderLabel(message);
  const ink = message.profiled
    ? scheme === 'dark'
      ? tags.pink.fg
      : KIT.nameInk
    : scheme === 'dark'
      ? tags.amber.fg
      : KIT.nickInk;
  const text = (
    <Text
      numberOfLines={Platform.OS === 'android' ? undefined : 1}
      maxFontSizeMultiplier={MAX_FONT_SCALE}
      style={[KIT_TYPE.fineLg, { color: c.ink }, Platform.OS === 'android' ? null : { flex: 1 }]}
    >
      <Text style={[KIT_TYPE.strong, { color: ink }]}>{name}</Text> {oneLine(message.body)}
    </Text>
  );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: GAP }}>
      {message.profiled ? (
        <Av size="sm" name={name} photoUrl={message.photoUrl} />
      ) : message.senderLook ? (
        <Av size="sm" name={name}>
          <LookAvatar look={message.senderLook} size={KIT.size.av.sm} />
        </Av>
      ) : (
        <Av size="sm" name={name} />
      )}
      {Platform.OS === 'android' ? (
        // Not scrollable and not touchable: the card's press opens the chat.
        <View pointerEvents="none" style={{ flex: 1 }}>
          <ScrollView
            horizontal
            scrollEnabled={false}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            fadingEdgeLength={{ start: 0, end: FADE }}
          >
            {text}
          </ScrollView>
        </View>
      ) : (
        text
      )}
    </View>
  );
}
const MAX_FONT_SCALE = 1.3;
const FADE = 44;
// The preview needs only the start of the message, on one line.
const PREVIEW_CHARS = 160;
function oneLine(body: string): string {
  return Array.from(body.replace(/\s+/g, ' ').trim()).slice(0, PREVIEW_CHARS).join('');
}
