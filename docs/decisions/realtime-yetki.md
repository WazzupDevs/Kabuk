# Realtime yayın yetkisi katılırken denetlenir (9 Kasım 2026)

Proje sahibinin kararı: kanalı kodla kapatan bir mekanizma şimdilik eklenmez; CLAUDE.md kural 9 gerçek davranışı söyleyecek biçimde düzeltildi.

- Deney (yerel Supabase yığını, üç test hesabı, uçtan uca denetim M2): bir DM konuşmasının üyesi `dm:{thread_id}` kanalına abone oldu; arkadaşlık ve konuşma silindi; sunucunun 1,5 sn, 20 sn ve 66 sn sonra gönderdiği yayınların hepsi açık aboneliğe ulaştı. Üye olmayan hesabın katılması reddedildi; üyenin sunucuya ayrılmış kanala gönderdiği yayın karşı tarafa ulaşmadı.
- Sonuç: `realtime.messages` politikaları (`private.realtime_topic_allowed`) kanala katılırken uygulanır. Yetkisi sonradan kalkan açık abonelik, bağlantısı sürdükçe veri içermeyen yayınları alabilir. Postgres Changes ayrıdır: her satır okuyanın RLS'iyle süzülür ve hemen kesilir.
- Risk: içerik sızmaz (yayınlar veri taşımaz, okuma RLS'lidir). Sızan, yayının zamanıdır: masadan çıkarılan biri masada mesaj ya da tepki olduğunu, check-in'i biten biri mekan sohbetinin hareketini sezebilir. Bu sıfır risk değildir; kabul edilmiş, kayıtlı bir sızıntıdır.
- Kapsam: yerel Realtime sürümünde görüldü; barındırılan projede ayrıca denenmedi.
- Sonraya bırakılan seçenek: masadan çıkışta kanal kimliğini yenilemek (Signum'un `game_team:` yöntemi). Bedeli: her çıkışta masadaki herkes yeniden abone olur ve kanala katılma yükü artar (denetim M2-02).
