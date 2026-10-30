-- Keşfet showed "Yedegör Dürüm" twice (the owner's report, 30 Ekim): the seeded test venue
-- (content/venues-test.json, test/yedegor-durum) and an older copy added by hand on the dev
-- project, outside the seed. The copy is put out of the lists; nothing is deleted (its check-ins
-- and history stay). Where there is no such copy (the pilot project) this changes nothing.
update public.venues
set is_active = false
where name = 'Yedegör Dürüm'
  and is_active
  and not (source = 'test' and source_ref = 'test/yedegor-durum');
