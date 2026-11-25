import { VENUE_FEED, type VenuePost } from '@shared/venueFeed.ts';

// How old a post is, as the unit and the number the screen words ("2 dk", "3 sa", "1 g").
// Under a minute is "now"; a clock that is behind the post's (a post from a moment ahead) is "now".
export type FeedAge = { unit: 'now' } | { unit: 'minutes' | 'hours' | 'days'; n: number };

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

export function feedAge(createdAt: string, now: number): FeedAge {
  const ms = now - Date.parse(createdAt);
  if (!Number.isFinite(ms) || ms < MINUTE_MS) return { unit: 'now' };
  if (ms < HOUR_MS) return { unit: 'minutes', n: Math.floor(ms / MINUTE_MS) };
  if (ms < DAY_MS) return { unit: 'hours', n: Math.floor(ms / HOUR_MS) };
  return { unit: 'days', n: Math.floor(ms / DAY_MS) };
}

// The characters a post counts (code points, as the server's char_length), and whether the text
// is past the limit (@shared/venueFeed.ts → prepareVenuePost is what can be posted).
export function feedLength(body: string): number {
  return [...body.trim()].length;
}

export function feedOver(body: string): boolean {
  return feedLength(body) > VENUE_FEED.maxLength;
}

// The like pressed or taken back, shown before the server answers. The same state again changes
// nothing; the count never goes under zero.
export function withLike(post: VenuePost, liked: boolean): VenuePost {
  if (post.liked === liked) return post;
  return { ...post, liked, likes: Math.max(0, post.likes + (liked ? 1 : -1)) };
}

// One post of a list changed, the others as they were.
export function mapPost(
  posts: readonly VenuePost[],
  id: string,
  change: (post: VenuePost) => VenuePost,
): VenuePost[] {
  return posts.map((p) => (p.id === id ? change(p) : p));
}

// A call at most once in `ms`: the first at once, what comes meanwhile once more at the window's
// end. The venue's broadcasts (each like is one) read the page; this is the screen's one read per
// second. `cancel` drops a read waiting.
export type ThrottleClock = {
  now: () => number;
  set: (run: () => void, after: number) => unknown;
  clear: (handle: unknown) => void;
};

const REAL_CLOCK: ThrottleClock = {
  now: () => Date.now(),
  set: (run, after) => setTimeout(run, after),
  clear: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
};

export function throttleCalls(
  fn: () => void,
  ms: number,
  clock: ThrottleClock = REAL_CLOCK,
): { call: () => void; cancel: () => void } {
  let last = Number.NEGATIVE_INFINITY;
  let waiting: unknown = null;
  let isWaiting = false;
  const run = () => {
    isWaiting = false;
    waiting = null;
    last = clock.now();
    fn();
  };
  return {
    call: () => {
      if (isWaiting) return;
      const wait = last + ms - clock.now();
      if (wait <= 0) run();
      else {
        isWaiting = true;
        waiting = clock.set(run, wait);
      }
    },
    cancel: () => {
      if (isWaiting) clock.clear(waiting);
      isWaiting = false;
      waiting = null;
    },
  };
}

// The next page asks for the posts before the oldest one it has; none when the page was short (the
// feed's first post is in).
export function nextBefore(posts: readonly { createdAt: string }[]): string | undefined {
  if (posts.length < VENUE_FEED.pageSize) return undefined;
  return posts.at(-1)?.createdAt;
}
