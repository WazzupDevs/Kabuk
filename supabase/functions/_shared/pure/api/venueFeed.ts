// `venue-feed` Edge Function, shared with the mobile app (docs/SPEC_V4.md §4.Y).
import type { ReportReason } from '../chat.ts';
import type { VenuePost } from '../venueFeed.ts';

export type VenueFeedRequest =
  // A post, or with replyTo a reply to a visible post of the same feed (never to a reply). The
  // author writes with their profile whatever the check-in's identity; without a profile photo it
  // is photo_required. The same clientId again is the same post (the first one's postId; nothing
  // written, counted or broadcast); with another body or replyTo it is client_id_reused.
  | { action: 'post'; venueId: string; body: string; replyTo?: string; clientId?: string }
  // One page of posts, newest first; empty without a live check-in in the feed.
  | { action: 'page'; venueId: string; before?: string }
  // One page of a post's replies, newest first; empty when the caller cannot see the post.
  | { action: 'replies'; postId: string; before?: string }
  // The caller's like on a visible post or reply; the same call again changes nothing.
  | { action: 'like'; postId: string }
  | { action: 'unlike'; postId: string }
  // The author's own post or reply, gone for everyone; another's or a gone one is not_found.
  | { action: 'delete'; postId: string }
  // A visible post or reply of another; the answer is the same whatever happened.
  | { action: 'report'; postId: string; reason: ReportReason }
  // The author's profiled identity, muted in the feed and in the venue and district chats. The
  // list and unmute are the venue chat's (venue-chat/mutes, unmute).
  | { action: 'mute'; postId: string };

export type VenueFeedPostResponse = { postId: string };
export type VenueFeedPageResponse = { posts: VenuePost[] };
export type VenueFeedMuteResponse = { muteId: string };
