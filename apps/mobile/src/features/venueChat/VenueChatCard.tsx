import { QUIET_RETRY_MS, retriesQuietly } from '@shared/chatOutbox.ts';
import {
  prepareVenueMessage,
  senderLabel,
  VENUE_CHAT,
  venueChatActive,
  type VenueChatMessage,
} from '@shared/venueChat.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, ScrollView, Text, View } from 'react-native';

import { Av, Badge, Btn, Live, T, useKit } from '@/aura/kit';
import { DraftComposer } from '@/components/Composer';
import { LookAvatar } from '@/components/LookAvatar';
import { useLoaderHold } from '@/components/Loader';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { track } from '@/lib/analytics';
import { ApiError, venueChatApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { requestKey } from '@/lib/requestKey';
import { useNow } from '@/lib/useNow';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { Arrive, ArriveLater, CollapsingCard, Tap } from '@/motion';
import { AURA, MOTION } from '@/theme/aura';
import { KIT, KIT_TYPE } from '@/theme/auraKit';
import { LOADER_SHOW_AFTER_MS } from '@/theme/markMotion';

import { readVenueChatNewer, useVenueChatCard } from './queries';

// "Mekan sohbeti" on Mekan (docs/design/iskelet.md → 5.11; docs/design/aura → Mekan): a glass card,
// its name with "şu an aktif" while the chat is active (a message in the last 10 minutes, K-12) and
// at the right the count of others' messages since the person last read it. Then the last two
// messages as one line each (the writer's face, the name in its colour, the message), and the
// field to write in with its send button: the chat's own send (venue-chat → send, the check-in's
// identity), no other call. Loading: two still placeholder lines; an error: the message and "Tekrar
// dene". The card's head and lines open the chat. Pinned under the table card it folds into a 54
// strip (CollapsingCard). Everyone checked in at the venue reads them (rule 4).
export function VenueChatCard({
  venueId,
  sessionId,
  identity,
  at,
}: {
  venueId: string;
  sessionId: string;
  identity: 'anonymous' | 'profiled';
  // Its line under the table card's strip.
  at: number;
}) {
  const queryClient = useQueryClient();
  const card = useVenueChatCard(venueId, sessionId);
  const now = useNow(30_000);
  const reduce = useReduceMotion();
  const loading = useLoaderHold(card.pending);
  const active = !loading && !card.failed && venueChatActive(card.lastAt, now);
  const unread = loading || card.failed ? 0 : card.unread;
  const openChat = () => router.push('/venue-chat');
  const label = active ? `${tr.venueChat.open}, ${tr.venue.chatActive}` : tr.venueChat.open;

  const send = useMutation({
    meta: FEEL_ERROR,
    mutationFn: ({ text, clientId }: { text: string; clientId: string }) =>
      venueChatApi.sendAs(venueId, text, identity, undefined, clientId),
  });
  const deliver = (body: string, clientId: string, clear: () => void, attempt = 0) => {
    send
      .mutateAsync({ text: body, clientId })
      .then(() => {
        track('venue_chat_sent', { profiled: identity === 'profiled' });
        clear();
        readVenueChatNewer(queryClient, venueId, sessionId);
      })
      .catch((err: unknown) => {
        const errorCode = err instanceof ApiError ? err.code : null;
        // The flood guard: sent again by itself, with the same clientId (the server writes it once).
        if (retriesQuietly(errorCode, attempt)) {
          setTimeout(() => deliver(body, clientId, clear, attempt + 1), QUIET_RETRY_MS);
          return;
        }
        // The identity changed elsewhere (or the photo went): nothing was sent.
        if (errorCode === 'identity_mismatch' || errorCode === 'photo_required') {
          void queryClient.invalidateQueries({ queryKey: ['activeTable'] });
        }
      });
  };

  const head = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
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
        <T v="h3">{tr.venueChat.open}</T>
        {active ? (
          <Arrive testID="venue-chat-live">
            <Live soft label={tr.venue.chatActive} />
          </Arrive>
        ) : null}
      </View>
      {unread > 0 ? (
        <Arrive kind="badge" accessible accessibilityLabel={tr.messages.unread(unread)}>
          <Badge large swap={!reduce} count={unread} />
        </Arrive>
      ) : null}
    </View>
  );

  return (
    <CollapsingCard
      at={at}
      strip={AURA.venueCollapse.chatStrip}
      radius={KIT.size.glassRadius}
      folded={
        <Tap sink={false} accessibilityLabel={label} onPress={openChat}>
          <View
            style={{
              height: AURA.venueCollapse.chatStrip,
              justifyContent: 'center',
              paddingHorizontal: PAD_X,
            }}
          >
            {head}
          </View>
        </Tap>
      }
    >
      <View style={{ paddingVertical: PAD_Y, paddingHorizontal: PAD_X, gap: GAP }}>
        <Tap
          testID="venue-chat-open"
          sink={false}
          accessibilityLabel={label}
          onPress={openChat}
          style={{ gap: GAP }}
        >
          {/* What the card shows when Mekan opens stays put; what comes after moves. */}
          <ArriveLater>
            {head}
            {loading ? (
              <Placeholder key="loading" />
            ) : card.failed ? null : card.recent.length > 0 ? (
              card.recent.map((m, i) => (
                <Arrive key={m.id} delay={i === 0 ? 0 : MOTION.stagger.part} swap>
                  <Line message={m} />
                </Arrive>
              ))
            ) : (
              <Arrive key="empty">
                <T v="fine">{tr.venue.chatEmpty}</T>
              </Arrive>
            )}
          </ArriveLater>
        </Tap>
        {card.failed && !loading ? (
          <Arrive style={{ gap: GAP, alignItems: 'flex-start' }}>
            <T v="fineLg">{tr.common.genericError}</T>
            <Btn
              sm
              variant="glassy"
              label={tr.common.retry}
              loading={card.retrying}
              onPress={card.retry}
            />
          </Arrive>
        ) : null}
        <DraftComposer
          capsule
          flush
          inputTestID="venue-card-input"
          sendTestID="venue-card-send"
          sendLabel={tr.venueChat.send}
          placeholder={tr.venueChat.placeholder}
          prepare={prepareVenueMessage}
          maxLength={VENUE_CHAT.maxLength}
          sending={send.isPending}
          onSend={(body, clear) => deliver(body, requestKey(), clear)}
        />
        {send.isError && !send.isPending ? (
          <T v="fine" color={KIT.danger}>
            {errorMessage(send.error)}
          </T>
        ) : null}
      </View>
    </CollapsingCard>
  );
}

const PAD_Y = 16;
const PAD_X = 18;
const GAP = 10;
const HEAD_ROW_GAP = 4;

// Two still lines in the messages' place: a face's circle and a bar. They show 300 ms into the
// wait (a quick answer shows none) and stay at least 600 ms (useLoaderHold).
function Placeholder() {
  const { c } = useKit();
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setShown(true), LOADER_SHOW_AFTER_MS);
    return () => clearTimeout(id);
  }, []);
  if (!shown) return null;
  return (
    <Arrive accessible accessibilityLabel={tr.common.loading} style={{ gap: GAP }}>
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
    </Arrive>
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
        // The line in the middle of the face's height: a horizontal ScrollView laid its content at
        // its own top (the owner's report, 2 Kasım, 7.8).
        <View pointerEvents="none" style={{ flex: 1, justifyContent: 'center' }}>
          <ScrollView
            horizontal
            style={{ flexGrow: 0 }}
            contentContainerStyle={{ alignItems: 'center' }}
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
