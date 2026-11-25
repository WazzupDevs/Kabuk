# Sohbetin anında açılması: hazır sohbet yüzeyi (25 Kasım)

Proje sahibi Mesajlar'dan bir sohbete basınca açılışın çok uzun sürdüğünü ve kayma hareketinin de yavaş olduğunu söyledi; WhatsApp'taki gibi her şeyin önceden yüklü, anında açılmasını istedi.

## Ölçüm (emülatör, geliştirme sürümü)

- Eski yol (native-stack ile itilen rota): kayma, yeni ekranın ilk çizimini bekliyor; boş bir sohbetin ilk çizimi ~0,45 sn, 7 mesajlı örnek sohbetin ~0,63 sn. Kayma sürerken ~40 karenin ~30'u 50 ms'den uzun (150–330 ms'lik kareler). Ayarlar aynı kaymayla akıcı. Duvar kâğıdı ve şeritleri sebep değil.
- Hazır yüzeyden açılış: kayma basışın karesinde başlıyor, kareler 30–55 ms (Ayarlar düzeyi).

## Karar (Telegram'ın yöntemi; kod alınmadı)

- `src/features/friends/DmSurface.tsx`: sekmelerin üstünde (sekme çubuğu dahil) bir yüzey. Gelen kutusunun ilk iki sohbeti açılıştan 1,5 sn sonra arkada kurulur; en çok üç sohbet kurulu durur (son açılanlar). Her kurulu ekran yalnız kendi sohbetidir; taslak, yanıt ve düzenleme sohbetler arasında taşınmaz. Açık/kapalı bilgisi depoda (`dmSurfaceStore.ts`), hiçbir ekranın state'inde değil.
- Kayma `src/motion/SlideOver.tsx`'te, UI iş parçacığında: 240 ms giriş, 200 ms çıkış (`theme/dm.ts` → `DM.slide`). Kurulu olmayan sohbet kayarken kurulur.
- Geri: Android geri tuşu ve hareketi yüzeyi kapatır; üç düğmeli gezinmede soldan kaydırma da kapatır.
- Gizli bekleyen sohbet okunmuş sayılmaz, klavyeyi izlemez; her açılışta okunmamış sayısı ve çizgisi yeniden okunur, kayma bitince okunur.
- Ön yükleme: gelen kutusunun ilk beş sohbetinin en yeni sayfası, gelen kutusu daha yenisini söylüyorsa açılmadan okunur (`queries.ts` → `preloadDm`).
- Yalnız Mesajlar'ın satırları ve yeni mesaj listesi yüzeyi kullanır; bildirimden, profilden ve bağlantıdan açılış eskisi gibi rotadır.

## Açık kalanlar

- Gerçek, mesajlı bir sohbette ve telefonda ölçülmedi (emülatördeki hesabın sohbeti yok).
- Kurulu bir sohbet yeniden açıldığında liste kaldığı yerde durur; çok okunmamış birikmişse ilk okunmamışa kaydırmaz.
- Listenin satırları yeniden kullanması (FlashList) ölçüme göre sonraki adım.
