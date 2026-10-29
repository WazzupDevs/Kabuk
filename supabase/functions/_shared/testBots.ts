// Test bots (the owner's call, 29 Ekim; migration 20261114090000_test_bots.sql): one phone tries a
// game alone. Only where pure/devProject.ts → testBotsAllowed says so (the local stack and the dev
// project); the pilot answers available: false and refuses the rest.
//
// A bot is an account that never signs in (no OTP: its number is no test number), with a finished
// profile like any person's and the capsule nick. Seating one is a person's road: a check-in at the
// owner's venue and spot, "Katıl" (a table in the lobby) or "Bu masadayım" (one out of it), and the
// owner's acceptance. Each owner keeps up to eleven bots and seats them again from table to table.
import type { Db } from './auth.ts';
import { assignCapsuleIdentity } from './capsule.ts';
import { dbError } from './db.ts';
import { lobbyChanged } from './lobby.ts';
import type { TestBotsResponse } from './pure/api/rooms.ts';
import {
  CURRENT_KVKK_VERSION,
  CURRENT_LOCATION_CONSENT_VERSION,
  CURRENT_TERMS_VERSION,
} from './pure/consent.ts';
import { testBotsAllowed } from './pure/devProject.ts';
import { AppError } from './pure/errors.ts';
import { JOIN_REQUEST_TTL_SECONDS } from './pure/rooms.ts';
import { MAX_TABLE_PHONES } from './pure/tables.ts';

export function testBotsHere(): boolean {
  return testBotsAllowed(Deno.env.get('SUPABASE_URL'));
}

// A table holds twelve phones: the owner and eleven bots at most.
const MAX_BOTS = MAX_TABLE_PHONES - 1;
// The same bots sit down again and again: a person's hourly limit on requests is not theirs.
const BOT_REQUESTS_PER_HOUR = 1000;
const BOT_BIRTH_DATE = '2000-01-01';
// A Turkish mobile number nobody signs in with (before_user_created accepts only 905…).
const BOT_PHONE_PREFIX = '+9055599';
const CREATE_ATTEMPTS = 5;

type Bot = { user_id: string; session_id: string | null; room_id: string | null };

async function botsOf(db: Db, owner: string): Promise<Bot[]> {
  const { data, error } = await db.rpc('test_bots_of', { target_owner: owner });
  if (error) throw dbError('test_bots_of', error);
  return data as Bot[];
}

// The owner's check-in and table (not_owner for anyone else, or a closed table).
async function ownersTable(db: Db, owner: string, roomId: string) {
  const session = await db
    .from('table_sessions')
    .select('id, venue_id, spot_id')
    .eq('user_id', owner)
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .limit(1)
    .maybeSingle();
  if (session.error) throw dbError('table_sessions', session.error);
  const room = await db
    .from('rooms')
    .select('id, owner_session_id, status, visibility, phones, venue_id')
    .eq('id', roomId)
    .maybeSingle();
  if (room.error) throw dbError('rooms', room.error);
  if (
    !session.data ||
    !room.data ||
    room.data.status === 'closed' ||
    room.data.owner_session_id !== session.data.id
  ) {
    throw new AppError('not_owner', 'Only the owner of the table seats test bots.');
  }
  return { session: session.data, room: room.data };
}

async function newBot(db: Db, owner: string, n: number): Promise<string> {
  let id: string | null = null;
  for (let attempt = 0; attempt < CREATE_ATTEMPTS && !id; attempt++) {
    const digits = String(Math.floor(Math.random() * 100_000)).padStart(5, '0');
    const { data, error } = await db.auth.admin.createUser({
      phone: `${BOT_PHONE_PREFIX}${digits}`,
      phone_confirm: true,
    });
    // A number taken already: another one.
    if (!error && data.user) id = data.user.id;
  }
  if (!id) throw new Error('test bot: no account');
  const now = new Date().toISOString();
  const profile = await db.from('profiles').upsert({
    id,
    age_confirmed_at: now,
    terms_accepted_at: now,
    terms_version: CURRENT_TERMS_VERSION,
    kvkk_accepted_at: now,
    kvkk_version: CURRENT_KVKK_VERSION,
    display_name: `Bot ${n}`,
    birth_date: BOT_BIRTH_DATE,
    gender: 'female',
    default_participation: 'anonymous',
  });
  if (profile.error) throw dbError('profiles', profile.error);
  const added = await db.rpc('test_bot_add', { target_bot: id, target_owner: owner });
  if (added.error) throw dbError('test_bot_add', added.error);
  await assignCapsuleIdentity(db, id);
  return id;
}

export async function testBots(db: Db, owner: string, roomId: string): Promise<TestBotsResponse> {
  if (!testBotsHere()) return { available: false, seated: 0 };
  const bots = await botsOf(db, owner);
  return { available: true, seated: bots.filter((b) => b.room_id === roomId).length };
}

export async function addTestBots(
  db: Db,
  owner: string,
  roomId: string,
  count: number,
): Promise<TestBotsResponse> {
  if (!testBotsHere()) throw new AppError('bad_request', 'No test bots on this server.');
  const { session, room } = await ownersTable(db, owner, roomId);
  if (room.phones + count > MAX_TABLE_PHONES) {
    throw new AppError('table_full', 'The table is full.');
  }
  const bots = await botsOf(db, owner);
  const chosen = bots
    .filter((b) => b.room_id !== roomId)
    .slice(0, count)
    .map((b) => b.user_id);
  let made = bots.length;
  while (chosen.length < count && made < MAX_BOTS) {
    made += 1;
    chosen.push(await newBot(db, owner, made));
  }

  for (const bot of chosen) {
    // A new check-in at the owner's venue and spot ends the one it had (and its seat elsewhere).
    const started = await db.rpc('start_table_session', {
      target_user_id: bot,
      target_venue_id: session.venue_id,
      consent_version: CURRENT_LOCATION_CONSENT_VERSION,
      new_spot_id: session.spot_id ?? undefined,
    });
    if (started.error) throw dbError('start_table_session', started.error);
    const asked = await db.rpc('rooms_request_join', {
      target_user_id: bot,
      target_room_id: room.id,
      ttl_seconds: JOIN_REQUEST_TTL_SECONDS,
      max_per_hour: BOT_REQUESTS_PER_HOUR,
      as_member: room.visibility !== 'open',
    });
    if (asked.error) throw dbError('rooms_request_join', asked.error);
    const accepted = await db.rpc('rooms_respond', {
      target_user_id: owner,
      target_request_id: asked.data.id,
      accept: true,
    });
    if (accepted.error) throw dbError('rooms_respond', accepted.error);
  }
  lobbyChanged(room);
  return testBots(db, owner, roomId);
}

// Every bot of the owner's leaves its check-in (and so its table and game: it counts as left).
export async function removeTestBots(
  db: Db,
  owner: string,
  roomId: string,
): Promise<TestBotsResponse> {
  if (!testBotsHere()) throw new AppError('bad_request', 'No test bots on this server.');
  const { room } = await ownersTable(db, owner, roomId);
  for (const bot of await botsOf(db, owner)) {
    if (!bot.session_id) continue;
    const { error } = await db.rpc('end_table_session', { target_user_id: bot.user_id });
    if (error) throw dbError('end_table_session', error);
  }
  lobbyChanged(room);
  return testBots(db, owner, roomId);
}

// The bots' moves at a running Vampir Köylü (test_bots_vampir), around each call to the game. A
// failed move is logged; the person's own call goes on.
export async function testBotsPlayVampir(db: Db, roomId: string): Promise<void> {
  if (!testBotsHere()) return;
  const { error } = await db.rpc('test_bots_vampir', { target_room_id: roomId });
  if (error) console.error(`test_bots_vampir failed (${error.code}): ${error.message}`);
}
