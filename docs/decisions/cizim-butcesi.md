# Çizim bütçesi (21 Kasım 2026)

Proje sahibinin kesin kuralı: hiçbir ekran ve parça gereksiz yere yeniden çizilmez.

## Neden

Mesaja uzun basınca açılan katman yavaştı. Ölçünce görüldü ki açılmak için:

- katmanın açık olduğu bilgisi sohbet ekranının durumunda (state) ve bağlamında (context) tutuluyordu; bütün sohbet ekranı ve mesaj listesinin kaydırma bileşeni yeniden çiziliyordu;
- katman önce görünmeden çizilip ölçülüyor, sonra tepki çubuğu ve menü `key` değiştirilerek baştan kuruluyordu (altı tepki yüzü iki kez);
- ⋮ menüleri ve mesaj katmanı her açılışta ayrı bir Android penceresi (Modal) kuruyordu (emülatörde ~160 ms).

Telegram Android aynı işte açılan menüyü ve basılı tutulan mesajı kendi penceresinde çizer, sohbet listesine dokunmaz.

## Kural

1. Açılan katman (⋮ menüsü, uzun basma menüsü, mesajın tepki ve menüsü) yalnız kendini çizer. Açıldığında altındaki ekran, liste ve satırlar yeniden çizilmez: açık ya da kapalı bilgisi ekranın state'inde ve context'inde tutulmaz; gerekiyorsa küçük bir depoda (zustand) durur ve yalnız onu okuyan küçük parça okur (`components/popHost.tsx` → `usePopOpen`, yalnız sohbetin kaydırma bileşeni), anlık kontrol abone olmadan okur (`isPopOpen`).
2. Menüler ve mesaj katmanı ayrı pencere (Modal) açmaz; uygulamanın katmanında çizilir (`motion/menuLayer.tsx` → `MenuLayer`, `Layer`). Ekran menüyü kendi state'inde tutmaz, `openMenu` / `openMenuAt` ile açar; menüyü katman (`MenuHost`) çizer ve kapatır. Alt sayfa (`Sheet`), onay penceresi (`OverlayHost`), fotoğraf önizleme ve gelen istek şimdilik kendi Modal'ındadır: 21 Kasım'da katmana taşındılar, hareketleri Modal'a göre kurulu olduğu için açılış ve kapanış bozuldu ve geri alındılar; taşınırken hareketleri katmanda yeniden kurulur.
3. Bir parça bir açılışta bir kez kurulur. Boyu hesaplanabiliyorsa hesaplanır (menü satırları); ölçülmesi gerekiyorsa görünmeden çizilen aynı örnek yerine taşınır ve hareketi orada başlar. Ölçüp `key` değiştirerek yeniden kurmak yoktur.
4. React Compiler'ın memo'su bozulmaz: bileşen içinde değişen değeri okuyan yardımcı onu parametre alır (CLAUDE.md → Kod kuralları), memo'lu çocuğa her çizimde yeni nesne ya da fonksiyon verilmez.
5. Yeni ekran ve katman işi `performans` ajanının çizim denetiminden geçer.

## Kapı

`apps/mobile/src/theme/renderGuard.test.ts`: Modal açan dosyalar listededir (`renderGuard.allowed.ts`), yeni dosya eklenemez, liste yalnız küçülür; adında `measure` geçen bir `key` ile yeniden kurulan parça yoktur.

## Ölçülen

- ⋮ menüsü: basıştan büyümenin başlamasına 210–220 ms → 26–50 ms (emülatör, geliştirme sürümü).
- Uzun basma eşiği 500 → 400 ms (Android ve Telegram'ın değeri).
