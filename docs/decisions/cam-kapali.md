# Canlı cam kapalı (6 Kasım 2026)

Proje sahibinin kararı: akıcılık camdan önce gelir ("uygulama akıcı olsun").

- Sekme çubuğunun camı, kaydırılan içerik çubuğun üstünde solduğu ve altını zemin şeridi kapattığı için yalnızca sabit zemini bulanıklaştırıyordu; görüntü değişmediği hâlde her karede yeniden hesaplanıyordu (`docs/denetim/performans-2026-11.md` → B1, B12).
- `theme/glass.ts` → `TAB_BAR_GLASS = false`: sekme çubuğu, mesaj çubuğu ve saydam düğmeler (`Frost`) canlı bulanıklık yerine Android 12 öncesi için zaten çizilmiş camsız görünüşü alır. Sekme çubuğu zeminin üstünde kendi dolgusuyla (`AURA.tabBar.fill`) çizilir; camla gördüğü renk korunur. `GlassTarget` düz görünüm olur.
- Değişen görünüş: mesaj çubuğunun ve saydam düğmelerin arkasından geçen içerik artık bulanık görünmez, düğmenin kendi dolgusu görünür.
- Yerel modül (`modules/skall-glass`) yerinde kalır; anahtar `true` yapılınca cam geri gelir.
- Sekme açılışındaki bulanıklık da kapalı (proje sahibi, 6 Kasım): `TabScene` artık `Dissolve` ile sarmaz; ekran yalnızca solarak ve 12 dp yükselerek gelir (`MOTION.dissolve.inMs`, `rise`), native sürücüde. Sekme geçişi bu sahnede render da üretmez. `DissolveView` yerel modülde kullanılmadan durur.
