# İlerleme

## Devir notu (31 Ekim 2026, Grup 4)

- Grup 4 (Masa kur, aura v47): **kod tamamlandı** (M1 #314, M2 #315, M3 bu PR); **cihaz kabulü bekliyor** (K1–K6, Android 12+ ve altı, açık/koyu, 390 ve 320 dp/1,3x); **ürün olarak tamamlanma** son toplu kabul testinden sonra. Kararlar: docs/decisions/grup4-masa-kur.md.
- Native değişiklik yok, yayın OTA. Sıradaki: Grup 5 (Alt menü, aura v48) planı.

## Devir notu (31 Ekim 2026, Grup 3)

- Grup 3 kodu main'de: P1 #309, P2+P3 #311, P4 #312, P5 sunucu #310, P5 istemci #313 (outbox, aynı `clientId` ile Tekrar dene, `mergeOutbox` sıralaması). Kararlar: docs/decisions/grup3-mekan-balonlari.md. Sıradaki: Grup 4 (Masa Kur), sonra 5, 6, 7; cihaz kabulü en sonda.
- BEKLİYOR, dev canlı testi: `dev-live.yml` yalnızca main'den elle koşar; koşmadı; `dev-live` ortamı (yalnızca main) ve üç sırrı (`DEV_PUBLISHABLE_KEY`, `DEV_TEST_PHONE`, `DEV_TEST_OTP`) kabul aşamasında kurulacak. Yerel karşılığı `supabase/tests/venueChat.test.ts` ci'da yeşil.
- BEKLİYOR, iki cihaz testi (development build + Metro): bekleyen mesaj varken gelen mesajın sırası, Gönderilemedi, Tekrar dene, Sil, en alta inme oku.
- BEKLİYOR, P1–P6 gerçek cihaz kabulü (iOS/Android, açık/koyu, 390 ve 320 dp/1,3x): proje sahibinde, yapılmadı.
- deploy-dev: OTA, `app.config.ts`'teki yorum değişikliği yüzünden bekletiliyordu; P1–P4 için elle preview OTA proje sahibince başlatıldı, yenisi başlatılmadı.

## Devir notu (31 Ekim 2026)

- Temizlik bitti (#291–#295, #297); saha testi yapıldı (proje sahibi, 31 Ekim), `docs/FIELD_TEST.md`'nin Faz 4 sürümü yazılmayacak.
- Tuval sürüm 35, Grup 1 (Mekan ve lobi) aktarıldı; kararlar `docs/decisions/aura-31.md` sonunda.
- Aura 31 eşitlemesi bitti: (a) #301, (b) #303, (c) #304, (d) #305, (e) Aktiviteler ve ortak boş hâl. Rapor `docs/design/aura/aktarim-31.md`, kararlar `docs/decisions/aura-31.md` (her grubun kararı orada). Açık sorularda bugünkü davranış korundu; satırdan morph ve swap ayrı iş (yapılmadı); Vampir Köylü ve oyun ekranlarına dokunulmadı. Sıradaki iş proje sahibinden.
- Yayın: #300'ün migration'ı ve #301'in `checkin` fonksiyonu (konum rızası `draft-1`, eski `draft-0` de kabul) dev'e otomatik gider; üretimde önce sunucu, sonra OTA. Konum rızasının düğme metniyle verilmesi pilottan önce hukuki kontrole girer. Bekleyen kararlar (proje sahibinde): mekan sohbetinde eski mesajları yükleme (son 50'yi gösteriyor, mesajlar 24 saat duruyor) ve oyun geçmişinde 100 kaydın ötesi (masa başına sayfalama); öneri pilot oyunlarından sonra, 4.8'de.
- Pilottan önce: onay ekranı yayımlanan yasal sayfaya bağlanır ve onay sürümü o zaman artar (bugün `tr.ts` yer tutucu gösteriyor); dev projesinde `auth.audit_log_entries`'te telefon numarası var mı bakılır.
- 0.9.3 build'i proje sahibinde bekliyor; 280 eski dal proje sahibinin bilgisayarından silinir (bulut oturumu dal silemiyor).

Eski M0 ile M7 ilerlemesi: [arsiv/PROGRESS-M0-M7.md](arsiv/PROGRESS-M0-M7.md).
