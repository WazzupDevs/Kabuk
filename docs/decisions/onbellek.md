# Ekranlar hazır gelir (21 Kasım 2026)

Proje sahibinin sorusu: "ekrana geçerken ekranlar neden hazır hâlde gelmiyor, her seferinde yükleme mantığıyla çalışıyor". Proje sahibi üç düzeltmeyi onayladı.

## Sebepler

1. Sekmeye her dönüşte ekranın parçaları sıra sıra yeniden "geliyordu" (sekme varış hareketi); veri hazırken de yükleniyor gibi görünüyordu.
2. Okunan veri yalnız bellekteydi ve kullanılmayan ekranın verisi 5 dakikada siliniyordu; uygulama kapanınca hiçbiri kalmıyordu.
3. Açılan ekran verisini geçişten sonra istiyordu.

Telegram Android sekme değiştirince içeriği olduğu gibi gösterir, ekranı kendi deposundaki veriyle hemen açar ve yenisini arkada getirir, bir satıra dokunulunca ekranın verisini hemen istemeye başlar.

## Karar

1. Sekmeye dönüş anlıktır: hareket, kayma ve parçaların yeniden gelişi yoktur (`components/TabBar.tsx`); varış yalnız sekmenin ilk açılışındadır.
2. Okunan veri bellekte bir gün kalır (`lib/queryClient.ts` → `gcTime`), izin listesindeki okumalar telefonda da tutulur (`lib/queryPersist.ts`, liste `lib/keptQuery.ts`, testli): mekan listesi ve şehirleri, mekan noktaları, arkadaş listesi, sohbet listesi, oyun geçmişi, bildirimler, kendi hesap ve kendi profil görünümü, hediye durumu. Ekran eldekiyle hemen açılır, eski olanı arkada yenilenir; yükleniyor yalnız hiç verisi olmayan ilk açılışta görünür. Saklanan veri hesaba bağlıdır, en çok 24 saatlik olanı gösterilir; çıkışta, hesap değişince ve hesap silinince telefondan silinir (`features/auth/session.ts`). Telefon yedeğine girmez (`android.allowBackup: false`).
   - Saklanmayanlar: başkasının profili (ekrandan çıkınca silinir, denetim M10-02), masa, oyun, semt odası, sohbet mesajları (DM'in kendi önbelleği `dmCache.ts`), listede olmayan her şey.
3. Mekan sayfası dokunma anında noktalarını ister (`features/explore/openVenue.ts`); DM'in mesajları zaten Mesajlar listesinden belleğe alınır.
