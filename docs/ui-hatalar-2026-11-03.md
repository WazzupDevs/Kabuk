# Arayüz hataları — 3 Kasım 2026

Proje sahibinin telefonda uygulamayı denerken bildirdiği küçük hatalar; not hâli. Kod değişikliği yok.

- Her madde: ekran, ne görüldü, önem, kodda bulunabiliyorsa olası yer (dosya:satır).
- Önem: **yüksek** (kullanılamıyor, çakışan/kesilen içerik), **orta** (göze batan), **düşük** (ince ayar).
- Aynı kökten gelen maddeler birleştirildi.

## Kararlar

Proje sahibinin bu oturumdaki ürün kararları.

| Karar | Madde |
| ----- | ----- |
| Kapsül ekranında aksesuar seçeneklerinin ve paket parçalarının dış kutusu (yüzey renkli, gölgeli kare) kalkar; yalnızca yuvarlak kapsül görünür. Seçili halka yuvarlağın çevresine çizilir. Tuvalin Kapsül bölüm 4 kutusundan sapma; düzeltme PR'ında tuval de güncellenir. | 8.1 |

## Maddeler

### 1. DM sohbeti (koyu)

**1.1 Uzun basınca öne çıkan balonun çevresindeki katman balona uymuyor.** Mesaja uzun basınca (tepki ve Yanıtla/Kopyala açılır) öne alınan balonun dışında yeşilimsi bir halka çıkıyor: rengi balonla ilgisiz (mavi balonda da yeşil), kuyruğu sarmıyor, balonun gölgesinin yerini alıyor. Önem: orta.
Olası yer: `apps/mobile/src/components/ChatBubble.tsx:323` (`lifted` iken `boxShadow: shape.shadow.focus`, yani `theme/theme.ts:152`/`:160` odak halkası, 4px yeşil); kuyruk ayrı çizildiği için (`BubbleTail`, `:327`) halka kuyruğu izlemiyor. Öne alma `components/MessagePop.tsx`.

**1.2 Yeni mesaj gönderince, liste en alttayken aşağı inme oku çıkıyor.** Kendi mesajını gönderdikten sonra sayfa en altta olduğu hâlde sağ altta aşağı ok beliriyor ve son balonun saatinin üstüne biniyor (ekranda "Bugün" günü yeni açılmıştı). Önem: orta.
Olası yer: `apps/mobile/src/components/ChatScreen.tsx:748` (ok `metaHidden`'a bağlı, `:1063`; yeni satır gelince `hiddenAt` yeniden hesaplanıyor ama `scrollY` eski kalıyor ya da yeni satırın/gün ayracının yüksekliği eşiği yanlış kuruyor), eşik `apps/mobile/src/lib/chatMeta.ts:5` → `metaHiddenAt`.

### 2. Ekranın en altındaki uyumsuz bant (açık tema)

**2.1 Bazı ekranlarda en altta zeminden ayrı, düz renkli bir bant çıkıyor.** Profili düzenle'de "Kaydet" barının, Aktiviteler'de sekme çubuğunun arkasında alt barı olmayan başkasının profilinde ve Ayarlar alt sayfalarında (Kullanım Koşulları, KVKK Aydınlatma Metni, Gizlilik, Engellenenler, Sessize alınanlar, Bildirim ayarları) da en altta, renk bulutlu zeminle uyuşmayan açık düz bir şerit var; üst kenarı sert çizgi gibi duruyor. Şeridin yüksekliği aşağı yukarı Android gezinme çubuğu kadar. Koyu temada görülmedi. Önem: orta.
Olası yer: alt barı olmayan ekranda da çıktığı için kök büyük olasılıkla zeminin kendisinde, barda değil: renk bulutlu zemin (`apps/mobile/src/aura/AuraBackground.tsx:31`/`:45`, `height: '100%'`) gezinme çubuğunun altına uzanmıyor ve orada pencerenin düz rengi görünüyor (?). Bant olan ekranlarda `AuraBand` → `Slice` (`:62`, `:92`) zemin resmini `useWindowDimensions().height`'e göre kestiği için aynı hizasızlığı tekrar ediyor. Çağıranlar `components/Screen.tsx:180`, `components/TabBar.tsx:98`/`:107`. 2 Kasım notundaki K2'nin "sönme bantları" izi. Gizlilik, Engellenenler ve Sessize alınanlar'daki riso kanki (`theme/kankiMotion.ts:167-169`, `bottom: 30`) bandın sert kenarında duruyor, bant giderilince kendiliğinden düzelir.

### 3. Keşfet (liste, açık)

**3.1 Arama çubuğunda "Mekan ara" yazısı çok küçük.** İpucu yazısı alanın içinde okunamayacak kadar küçük çiziliyor. Önem: orta.
Olası yer: `apps/mobile/app/(app)/(tabs)/explore/index.tsx:732` (`<T v="body" lines={1} fit>` mutlak katmanda; `fit` yazıyı gereksiz küçültüyor (?)).

**3.2 Liste/harita düğmeleri kapsülüne sığmıyor.** Seçili yuvarlak kapsülün üst ve alt kenarından taşıyor. Önem: orta.
Olası yer: aynı dosya `:803` (`SWITCH_ROUND = 48`) kapsül yüksekliği `KIT.size.field` 48'e indikten sonra (`apps/mobile/src/theme/auraKit.ts:671`, 2 Kasım kararı) değişmemiş; kapsül iç boşluğu `:758` ile 48 + 2×3 > 48. Yuvarlak, kapsül yüksekliğinden türemeli.

### 4. Riso resimlerin üst kenarı (Mekan, Mesajlar → İstekler; açık)

**4.1 Riso sahnelerin üstünde turuncu bir çerçeve çizgisi var; "Henüz masan yok" sahnesi de çerçeveye sığmıyor.** "Henüz masan yok" kartında, "Açık masa yok" resminde ve Mesajlar → İstekler boş durumunda ("Bekleyen istek yok") üst kenarda turuncu-sarı noktalı bir şerit görünüyor, bütünlüğü bozuyor. "Henüz masan yok"ta ayrıca sağdaki kapsül kesik. Önem: orta.
Kök (doğrulandı): şerit resim dosyalarının kendisinde, ilk 3–4 piksel satırı turuncu (mavi kanal ~60, altı ~190): `apps/mobile/assets/riso/venue-no-table.webp`, `venue-no-open.webp`, `empty-requests.webp`; kenar taraması (üst satır ile 20. satırın farkı) `venue-scene.webp`, `scene-table-end.webp`, `scene-signup.webp`, `venue-yemek.webp`, `game-krot.webp`, `spot-ic-salon.webp` ve başkalarında da işaret veriyor: `assets/riso/` hepsi gözle taranmalı. Dosyalar kenarı kırpılarak yeniden dışa aktarılmalı (kaynak `docs/design/kaynak/`).
Kırpma: `apps/mobile/src/features/rooms/TableCard.tsx:363` (`Image` + `PICTURE_FILL`, `cover`; resim 700×420 (5:3), kart 210 yüksekliğinde, yaklaşık 1,9:1); "Açık masa yok" `src/features/rooms/Lobby.tsx:381`. 2 Kasım notundaki K1 (6.1) ile ilişkili.

### 5. Check-in alt sayfası (Keşfet → mekan → "Konumumu kullan", açık)

**5.1 Alt sayfanın üstünden bakan kapsül kankiler riso çizimi değil.** Sayfanın kenarından bakan üç kanki düz vektör (`Buddy`) çiziliyor; diğer yerlerdeki riso kankilerle uyuşmuyor. Önem: orta.
Olası yer: `apps/mobile/src/aura/Peek.tsx:34` (`notifications` ve `request` dışındaki her tür, `checkin` dahil, `BuddyPeek` → `Buddy`'ye düşüyor; `:37`), çağıran `apps/mobile/app/(app)/checkin/index.tsx:130` (`peek="checkin"`). Riso yolu aynı dosyada (`RisoKanki`, `RisoStrip`); aynı `BuddyPeek`'i kullanan diğer alt sayfalar da etkileniyor olabilir. Masa kur alt sayfasının sahnesindeki üç kanki de düz vektör: `apps/mobile/src/aura/Scene.tsx:78` (`Gathering` → `Buddy`).

### 6. Ayarlar alt sayfaları ve yasal metinler (açık)

**6.1 Yasal metinlerde riso kanki "Devam" düğmesinin arkasından taşıyor.** Kullanım Koşulları ve KVKK'da pembe kanki düğmenin üstünden bakıyor ama gövdesinin alt kısmı düğmenin altından, en alttaki bandın üstüne çıkıyor. Önem: düşük.
Olası yer: `apps/mobile/src/components/LegalText.tsx:20` (`LEGAL_PEEK`, `theme/kankiMotion.ts:174`: `top: -36`, yükseklik 105; düğme 48: 105 − 36 = 69 > 48). Düğmenin altında kalan kısım kırpılmalı ya da kankinin yüksekliği düğmeyle sınırlanmalı.

**6.2 Engellenenler ve Sessize alınanlar'ın boş durumunda başlık yok.** Riso resmin altında yalnızca tek satır gövde metni ("Engellediğin kimse yok.") var; diğer boş durumlarda başlık ve açıklama ikilisi var ("Bekleyen istek yok" + açıklama). Önem: düşük.
Olası yer: `apps/mobile/app/(app)/settings-muted.tsx:51` (`EmptyState ... body=` yalnızca), engellenenler için `app/(app)/settings-blocked.tsx` aynı kalıp.

**6.3 Gizlilik'te "Gizlilik politikası" satırı soluk ve KVKK'yı açıyor.** Satırın yazısı ve ikonu diğer satırlardan soluk görünüyor (?). Gizlilik politikası adresi yokken satır KVKK Aydınlatma Metni'ni açıyor; alttaki KVKK satırıyla aynı yere gidiyor. Önem: düşük.
Olası yer: `apps/mobile/app/(app)/settings-privacy.tsx:48-56` (`privacyUrl` yoksa `doc: 'kvkk'`).

### 7. Masa kur alt sayfası (açık)

**7.1 Seçili masa simgesi yeşil çerçeveyi doldurmuyor.** Hızlı seçim sırasında seçili simgeyle yeşil halka arasında beyaz bir boşluk var; simge çerçevenin içinde küçük kalıyor. Önem: düşük.
Olası yer: `apps/mobile/src/features/rooms/CreateTableSheet.tsx:204-208` (`borderWidth: OUTLINE` + `padding: OUTLINE`, `OUTLINE = 3` `:307`: halka ile resim arasında 3 dp iç boşluk); halka resmin üstüne çizilmeli ya da iç boşluk kaldırılmalı.

### 8. Profil → Kapsülün (açık)

**8.1 Aksesuar seçeneklerinin ve paket parçalarının gereksiz dış çerçevesi var.** Her yuvarlak kapsül önizlemesi beyaz, gölgeli, köşesi yuvarlatılmış bir kare kutunun içinde ("Baş boş", Zarif, Çiçek, Sokak paketi parçaları). Önem: orta.
Olası yer: `apps/mobile/app/(app)/(tabs)/profile/capsule.tsx:524-532` (`Box`: `backgroundColor: colors.surface` / `c.glassInSheet`, `boxShadow`); seçili halka `:546-560` kutunun köşesine göre çiziliyor, yuvarlağa göre çizilmeli. Ölçüler `KIT.size.optionBox`, `partBox` (`src/theme/auraKit.ts`).
