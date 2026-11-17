# Pano–kod denetimi, grup 08 (13 pano)

Not: Resim dosyaları depoda yok (BLOBLAR.md), resim içeriği açılıp bakılmadı; resim eşlemesi yalnız boyut/yer olarak denetlendi. Telefon/emülatör görüntüsü yok: bütün hükümler koddan. Yazı boyları pano css'i ile `KIT_TYPE`/`T v=` değerleri karşılaştırılarak çözüldü.

## 62b Hediye paketleri · Gümüş kilitli — project/HediyePaketKilit.dc.html
Kod: app/(app)/gifts.tsx (Packs, Info, Buttons), src/features/gifts/PackRing.tsx, parts.tsx (GiftTopBar, SoonTag, LoginBar), theme/gifts.ts
Öğe sayısı: 14 · uyuyor: 6 · fark: 8 · fazla: 1 · doğrulanamadı: 1
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Üst bar: başlık | düzen/yazı | Geri düğmesinin yanında SOLA yaslı, `flex:1`, 700 21/28 ls -.3, bar 56, yan boşluk 20 (.hpt) | Başlık ORTADA, `T v="title"` 600 21/27 (parts.tsx GiftTopBar; yanında boş 44'lük dengeleyici) |
| 2 | Paket gölgesi | renk/ölçü | `drop-shadow(0 14px 18px rgba(3,27,11,.22))`, koyu `0 14 18 rgba(0,0,0,.6)` | PACK_DROP: açık `0 10 σ6 rgba(4,73,35,.22)`, koyu `0 10 σ7 .55` (theme/gifts.ts PACK_DROP; PackRing.tsx RingPack) |
| 3 | "Yakında" hapı | ölçü/yazı | yazı 600 11/1, ikon 12, iç boşluk 0 9 0 7, gap 4, h 24 | `Tag`: yazı 12/16 (KIT_TYPE.tag), ikon `ICON.sm`=16, padX 8/8, gap 4 (parts.tsx SoonTag) |
| 4 | Nokta göstergesi (koyu) | koyu | pasif `rgba(255,255,255,.22)`, aktif `#fff` | `c.emptyMark` koyu `#1B211F`, aktif `c.ink` koyu `#EEF3F0` (auraKit.ts:547; PackRing.tsx RingDots) |
| 5 | Paket adı (h2) | yazı | 700 21/28 | `T v="title"` 600 21/27 (gifts.tsx Info) |
| 6 | "Yakında açılacak" | yazı | 600 15/20, metin rengi | `T v="fine" strong` 13/18 (gifts.tsx Info) |
| 7 | Not metni üst boşluğu | boşluk | `.nt` margin-top 6 | gap SPACING[1]=4 (gifts.tsx Info) |
| 8 | "Oranlar" düğmesi | ölçü | h 56 (`.fx .btn`), flex 1 | `Btn` varsayılan 48 (gifts.tsx Buttons; uzun boy verilmemiş) |
| 9 | Geri düğmesi (soft) | doğrulanamadı | `.round.soft` 44, koyu #121614 | `Round glassy` 44; koyu değeri ortak parça, bu denetimde ayrıca ölçülmedi |
| F1 | Havada süzülme (`useFloat`) ve rozet nabzı | fazla | pano durağan | PackRing.tsx RingPack `useFloat`; parts.tsx CanOpenBadge |
Uyuyan: carousel (236/168, ±150, ±7°), merkez Y 337, "Yakında" konumu %86, nokta ölçüleri (6/20, gap 6), Paket adı/not metinleri, "Gümüş paketler şimdilik kapalı…" metni.

## 62c Hediye paketi · Oranlar — project/HediyeOranlar.dc.html
Kod: app/(app)/gifts.tsx (Info, Buttons), src/features/gifts/OddsSheet.tsx, parts.tsx (Marks, LoginBar), motion/Sheet.tsx, theme/gifts.ts
Öğe sayısı: 28 · uyuyor: 14 · fark: 13 · fazla: 1 · doğrulanamadı: 0
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Üst bar başlığı, paket gölgesi, "Yakında" hapı, noktalar, h2, not boşluğu, Oranlar yüksekliği | ölçü/yazı | bkz 62b #1-#8 | bkz 62b #1-#8 |
| 2 | "Açılacak paket yok" | yazı | 600 15/20 | `fine strong` 13/18 (gifts.tsx Info) |
| 3 | İlerleme çubukları kapalı parça | renk/koyu | açık `rgba(3,27,11,.12)`, koyu `rgba(255,255,255,.16)` | `c.emptyMark` açık `rgba(3,27,11,.18)`, koyu `#1B211F` (parts.tsx LoginBar) |
| 4 | İlerleme çubukları dolu parça (koyu) | koyu | `#3DDC84` (.dark .pr b.on) | `colors.success` koyu `#4CC97E` (theme/theme.ts:84; gifts.tsx Info) |
| 5 | "2/3 giriş" yazısı | yazı/renk | 600 13/18, `--muted` | `T v="fine" strong` metin rengi (gifts.tsx Info), muted değil |
| 6 | İlerleme satırı üst boşluğu | boşluk | margin-top 10 | gap 4 + marginTop 4 = 8 (gifts.tsx Info) |
| 7 | Alt sayfa alt başlığı (.sx) | yazı | 500 14/20 muted | `T v="fine"` 13/18 (OddsSheet.tsx) |
| 8 | Satırda elmaslar | ölçü | 9×9, gap 3, radius 2, kap 52 | MARK=6, gap 2, radius 1 (parts.tsx `Marks`) |
| 9 | Elmas/çubuk rengi, koyu | koyu | Sıradan `#6E8874`, Nadir `#2C63D6` (iki temada aynı, `--rc` satır içi) | koyu: `#A3AEA8`, `#7DB2FF` (theme/gifts.ts:9) |
| 10 | Çubuk zemini | renk/koyu | açık `rgba(3,27,11,.08)`, koyu `rgba(255,255,255,.12)` | `c.emptyMark` `.18` / `#1B211F` (OddsSheet.tsx) |
| 11 | Yüzde yazısı | yazı | 700 15/20, sağa yaslı 44 | `h3` 600 16/22 (OddsSheet.tsx) |
| 12 | Alt notlar | fazla | tek not: "Elmas işaretlerinin sayısı nadirliği gösterir." | iki not: ayrıca "Sahip olduğun aksesuar bir daha çıkmaz." (tr.ts gifts.oddsNoRepeat; OddsSheet.tsx) |
| 13 | Efsanevi satırı | pano içi tutarsızlık | çubuk `width:3%` ama yazı `%1` | kod sunucudan gelen oranı kullanır (OddsSheet.tsx); panoda hangisi doğru belirsiz |
Uyuyan: perde .42/.7, sayfa 8/8/8, radius 28, iç boşluk 10/20/34, tutamaç 40×5 (16 boşluk), başlık metni, "Bronz paket oranları", satır 56, ayırıcı hair, çubuk 96×6, alt not ilk satırı, kilit satırı yok, Aç+Oranlar yan yana.

## 62d Hediye paketi · yırtma — project/HediyeYirt.dc.html
Kod: app/(app)/gifts.tsx (RESULT_TITLE_AT, kapat düğmesi), src/features/gifts/Rip.tsx, theme/gifts.ts (FINGER), tr.ts gifts.ripHint
Öğe sayısı: 10 · uyuyor: 3 · fark: 7 · fazla: 0 · doğrulanamadı: 0
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Üst başlık "Bronz paket" | yazı/renk | 600 14/20, `--muted`, ortada | `T v="fine" strong center` 13/18, metin rengi (gifts.tsx) |
| 2 | Paket gölgesi | renk/ölçü | `drop-shadow(0 18px 22px rgba(3,27,11,.25))`, koyu `.6` | Rip.tsx'te hiç gölge yok (RipBody/RipStrip; grep filter/shadow boş) |
| 3 | Yırtma çizgisi | düzen | pakette %9'da 2.5px kesik beyaz çizgi + gölge, sürekli görünür | Çizgi yok; yalnız yırtılan yerde zikzak (Rip.tsx ZIG/zigzag), konum %8.5 (art.ts TEAR_AT=0.085) |
| 4 | Tutamaç | ölçü/renk | 42 daire, sol 4, dolgu `rgba(255,255,255,.92)`, gölge `0 4 14 rgba(0,0,0,.3)`, ok `#031B0B` 22, kalınlık 2.6 | FINGER_SIZE 44, sol -11, dolgu `.55` + 2px beyaz kenar, gölge yok, ok beyaz `CapIcon back` 20 döndürülmüş (Rip.tsx; theme/gifts.ts FINGER) |
| 5 | İpucu "Yırtmak için şeridi sağa kaydır" | yazı | 600 15/20 metin rengi, pakete 30 | `fine strong` 13/18 (Rip.tsx) |
| 6 | "Parmağını kaldırırsan…" | uyuyor | 500 13/18 muted, 4 boşluk | uyuyor |
| 7 | "Atla" düğmesi | eksik | `.btn.soft.sm` "Atla", ipucundan 18 aşağı | YOK (Rip.tsx yorumu: "No Atla (the owner's call, 8 Kasım; HediyeYirt draws one, waiting for his answer)") |
Uyuyan: paket 276 genişlik, üstten 144, kapat düğmesi sağ 20/üst bar ortası (Round close), ipucu metni.

## 62e Hediye paketi · çıkan aksesuar — project/HediyeSonuc.dc.html
Kod: src/features/gifts/OpenedCard.tsx, parts.tsx (CardFace, TierTag), art.ts, theme/gifts.ts (TIER_GLOW, TIER_SPARKLES)
Öğe sayısı: 9 · uyuyor: 1 · fark: 8 · fazla: 2 · doğrulanamadı: 0
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Üst başlık "Bronz paketten çıktı" | yazı/renk | 600 14/20 muted | `fine strong` 13/18 metin rengi (gifts.tsx) |
| 2 | Kart köşe/gölge | ölçü/renk | `.kart` radius 20, `0 20 40 rgba(123,92,255,.35), 0 0 0 1px beyaz .4` | köşe `w*30/600`=12.5 (art.ts CARD_FRAME_CORNER), kart gölgesi yok; yerine glow diskleri (OpenedCard.tsx) |
| 3 | "YENİ AKSESUAR" | yazı/boşluk | 700 12/16 ls .6 muted, karttan 22 | `eyebrow` 600 12/16 ls .24, marginTop SPACING[5]=20 (OpenedCard.tsx) |
| 4 | Aksesuar adı | yazı | 700 24/30, üst 4 | `T v="title"` 600 21/27 (OpenedCard.tsx) |
| 5 | Rütbe etiketi | ölçü/yazı | h 26, iç 10, gap 6, 700 12/16, zemin %14 (koyu %26), elmas 7×7 radius 1.5 | `TierTag`→`Tag` h 24, padX 8, gap 4, 600 12/16, zemin %16 (koyu da %16), elmas 6, gap 2 (parts.tsx TierTag; auraKit tag 24) |
| 6 | İpucu "Kartı sağa sola sürükleyerek çevirebilirsin." | düzen | akışta, etiketten 8 aşağı (≈y 600) | mutlak `HINT_AT=584` (OpenedCard.tsx) |
| 7 | Alt düğmeler | ölçü/ikon | iki düğme `flex:1`, h 56; "Aksesuarı tak" ikonsuz | `flexBasis:auto` sarmalı, h 48, "Aksesuarı tak" `sparkles` ikonlu (OpenedCard.tsx) |
| 8 | Kartın çevresi | fazla | yok | iki glow diski, rütbeye göre 0/4/8/14 kıvılcım, Efsanevi yıldız patlaması, kartı çevirme jesti (OpenedCard.tsx GLOWS/SPARKLES, StarBurst.tsx) |
| 9 | Durum metinleri | fazla | yok | "Takıldı", "Devam", hata satırı (OpenedCard.tsx) |
Uyuyan: kart genişliği 250 / üst 136, "Sonra" + "Aksesuarı tak" sırası/metinleri.

## 63 Ayarlar · Bildirim izni kapalı — project/AyarBildirimKapali.dc.html
Kod: app/(app)/settings-notifications.tsx, src/features/settings/SettingsParts.tsx, theme/settings.ts, auraKit.ts (warnBox), tr.ts settings.*
Öğe sayısı: 22 · uyuyor: 12 · fark: 9 · fazla: 0 · özellik yok: 1 · doğrulanamadı: 0
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Uyarı kartı zemini (koyu) | koyu | `rgba(255,181,71,.12)` | `rgba(255,181,71,.14)` (auraKit.ts:781 warnBox.dark) |
| 2 | Kart başlığı | yazı | 700 16/22, metin rengi | `T v="h3" ink` 600 16/22 (settings-notifications.tsx) |
| 3 | Kart ikonu | ikon | zil + çapraz çizgi, altın `#FFB547`, 22 | `CapIcon bell` tek renk `warn.fg`, 24 (R.icon) (settings-notifications.tsx) |
| 4 | Kart gövde yazısı rengi | renk | `--text` opaklık .8 (açık #031B0B, koyu #EEF3F0) | `warn.fg` açık #5C3A00, koyu #FFE2B3 (settings-notifications.tsx; auraKit.ts:780-781) |
| 5 | "Ayarları aç" düğmesi | ölçü | primary h 40, iç 18, 15/20 | `Btn sm` 36 (settings-notifications.tsx) |
| 6 | "İzin verince aşağıdaki…" üst boşluğu | boşluk | margin-top 12 | `NOTES` marginTop 8 (SettingsParts.tsx NOTES) |
| 7 | "Masa davetleri" alt satırı | metin | "Davet 2 dakika geçerli, kapatırsan kaçırabilirsin" | "Davetler 2 dakika geçerli; kapatırsan kaçırabilirsin" (tr.ts settings.invitesNote) |
| 8 | Alt not | metin | `Masa daveti bildiriminde kişi, masa ve mekân adı yazmaz: "Bir arkadaşın seni masasına çağırıyor." Mekân sohbeti bildirim göndermez.` | `Masa davetinin bildiriminde ad, masa adı ve mekan yazmaz: "Bir arkadaşın seni masasına çağırıyor". Mekan sohbeti bildirim göndermez.` (tr.ts settings.notifyFootnote) |
| 9 | Anahtar (koyu) | koyu | kapalı `#262E2B` / topuz `#EEF3F0`; açık `#3DDC84` / topuz `#0B0E0D` | açık `KIT.primary #0E8745` iki temada; topuz `#151A18` (aura/kit.tsx Switch; auraKit.ts:575) |
| 10 | "Mesajı bildirimde göster" satırı + ÖNERİ rozeti | özellik yok | 4. satır, kapalı anahtar, alt satır `Kapalıyken yalnızca "Yeni mesaj" yazar`; pano "ÖNERİ" | Kodda yok, yorumda bilerek dışarıda (settings-notifications.tsx üst yorum; sunucu ucu/ayar yok) |
Uyuyan: sayfa zemini, üst bar (52/48/12), başlık 700 21/26, kart radius 20 ve iç boşluk 14/16/16, gap 4/10, ".45 sönük ve dokunulmaz", bölüm başlıkları 26/8 700 13/18, satır 56 / iç 10 / gap 14, ayırıcı, ikinci satır 13/18 muted, "Birebir mesajlar/Arkadaşlarından gelen mesajlar", izin metinleri (offTitle/offBody/offOpen).

## 64 Masa bitti — project/MasaBitti.dc.html
Kod: src/features/rooms/TableEnd.tsx, theme/tableSetup.ts (end), tr.ts tableEnd.*, `@shared/tableEnd.ts`
Öğe sayısı: 20 · uyuyor: 12 · fark: 6 · fazla: 1 · kural: 2 · doğrulanamadı: 0
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Alt başlık satırı | metin/eksik | "Uçan Halı · 4 kişi · 38 dk" (süre var) | `${masa} · ${n} kişi`, süre yok (tr.ts tableEnd.subtitle; TableEnd.tsx props'ta süre yok) |
| 2 | Kişi adı | metin/KURAL 4 | "Elif, 23" (ad + yaş) | yalnız `other_alias`; `@shared/tableEnd.ts` başlığı: "the server sends no profile after the close (rule 4)". KURAL 4: masa bittikten sonra yaş/profil gitmez; panonun yaşı kuralla çelişir |
| 3 | Anonim satır | davranış/KURAL 5 | "luna-te89 · Anonim katıldı · eklenemez", düğme yok | metin "Anonim katıldı", ama `pairFriendState`='add' ise "Ekle" düğmesi çıkar (TableEnd.tsx EndRow). CLAUDE.md kural 5/K-75: anonim oturana da 'Arkadaş ekle' verilir; pano "eklenemez" diyor, karar sahibinde |
| 4 | Anonim avatar | resim/KURAL 4 | kapsül görseli 44 (surface2 zemin) | harf avatar `Av name=alias` (TableEnd.tsx); kapsül yok. Kural 4: başkasının kapsülü/nick'i gösterilmez, panoyla çelişir |
| 5 | Satır düğmesi | ölçü | h 40, iç 16, 14 yazı, ikon 16 | `Btn sm` h 36 (TableEnd.tsx EndRow) |
| 6 | "Eklendi" düğmesi | davranış | `.btn.off` (soluk, basılamaz) | glassy, basılınca geri alır (`withdraw`) (TableEnd.tsx). Kural 5 geri almaya izin verir; pano görünümü pasif |
| 7 | Alt düğme | metin/ölçü | "Mekâna dön" (â), primary h 56 | "Mekana dön" (tr.ts tableEnd.back), `Btn block tall` 58 (TableEnd.tsx) |
| 8 | Kodda olup panoda olmayan | fazla | yok | `anonymousNote` ("Arkadaş olursanız anonim adının sen olduğunu görür…") + "Masadan ayrıldın/çıkarıldın" başlıkları (ayrı pano 132) |
Uyuyan: hero 350×200 r28 gölge, başlık 700 32/38 ls -.6, satır 500 15/20, bölüm etiketi 600 12/16 (20/4/2), satır min 64 / gap 12 / 1, ad 600 16/22, "Arkadaşsınız" yeşil, "Onun eklemesi bekleniyor", "Ekle" + ikon, bölüm metni "Masadakiler · İkiniz de eklerseniz arkadaş olursunuz".

## 64a Masa bitti · arkadaş oldunuz — project/MasaBittiArkadas.dc.html
Kod: src/features/rooms/TableEnd.tsx, features/friends/historyActions.tsx, tr.ts notifications.line.match
Öğe sayısı: 26 · uyuyor: 13 · fark: 6 · fazla: 1 · özellik yok: 2 · kural: 2 · doğrulanamadı: 0
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | 64'teki öğeler | — | bkz 64 #1-#8 (aynı satırlar) | bkz 64 #1-#8 |
| 2 | Eşleşme bildirimi (toast) | özellik yok | üstte (top 60) koyu kart: "Mert ile arkadaş oldunuz" + "Artık birbirinize mesaj atabilirsiniz." + "Mesaj at" düğmesi | TableEnd.tsx'te toast yok; `tableEnd.friends` ("Arkadaş oldunuz") yalnız historyActions.tsx'te kullanılıyor; "Mesaj at" ve alt satır metni tr.ts'te yok |
| 3 | Konfeti | özellik yok | 6 parça (7×16) | TableEnd'de yok (components/game/Confetti.tsx yalnız oyunlarda) |
| 4 | Mert satırı eşleşince | ölçü | "Arkadaşsınız" + soft "Mesaj" | `state==='friends'` → `Btn sm glassy chat` "Mesaj"; h 36 vs pano 40 (bkz 64 #5) |
| 5 | KURAL 5 (K-70) | kural | eşleşmeyi gösteren toast | CLAUDE.md: eşleşme yalnız ilk basana bildirilir; toast kararı sahibinde |

## 65 Güncelleme gerekli — project/GuncellemeGerekli.dc.html
Kod: src/features/update/UpdateRequired.tsx, components/Wordmark.tsx, theme/kankiMotion.ts (UPDATE_KANKI), tr.ts update.*
Öğe sayısı: 6 · uyuyor: 0 · fark: 8 · fazla: 0 · doğrulanamadı: 1
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Sıra | sıra | wordmark ÜSTTE, sonra resim, başlık | resim üstte, sonra wordmark, başlık (UpdateRequired.tsx) |
| 2 | Wordmark boyu | ölçü | h 30, altına 28 | `Wordmark height=SPACING[8]`=32, marginBottom 12 (UpdateRequired.tsx) |
| 3 | Resim | ölçü/doğrulanamadı | 260×212 ("Telefonu güncelleyen kapsül kanki") | `UPDATE_KANKI` 110×144 (kankiMotion.ts:62); resim eşlemesi (6f419d) doğrulanamadı: panodaki 5ed5531c… 360×294 png depoda yok |
| 4 | Başlık | yazı | 700 24/30 ls -.3 | `T v="h3"` 600 16/22 (UpdateRequired.tsx) |
| 5 | Gövde metni | metin | "skall'ın bu sürümü artık çalışmıyor. Devam etmek için yeni sürümü yükle, hesabın ve arkadaşların olduğu gibi kalır." (max 300) | "Uygulamanın bu sürümü artık çalışmıyor. Devam etmek için yeni sürümü yükle." (tr.ts update.body), max genişlik yok |
| 6 | Güncelle düğmesi | ölçü/düzen | h 56, ekranın altında (bottom 46), tam genişlik | `Btn block` 48, içerik sütununda ortada (UpdateRequired.tsx) |
| 7 | Sürüm yazısı | metin/yazı | "Yüklü sürüm 0.9.3" 500 12/16 muted | `Yüklü sürüm: ${build}` 13/18 (tr.ts update.build); iki nokta var ve `appBuild`=nativeBuildVersion (build numarası), sürüm adı değil |
| 8 | İçerik dikey konumu | düzen | içerik ortada, alta 150 boşluk (`padding:0 28px 150px`) | `justify-center` tam ekran, alt boşluk yok (UpdateRequired.tsx) |

## 66 Bağlantı yok (Aktiviteler örneği) — project/AktivitelerBaglantiYok.dc.html
Kod: app/(app)/(tabs)/activities.tsx, features/gifts/GiftCard.tsx, components/EmptyState.tsx, components/ConnectionBanner.tsx, motion/TabBar.tsx, theme/activities.ts, theme/gifts.ts (GIFT_CARD)
Öğe sayısı: 14 · uyuyor: 5 · fark: 8 · fazla: 1 · doğrulanamadı: 0
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Başlık üstü etiketi | fazla | yok, yalnız "Aktiviteler" 32/42 | `LargeTitle` içinde şehir etiketi `fromVenues(city)` (activities.tsx ActivitiesScreen) |
| 2 | Hediye kartı | düzen | cam kart, h 76, r 22, iç 0 14 0 10, üstten 8; solda 88×76 üç paket resmi (42/50 genişlik, ±12°), "HEDİYE PAKETİ" accent 600 12/16 ls .24, "Bütün aksesuarlar sende" tek satır 600 16/22, sağda chevron 18 muted | koyu yeşil katman h 170, r 30, iç 20, "Paketlere bak" düğmesi, üstüne taşan paketler, iki satırlı "Bütün aksesuarlar\nsende" (GiftCard.tsx; GIFT_CARD theme/gifts.ts) |
| 3 | Bölmeli seçici camı | renk | `--glass-bg` gradyan .80→.54, çizgi .86, gölge `0 18 44 .10` | `tabsGlass` fill .60, edge .90, gölge `0 10 30 .08` (theme/activities.ts light.tabsGlass) |
| 4 | Boş durum yeri | düzen | içerik kalan alanın DİKEY ORTASINDA (flex:1, alt 150) | `marginTop: A.listTop` (12), üstte (activities.tsx Events) |
| 5 | Boş durum resmi | resim | "Fişi çıkmış kapsül kanki" 210×172 | resim yok; 64'lük disk + cloudOff ikon 28 (EmptyState.tsx StateDisc; yorum: "riso pictures not in the repo yet") |
| 6 | Başlık "Bağlantı yok" | metin | 600 15/20, resmin 12 altı | `title` verilmiyor; Aktiviteler'de `EmptyState kind="error"` yalnız `errorMessage(...)` gövdesi (activities.tsx Events) |
| 7 | Açıklama | metin | "İnternete bağlanınca bu sayfa kendiliğinden yenilenir." | bağlantı yokken üst bant "Bağlantı yok · Bağlanınca ekran kendiliğinden yenilenir." (tr.ts connection.offlineBody) ya da "Bağlantı yok. Bağlanınca tekrar dene." (offlineError); ekranda ayrı çevrimdışı hâli yok |
| 8 | "Tekrar dene" düğmesi | ölçü | soft h 44, iç 20, üst 16 | `Btn sm glassy` h 36 (EmptyState.tsx) |
Uyuyan: başlık "Aktiviteler" 32/500, "Etkinlikler"/"Geçmiş" seçici (44, iç 4, öğe 36, seçili koyu/beyaz), alt çubuk (60, 20 yan, 5 iç, 50 hap, ikon 20, etiket 10/13 ls .1, gap 3), alt solma 150. Alt çubuk `bottom:30` değeri güvenli alana bağlı, doğrulanamadı.

## 66a Hata (Aktiviteler örneği) — project/AktivitelerHata.dc.html
Kod: 66 ile aynı (EmptyState kind="error")
Öğe sayısı: 14 · uyuyor: 5 · fark: 8 · fazla: 1 · doğrulanamadı: 0
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Hediye kartı, başlık etiketi, seçici camı, boş durum yeri, düğme | — | bkz 66 #1-#4, #8 | bkz 66 |
| 2 | Resim | resim | "Kırık fincana bakan kapsül kanki" 210×172 | disk + cloudOff (bkz 66 #5) |
| 3 | Başlık | metin | "Bir sorun oldu" | yok (title verilmiyor) (activities.tsx Events) |
| 4 | Açıklama | metin | "Etkinlikler yüklenemedi. Birazdan yeniden dene." | `errorMessage(venues.error ?? cities.error)` değişken metin (activities.tsx Events) |

## 70 Hareket · ortak değerler — project/HareketDegerler.dc.html
Kod: src/theme/aura.ts → MOTION, features/capsule/motion.ts, motion/useSheetMotion.ts, motion/menuPlace.ts, motion/Tap.tsx
Öğe sayısı: 33 · uyuyor: 32 · fark: 1
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | "Hareketi azalt açıkken hiçbir şey ölçeklenmez" | hareket | basma ölçeği dahil hiçbir ölçek | `usePress` (Tap.tsx:24-37) `useReduceMotion` okumaz: basma 0.96 ölçeği azaltmada da oynar |
Doğrulanan (hepsi eşit): springs morph 170/26/1, morphBack 260/30/1, sheet 260/24/1, pop 260/17/1, menu 300/24/1, press 500/22/1, seg 380/30/1, tabLead 420/30/1, tabTrail 200/24/1; curves arrive .2,.9,.25,1 / leave .4,0,1,1 / swap .4,0,.2,1; dissolve 240/150, .97, 12, blur 12; stagger 30/35/max 5; SHEET_LEAVE_MS 320; cardOpen 150; menuOpen .18; MENU_FADE_UNTIL .35; sheetOpen 80/.3; press .96/100/100; messageIn 18/.86/.4; JUMP 500 ms .3,.7,.4,1 (y 0,-5,.6,0); SHUFFLE 560 ms dönme 0,-6,5,-2,0; idle 4 px/1300 ms, kırpma 160 ms, 4–6 sn; sayfa geçişi `ios_from_right` (lib/stackOptions.ts:18).

## 71 Hareket tablosu — project/HareketTablo.dc.html
Kod: motion/Tap.tsx, Menu.tsx, Dialog.tsx, ListMove.tsx, SnapStrip.tsx, CatalogMotion.tsx, components/Composer.tsx, ChatBubble.tsx, features/friends/InboxRows.tsx, features/capsule/*, app/(app)/(tabs)/profile/capsule.tsx, features/district/People.tsx, RoomSheets.tsx, features/profile/LivingLook.tsx
Öğe sayısı: 33 satır (A1 5, A2 3, A3 4, A4 4, A5 6, A6 5, A7 2, B6 4) · uyuyor: 21 · fark: 12
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | 1.1 Basılı tutma / 2.3 düğmeye basma: eğri | hareket | ölçek 1→.96, 100 ms, eğri `swap` (.4,0,.2,1) | `Animated.timing` easing verilmemiş, varsayılan eğri (Tap.tsx:28-33) |
| 2 | 1.1 / 2.3 hareketi azalt | hareket | ölçek yok, zemin rengi anında | ölçek azaltmada da oynar (bkz 70 #1) |
| 3 | 1.2 Satırın kalkması | özellik yok | satırın kopyası örtünün üstüne çıkar (ölçek .96→1, gölge 0→1, yay 500/22/1) | Menü `hold` yalnız örtü + menü çizer (Menu.tsx:~281; InboxRows.tsx:~100); basılı satır yükseltilmez, kopyası yok |
| 4 | 1.3 Örtünün gelişi | hareket | bulanık sabit kopya (6 px) + karartma, 240 ms arrive | karartma var; bulanık kopya varsayılan KAPALI (lab `scrimGlass`, docs/decisions/scrim-glass.md; SheetScrim.tsx:~27) |
| 5 | 5.4 Hepsini çıkar | hareket | parçalar 150 ms leave ile solar, 35 ms arayla (en çok 5), sonra kapsül zıplar | tek seferde yeni görünüş + JUMP (capsule.tsx put:~262); features/capsule'de `stagger.part` kullanılmıyor |
| 6 | 5.5 Sekme değişimi: şerit | hareket | eski şerit 150 ms çözülür, yenisi 240 ms gelir, öğeler 35 ms arayla | "a new slot or pack opens on the chosen option without motion" (capsule.tsx:~631); yalnız alt çizgi (SlideLine, springs.seg) kayıyor |
| 7 | 5.6 Kaydet | hareket | yazının yerinde dönen halka, 800 ms/tur | `Btn loading` → Buluş kapsülleri (aura/kit.tsx:~447); `waitSpinner` halkası yalnız semt ekranında (district/parts.tsx:496) |
| 8 | 6.3 Katalogda seçim halkası eğrisi | hareket | 140 ms, eğri `swap` | `Animated.timing` easing yok (CatalogMotion.tsx FadeMark:~25-30) |
| 9 | 7.1 Odadakiler'e geçiş | düzen/hareket | Odadakiler SAĞDAN İTEN sayfa, satırlar 30 ms arayla (en çok 5) çözülerek gelir | Odadakiler alt sayfa (Sheet), satırlarda kademe yok (features/district/People.tsx:37-45). Not: Odadakiler.dc.html panosu da alt sayfa çiziyor; 7.1 ile pano çelişiyor |
| 10 | B6.1 Süzülme (Profilim bileti) | hareket | kapsül 4 px, 1300 ms yarım tur, sürekli | Profil bileti kapsülü süzülmez (LivingLook.tsx; `FloatStage` yalnız Süsle'de, capsule.tsx:530) |
| 11 | B6.2 Göz kırpma | hareket | 160 ms, gözler .12'ye kapanır, 4–6 sn | 110 ms, tam kapanır (snapTo 0/1), 2.6–5.6 sn aralığı, bazen çift kırpma + bakış/göz devirme (LivingLook.tsx:30-45) |
| 12 | 6.5 Kategori çipi | doğrulanamadı | 140 ms swap + kaydırma | Süsle/Tüm aksesuarlar çip geçişi ayrıca izlenmedi (kitte `Chip`) |
Uyuyan: 1.4/1.5 menü yayı, ölçek .18, opaklık ilk %35, çıkış 150 ms leave; 2.1/2.2 dialog (240/150, .97, 12 px); 3.1-3.4 liste kayması/çıkışı/sayaç (ListMove.tsx); 4.1-4.4 DM düzenleme (Composer.tsx, ChatBubble.tsx); 5.1 şerit ölçeği 1.14/.9; 5.2 JUMP; 5.3 SHUFFLE; 6.1/6.2 sistem itişi; 6.4 "Kapsülüne tak" .4→1; 7.2 Seçenekler yeniden açılmaz (People.tsx yorumu; ÖNERİ işaretli, kodda uygulanmış); B6.3 efsanevi hale 2400 ms (theme/capsuleFx.ts); B6.4 yalnız ekran önde iken döner (`useLoopActive`).

## 72 Kapsülünü süsle · Renk sekmesi — project/SusleRenk.dc.html
Kod: app/(app)/(tabs)/profile/capsule.tsx (Editor), features/capsule/SusleTabs.tsx, SusleFilter.tsx, motion/SnapStrip.tsx, theme/capsuleEdit.ts, components/CapsuleHale.tsx
Öğe sayısı: 40 · uyuyor: 17 · fark: 22 · fazla: 3 · doğrulanamadı: 2
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Üst bar yan boşluk | ölçü | `.ptb` padding 0 20 | `barSide: 16` (capsuleEdit.ts) |
| 2 | Başlık metni | metin | "Kapsülünü süsle" | "Kapsülün" (tr.ts capsule.title; capsule.tsx PageTop); "Kapsülünü süsle" `capsule.edit` olarak var ama bu ekranda kullanılmıyor |
| 3 | Başlık yazısı | yazı | 700 19/24 ls -.3 | `pageBarTitle` 700 21/26 (auraKit.ts:197) |
| 4 | Kaydet düğmesi | ölçü | primary h 40, iç 18, 15/20 | `Btn bar=44`, minWidth 96 (capsule.tsx) |
| 5 | Sahne (hero) boyu | ölçü | 340×340 kutu, bar altı 10, kapsül resmi 290 yüksek | sahne 300 yüksek, kapsül `capsuleStage` 220, hale 258 (capsuleEdit.ts scene; auraKit.ts:972) |
| 6 | Mor hale | ölçü | 340 çap | 258 çap (CAPSULE_HALE ratio 340/290 ama kapsül 220'ye uygulanmış) (capsuleEdit.ts) |
| 7 | Kapsül gölgesi | fazla | yok | 120×16 nefes alan gölge (capsule.tsx FloatStage shadow; E.shadow) |
| 8 | "Hepsini çıkar"/"Rastgele" | yazı/ölçü | 600 13/16, iç 14/14, h 36, gap 6, ikon 16, koyuda #121614 + .08 çizgi | `coverBtn` 700 13.5/17, padLeft 12/padRight 14 (capsuleEdit.ts clear) |
| 9 | Düğmelerin üst boşluğu | boşluk | hero altı 12 | sahne altına yapışık, sahne 300 içinde (capsule.tsx) |
| 10 | Tepsi üst konumu | düzen | `top:528` | ≈434 (sahne 300 + panel top 18): tepsi ~94 px yukarıda |
| 11 | Tepsi zemini | renk | `--surface` düz (açık #FFF, koyu #121614) | açık `rgba(255,255,255,.72)`, koyu `rgba(27,33,31,.92)` (capsuleEdit.ts light/dark.panel) |
| 12 | Tepsi köşe/gölge/üst boşluk | ölçü | r 28, gölge `0 -6 24 .06`, padding-top 8, koyuda üst çizgi `rgba(255,255,255,.06)` | r 34, gölge `0 -10 30 .08` + iç ışık, padTop 16, koyuda çizgi yok (capsuleEdit.ts panel) |
| 13 | Sekme ikonu rengi | renk | seçili `a:#0E8745`, `b:#FF4F8B`; koyu `#3DDC84`/`#FF6FA0` | `color=c.ink`, `second=KIT.pink` (SusleTabs.tsx) |
| 14 | Sekme yazısı | yazı | 600 12/15, seçili de 600 | `eyebrow` 600 12/16, seçili `strong` (SusleTabs.tsx) |
| 15 | Sekme ikonları | doğrulanamadı | Renk (3 nokta), Göz, Baş, Yüz, Ağız, Gövde özel SVG | `SLOT_ICON` CapIcon adları (capsule.tsx); çizimler ayrıca karşılaştırılmadı |
| 16 | "Ağız" sekmesi ÖNERİ rozeti | davranış | ÖNERİ işaretli | Ağız sekmesi kodda tam özellik olarak var; rozet yok (ürün kararı) |
| 17 | Filtre çipleri | ölçü | h 28, iç 11, 600 12/16, zemin `--surface2` (koyu #1B211F), seçili `#031B0B`/beyaz (koyu .94) | kit `Chip` 36 yüksek, kendi iç boşluğu (SusleFilter.tsx) |
| 18 | Filtre satırı | boşluk | yan 20, çip–"Tümüne bak" gap 10, çip gap 6 | yan 22 (E.panel.side), gap `E.filter.gap*2`=12 |
| 19 | "Tümüne bak" | yazı | 700 13/16 | `capsuleChip` 700 14/18 (SusleFilter.tsx) |
| 20 | Seçenek adımı | ölçü | 76 daire, gap 18 (merkezden merkeze ≈100) | 84×0.9=75.6 uyuyor; adım 96 (stripStep) |
| 21 | Seçili seçenek | ölçü/halka | 88 daire, halka: 3 `--surface` boşluk + 3 pembe `#FF4F8B` (koyu #FF6FA0) | 84×1.14=95.8, halka 3 genişlik kenarda, boşluk 0 (KIT.size.boxRing 3, boxRingGap 0; auraKit.ts:980-985) |
| 22 | Seçenek zemini | renk | `--surface2` (#E6F0E8 / koyu #1B211F) | `tile` açık `rgba(3,27,11,.05)`, koyu `rgba(255,255,255,.06)` (capsuleEdit.ts) |
| 23 | Şeridin davranışı | düzen | üç seçenek ortalı, sabit (anlık görüntü) | kaydırılabilir `SnapStrip`, uçlar solar |
| 24 | Seçenek altındaki noktalar | fazla | yok | en çok 7 nokta, `E.dots` (capsule.tsx; capsuleEdit.ts) |
| 25 | Seçenek adı | uyuyor | 600 12/15, seçili 700, altı 6 | 600/700 12, gap 6 |
| 26 | Nadirlik elması (.r) | uyuyor | 9, r2, 6/6, 2 halka, Efsanevi #FFB547 Destansı #7B5CFF | `tierDot` aynı (capsuleEdit.ts) |
| 27 | "Aksesuarı çıkar" düğmesi | fazla | markup'ta yok (yalnız css `.rmv`) | aksesuar takılıyken gösterilir (capsule.tsx; tr.ts removeAccessory) |
| 28 | Koyu hâl tepsi çizgisi, çip/seçim koyu renkleri | koyu | bkz #11-#13, #17, #22 | bkz aynı satırlar |
Uyuyan: geri düğmesi soft 44, gap 12, hale halka oranları/renk/opaklık (22 %, 86 %/72 %, .45/.30, #8B6CFF), sekme satırı yan 12, sekme alt çizgi 1px, seçili sekme çizgisi 3 px 22 %–78 %, ikon 22/gap 3/üst 8/alt 9, sekme kenarı `hair`, "Tümü" ilk çip, "Tümüne bak" chevron 16 gap 2, filtre üst 12, düğme gap 8.

## Kapsam
| pano no | öğe sayısı | fark sayısı | okundu |
| --- | --- | --- | --- |
| 62b | 14 | 8 | evet |
| 62c | 28 | 13 | evet |
| 62d | 10 | 7 | evet |
| 62e | 9 | 8 | evet |
| 63 | 22 | 9 (+1 özellik yok) | evet |
| 64 | 20 | 6 (+2 kural) | evet |
| 64a | 26 | 6 (+2 özellik yok, 2 kural) | evet |
| 65 | 6 | 8 | evet |
| 66 | 14 | 8 | evet |
| 66a | 14 | 8 | evet |
| 70 | 33 | 1 | evet |
| 71 | 33 | 12 | evet |
| 72 | 40 | 22 | evet |
