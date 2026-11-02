# Aura v65: tokenlar, ortak bileşenler, ikon ailesi

Proje sahibinin onayı (1 Kasım 2026; birleşik aktarım raporu, Aura v65, sürüm 1793569092-718f).
Uygulanan: U1–U6, U8–U10 (Temel satır). Ekranlar, alt menü (U7), riso görseller, kayıt ve açılış
sonraki paketlerdir.

- **Renk.** Açık tema `skall.css` `:root`, koyu tema `.dark` üstüne `koyu.css` `.dark.pA` (Grafit,
  düz siyah). Mor aile arayüzden çıktı; DM mavisi (`read`) kaldı. Denetim:
  `src/lib/violetGuard.test.ts` (OKLCH ton 278–325). Logo, kapsül ve oyun sanatı kendi renginde.
- **Koyu `calm` ve `featureMuted`:** v65 tuvali vermiyordu, türetildi (`calm` = `rgba(61,220,132,.14)`
  siyah zemine serilmiş hâli, `#091F12`; `featureMuted` = açık temanın `muted`'ı, `#4A6550`). Proje
  sahibi ikisini onayladı, tuval v67 `koyu.css` aynı değerleri yazar (2 Kasım). Öne çıkan kart koyuda
  açık temanın anlamsal renklerini kullanır (`theme/feature.ts`).
- **Koyu `border`:** v67'de `#626D68` (`surface2` üstünde 3,04:1); v65'teki `#5E6964` (2,9:1) ve
  kontrast testindeki yalnız-açık istisnası kalktı (2 Kasım).
- **Aura** yalnız açık temada (`scripts/aura/ground.ts` ile çizilen tek resim); koyuda düz zemin.
- **Ölçüler:** düğme 56 / 40 (orta ve uzun düğmeler de bu ikisine çekildi), alan 56, çok satırlı
  104 / 22, seg 44 / 36, anahtar 52 × 32, sohbet alanı ve gönder 56, alt menü 64 / sekme 48 /
  ikon 24 / kenar 20 / iç 8.
- **Sheet (U8):** kenarlardan 8, 28 köşe, tutamak 40 × 4, içerik güvenli alan + 4 (34'te 38),
  perde `scrim-bg`. Perdenin 8 bulanıklığı bu pakette yok: Modal ayrı pencere olduğundan arka
  ekran yerel camla örneklenemiyor; ayrı iş.
- **Pasif düğme (U10):** `disabled` / `on-disabled`, opaklık düşmez; koyu kart ve sheet içinde
  `#2A332F`.
- **İkonlar (U6):** 57 çizim (30 Revize 1, 20 yeni, 10 revize; settings, refresh, checkCircle
  revize sürümüyle) `docs/design/aura/ikonlar/*.svg` → `scripts/sistem/capIcons.ts` →
  `capIcons.generated.ts`. Ionicons, çizgi ve çubuk aileleri ve çubuk ikon yayları kalktı.
  Uyarı ünlemi tuvaldeki gibi info'nun 180° çevrilmişi (ayrı çizim açık karar, rapor 12.5).
