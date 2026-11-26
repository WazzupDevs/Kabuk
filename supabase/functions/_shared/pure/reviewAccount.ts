// The store review account (docs/SPEC_V4.md §4.Z, CLAUDE.md rule 6): Google Play's and Apple's
// reviewers sign in with one permanent test number and are never inside a partner campus. Their
// guidelines ask for sign-in details that work wherever the reviewer is ("independent of the user's
// location"). REVIEW_PHONE (a function secret on the production project, never in the repo) names
// that number; check-in from it skips the boundary check. Every other account keeps it.
import { toTrMobileE164 } from './phone.ts';

// `userPhone` as Supabase Auth keeps it ("905…", no plus); `reviewPhone` in any common spelling.
// Unset, empty or not a Turkish mobile number: nobody is the review account.
export function isReviewPhone(
  reviewPhone: string | undefined,
  userPhone: string | null | undefined,
): boolean {
  if (!reviewPhone || !userPhone) return false;
  const review = toTrMobileE164(reviewPhone);
  return review !== null && review === toTrMobileE164(userPhone);
}
