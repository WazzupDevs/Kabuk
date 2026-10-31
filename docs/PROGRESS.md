# İlerleme

## Devir notu (31 Ekim 2026)

- Temizlik bitti (#291–#295, #297); saha testi yapıldı (proje sahibi, 31 Ekim), `docs/FIELD_TEST.md`'nin Faz 4 sürümü yazılmayacak.
- Paket 1 (#300) ve aura 31 (a) Keşfet, Keşfet boş, Mekan sayfası, Check-in (#301) birleşti. Aura 31 eşitlemesi: rapor `docs/design/aura/aktarim-31.md`, kararlar `docs/decisions/aura-31.md`, `project/` kopyası 31'de. Sıradaki paket (b) Mekan ve lobi, Masa kur, Masa (oyun kartları dahil); sonra (c) Mesajlar, istekler boş, DM; (d) Profil, Profili düzenle, Profil fotoğrafı, Kapsülün; (e) Aktiviteler ve ortak boş hâl. Her biri ayrı PR; "kalktı" maddeleri önce SPEC_V4 ve değişmez kurallarla karşılaştırılır (Masa kur'daki niyet ve oyun çipleri, Profil'deki rozetler); raporun açık sorularında bugünkü davranış korunur. Satırdan morph ve swap `MOTION`'da var ama uygulamada hiçbir ekranda kullanılmıyor; ayrı iş. Vampir Köylü ve oyun ekranları bu oturumlarda yapılmaz (proje sahibinin kararı, 31 Ekim).
- Yayın: #300'ün migration'ı ve #301'in `checkin` fonksiyonu (konum rızası `draft-1`, eski `draft-0` de kabul) dev'e otomatik gider; üretimde önce sunucu, sonra OTA. Konum rızasının düğme metniyle verilmesi pilottan önce hukuki kontrole girer. Bekleyen kararlar (proje sahibinde): mekan sohbetinde eski mesajları yükleme (son 50'yi gösteriyor, mesajlar 24 saat duruyor) ve oyun geçmişinde 100 kaydın ötesi (masa başına sayfalama); öneri pilot oyunlarından sonra, 4.8'de.
- Pilottan önce: onay ekranı yayımlanan yasal sayfaya bağlanır ve onay sürümü o zaman artar (bugün `tr.ts` yer tutucu gösteriyor); dev projesinde `auth.audit_log_entries`'te telefon numarası var mı bakılır.
- 0.9.3 build'i proje sahibinde bekliyor; 280 eski dal proje sahibinin bilgisayarından silinir (bulut oturumu dal silemiyor).

Eski M0 ile M7 ilerlemesi: [arsiv/PROGRESS-M0-M7.md](arsiv/PROGRESS-M0-M7.md).
