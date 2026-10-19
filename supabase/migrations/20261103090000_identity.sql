-- Faz 4 step 4.4, server (docs/SPEC_V4.md §4.D, §4.H, §4.I, §4.K): the capsule identity.
--
-- Every account gets a nick ("kapsul-xx55": unique, the account's own) and a capsule look (a short
-- code of the catalog, pure/capsuleCatalog.ts). Both are closed to authenticated like the gender;
-- the owner reads them in profile/get, others only in their context (an anonymous venue chat
-- message, an anonymous person at a table). A deleted account's nick and a refreshed one are kept
-- as text only, so they are never given again (retired_capsule_nicks).
--
-- A check-in has one identity (anonymous or profiled) and one change (identity_mode,
-- identity_switches). The venue chat writes the identity with each message: the nick and the look
-- for an anonymous one. The page groups a person's messages by an opaque senderKey, leaves out
-- deleted messages and the identities the reader muted.
--
-- Staged like 23.2 and 23.3 (server first, today's app unbroken; docs/decisions/4.4-kimlik.md):
-- today's app sends `profiled` with every venue chat message and picks the mode with its first one
-- (§22.G); venue_chat_send keeps that as the check-in's one change. The new app sends the identity it shows and
-- gets identity_mismatch when its picture is stale. Rooms keep the check-in alias until 4.5 (§4.H);
-- the look a person sits at a table with is written now.

-- Nick and look ------------------------------------------------------------------------------------
-- Not granted to authenticated (profiles has column grants since 20261004090000_profiles_v2.sql).
alter table public.profiles
  add column capsule_nick text unique
    check (capsule_nick ~ '^kapsul-[abcdefghkmnprstuvyz]{2}[0-9]{2,3}$'),
  add column capsule_look text check (char_length(capsule_look) between 1 and 200),
  -- The last refresh (K-9: once in 30 days); empty until the first one.
  add column capsule_nick_changed_at timestamptz;

-- Nicks no account has any more: the text only, no account and no date (§4.H).
create table public.retired_capsule_nicks (
  nick text primary key
);

alter table public.retired_capsule_nicks enable row level security;
revoke all on table public.retired_capsule_nicks from anon, authenticated;

-- A deleted account's nick is retired on the way out (account/delete, admin:delete, admin:ban: all
-- delete the auth user, the profile goes by cascade).
create function private.retire_capsule_nick()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.capsule_nick is not null then
    insert into public.retired_capsule_nicks (nick) values (old.capsule_nick)
    on conflict (nick) do nothing;
  end if;
  return old;
end;
$$;

create trigger profiles_retire_capsule_nick
  before delete on public.profiles
  for each row execute function private.retire_capsule_nick();

-- Assigned and retired nicks: the fullness the nick's digits follow (pure/capsule.ts → nickDigits).
create function public.capsule_nicks_taken()
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select (select count(*) from public.profiles where capsule_nick is not null)
       + (select count(*) from public.retired_capsule_nicks);
$$;

-- complete-onboarding (after the age check): the nick and the start look, once. A nick another
-- account holds fails on the unique index (23505), a retired one with nick_taken; the function tries
-- another. The retired check comes after the write: a nick retired meanwhile was held by the
-- deleted profile until then, so the write waited for it and the check now sees it.
create function public.assign_capsule_identity(
  target_user_id uuid,
  new_nick text,
  new_look text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  assigned text;
begin
  update public.profiles
  set capsule_nick = new_nick, capsule_look = coalesce(capsule_look, new_look)
  where id = target_user_id and capsule_nick is null
  returning capsule_nick into assigned;
  if assigned is null then
    -- Already has one (or no profile).
    return (select capsule_nick from public.profiles where id = target_user_id);
  end if;
  if exists (select 1 from public.retired_capsule_nicks where nick = new_nick) then
    raise exception using errcode = 'P0001', message = 'nick_taken';
  end if;
  return assigned;
end;
$$;

-- profile/refresh-nick (K-9): a new nick once in `min_days` days; the old one retires in the same
-- transaction. Messages and table seats keep the nick they were written with.
create function public.refresh_capsule_nick(
  target_user_id uuid,
  new_nick text,
  min_days integer
)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  p public.profiles;
  old_nick text;
begin
  select * into p from public.profiles where id = target_user_id for no key update;
  if p.id is null or p.capsule_nick is null then
    raise exception using errcode = 'P0001', message = 'onboarding_required';
  end if;
  if p.capsule_nick_changed_at is not null
    and p.capsule_nick_changed_at > now() - make_interval(days => min_days) then
    raise exception using errcode = 'P0001', message = 'nick_refresh_too_soon';
  end if;
  old_nick := p.capsule_nick;
  update public.profiles
  set capsule_nick = new_nick, capsule_nick_changed_at = now()
  where id = target_user_id
  returning * into p;
  insert into public.retired_capsule_nicks (nick) values (old_nick)
  on conflict (nick) do nothing;
  -- After both writes, like assign_capsule_identity: a retired nick (the old one included, if the
  -- random pick gave it again) is not given.
  if exists (select 1 from public.retired_capsule_nicks where nick = new_nick) then
    raise exception using errcode = 'P0001', message = 'nick_taken';
  end if;
  return p;
end;
$$;

-- Accounts from before this step: a nick and one of the 28 ready looks each, at random and never
-- from the gender (K-50). The letters, the exclusions and the looks are pure/capsule.ts's and
-- capsuleCatalog.ts's (scripts/seed/capsule.test.ts checks they are the same); there are few
-- accounts (no pilot yet), so two digits.
do $$
declare
  letters constant text := 'abcdefghkmnprstuvyz';
  excluded_pairs constant text[] := array['am', 'mk', 'sk', 'sg', 'gt'];
  excluded_numbers constant text[] := array['31', '69'];
  looks constant text[] := array[
    'c:mor e:klasik',
    'c:hardal e:klasik f:gozbandi',
    'c:mercan e:klasik h:korsan',
    'c:pembe e:klasik h:korsan f:gozbandi',
    'c:lavanta e:koyu m:vampir',
    'c:turkuaz e:klasik f:gunes',
    'c:gok e:klasik h:parti',
    'c:mor e:klasik h:tac',
    'c:pembe e:koyu h:kulaklik',
    'c:hardal e:klasik m:biyik',
    'c:pembe e:klasik h:kedi',
    'c:mercan e:koyu h:boynuz m:gulumse',
    'c:krem e:koyu h:hale m:gulumse',
    'c:limon e:klasik h:bere',
    'c:turkuaz e:klasik h:kovboy',
    'c:komur e:ninjagoz h:ninjabant',
    'c:lavanta e:klasik h:fiyonk m:gulumse',
    'c:yesil e:klasik f:monokl m:kivrik',
    'c:gok e:klasik f:yuvarlak',
    'c:yesil e:klasik h:papatya m:gulumse',
    'c:nane e:koyu h:anten',
    'c:hardal e:klasik h:sihirbaz',
    'c:pembe e:klasik h:silindir',
    'c:lavanta e:klasik m:allik',
    'c:gok e:koyu n:atki',
    'c:mercan e:klasik h:boynuz m:sakal',
    'c:krem e:koyu h:tavsan',
    'c:mor e:klasik f:maske'
  ];
  account record;
  pair text;
  num text;
  candidate text;
  tries integer;
begin
  for account in
    select id from public.profiles where capsule_nick is null order by created_at, id
  loop
    tries := 0;
    loop
      tries := tries + 1;
      if tries > 10000 then
        raise exception 'no free capsule nick';
      end if;
      pair := substr(letters, 1 + floor(random() * 19)::integer, 1)
        || substr(letters, 1 + floor(random() * 19)::integer, 1);
      num := lpad(floor(random() * 100)::integer::text, 2, '0');
      continue when pair = any (excluded_pairs)
        or exists (select 1 from unnest(excluded_numbers) e where strpos(num, e) > 0);
      candidate := 'kapsul-' || pair || num;
      exit when not exists (select 1 from public.profiles where capsule_nick = candidate)
        and not exists (select 1 from public.retired_capsule_nicks where nick = candidate);
    end loop;
    update public.profiles
    set capsule_nick = candidate,
        capsule_look = looks[1 + floor(random() * array_length(looks, 1))::integer]
    where id = account.id;
  end loop;
end;
$$;

-- The check-in's identity -------------------------------------------------------------------------
-- identity_mode: the venue chat identity, and at a table the woman's (§4.D; a man or an unspecified
-- account is profiled at a table whatever this says). One change per check-in (K-3, K-48).
-- venue_chat_profiled (Faz 2) stays until 4.8 for today's app and follows identity_mode.
alter table public.table_sessions
  add column identity_mode text not null default 'anonymous'
    check (identity_mode in ('anonymous', 'profiled')),
  add column identity_switches smallint not null default 0
    check (identity_switches between 0 and 1);

-- Live check-ins: the mode already chosen in the venue chat, otherwise the account's default
-- (Ayarlar → "Oyunlara katılım") when a visible photo allows it.
update public.table_sessions ts
set identity_mode = case
  when ts.venue_chat_profiled is not null then
    case when ts.venue_chat_profiled then 'profiled' else 'anonymous' end
  when p.default_participation = 'profile' and p.photo_path is not null
    and p.photo_hidden_at is null then 'profiled'
  else 'anonymous'
end
from public.profiles p
where p.id = ts.user_id and ts.status = 'active';

-- The check-in starts with the account's default; a profiled default needs a visible photo (K-4).
create or replace function public.start_table_session(
  target_user_id uuid,
  target_venue_id uuid,
  new_alias text,
  new_headcount smallint,
  consent_version text,
  accuracy_m real default null,
  new_participation text default 'anonymous',
  new_spot_id uuid default null,
  new_team_capable boolean default false,
  new_checkin_key uuid default null
)
returns public.table_sessions
language plpgsql
security definer
set search_path = ''
as $$
declare
  created public.table_sessions;
  old_session_id uuid;
begin
  perform private.check_spot(target_venue_id, new_spot_id);

  update public.profiles
  set location_consent_at = now(), location_consent_version = consent_version
  where id = target_user_id
    and location_consent_version is distinct from consent_version;

  -- The same check-in again (its key, venue, spot, headcount and team choice): the table it
  -- opened, untouched.
  if new_checkin_key is not null then
    select * into created from public.table_sessions
    where user_id = target_user_id
      and status = 'active'
      and checkin_key = new_checkin_key
      and venue_id = target_venue_id
      and spot_id is not distinct from new_spot_id
      and headcount = new_headcount
      and team_capable = new_team_capable
      and expires_at > now()
    for no key update;
    if found then
      return created;
    end if;
  end if;

  for old_session_id in
    select id from public.table_sessions
    where user_id = target_user_id and status = 'active'
    for no key update
  loop
    perform private.release_rooms_of_session(old_session_id);
    update public.table_sessions set status = 'ended', ended_at = now() where id = old_session_id;
  end loop;

  insert into public.table_sessions
    (user_id, venue_id, alias, headcount, gps_accuracy_m, participation, spot_id, team_capable,
     checkin_key, expires_at, identity_mode)
  values
    (target_user_id, target_venue_id, new_alias, new_headcount, accuracy_m, new_participation,
     new_spot_id, new_team_capable, new_checkin_key, now() + interval '4 hours',
     case
       when (select default_participation from public.profiles where id = target_user_id)
           = 'profile'
         and public.has_profile_photo(target_user_id) then 'profiled'
       else 'anonymous'
     end)
  returning * into created;

  return created;
end;
$$;

-- checkin/set-identity: the check-in's one change. Only the check-in is locked (§4.K). The same
-- identity again changes nothing and uses no change.
create function public.set_checkin_identity(target_user_id uuid, new_mode text)
returns public.table_sessions
language plpgsql
security definer
set search_path = ''
as $$
declare
  ts public.table_sessions;
begin
  if new_mode not in ('anonymous', 'profiled') then
    raise exception using errcode = 'P0001', message = 'bad_request';
  end if;
  select * into ts from public.table_sessions
  where user_id = target_user_id and status = 'active' and expires_at > now()
  for no key update;
  if ts.id is null then
    raise exception using errcode = 'P0001', message = 'no_active_table';
  end if;
  if ts.identity_mode = new_mode then
    return ts;
  end if;
  if ts.identity_switches >= 1 then
    raise exception using errcode = 'P0001', message = 'identity_switch_used';
  end if;
  if new_mode = 'profiled' and not public.has_profile_photo(target_user_id) then
    raise exception using errcode = 'P0001', message = 'photo_required';
  end if;
  update public.table_sessions
  set identity_mode = new_mode,
      identity_switches = identity_switches + 1,
      venue_chat_profiled = new_mode = 'profiled'
  where id = ts.id
  returning * into ts;
  return ts;
end;
$$;

revoke all on function public.set_checkin_identity(uuid, text) from public, anon, authenticated;
grant execute on function public.set_checkin_identity(uuid, text) to service_role;

-- The venue chat -----------------------------------------------------------------------------------
-- The identity a message was written with: the nick in sender_alias and the look for an anonymous
-- one, the display name and no look for a profiled one. deleted_at: its sender took it back.
alter table public.venue_chat_messages
  add column sender_look text,
  add column deleted_at timestamptz,
  add constraint venue_chat_messages_profiled_no_look check (not profiled or sender_look is null);

-- A deleted message is gone for everyone: no reply, reaction, report or mute through it.
create or replace function private.visible_venue_chat_message(
  target_user_id uuid,
  target_message_id uuid
)
returns public.venue_chat_messages
language sql
stable
security definer
set search_path = ''
as $$
  select m.* from public.venue_chat_messages m
  where m.id = target_message_id
    and m.deleted_at is null
    and (private.venue_chat_session(target_user_id, m.venue_id)).id is not null
    and not private.is_blocked_between(target_user_id, m.sender_user_id)
    and (m.hidden_at is null or m.sender_user_id = target_user_id);
$$;

-- Sending. The identity is the check-in's (§4.D):
-- - `expected_identity` (the app from 4.4 on): must be the check-in's, or identity_mismatch and nothing is
--   written (a message believed anonymous never goes profiled);
-- - `profiled` (the app before 4.4, §22.G): its first message picks the mode. A first message with
--   the other mode is the check-in's one change, made with the message (after the rate limit, so a
--   refused message changes nothing); afterwards the other mode is venue_chat_mode_locked as before.
drop function public.venue_chat_send(uuid, uuid, text, boolean, integer, integer, integer, uuid);

create function public.venue_chat_send(
  target_user_id uuid,
  target_venue_id uuid,
  new_body text,
  min_interval_ms integer,
  window_seconds integer,
  window_max integer,
  reply_to uuid default null,
  profiled boolean default null,
  expected_identity text default null
)
returns public.venue_chat_messages
language plpgsql
security definer
set search_path = ''
as $$
declare
  ts public.table_sessions;
  rate public.venue_chat_rate;
  msg public.venue_chat_messages;
  p public.profiles;
  chosen text;
begin
  select * into ts from public.table_sessions
  where user_id = target_user_id and venue_id = target_venue_id
    and status = 'active' and expires_at > now()
  for no key update;
  if ts.id is null then
    raise exception using errcode = 'P0001', message = 'no_active_table';
  end if;

  chosen := ts.identity_mode;
  if expected_identity is not null then
    if expected_identity is distinct from ts.identity_mode then
      raise exception using errcode = 'P0001', message = 'identity_mismatch';
    end if;
  elsif profiled is not null
    and (case when profiled then 'profiled' else 'anonymous' end) <> ts.identity_mode then
    if ts.venue_chat_profiled is not null or ts.identity_switches >= 1 then
      raise exception using errcode = 'P0001', message = 'venue_chat_mode_locked';
    end if;
    if profiled and not public.has_profile_photo(target_user_id) then
      raise exception using errcode = 'P0001', message = 'photo_required';
    end if;
    chosen := case when profiled then 'profiled' else 'anonymous' end;
  end if;
  if reply_to is not null and (
    (private.visible_venue_chat_message(target_user_id, reply_to)).venue_id
      is distinct from target_venue_id
  ) then
    raise exception using errcode = 'P0001', message = 'reply_unavailable';
  end if;

  insert into public.venue_chat_rate (user_id, window_started_at, count, last_sent_at)
  values (target_user_id, '-infinity', 0, '-infinity')
  on conflict (user_id) do nothing;
  select * into rate from public.venue_chat_rate where user_id = target_user_id for update;
  if now() - rate.last_sent_at < make_interval(secs => min_interval_ms / 1000.0) then
    raise exception using errcode = 'P0001', message = 'too_soon';
  end if;
  if now() - rate.window_started_at >= make_interval(secs => window_seconds) then
    update public.venue_chat_rate
    set window_started_at = now(), count = 1, last_sent_at = now()
    where user_id = target_user_id;
  elsif rate.count >= window_max then
    raise exception using errcode = 'P0001', message = 'rate_limited';
  else
    update public.venue_chat_rate
    set count = count + 1, last_sent_at = now()
    where user_id = target_user_id;
  end if;

  if chosen <> ts.identity_mode or ts.venue_chat_profiled is null then
    update public.table_sessions
    set identity_mode = chosen,
        identity_switches = identity_switches + (case when chosen <> ts.identity_mode then 1 else 0 end),
        venue_chat_profiled = chosen = 'profiled'
    where id = ts.id;
  end if;

  select * into p from public.profiles where id = target_user_id;
  insert into public.venue_chat_messages
    (venue_id, session_id, sender_user_id, sender_alias, profiled, sender_look, body, reply_to_id,
     replied)
  values
    (target_venue_id, ts.id, target_user_id,
     case when chosen = 'profiled' then coalesce(p.display_name, ts.alias)
          else coalesce(p.capsule_nick, ts.alias) end,
     chosen = 'profiled',
     case when chosen = 'profiled' then null else p.capsule_look end,
     new_body, reply_to, reply_to is not null)
  returning * into msg;
  return msg;
end;
$$;

revoke all on function public.venue_chat_send(uuid, uuid, text, integer, integer, integer, uuid, boolean, text)
  from public, anon, authenticated;
grant execute on function public.venue_chat_send(uuid, uuid, text, integer, integer, integer, uuid, boolean, text)
  to service_role;

-- The senderKey's key: the Vault key with this use's own prefix (no new secret). Raises when it is
-- missing rather than giving keys that group nobody.
create function private.venue_chat_sender_secret()
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  key text;
begin
  select decrypted_secret into key from vault.decrypted_secrets where name = 'phone_hash_key';
  if key is null then
    raise exception 'vault secret phone_hash_key is missing';
  end if;
  return key;
end;
$$;

revoke all on function private.venue_chat_sender_secret() from public, anon, authenticated;

-- A person's mute of one identity of another (§4.D): the anonymous one or the profiled one, never
-- both. The muted person never learns of it (rule 5). label: the nick or the name when muted.
create table public.venue_chat_mutes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  muted_user_id uuid not null references auth.users (id) on delete cascade,
  profiled boolean not null,
  label text not null check (char_length(label) between 1 and 100),
  created_at timestamptz not null default now(),
  unique (user_id, muted_user_id, profiled),
  check (user_id <> muted_user_id)
);

create index venue_chat_mutes_muted_user_id on public.venue_chat_mutes (muted_user_id);

alter table public.venue_chat_mutes enable row level security;
revoke all on table public.venue_chat_mutes from anon, authenticated;

-- The page. sender_key groups a person's messages of one identity on one day at the venue: an HMAC
-- of the account, the identity, the venue and the Istanbul date. The two identities of one person
-- get different keys, and the key carries no account id or public_id (§4.D). sender_look: an
-- anonymous message's look as written. Deleted messages and muted identities are left out.
drop function public.venue_chat_page_for(uuid, uuid, timestamptz, integer);

create function public.venue_chat_page_for(
  target_user_id uuid,
  target_venue_id uuid,
  before timestamptz default null,
  page_size integer default 50
)
returns table (
  id uuid,
  profiled boolean,
  sender_alias text,
  display_name text,
  photo_path text,
  body text,
  created_at timestamptz,
  from_me boolean,
  reply_to jsonb,
  reactions jsonb,
  sender_key text,
  sender_look text
)
language sql
stable
security definer
set search_path = ''
as $$
  with k as materialized (select private.venue_chat_sender_secret() as secret)
  select m.id, m.profiled,
         case when m.profiled then null else m.sender_alias end,
         case when m.profiled then p.display_name else null end,
         case when m.profiled and p.photo_hidden_at is null then p.photo_path else null end,
         m.body, m.created_at, m.sender_user_id = target_user_id,
         private.venue_quote(target_user_id, m),
         private.venue_reaction_list(target_user_id, m.id),
         left(encode(extensions.hmac(
           'venue_chat_sender:' || m.sender_user_id::text || ':' || m.profiled::text || ':'
             || m.venue_id::text || ':' || ((m.created_at at time zone 'Europe/Istanbul')::date)::text,
           k.secret, 'sha256'), 'hex'), 24),
         case when m.profiled then null else m.sender_look end
  from public.venue_chat_messages m
  cross join k
  left join public.profiles p on p.id = m.sender_user_id
  where m.venue_id = target_venue_id
    and (private.venue_chat_session(target_user_id, target_venue_id)).id is not null
    and (before is null or m.created_at < before)
    and m.deleted_at is null
    and (m.hidden_at is null or m.sender_user_id = target_user_id)
    and not private.is_blocked_between(target_user_id, m.sender_user_id)
    and not exists (
      select 1 from public.venue_chat_mutes mu
      where mu.user_id = target_user_id
        and mu.muted_user_id = m.sender_user_id
        and mu.profiled = m.profiled
    )
  order by m.created_at desc
  limit least(greatest(page_size, 1), 100);
$$;

revoke all on function public.venue_chat_page_for(uuid, uuid, timestamptz, integer)
  from public, anon, authenticated;
grant execute on function public.venue_chat_page_for(uuid, uuid, timestamptz, integer)
  to service_role;

-- The client's own read of the page (no photos; `pnpm latency`): the same messages left out.
create or replace function public.venue_chat_page(
  target_venue_id uuid,
  before timestamptz default null,
  page_size integer default 50
)
returns table (
  id uuid,
  profiled boolean,
  sender_alias text,
  display_name text,
  body text,
  created_at timestamptz,
  from_me boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select m.id, m.profiled,
         case when m.profiled then null else m.sender_alias end,
         case when m.profiled then p.display_name else null end,
         m.body, m.created_at, m.sender_user_id = (select auth.uid())
  from public.venue_chat_messages m
  left join public.profiles p on p.id = m.sender_user_id
  where m.venue_id = target_venue_id
    and (private.venue_chat_session((select auth.uid()), target_venue_id)).id is not null
    and (before is null or m.created_at < before)
    and m.deleted_at is null
    and (m.hidden_at is null or m.sender_user_id = (select auth.uid()))
    and not private.is_blocked_between((select auth.uid()), m.sender_user_id)
    and not exists (
      select 1 from public.venue_chat_mutes mu
      where mu.user_id = (select auth.uid())
        and mu.muted_user_id = m.sender_user_id
        and mu.profiled = m.profiled
    )
  order by m.created_at desc
  limit least(greatest(page_size, 1), 100);
$$;

-- venue-chat/delete: the sender's own message, gone for everyone. The report copies
-- (reports.messages_snapshot) keep it. Returns the venue for the broadcast.
create function public.venue_chat_delete(target_user_id uuid, target_message_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  deleted_venue uuid;
begin
  update public.venue_chat_messages
  set deleted_at = now()
  where id = target_message_id and sender_user_id = target_user_id and deleted_at is null
  returning venue_id into deleted_venue;
  if deleted_venue is null then
    raise exception using errcode = 'P0001', message = 'not_found';
  end if;
  return deleted_venue;
end;
$$;

-- venue-chat/mute: the sender and the identity come from a message the caller can see; the caller
-- never sees an account id. Muting twice is one mute.
create function public.venue_chat_mute(target_user_id uuid, target_message_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  m public.venue_chat_messages;
  mute_id uuid;
begin
  m := private.visible_venue_chat_message(target_user_id, target_message_id);
  if m.id is null then
    raise exception using errcode = 'P0001', message = 'not_found';
  end if;
  if m.sender_user_id = target_user_id then
    raise exception using errcode = 'P0001', message = 'bad_request';
  end if;
  insert into public.venue_chat_mutes (user_id, muted_user_id, profiled, label)
  values (
    target_user_id, m.sender_user_id, m.profiled,
    case
      when m.profiled then
        coalesce((select display_name from public.profiles where id = m.sender_user_id),
                 m.sender_alias)
      else m.sender_alias
    end
  )
  on conflict (user_id, muted_user_id, profiled) do update set label = public.venue_chat_mutes.label
  returning id into mute_id;
  return mute_id;
end;
$$;

-- venue-chat/unmute: one of the caller's own; another id does nothing.
create function public.venue_chat_unmute(target_user_id uuid, target_mute_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.venue_chat_mutes where id = target_mute_id and user_id = target_user_id;
$$;

-- venue-chat/mutes: the label and the date, newest first; no account id.
create function public.venue_chat_mutes_of(target_user_id uuid)
returns table (id uuid, label text, profiled boolean, created_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select id, label, profiled, created_at from public.venue_chat_mutes
  where user_id = target_user_id
  order by created_at desc, id;
$$;

do $$
declare
  fn text;
begin
  foreach fn in array array[
    'public.capsule_nicks_taken()',
    'public.assign_capsule_identity(uuid, text, text)',
    'public.refresh_capsule_nick(uuid, text, integer)',
    'public.venue_chat_delete(uuid, uuid)',
    'public.venue_chat_mute(uuid, uuid)',
    'public.venue_chat_unmute(uuid, uuid)',
    'public.venue_chat_mutes_of(uuid)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', fn);
    execute format('grant execute on function %s to service_role', fn);
  end loop;
end;
$$;

-- Tables ------------------------------------------------------------------------------------------
-- The look a person sits at a table with (K-10: fixed for the table) and the identity a room
-- message was written with (§4.D). Written by triggers so that every way in (room create, accept,
-- "Bu masadayım", lobby join) and every message writer gets it; nothing to lock (rule 10).
alter table public.room_members add column look text;

alter table public.messages
  add column profiled boolean not null default false,
  add column sender_look text,
  add constraint messages_profiled_no_look check (not profiled or sender_look is null);

-- Existing messages: their sender's seat.
update public.messages m
set profiled = rm.profiled
from public.room_members rm
where rm.room_id = m.room_id and rm.session_id = m.session_id and rm.profiled;

create function private.room_member_look()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.look := case
    when new.profiled then null
    else (
      select p.capsule_look from public.table_sessions ts
      join public.profiles p on p.id = ts.user_id
      where ts.id = new.session_id
    )
  end;
  return new;
end;
$$;

create trigger room_members_look
  before insert on public.room_members
  for each row execute function private.room_member_look();

create function private.message_identity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  seat public.room_members;
begin
  select * into seat from public.room_members
  where room_id = new.room_id and session_id = new.session_id
  order by left_at is null desc, joined_at desc
  limit 1;
  new.profiled := coalesce(seat.profiled, false);
  new.sender_look := case when coalesce(seat.profiled, false) then null else seat.look end;
  return new;
end;
$$;

create trigger messages_identity
  before insert on public.messages
  for each row execute function private.message_identity();

-- room_phones, plus each phone's look (empty for a profiled one).
drop function public.room_phones(uuid);

create function public.room_phones(target_room_id uuid)
returns table (
  session_id uuid, side text, alias text, profiled boolean, is_leader boolean,
  joined_at timestamptz, look text
)
language sql
stable
security definer
set search_path = ''
as $$
  select rm.session_id, rm.side, rm.alias, rm.profiled,
         rm.session_id = r.owner_session_id or rm.session_id is not distinct from r.guest_session_id,
         rm.joined_at,
         case when rm.profiled then null else rm.look end
  from public.rooms r
  join public.room_members rm on rm.room_id = r.id
  where r.id = target_room_id
    and private.is_room_member(r.id)
    and r.status in ('waiting', 'active')
    and rm.left_at is null
  order by rm.side desc, rm.joined_at, rm.id;
$$;

revoke all on function public.room_phones(uuid) from public, anon;
grant execute on function public.room_phones(uuid) to authenticated;
