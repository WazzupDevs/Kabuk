// Venue feed (docs/SPEC_V4.md §4.Y): short posts of the people checked in at a venue (at any
// campus of a university, §4.Q), each with its author's profile. Length and profanity are checked
// here; the check-in, the photo, the rate limits and the writes in SQL (20261219090000_venue_feed).
// Others learn of a change from a data-free broadcast on the venue chat's topics and read the page
// again; the page signs the authors' photos. No push. Likes are counted, never named; nothing here
// carries an account id, a profile id, a nick or a table (rules 4 and 5).
import { requireUser, serviceClient } from '../_shared/auth.ts';
import { inBackground } from '../_shared/background.ts';
import { dbError } from '../_shared/db.ts';
import { z } from '../_shared/deps.ts';
import { handle } from '../_shared/http.ts';
import { signPhotos } from '../_shared/photos.ts';
import { loadProfanity } from '../_shared/profanity.ts';
import type {
  VenueFeedMuteResponse,
  VenueFeedPageResponse,
  VenueFeedPostResponse,
  VenueFeedRequest,
} from '../_shared/pure/api/venueFeed.ts';
import { REPORT_REASONS } from '../_shared/pure/chat.ts';
import { AppError } from '../_shared/pure/errors.ts';
import { containsProfanity } from '../_shared/pure/profanity.ts';
import { prepareVenuePost, VENUE_FEED, VENUE_FEED_BROADCAST } from '../_shared/pure/venueFeed.ts';
import { broadcastVenueChat } from '../_shared/venueChatBroadcast.ts';

const before = z.iso.datetime({ offset: true }).optional();

const Body: z.ZodType<VenueFeedRequest> = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('post'),
    venueId: z.uuid(),
    body: z.string().max(2000),
    replyTo: z.uuid().optional(),
    clientId: z.uuid().optional(),
  }),
  z.object({ action: z.literal('page'), venueId: z.uuid(), before }),
  z.object({ action: z.literal('replies'), postId: z.uuid(), before }),
  z.object({ action: z.literal('like'), postId: z.uuid() }),
  z.object({ action: z.literal('unlike'), postId: z.uuid() }),
  z.object({ action: z.literal('delete'), postId: z.uuid() }),
  z.object({ action: z.literal('report'), postId: z.uuid(), reason: z.enum(REPORT_REASONS) }),
  z.object({ action: z.literal('mute'), postId: z.uuid() }),
]);

const db = serviceClient();

// Every campus of the feed hears it (docs/SPEC_V4.md §4.Q); no data.
function announce(venueId: string): void {
  inBackground(broadcastVenueChat(db, venueId, VENUE_FEED_BROADCAST));
}

type Row = {
  id: string;
  display_name: string | null;
  photo_path: string | null;
  body: string;
  created_at: string;
  from_me: boolean;
  likes: number;
  liked: boolean;
  replies?: number;
};

// Each distinct photo path is signed once.
async function posts(rows: Row[]): Promise<VenueFeedPageResponse> {
  const urls = await signPhotos(db, [
    ...new Set(rows.map((r) => r.photo_path).filter((p): p is string => !!p)),
  ]);
  return {
    posts: rows.map((r) => ({
      id: r.id,
      displayName: r.display_name,
      photoUrl: r.photo_path ? (urls.get(r.photo_path) ?? null) : null,
      body: r.body,
      createdAt: r.created_at,
      fromMe: r.from_me,
      likes: r.likes,
      liked: r.liked,
      replies: r.replies ?? 0,
    })),
  };
}

Deno.serve(
  handle(
    async (
      req,
      raw,
    ): Promise<
      VenueFeedPostResponse | VenueFeedPageResponse | VenueFeedMuteResponse | { ok: true }
    > => {
      const body = Body.parse(raw);
      const user = await requireUser(req, db);

      if (body.action === 'page') {
        const { data, error } = await db.rpc('venue_feed_page_for', {
          target_user_id: user.id,
          target_venue_id: body.venueId,
          ...(body.before ? { before: body.before } : {}),
          page_size: VENUE_FEED.pageSize,
        });
        if (error) throw dbError('venue_feed_page_for', error);
        return posts(data);
      }
      if (body.action === 'replies') {
        const { data, error } = await db.rpc('venue_feed_replies_for', {
          target_user_id: user.id,
          target_post_id: body.postId,
          ...(body.before ? { before: body.before } : {}),
          page_size: VENUE_FEED.pageSize,
        });
        if (error) throw dbError('venue_feed_replies_for', error);
        return posts(data);
      }
      if (body.action === 'like' || body.action === 'unlike') {
        const { data, error } = await db.rpc('venue_feed_like', {
          target_user_id: user.id,
          target_post_id: body.postId,
          liked: body.action === 'like',
          window_seconds: VENUE_FEED.likeWindowSeconds,
          window_max: VENUE_FEED.likeWindowMax,
        });
        if (error) throw dbError('venue_feed_like', error);
        const row = data[0];
        if (row?.changed) announce(row.post_venue_id);
        return { ok: true };
      }
      if (body.action === 'delete') {
        const { data, error } = await db.rpc('venue_feed_delete', {
          target_user_id: user.id,
          target_post_id: body.postId,
        });
        if (error) throw dbError('venue_feed_delete', error);
        announce(data);
        return { ok: true };
      }
      // Nothing goes to the muted person, no broadcast either (rule 5).
      if (body.action === 'mute') {
        const { data, error } = await db.rpc('venue_feed_mute', {
          target_user_id: user.id,
          target_post_id: body.postId,
        });
        if (error) throw dbError('venue_feed_mute', error);
        return { muteId: data };
      }
      if (body.action === 'report') {
        const { data, error } = await db.rpc('safety_report_venue_post', {
          target_user_id: user.id,
          target_post_id: body.postId,
          new_reason: body.reason,
          hide_after: VENUE_FEED.hideAfterReports,
        });
        if (error) throw dbError('safety_report_venue_post', error);
        // Hidden by this report: everyone in the feed reads the page again.
        if (data) {
          const post = await db.from('venue_posts').select('venue_id').eq('id', body.postId);
          if (post.error) throw dbError('venue_posts', post.error);
          const venueId = post.data[0]?.venue_id;
          if (venueId) announce(venueId);
        }
        return { ok: true };
      }

      const text = prepareVenuePost(body.body);
      if (text === null) {
        throw new AppError('message_invalid', 'Post must be 1 to 280 characters.');
      }
      // Rejected, not masked (rule 7).
      if (containsProfanity(text, await loadProfanity(db))) {
        throw new AppError('profanity_rejected', 'Post contains inappropriate language.');
      }
      const { data, error } = await db.rpc('venue_feed_post_once', {
        target_user_id: user.id,
        target_venue_id: body.venueId,
        new_body: text,
        min_interval_ms: VENUE_FEED.minIntervalMs,
        window_seconds: VENUE_FEED.windowSeconds,
        window_max: VENUE_FEED.windowMax,
        ...(body.replyTo ? { reply_to: body.replyTo } : {}),
        ...(body.clientId ? { new_client_id: body.clientId } : {}),
      });
      if (error) throw dbError('venue_feed_post_once', error);
      const [sent] = data;
      if (!sent) throw new AppError('internal', 'venue_feed_post_once returned no row.');
      if (!sent.replayed) announce(body.venueId);
      return { postId: sent.post_id };
    },
  ),
);
