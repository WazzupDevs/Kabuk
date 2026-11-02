# Masanın kimliği riso masa kartı (2 Kasım 2026)

Proje sahibinin kararı (Aura v65 açık karar 12.6'nın cevabı): "kartları eşlemek yok, yeni bir kimlik yaratıyoruz." Ürün belgesinde K-82.

- Eski 100 masa simgesi (20 tema) kalktı; 55 riso masa kartı tek liste (`content/table-icons.json`, tema "Masa", seçicide tema çipi yok). Kimlik dosya adıdır (`16-lale`), ad `masa-adlari.md`'deki addır; masa adı kartın adı (K-76).
- Görseller: kare `docs/design/aura/masa-kartlari/kare/` (yatay kartın ortası, kaynaktan 256 px) → `pnpm seed` → `assets/table-icons/`; yatay ve uzun `assets/table-cards/` (docs/decisions/aura-v65-riso.md). Üretilen modül `tableIconImages.ts` üçünü de verir (`TABLE_ICON_IMAGES`, `TABLE_CARD_WIDE`, `TABLE_CARD_TALL`).
- Sunucu değişmedi: `table_icons` tohumla yenilenir, eski 100 satır `is_active = false` kalır; onları taşıyan açık masalar kapanana kadar eski simgeyle durur (uygulamada görselsiz yer tutucu).
- Yayın: tohum (`pnpm seed` çıktısı, dev ve üretimde içerik tohumu) ve OTA birlikte.
