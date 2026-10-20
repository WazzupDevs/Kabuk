// The capsule nick and start look (docs/SPEC_V4.md §4.D, K-9): generation is pure/capsule.ts, the
// database keeps nicks unique and never gives a retired one. A taken pick (another account's, or a
// retired one) is tried again with another, like a taken table alias at check-in.
import type { Db } from './auth.ts';
import { dbError } from './db.ts';
import { NICK_REFRESH_DAYS, nickDigits, pickReadyLook, randomNick } from './pure/capsule.ts';

const MAX_NICK_ATTEMPTS = 8;
const UNIQUE_VIOLATION = '23505';

function nickTaken(error: { code: string; message: string }): boolean {
  return (
    error.code === UNIQUE_VIOLATION || (error.code === 'P0001' && error.message === 'nick_taken')
  );
}

// Two digits until half the two-digit nicks are given (assigned and retired), three after.
async function digits(db: Db) {
  const { data, error } = await db.rpc('capsule_nicks_taken');
  if (error) throw dbError('capsule_nicks_taken', error);
  return nickDigits(Number(data));
}

// complete-onboarding, after the age check: a nick and one of the ready looks, once. Never from the
// gender (K-50): nothing about the person goes in. Check-in and the own profile call it too, for an
// account left without one (signed up through an older function between the migration and the
// functions' deploy, or after a failed assignment); an account with a nick costs one read.
export async function assignCapsuleIdentity(db: Db, userId: string): Promise<void> {
  const own = await db.from('profiles').select('capsule_nick').eq('id', userId).maybeSingle();
  if (own.error) throw dbError('profiles', own.error);
  if (!own.data || own.data.capsule_nick !== null) return;
  const nickDigitsNow = await digits(db);
  const look = pickReadyLook(Math.random);
  for (let attempt = 0; attempt < MAX_NICK_ATTEMPTS; attempt++) {
    const { error } = await db.rpc('assign_capsule_identity', {
      target_user_id: userId,
      new_nick: randomNick(nickDigitsNow, Math.random),
      new_look: look,
    });
    if (!error) return;
    if (!nickTaken(error)) throw dbError('assign_capsule_identity', error);
  }
  throw new Error('assign_capsule_identity failed (no free nick)');
}

export type RefreshedNick = { nick: string; changedAt: string };

// profile/refresh-nick: a new nick once in 30 days; the old one retires in the same transaction.
export async function refreshCapsuleNick(db: Db, userId: string): Promise<RefreshedNick> {
  const nickDigitsNow = await digits(db);
  for (let attempt = 0; attempt < MAX_NICK_ATTEMPTS; attempt++) {
    const { data, error } = await db.rpc('refresh_capsule_nick', {
      target_user_id: userId,
      new_nick: randomNick(nickDigitsNow, Math.random),
      min_days: NICK_REFRESH_DAYS,
    });
    if (!error && data.capsule_nick && data.capsule_nick_changed_at) {
      return { nick: data.capsule_nick, changedAt: data.capsule_nick_changed_at };
    }
    if (error && !nickTaken(error)) throw dbError('refresh_capsule_nick', error);
  }
  throw new Error('refresh_capsule_nick failed (no free nick)');
}
