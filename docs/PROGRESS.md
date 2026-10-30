# İlerleme

## Devir notu (31 Ekim 2026)

- Temizlik bitti (#291–#295, #297); saha testi yapıldı (proje sahibi, 31 Ekim), `docs/FIELD_TEST.md`'nin Faz 4 sürümü yazılmayacak.
- Sıradaki iş: Vampir Köylü aura tuvaline göre gözden geçirilir (proje sahibinin kararı, 31 Ekim). Tuvalde Vampir Köylü panosu yok: önce tuvale çizilir (CLAUDE.md → Kod kuralları), sonra `apps/mobile/src/features/games/vampir/` ekranlarındaki hatalar, eksikler ve fazlalıklar SPEC_V4 §4.F → 4.6.6'ya göre düzeltilir. Sonra pilotun öteki iki oyunu (Kapsül Anlat, Sahtekar), ardından 4.8 ve pilot ön koşulları (§4.N).
- Pilottan önce: onay ekranı yayımlanan yasal sayfaya bağlanır ve onay sürümü o zaman artar (bugün `tr.ts` yer tutucu gösteriyor); dev projesinde `auth.audit_log_entries`'te telefon numarası var mı bakılır.
- Bulut oturumu dal ve etiket silemiyor: 280 eski dal proje sahibinin bilgisayarından silinir.
- 0.9.3 build'i proje sahibinde bekliyor; yeni native değişiklik yok.

Eski M0 ile M7 ilerlemesi: [arsiv/PROGRESS-M0-M7.md](arsiv/PROGRESS-M0-M7.md).
