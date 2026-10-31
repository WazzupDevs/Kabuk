# İlerleme

## Devir notu (31 Ekim 2026)

- Temizlik bitti (#291–#295, #297); saha testi yapıldı (proje sahibi, 31 Ekim), `docs/FIELD_TEST.md`'nin Faz 4 sürümü yazılmayacak.
- Aura 31 eşitlemesi: (a) #301, (b) Mekan ve lobi, Masa kur, Masa #303, (c) Mesajlar, istekler boş, DM birleşti. Rapor `docs/design/aura/aktarim-31.md`, kararlar `docs/decisions/aura-31.md` (her grubun kararı orada). Sıradaki paket (d) Profil, Profili düzenle, Profil fotoğrafı, Kapsülün (Profil'deki "Rozetler kalktı" önce SPEC_V4 ve kural 4 ile karşılaştırılır: profil rozet taşır); sonra (e) Aktiviteler ve ortak boş hâl (mor kapsül + kesikli pembe çizgi; lobide, İstekler'de ve Aktiviteler'de). Kitte hazır: `Seg large` (kayan disk), `Switch`, `Btn mid/bar`, `Li padY`, `Av seat` (58). Açık sorularda bugünkü davranış korunur; satırdan morph ve swap ayrı iş; Vampir Köylü ve oyun ekranlarına dokunulmaz (proje sahibinin kararı, 31 Ekim).
- Yayın: #300'ün migration'ı ve #301'in `checkin` fonksiyonu (konum rızası `draft-1`, eski `draft-0` de kabul) dev'e otomatik gider; üretimde önce sunucu, sonra OTA. Konum rızasının düğme metniyle verilmesi pilottan önce hukuki kontrole girer. Bekleyen kararlar (proje sahibinde): mekan sohbetinde eski mesajları yükleme (son 50'yi gösteriyor, mesajlar 24 saat duruyor) ve oyun geçmişinde 100 kaydın ötesi (masa başına sayfalama); öneri pilot oyunlarından sonra, 4.8'de.
- Pilottan önce: onay ekranı yayımlanan yasal sayfaya bağlanır ve onay sürümü o zaman artar (bugün `tr.ts` yer tutucu gösteriyor); dev projesinde `auth.audit_log_entries`'te telefon numarası var mı bakılır.
- 0.9.3 build'i proje sahibinde bekliyor; 280 eski dal proje sahibinin bilgisayarından silinir (bulut oturumu dal silemiyor).

Eski M0 ile M7 ilerlemesi: [arsiv/PROGRESS-M0-M7.md](arsiv/PROGRESS-M0-M7.md).
