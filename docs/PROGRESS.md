# İlerleme

## Devir notu (31 Ekim 2026)

- Temizlik bitti (#291–#295, #297); saha testi yapıldı (proje sahibi, 31 Ekim), `docs/FIELD_TEST.md`'nin Faz 4 sürümü yazılmayacak.
- Masa ekranı ilk okuma hatası, hesap değişince masa sonu belleği ve `leave_room`'da süresi dolmuş check-in'e devir düzeltildi (bu PR).
- Sıradaki iş: aura tuvali sürüm 31 eşitlemesi, `docs/design/aura/aktarim-31.md` (16 pano; önce `project/` kopyası canlı tuvalden yenilenir, ekran grubu başına PR; spec'ten sapmalar aynı PR'da belgeye). Vampir Köylü ve pilot oyunlarının arayüz revizyonu bu oturumlarda yapılmaz: ayrı tasarım oturumu yapar (proje sahibinin kararı, 31 Ekim). Bekleyen kararlar (proje sahibinde): mekan sohbetinde eski mesajları yükleme (son 50'yi gösteriyor, mesajlar 24 saat duruyor) ve oyun geçmişinde 100 kaydın ötesi (masa başına sayfalama); öneri pilot oyunlarından sonra, 4.8'de.
- Pilottan önce: onay ekranı yayımlanan yasal sayfaya bağlanır ve onay sürümü o zaman artar (bugün `tr.ts` yer tutucu gösteriyor); dev projesinde `auth.audit_log_entries`'te telefon numarası var mı bakılır.
- 0.9.3 build'i proje sahibinde bekliyor; 280 eski dal proje sahibinin bilgisayarından silinir (bulut oturumu dal silemiyor).

Eski M0 ile M7 ilerlemesi: [arsiv/PROGRESS-M0-M7.md](arsiv/PROGRESS-M0-M7.md).
