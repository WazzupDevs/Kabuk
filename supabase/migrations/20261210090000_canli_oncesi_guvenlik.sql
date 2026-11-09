-- Canlı öncesi denetim (9 Kasım 2026): Realtime yetkisi kural 9'a çekilir.
-- 1. Oda kanalları (room:, messages:, game:, presence:): masanın kişileri abone olur, yalnızca sunucu
--    yayın yapar. Önceden masadaki her kişi bu konulara kendi yayınını (ve presence'ını) gönderebiliyordu;
--    uygulama hiçbirini kullanmıyor ve istemcinin yayın yaptığı tek kanal dm_typing:'dir.
-- 2. Lobi kanalı (venue:): süresi geçmiş ama henüz kapatılmamış check-in abone olamaz (venue_chat: gibi).
-- Geri kalanı 20261208090000_semte_git.sql'deki gibidir.
create or replace function private.realtime_topic_allowed(channel_topic text, sending boolean)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  kind text := split_part(channel_topic, ':', 1);
  target text := substr(channel_topic, length(kind) + 2);
  target_id uuid;
begin
  if target !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return false;
  end if;
  target_id := target::uuid;

  if kind = 'venue' then
    return not sending and exists (
      select 1 from public.table_sessions
      where user_id = (select auth.uid()) and venue_id = target_id
        and status = 'active' and expires_at > now()
    );
  elsif kind = 'venue_chat' then
    -- Only the own venue's topic (a campus of a university included): the server sends every venue
    -- chat broadcast to each campus's topic, and nobody listens on another campus's.
    return not sending and exists (
      select 1 from public.table_sessions
      where user_id = (select auth.uid()) and venue_id = target_id
        and status = 'active' and expires_at > now()
    );
  elsif kind = 'district_chat' then
    -- Only the room of the own open session (the extra time included); only the server sends.
    return not sending and exists (
      select 1 from public.district_sessions
      where user_id = (select auth.uid()) and room_id = target_id
        and status = 'open' and grace_ends_at > now()
    );
  elsif kind = 'session' then
    return not sending and exists (
      select 1 from public.table_sessions
      where id = target_id and user_id = (select auth.uid())
    );
  elsif kind in ('room', 'messages', 'game', 'presence') then
    return not sending and private.is_room_member(target_id);
  elsif kind = 'game_team' then
    -- Signum's team channel: only the server sends (data-free), only the team's players listen.
    return not sending and private.signum_team_member(target_id);
  elsif kind = 'inbox' then
    return not sending and target_id = (select auth.uid());
  elsif kind = 'dm' then
    return not sending and exists (
      select 1 from public.dm_threads
      where id = target_id and (select auth.uid()) in (user_a, user_b)
    );
  elsif kind = 'dm_typing' then
    return exists (
      select 1 from public.dm_threads t
      where t.id = target_id and (select auth.uid()) in (t.user_a, t.user_b)
        and not private.is_blocked_between(t.user_a, t.user_b)
    );
  end if;
  return false;
end;
$$;

-- 3. Bildirim sınırı: bir hesap saatte en çok 30, günde en çok 100 bildirim satırı yazar (profil
--    bildirimi fotoğraf ve kapak kopyası taşır; sınırsız döngü tabloyu ve depolamayı şişirirdi).
--    Fazlası sessizce yazılmaz: çağrı her zamanki yanıtı alır, aynı işlemdeki engel, arkadaşlıktan
--    çıkarma, gizleme ve Kibrit işareti yine yapılır. Sayım kilitsiz okunur (kural 10'a kilit girmez).
create index reports_reporter_created_idx on public.reports (reporter_id, created_at);

create function private.report_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  last_hour integer;
  last_day integer;
begin
  select count(*) filter (where created_at > now() - interval '1 hour'), count(*)
    into last_hour, last_day
  from public.reports
  where reporter_id = new.reporter_id and created_at > now() - interval '1 day';
  if last_hour >= 30 or last_day >= 100 then
    return null;
  end if;
  return new;
end;
$$;

revoke all on function private.report_rate_limit() from public, anon, authenticated;

create trigger reports_rate_limit
  before insert on public.reports
  for each row
  when (new.reporter_id is not null)
  execute function private.report_rate_limit();
