import { REPORT_REASONS, type ReportReason } from '@shared/chat.ts';
import type { VenuePost } from '@shared/venueFeed.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';

import { ReportModal } from '@/features/chat/ReportModal';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { venueFeedApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { haptic } from '@/lib/haptics';
import { confirm } from '@/lib/overlayStore';
import { useFlash } from '@/lib/useFlash';

import { useFeedDelete, useFeedLike, venueFeedKeys } from './queries';

// What the ⋮ and the heart do on a post or a reply, for the feed and for a post's replies: "Sil"
// (own; asks first, a centred dialog), "Şikayet et" (the reasons' sheet), "Sessize al", the like
// shown at once. `note` is the line to show over the list (a toast's words); `sheet` is the
// report's sheet, drawn once by the screen.
export function usePostActions() {
  const queryClient = useQueryClient();
  const [note, flash] = useFlash();
  const [reporting, setReporting] = useState<VenuePost | null>(null);
  const like = useFeedLike();
  const remove = useFeedDelete(() => flash(tr.venueFeed.deleted));
  const report = useMutation({
    meta: FEEL_ERROR,
    mutationFn: ({ id, reason }: { id: string; reason: ReportReason }) =>
      venueFeedApi.report(id, reason),
    onSuccess: () => {
      setReporting(null);
      flash(tr.safety.reportSent);
    },
  });
  const mute = useMutation({
    meta: FEEL_ERROR,
    mutationFn: (post: VenuePost) => venueFeedApi.mute(post.id),
    onSuccess: (_data, post) => {
      flash(tr.venueFeed.mutedToast(post.displayName ?? tr.venueFeed.someone));
      // The list of the muted (Ayarlar → Gizlilik) is the venue chat's.
      void queryClient.invalidateQueries({ queryKey: ['venueChatMutes'] });
      void queryClient.invalidateQueries({ queryKey: venueFeedKeys.all });
      void queryClient.invalidateQueries({ queryKey: venueFeedKeys.repliesAll });
    },
  });

  const onLike = (post: VenuePost) => {
    haptic('selection');
    like.mutate(
      { postId: post.id, liked: !post.liked },
      { onError: (err) => flash(errorMessage(err)) },
    );
  };
  // A thrown error leaves the dialog open for another try (lib/overlayStore → confirm).
  const onDelete = (post: VenuePost) =>
    confirm({
      title: tr.venueFeed.deleteTitle,
      note: tr.venueFeed.deleteBody,
      icon: 'trash',
      tone: 'danger',
      confirmLabel: tr.venueFeed.deleteConfirm,
      confirmIcon: 'trash',
      cancelLabel: tr.common.cancel,
      testID: 'venue-feed-delete-confirm',
      onConfirm: async () => {
        await remove.mutateAsync(post.id);
      },
    });
  const onMute = (post: VenuePost) => {
    if (!mute.isPending) mute.mutate(post, { onError: (err) => flash(errorMessage(err)) });
  };

  // The author's profile, through the post (docs/SPEC_V4.md §4.Y).
  const onProfile = (post: VenuePost) =>
    router.push({ pathname: '/venue-feed/profile/[postId]', params: { postId: post.id } });

  return {
    note,
    onProfile,
    flash,
    onLike,
    onDelete,
    onMute,
    onReport: setReporting,
    sheet: (
      <ReportModal
        reasons={REPORT_REASONS}
        visible={reporting !== null}
        pending={report.isPending}
        error={report.error}
        onReport={(reason) => reporting && report.mutate({ id: reporting.id, reason })}
        onClose={() => setReporting(null)}
      />
    ),
  };
}
