-- Canlı öncesi performans denetimi (9 Kasım 2026, docs/PROGRESS.md → Canlı öncesi denetim, D1–D4).
--
-- 1. Yabancı anahtarların indeksi: bir satır silinince (arkadaşlıktan çıkarma, engel, hesap silme,
--    saatlik ve gecelik temizlik) Postgres ona bağlı her tabloda satırları arar. Başında o kolon olan
--    tam bir indeks yoksa her silinen satır için bütün tablo taranır (ör. `dm_messages.reply_to_id`:
--    konuşmanın her mesajı için bütün DM tablosu). Bu blok public şemasında, tek kolonlu ve başında
--    o kolon olan kısmi olmayan bir indeksi bulunmayan her yabancı anahtara indeks kurar. Sonradan
--    gelen tablolar kendi indeksini kendi migration'ında getirir.
do $$
declare
  fk record;
  name text;
begin
  for fk in
    select c.conrelid::regclass as tbl, t.relname as table_name, a.attname as column_name
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
    where c.contype = 'f' and n.nspname = 'public' and array_length(c.conkey, 1) = 1
      and not exists (
        select 1 from pg_index i
        where i.indrelid = c.conrelid and i.indkey[0] = c.conkey[1] and i.indpred is null
      )
    order by t.relname, a.attname
  loop
    name := left(fk.table_name || '_' || fk.column_name, 55) || '_fk_idx';
    execute format('create index if not exists %I on %s (%I)', name, fk.tbl, fk.column_name);
  end loop;
end;
$$;

-- 2. Lobi: `rooms` silinmez; lobi okuması yalnızca kapanmamış masaları tarar.
create index rooms_lobby_open_idx on public.rooms (venue_id, waiting_since)
  where status <> 'closed';

-- 3. pg_cron'un koşu kayıtları (`cron.job_run_details`) yalnızca Sprengja işi için siliniyordu;
--    dakikalık işler günde on binlerce satır yazar. Bir günden eski kayıt her gece silinir.
select cron.schedule(
  'cron-run-details-cleanup',
  '17 3 * * *',
  $$delete from cron.job_run_details where end_time < now() - interval '1 day'$$
);
