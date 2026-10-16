-- Oda yükü (docs/SPEC_V3.md §22.I, adım 22.6; nasıl kullanılacağı docs/ROOM_LOAD.md).
-- Dev projesinde Supabase paneli → SQL Editor'da çalıştırılır; yalnızca okur. Sayılar
-- pg_stat_statements'ın son sıfırlanmasından beridir: saha testinden hemen önce panelde
-- Database → Query Performance → "Reset" ile (ya da aşağıdaki ilk satırla) sıfırlanır.
--
--   select extensions.pg_stat_statements_reset();
--
-- private.is_room_member ve private.realtime_topic_allowed kendi satırlarıyla görünmez: politikaların
-- içinde, onları çağıran sorgunun süresine katılırlar. Bu yüzden pay, o fonksiyonları çalıştıran
-- sorgu gruplarından okunur:
--   * Postgres Changes (wal): oda kanalındaki satır değişikliklerinin her aboneye RLS ile süzülmesi
--     (rooms, messages, game_events, game_proposals politikaları → is_room_member).
--   * Kanal yetkisi ve yayın (realtime.messages): özel kanallara abonelik ve sunucu yayınları
--     (realtime.messages politikaları → realtime_topic_allowed).
--   * Oda ve öneri okumaları: uygulamanın 4 saniyelik yoklaması (ROOM_CHECK_SECONDS) ve kanal
--     olaylarından sonraki yeniden okumalar (PostgREST, RLS → is_room_member).
with s as (
  select query, calls, total_exec_time
  from extensions.pg_stat_statements
  where dbid = (select oid from pg_database where datname = current_database())
),
grouped as (
  select
    case
      when query ilike '%wal->>%' or query ilike '%realtime.list_changes%'
        then '1 Postgres Changes (wal, RLS)'
      when query ilike '%"realtime"."messages"%' or query ilike '%realtime.messages%'
        then '2 Kanal yetkisi ve yayın (realtime.messages)'
      when query ilike '%from "public"."rooms"%'
        then '3 Oda okuması (rooms; yoklama dahil)'
      when query ilike '%from "public"."game_proposals"%'
        then '4 Öneri okuması (game_proposals; yoklama dahil)'
      else '5 Diğer'
    end as grup,
    calls,
    total_exec_time
  from s
)
select
  grup,
  sum(calls) as cagri,
  round(sum(total_exec_time)::numeric, 0) as toplam_ms,
  round((100 * sum(total_exec_time) / nullif((select sum(total_exec_time) from s), 0))::numeric, 1)
    as yuzde,
  round((sum(total_exec_time) / nullif(sum(calls), 0))::numeric, 2) as ortalama_ms
from grouped
group by grup
order by grup;
