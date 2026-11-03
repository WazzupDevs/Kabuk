# Arayüz hataları — 3 Kasım 2026

Proje sahibinin telefonda uygulamayı denerken bildirdiği küçük hatalar; not hâli. Kod değişikliği yok.

- Her madde: ekran, ne görüldü, önem, kodda bulunabiliyorsa olası yer (dosya:satır).
- Önem: **yüksek** (kullanılamıyor, çakışan/kesilen içerik), **orta** (göze batan), **düşük** (ince ayar).
- Aynı kökten gelen maddeler birleştirildi.

## Kararlar

Proje sahibinin bu oturumdaki ürün kararları.

| Karar | Madde |
| ----- | ----- |

## Maddeler

### 1. DM sohbeti (koyu)

**1.1 Uzun basınca öne çıkan balonun çevresindeki katman balona uymuyor.** Mesaja uzun basınca (tepki ve Yanıtla/Kopyala açılır) öne alınan balonun dışında yeşilimsi bir halka çıkıyor: rengi balonla ilgisiz (mavi balonda da yeşil), kuyruğu sarmıyor, balonun gölgesinin yerini alıyor. Önem: orta.
Olası yer: `apps/mobile/src/components/ChatBubble.tsx:323` (`lifted` iken `boxShadow: shape.shadow.focus`, yani `theme/theme.ts:152`/`:160` odak halkası, 4px yeşil); kuyruk ayrı çizildiği için (`BubbleTail`, `:327`) halka kuyruğu izlemiyor. Öne alma `components/MessagePop.tsx`.

**1.2 Yeni mesaj gönderince, liste en alttayken aşağı inme oku çıkıyor.** Kendi mesajını gönderdikten sonra sayfa en altta olduğu hâlde sağ altta aşağı ok beliriyor ve son balonun saatinin üstüne biniyor (ekranda "Bugün" günü yeni açılmıştı). Önem: orta.
Olası yer: `apps/mobile/src/components/ChatScreen.tsx:748` (ok `metaHidden`'a bağlı, `:1063`; yeni satır gelince `hiddenAt` yeniden hesaplanıyor ama `scrollY` eski kalıyor ya da yeni satırın/gün ayracının yüksekliği eşiği yanlış kuruyor), eşik `apps/mobile/src/lib/chatMeta.ts:5` → `metaHiddenAt`.

### 2. Sabit alt bar zemini (açık tema)

**2.1 Bazı ekranlarda en altta zeminden ayrı, düz renkli bir bant çıkıyor.** Profili düzenle'de "Kaydet" barının, Aktiviteler'de sekme çubuğunun arkasında, renk bulutlu zeminle uyuşmayan açık düz bir şerit; üst kenarı sert çizgi gibi görünüyor. Koyu temada yok. Önem: orta.
Olası yer: `apps/mobile/src/aura/AuraBackground.tsx:62` (`AuraBand`) → `Slice` açık temada zemin resmini `useWindowDimensions().height`'e göre kesiyor; Android'de bu yükseklik gezinme çubuğunu içermediği için kesit arkadaki zeminle hizalanmıyor (?). Çağıranlar `components/Screen.tsx:180` (alt bar), `components/TabBar.tsx:98`/`:107` (`TabBarFade`). 2 Kasım notundaki K2'nin "sönme bantları" izi.

### 3. Keşfet (liste, açık)

**3.1 Arama çubuğunda "Mekan ara" yazısı çok küçük.** İpucu yazısı alanın içinde okunamayacak kadar küçük çiziliyor. Önem: orta.
Olası yer: `apps/mobile/app/(app)/(tabs)/explore/index.tsx:732` (`<T v="body" lines={1} fit>` mutlak katmanda; `fit` yazıyı gereksiz küçültüyor (?)).

**3.2 Liste/harita düğmeleri kapsülüne sığmıyor.** Seçili yuvarlak kapsülün üst ve alt kenarından taşıyor. Önem: orta.
Olası yer: aynı dosya `:803` (`SWITCH_ROUND = 48`) kapsül yüksekliği `KIT.size.field` 48'e indikten sonra (`apps/mobile/src/theme/auraKit.ts:671`, 2 Kasım kararı) değişmemiş; kapsül iç boşluğu `:758` ile 48 + 2×3 > 48. Yuvarlak, kapsül yüksekliğinden türemeli.

### 4. Mekan (masasız, açık): riso resimlerin üst kenarı

**4.1 Riso sahnelerin üstünde turuncu bir çerçeve çizgisi var; "Henüz masan yok" sahnesi de çerçeveye sığmıyor.** "Henüz masan yok" kartında ve "Açık masa yok" resminde üst kenarda turuncu-sarı noktalı bir şerit görünüyor, bütünlüğü bozuyor. "Henüz masan yok"ta ayrıca sağdaki kapsül kesik. Önem: orta.
Kök (doğrulandı): şerit resim dosyalarının kendisinde, ilk 3–4 piksel satırı turuncu (mavi kanal ~60, altı ~190): `apps/mobile/assets/riso/venue-no-table.webp`, `venue-no-open.webp`, `venue-scene.webp`, `scene-table-end.webp`, `scene-signup.webp`. Dosyalar kenarı kırpılarak yeniden dışa aktarılmalı (kaynak `docs/design/kaynak/`).
Kırpma: `apps/mobile/src/features/rooms/TableCard.tsx:363` (`Image` + `PICTURE_FILL`, `cover`; resim 700×420 (5:3), kart 210 yüksekliğinde, yaklaşık 1,9:1); "Açık masa yok" `src/features/rooms/Lobby.tsx:381`. 2 Kasım notundaki K1 (6.1) ile ilişkili.

### 5. Check-in alt sayfası (Keşfet → mekan → "Konumumu kullan", açık)

**5.1 Alt sayfanın üstünden bakan kapsül kankiler riso çizimi değil.** Sayfanın kenarından bakan üç kanki düz vektör (`Buddy`) çiziliyor; diğer yerlerdeki riso kankilerle uyuşmuyor. Önem: orta.
Olası yer: `apps/mobile/src/aura/Peek.tsx:34` (`notifications` ve `request` dışındaki her tür, `checkin` dahil, `BuddyPeek` → `Buddy`'ye düşüyor; `:37`), çağıran `apps/mobile/app/(app)/checkin/index.tsx:130` (`peek="checkin"`). Riso yolu aynı dosyada (`RisoKanki`, `RisoStrip`); aynı `BuddyPeek`'i kullanan diğer alt sayfalar da etkileniyor olabilir.
