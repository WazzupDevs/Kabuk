import { QUIET_RETRY_MS, retriesQuietly } from '@shared/chatOutbox.ts';
import { prepareVenuePost, VENUE_FEED } from '@shared/venueFeed.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { View } from 'react-native';

import { Av, Btn, T, useKit } from '@/aura/kit';
import { Banner } from '@/components/Banner';
import { BareField } from '@/components/Field';
import { Screen } from '@/components/Screen';
import { useActiveTable } from '@/features/checkin/useActiveTable';
import { PhotoSheet } from '@/features/profile/PhotoSheet';
import { useOwnPhoto } from '@/features/profile/useOwnPhoto';
import { feedLength, feedOver } from '@/features/venueFeed/feedLogic';
import { venueFeedKeys } from '@/features/venueFeed/queries';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { ApiError, venueFeedApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { haptic } from '@/lib/haptics';
import { requestKey } from '@/lib/requestKey';
import { Tap } from '@/motion';
import { KIT } from '@/theme/auraKit';
import { VENUE_FEED_LOOK } from '@/theme/venueFeed';

// Where a post is written (yeni arayüz tuvali, AkisYaz, AkisYazBos; docs/SPEC_V4.md §4.Y), and a
// reply to a post (the same page: `replyTo`; no replies to a reply). A page over the whole screen:
// "Vazgeç", the title and "Paylaş" on its bar, "Profilinle paylaşıyorsun" with the venue's name,
// the field, and the count over the keyboard. "Paylaş" waits for words (1 to 280). Everyone writes
// with the profile: without a profile photo the page says so before the press (the server answers
// photo_required) and "Fotoğraf ekle" opens the photo's sheet.
// The same press again is the same post (clientId); a changed text is a new one.
export default function VenueFeedComposeScreen() {
  const params = useLocalSearchParams<{ venueId: string; replyTo?: string; replyName?: string }>();
  const { venueId, replyTo, replyName } = params;
  const queryClient = useQueryClient();
  const table = useActiveTable();
  const photo = useOwnPhoto();
  const { c } = useKit();
  const L = VENUE_FEED_LOOK.compose;
  const [body, setBody] = useState('');
  const [photoSheet, setPhotoSheet] = useState(false);
  // The id of the press: kept for the same text, so a repeat is the same post.
  const attempt = useRef<{ body: string; clientId: string } | null>(null);

  const prepared = prepareVenuePost(body);
  const needsPhoto = photo.known && !photo.has;
  const length = feedLength(body);
  const over = feedOver(body);

  const post = useMutation({
    meta: FEEL_ERROR,
    mutationFn: async (text: string) => {
      if (attempt.current?.body !== text) attempt.current = { body: text, clientId: requestKey() };
      const { clientId } = attempt.current;
      // The flood guard: sent again by itself, nothing shown, the same clientId (the server writes
      // it once).
      for (let tries = 0; ; tries++) {
        try {
          return await venueFeedApi.post(venueId, text, clientId, replyTo);
        } catch (err) {
          const code = err instanceof ApiError ? err.code : null;
          if (!retriesQuietly(code, tries)) throw err;
          await new Promise((resolve) => setTimeout(resolve, QUIET_RETRY_MS));
        }
      }
    },
    onSuccess: () => {
      haptic('sent');
      void queryClient.invalidateQueries({ queryKey: venueFeedKeys.page(venueId) });
      if (replyTo) {
        void queryClient.invalidateQueries({ queryKey: venueFeedKeys.replies(replyTo) });
      }
      router.back();
    },
    onError: (err) => {
      // The photo went (or was never seen): the profile is read again, the page says so.
      if (err instanceof ApiError && err.code === 'photo_required') void photo.refresh();
    },
  });

  const share = () => {
    if (prepared && !over && !needsPhoto && !post.isPending) post.mutate(prepared);
  };
  const venueName = table.data?.venue?.name ?? '';
  const sub = replyTo ? tr.venueFeed.composeReplyTo(replyName ?? tr.venueFeed.someone) : venueName;
  const photoMissing =
    needsPhoto || (post.error instanceof ApiError && post.error.code === 'photo_required');

  return (
    <Screen
      plain
      top={
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: L.bar,
          }}
        >
          <Tap
            testID="venue-feed-cancel"
            sink={false}
            accessibilityLabel={tr.venueFeed.composeBack}
            onPress={() => router.back()}
            style={{ minHeight: L.bar, justifyContent: 'center', paddingRight: L.barLeft }}
          >
            <T v="h3" ink>
              {tr.venueFeed.composeBack}
            </T>
          </Tap>
          <T v="h3" ink accessibilityRole="header">
            {replyTo ? tr.venueFeed.composeReplyTitle : tr.venueFeed.composeTitle}
          </T>
          <Btn
            sm
            testID="venue-feed-share"
            label={tr.venueFeed.composeShare}
            disabled={!prepared || over || needsPhoto}
            loading={post.isPending}
            onPress={share}
            style={{ minWidth: L.share }}
          />
        </View>
      }
      footer={
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingTop: L.footTop }}>
          <T
            v="fine"
            strong
            tabular
            color={over ? KIT.danger : c.muted}
            accessibilityLiveRegion="polite"
          >
            {tr.venueFeed.composeCount(length, VENUE_FEED.maxLength)}
          </T>
        </View>
      }
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: L.whoGap }}>
        <Av name={photo.name} photoUrl={photo.url} size="list" />
        <View style={{ flex: 1, minWidth: 0 }}>
          <T v="body" ink strong>
            {tr.venueFeed.composeAs}
          </T>
          {sub ? <T v="fine">{sub}</T> : null}
        </View>
      </View>
      <View style={{ marginTop: L.textTop }}>
        <BareField
          testID="venue-feed-input"
          autoFocus
          value={body}
          onChangeText={setBody}
          placeholder={
            replyTo ? tr.venueFeed.composeReplyPlaceholder : tr.venueFeed.composePlaceholder
          }
          selectionColor={KIT.pink}
          minHeight={L.textMin}
        />
      </View>
      {photoMissing ? (
        <View style={{ gap: L.whoGap }}>
          <Banner tone="warn" body={tr.errors.photo_required} />
          <Btn
            block
            icon="photo"
            testID="venue-feed-add-photo"
            label={tr.identity.addPhoto}
            onPress={() => setPhotoSheet(true)}
          />
        </View>
      ) : post.isError ? (
        <Banner
          tone="danger"
          body={
            post.error instanceof ApiError && post.error.code === 'message_invalid'
              ? tr.venueFeed.tooLong(VENUE_FEED.maxLength)
              : errorMessage(post.error)
          }
        />
      ) : null}
      <PhotoSheet visible={photoSheet} onClose={() => setPhotoSheet(false)} />
    </Screen>
  );
}
