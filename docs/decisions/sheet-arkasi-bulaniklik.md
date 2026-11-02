# Sheet arkası bulanıklık (U8, 2 Kasım 2026)

Rapor `docs/design/aura/aktarim-v65.md` U8: scrim + 8 bulanıklık (`.scrim`: `backdrop-filter: blur(8px)`).

- Sorun: `Sheet` React Native `Modal`'ıdır (ayrı pencere); `RouteSheet` önceki ekranın üstüne açılan şeffaf ekrandır. Canlı cam (`LiquidGlassView`) yalnızca aynı penceredeki `GlassTargetView`'u örnekler, ikisinde de arkadaki ekranı göremez.
- Telegram Android: diyalog ve menü arkasında pencereleri bir kez küçük (sekizde bir) bir resme çizer, bulanıklaştırır ve açık kaldıkça o resmi çizer (`makeGlobalBlurBitmap`); sistemin pencere bulanıklığını (`FLAG_BLUR_BEHIND`) kapalı tutar.
- Alınan: yeni yerel görünüm `BackdropBlurView` (`modules/skall-glass`), sayfa açılırken uygulama penceresini `PixelCopy` ile bir kez küçük kopyalar (harita ve GPU resimleri de girer), `RenderEffect` ile 8 dp sapmayla bulanık çizer. Scrim rengi üstündedir, ikisi sayfayla birlikte belirir (`SheetScrim`). Sayfa açıkken arkadaki ekran değişirse resim değişmez (Telegram'daki gibi).
- Android 12 altında bulanıklık yok, yalnızca scrim rengi (camın kuralı).
- Native değişiklik: `version` 0.9.4, yeni build gerekir.
