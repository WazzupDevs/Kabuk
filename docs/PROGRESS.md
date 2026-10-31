# İlerleme

## Devir notu (31 Ekim 2026)

- Temizlik bitti (#291–#295, #297); saha testi yapıldı (proje sahibi, 31 Ekim), `docs/FIELD_TEST.md`'nin Faz 4 sürümü yazılmayacak.
- Paket 1 birleşti (#300). Aura 31 eşitlemesi (`docs/design/aura/aktarim-31.md`, kararlar `docs/decisions/aura-31.md`): `project/` kopyası 31'e yenilendi; (a) Keşfet, Keşfet boş, Mekan sayfası, Check-in bu PR'da. Sıradaki: (b) Mekan ve lobi, Masa kur, Masa (oyun kartları dahil); (c) Mesajlar, istekler boş, DM; (d) Profil, Profili düzenle, Profil fotoğrafı, Kapsülün; (e) Aktiviteler ve ortak boş hâl. Satırdan morph ve swap hareketleri `MOTION`'da var ama uygulamada hiçbir ekranda kullanılmıyor; ayrı iş. Vampir Köylü ve oyun ekranları bu oturumlarda yapılmaz (proje sahibinin kararı, 31 Ekim). Bekleyen kararlar (proje sahibinde): mekan sohbetinde eski mesajları yükleme (son 50'yi gösteriyor, mesajlar 24 saat duruyor) ve oyun geçmişinde 100 kaydın ötesi (masa başına sayfalama); öneri pilot oyunlarından sonra, 4.8'de.
- Pilottan önce: onay ekranı yayımlanan yasal sayfaya bağlanır ve onay sürümü o zaman artar (bugün `tr.ts` yer tutucu gösteriyor); dev projesinde `auth.audit_log_entries`'te telefon numarası var mı bakılır.
- 0.9.3 build'i proje sahibinde bekliyor; 280 eski dal proje sahibinin bilgisayarından silinir (bulut oturumu dal silemiyor).

Eski M0 ile M7 ilerlemesi: [arsiv/PROGRESS-M0-M7.md](arsiv/PROGRESS-M0-M7.md).
