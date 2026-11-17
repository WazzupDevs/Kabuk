// Venue feed (docs/SPEC_V4.md §4.Y): short posts of the people checked in at a venue, each with
// its author's profile. The numbers here are the only source: the Edge Function passes them to SQL.

export const VENUE_FEED = {
  maxLength: 280,
  // Per account, posts and replies together: one per 3 seconds, at most 10 in 10 minutes.
  minIntervalMs: 3000,
  windowSeconds: 600,
  windowMax: 10,
  // Likes and their takebacks, per account: at most this many changes per window (each one is a
  // broadcast the whole venue reads the page on). A call that changes nothing is not counted.
  likeWindowSeconds: 10,
  likeWindowMax: 10,
  // A post reported by this many different accounts is hidden from everyone but its author.
  hideAfterReports: 3,
  // Posts are deleted after a day (hourly job).
  keepHours: 24,
  // One page of posts or replies.
  pageSize: 30,
} as const;

// Trimmed post, or null when empty or longer than 280 characters (code points, like the
// database's char_length).
export function prepareVenuePost(raw: string): string | null {
  const body = raw.trim();
  const length = [...body].length;
  return length >= 1 && length <= VENUE_FEED.maxLength ? body : null;
}

// One post as venue-feed/page returns it, and one reply as venue-feed/replies does (a reply has
// no replies). The author's display name and photo (signed, if any); no account id, no profile id,
// no nick. Likes are a count and whether the reader liked, never who.
export type VenuePost = {
  id: string;
  displayName: string | null;
  photoUrl: string | null;
  body: string;
  createdAt: string;
  fromMe: boolean;
  likes: number;
  liked: boolean;
  replies: number;
};

// The feed changed (a post, a reply, a like, a delete, a hide): no data, the reader reads the
// page again. Sent on the venue chat's topics (venueChat.ts → venueChatChannel), on every campus
// of the feed's scope.
export const VENUE_FEED_BROADCAST = 'venue_post' as const;
