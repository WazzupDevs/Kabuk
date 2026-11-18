# Pano–kod denetimi, grup 10 (13 pano)

Notlar: Sayılar öğe sayımıdır (durum çubuğu ve telefon çerçevesi hariç). "Kayıtlı karar" = `docs/design/yeni-arayuz/davranis-eksikleri.md` F satırları ve `docs/decisions/yeni-tuval.md`; bilinçli sapmalardır ama yönerge gereği yine bulgudur (pano geçerli). Dar panolarda (320 dp) yazı ölçekleri 1,3 kat; taban değer = pano px / 1,3 (ör. 20,8 -> 16). Ortak parça farkları (sekme çubuğu alt boşluğu, ⋮ düğmesi, sohbet çubuğu) ilk panoda tam yazıldı.

## 86 Yükleniyor · liste (Mesajlar) — YukleniyorListe.dc.html
Kod: `app/(app)/(tabs)/messages/index.tsx` (Chats, `EmptyState kind="loading"`), `src/components/EmptyState.tsx` (Loading), `src/components/Loader.tsx`, `src/components/TabBar.tsx`, `src/motion/TabBar.tsx`
Öğe sayısı: 14 · uyuyor: 11 · fark: 1 · fazla: 0 · doğrulanamadı: 2
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Yükleniyor işareti (Buluş, 22×50) | düzen | mutlak merkez y=470 (üst bar 60 + başlık 44 + alan 48 + seg 44 + boşluklar -> seg altından ≈225 aşağıda; alt sekme çubuğuyla seg arasının ortası), yatay ortalı, içeriğin ortasında | seg'in hemen altı: `mt-12` (48) + `stateLoadTop` 18 = seg altından 66 aşağıda (index.tsx:174-177, EmptyState.tsx Loading `paddingTop`, auraKit.ts:965); içeriğin ortasında değil, listenin tepesinde |
| 2 | Alt sekme çubuğu alt boşluğu | ölçü | `.tb` bottom 30 (844 pano, sistem çubuğu payı yok) | `AURA.tabBar.bottom` 12 + `insets.bottom` (aura.ts:93-119); DOĞRULANAMADI: ekranın alt payı cihaza bağlı, panoda 30'un neye denk geldiği yazılı değil |
| 3 | Sekme etiketi yazısı | yazı | 10/13 600, ls .1 | `variant="tabLabel"` (src/motion/TabBar.tsx:272); DOĞRULANAMADI: tabLabel token'ının sayısı okunmadı |

## 87 Yükleniyor · profil — YukleniyorProfil.dc.html
Kod: `app/(app)/people/[publicId].tsx:80-109` (Screen + `ProfileTopBar` + `<Loader/>`), `src/features/profile/ProfileCard.tsx:30`
Öğe sayısı: 4 (kapak resmi + alt geçiş, geri düğmesi, yükleniyor işareti) · uyuyor: 1 · fark: 2 · fazla: 0 · doğrulanamadı: 1
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Kapak resmi (yükleme sırasında) | eksik | üstte 250 yüksek kapak (blob a84d04f0…, merkez %40, üstte rgba(0,0,0,.28)→0 %34, altta zemine solma %55→%100), geri düğmesinin arkasında | yok: yükleme `Screen` içinde düz zemin üstünde yalnız üst çubuk ve işaret (people/[publicId].tsx:80-97). Kapak yalnız veri gelince (`CoverPage`, :76) çiziliyor |
| 2 | Yükleniyor işareti yeri | düzen | mutlak merkez y=470, ortalı | `mt-16` (64) altında üst çubuktan hemen sonra (people/[publicId].tsx:91-93) ≈ y 160 |
| 3 | Geri düğmesi görünümü | renk | `.tp .round` rgba(255,255,255,.78) + 1px rgba(255,255,255,.9) kenar (koyu: rgba(18,22,20,.72)/rgba(255,255,255,.12)); üstten 52, soldan 16 | `<Round glassy>` (ProfileCard.tsx:40); DOĞRULANAMADI: glassy dolgu değerleri kapak üstündeki hâl için okunmadı |

## 88 Yükleniyor · sohbet (DM) — YukleniyorSohbet.dc.html
Kod: `app/(app)/(tabs)/messages/[threadId].tsx:496-499, 537-575`, `src/components/ChatTopBar.tsx`, `src/components/Composer.tsx` (CapsuleBar), `src/theme/dm.ts`
Öğe sayısı: 16 (duvar kâğıdı, üst bant, geri, kapsül çubuk: yüz/ad/"Profili gör"/ara/⋮, işaret, alan: emoji/yer tutucu/ek/kamera/ses) · uyuyor: 8 · fark: 3 · özellik yok: 5 · doğrulanamadı: 1
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | "Sohbette ara" düğmesi (kapsül çubuğunda) | özellik yok | 40×44 ikon düğmesi, ad altında "Profili gör"ün sağında | yok; DM'de sohbet içi arama ucu ve ekranı yok (tr.ts:317 yalnız Mesajlar listesi araması). ChatTopBar `actions` yalnız ⋮ (threadId.tsx:566-577) |
| 2 | ⋮ düğmesi boyu | ölçü | `.who .ib` 40×44 | `DM.bar.more` 44 (dm.ts, [threadId].tsx:568) |
| 3 | Mesaj alanında emoji düğmesi | özellik yok | alanda solda 40×40 emoji ikonu | yok (dm.ts:86 "the board draws … its emoji, which the app has not") |
| 4 | Mesaj alanında ek (dosya) düğmesi | özellik yok | 40×40 ataç | yok; fotoğraf gönderimi başka yolda (DmFotoMesaj panosu başka grup), alanda düğme yok |
| 5 | Mesaj alanında kamera düğmesi | özellik yok | 40×40 | yok |
| 6 | Mesaj alanında sesli mesaj düğmesi | özellik yok | 40×40 mikrofon; pano gönder düğmesi çizmiyor, yerine mikrofon | yok; ayrıca uygulamada gönder düğmesi yazı yokken gizli (Composer.tsx:324-328 `shown`) |
| 7 | Yer tutucu metni | metin | "Mesaj yaz" | "Mesaj yaz…" (tr.ts:701, tr.dm.placeholder) |
| 8 | Alan iç boşluğu | boşluk | 6 sol/sağ (ikonlar içeride), yer tutucu 4 daha içeride | `DM.composer.padLeft` 20 (dm.ts:70, Composer.tsx:446) |
| 9 | Duvar kâğıdı | resim | blob 564f379c… (açık) / e7ec12cc… (koyu) tam ekran | kod elle çizilen vektör duvar (ChatWallpaper.tsx); DOĞRULANAMADI: blobun BLOBLAR.md karşılığı/depoda yok |

## 89 320 dp, en büyük yazı · Mesajlar — DarMesajlar.dc.html
Kod: `app/(app)/(tabs)/messages/index.tsx`, `src/features/friends/InboxRows.tsx`, `src/theme/messages.ts`
Öğe sayısı: 33 (başlık, 2 düğme + nokta, arama, seg 2+rozet, "Sabitlenenler" etiketi+ikon, 5 satır × (yüz, ad, saat, önizleme, rozet/tik/sessiz ikonu), Arşivlenenler satırı 4 öğe, tab çubuğu 5) · uyuyor: 24 · fark: 4 · özellik yok: 1 · doğrulanamadı: 1
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Son mesaj önizlemesi, dar | davranış | `.pv` white-space normal: metin satıra sarar (19,5/28,6), sağda 44 px solma maskesi | tek satır `lines={1}` (InboxRows.tsx:349); CLAUDE.md önizlemeye `numberOfLines` izni veriyor ama pano sarmayı çiziyor |
| 2 | Sessize alınmış sohbet işareti (Furkan satırı, ad yanında 16 ikon "Sessizde") | özellik yok | ad satırında 16×16 çan+çizgi ikonu | yok; DM sessize alma yok (davranis-eksikleri F: "karar verilmedi"); InboxRow'da sessiz alanı yok (InboxRows.tsx:262-293) |
| 3 | Bölüm etiketi "Sabitlenenler" | yazı | 15,6/20,8 600 ls .24 (=12/16 + ölçek) | `v="eyebrow"` dar durumda `EYEBROW_NARROW` 13/17 (auraKit.ts:374-376, kit.tsx:107): ölçek 1,3 ile 16,9 olur, pano 15,6; küçük fark |
| 4 | Okunmamış sayı rozeti | yazı | `.cnt` 700 14,3 (=11 × 1,3), satır yüksekliği 26 sabit 20 kutu içinde | Badge bileşeni (kit); DOĞRULANAMADI: rozetin dar ölçekte büyüyüp büyümediği okunmadı |
| 5 | Sekme çubuğu etiketi (dar) | yazı | 10/13 nowrap sabit, ölçeklenmez | `adjustsFontSizeToFit`, `numberOfLines=1`, en az 0,7 (src/motion/TabBar.tsx:271-281): etiket büyük yazıda büyüyüp küçülüyor, panoda 10 sabit |
| 6 | Arama alanı yüksekliği | ölçü | 48 (dar durumda 56 değil) | `KIT.size.field` 48 (messages/index.tsx:112) uyuyor; not: auraKit `fieldNarrow` 56 bu ekranda kullanılmıyor: uyuyor |

## 90 320 dp, en büyük yazı · Profilim — DarProfilim.dc.html
Kod: `app/(app)/(tabs)/profile/index.tsx`, `src/features/profile/IdentityTicket.tsx`, `src/features/gifts/SetCard.tsx`, `src/theme/profileCover.ts`, `src/theme/ownProfile.ts`, `src/components/ButtonRow.tsx`
Öğe sayısı: 27 (kapak, ayarlar düğmesi, foto "G", ad, bio, "Profili düzenle", "5 arkadaş" (yüz yığını 2, yazı, ok), bilet (damga kapsül, "No. uc44", "ANONİM KİMLİĞİN", nick, "Yeni ad · 12 gün sonra", delikli çizgi), "Kapsülünü süsle", "SET BALONU", "Ninja balonu açık", açıklama, 3 parça (resim, ad, alt ad), fade, tab çubuğu 5) · uyuyor: 12 · fark: 12 · fazla: 3 · doğrulanamadı: 1
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Kapak yüksekliği (dar) | ölçü | 200 (Dar'da `.cov{height:200}`; 390'da 236) | `OWN.cover` 236 + dy, dar için ayrı değer yok (profileCover.ts:106, index.tsx:116-117) |
| 2 | Kapak alt kenarı | düzen | alt köşeler 28 yuvarlak, sert kenar, zemine solma yok | zemine solma + bulanık kopya (`ProfileCoverArt`, ProfileCover.tsx:56-120, footFrom 0.5) ; köşe yuvarlama yok |
| 3 | Foto konumu | düzen | foto 112, kapağı 60 bindirir: dar merkez y = 200-60+56 = 196 | `photoAt.y` 232 (+dy) sabit (profileCover.ts:108); dar kapak 200 olunca 36 aşağıda |
| 4 | Alt panel (sürüklenen sayfa: 34 yuvarlak, tutamaç 40×5, pembe+yeşil ışık, gölge yukarı) | fazla | yok: içerik zeminde düz akar, panel ve tutamaç çizili değil (ProfilBen'de de yok) | `panelRadius` 34, grab, `look.panel` gradyanı (index.tsx:235-285, ownProfile.ts) |
| 5 | Ad yazısı | yazı | 600, 28 tabanı (36,4/44,2 dar), ls -.6 | `profileName` 800, 31/39, ls -.03em (auraKit.ts:159) |
| 6 | Düğme yüksekliği (dar, alt alta) | ölçü | min 52 (`min-height:52`) | `KIT.size.btnRow` 48 (index.tsx:176,193, auraKit.ts:938) |
| 7 | "Profili düzenle" / "N arkadaş" arası boşluk | boşluk | 10 | 10 (`B.buttonsGap`): uyuyor (not) |
| 8 | Arkadaş yüz yığını | ölçü | yüz 32 (içi 28; 2 canvas kenarlığı), -10 bindirme | 28 + 2×2,5 halka = 33, adım 20 (bindirme 13) (index.tsx:355-361, profileCover.ts:124-128) |
| 9 | Bilet yüksekliği (dar) | ölçü | sabit 150 (svg 280×150, cep yolu 150) | `minHeight` 128, büyür (IdentityTicket.tsx:96, TICKET.height 128) |
| 10 | "Kapsülünü süsle" düğmesi yeri | düzen | biletin dışında, bileti 12 altında tam genişlik birincil düğme (`.tbtn`, min 52, ikon 20) | bilet içinde, yazının altında küçük düğme (IdentityTicket.tsx:224-240) — dar durum için ayrı yerleşim yok |
| 11 | Bilet yazıları | yazı | "ANONİM KİMLİĞİN" 700 11 ls 1,4px; "terra-uc44" 800 20; "Yeni ad · 12 gün sonra" 500 13; damga "No. uc44" 700 12 ls .2 | kicker 800 11,5 ls .1em (auraKit.ts:166); nick 800 20; not 600 13 (:168); No. 700 13 (:165) |
| 12 | "SET BALONU" etiketi | yazı | 600 12/16 ls .24 | `eyebrow` (uyuyor); dar durumda 13/17 (EYEBROW_NARROW) |
| 13 | "Ninja balonu açık" etiketi | yazı | 600 12/16, dolgu success-soft, iç boşluk 4×10, kapsül | `setCount` 800 12,5/16 (auraKit.ts:170), yükseklik 26, yan 10 (ownProfile.ts SET_CARD.count) |
| 14 | Set açıklaması | yazı | 500 14/20 muted, üstten 6 | `setNote` 500 13,5/19 (auraKit.ts:171) |
| 15 | Parça adı ve alt adı | yazı | ad 600 14/18; alt ad 500 12/16 | ad `setSlot` 700 13/17 (:172); alt ad `fine` 13/18 |
| 16 | Parça ızgarası | düzen | dar 2 sütun, 84 yuvarlak resim | `narrow ? '50%'` 2 sütun, 84 (SetCard.tsx): uyuyor |
| 17 | Ayarlar düğmesi görünümü | renk | `.tp .round` rgba(255,255,255,.82)+kenar, ikon rengi #031B0B/#4A6550 | `Round glass="clear"` (index.tsx:325-333); DOĞRULANAMADI: clear camın kapak üstündeki dolgusu |
| 18 | Üst "sbar2" bulanık bant (CSS'te tanımlı) | davranış | markup'ta yok, kullanılmıyor | `BarBand` kaydırınca var (kaydırma davranışı, pano çizmiyor): fazla sayılmadı |
| 19 | Kimlik biletinde "Yeni ad" metni | metin | "Yeni ad · 12 gün sonra" | "Yenile · 12 gün sonra" (tr.ts:849 `nickRenewIn`) |
| 20 | Sekme çubuğu | ölçü | bkz. 86 #2, #3 | bkz. 86 |
| 21 | Bilet sağ gölgesi (pembe/mor baskı) | ölçü | svg 4,5 kaydırmalı, `fill #FF4F8B` (koyu #7B5CFF) | `TICKET_TONE` print aynı: uyuyor |

## 91 320 dp, en büyük yazı · Kapsülünü süsle — DarSusle.dc.html
Kod: `app/(app)/(tabs)/profile/capsule.tsx`, `src/features/capsule/SusleTabs.tsx`, `SusleFilter.tsx`, `src/theme/capsuleEdit.ts`
Öğe sayısı: 24 (geri, başlık, Kaydet, hero kapsül+hale, "Rastgele", tepsi, sekme "Gövde", süzgeç çipleri 7, "Tümüne bak", 3 seçenek (resim+ad), seçili halka, nadir işareti, "Aksesuarı çıkar") · uyuyor: 9 · fark: 9 · özellik yok: 1 · doğrulanamadı: 3 · fazla: 2
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Sayfa başlığı | metin | "Kapsülünü süsle" | "Kapsülün" (tr.ts:736 `capsule.title`, capsule.tsx:535) |
| 2 | Başlık yazısı | yazı | 700 19 tabanı (dar 23/28), ls -.3 | `PageTop` başlığı (kit başlık); DOĞRULANAMADI: PageTop `inline` başlık tipi okunmadı |
| 3 | Kaydet düğmesi yüksekliği | ölçü | 40 (`.ptb .btn{height:40}`, 18 yan boşluk) | `bar={KIT.size.round}` 44 (capsule.tsx:546) |
| 4 | Seçenek seçici: ızgara yerine şerit | düzen | 3 yuvarlak yan yana ızgara (`.grid`), normal 76, seçili 88 + 3+3 pembe halka, ad altında, ızgara ortalı, dar boşluk 10 | kaydırmalı deneme şeridi (`SnapStrip`, 84 yuvarlak, adım 96, ortadaki 1,14, yanlar 0,9, nokta göstergesi) (capsule.tsx:664-700, capsuleEdit.ts:79-86, auraKit.ts stripItem/stripStep). Ayrıca KapsulSusle panosu da aynı ızgarayı çiziyor |
| 5 | Seçenek ad yazısı | yazı | 600 12 tabanı (dar 15,6/19,5), seçilince 700, sarar | tek satır, küçülür, 16 satır (capsuleEdit.ts:81 `nameLine` 16, `nameScale` 1,3) |
| 6 | Nadir işareti (Efsanevi: dönük kare 9×9, sağ üst 6) | ölçü | 9×9, 6 içeri, 2 halka (zemin rengi) | `tierDot` 9, inset 6, ring 2 (capsuleEdit.ts:75): uyuyor |
| 7 | Seçili seçenek halkası | renk | pembe #FF4F8B (koyu #FF6FA0), 3 yüzey + 6 halka | `KIT.pink` (capsule.tsx:696 ringColor): DOĞRULANAMADI: halkanın 6 dp yarıçapı şeritte aynı mı |
| 8 | Süzgeç çipleri yüksekliği | ölçü | 28 (`.flt span`, 600 12 tabanı) | `Chip` kit 36 (SusleFilter.tsx:46-53, KIT.size.chip) |
| 9 | Süzgeç çipleri metinleri | metin | Tümü, Zarif, Çiçek, Sokak, Prenses, Gece, Balo | veriye bağlı paketler (`packs`), "Tümü" `allPacks`; DOĞRULANAMADI: paket adları içerikten |
| 10 | "Aksesuarı çıkar" düğmesi | düzen | tepsinin dibine sabit, soldan/sağdan 16, alttan 22, min 52, tek satır nowrap, solda ikon 18 | tepsi içinde şeridin altında ortalı `Btn` (48/56 boyu), yalnız aksesuar giyiliyken (capsule.tsx:703-717) |
| 11 | "Hepsini çıkar" düğmesi | fazla | yok (Dar'da yalnız "Rastgele"; 390 KapsulSusle'de var) | `clearAll` düğmesi dar ekranda da var (capsule.tsx:610-624): DOĞRULANAMADI: Dar panonun bilerek mi çizmediği belli değil |
| 12 | Sekme çubuğu sekmeleri | düzen | yalnız tek sekme çizili ("Gövde") | altı sekme (SusleTabs); DOĞRULANAMADI: Dar pano altı sekmeyi göstermiyor |
| 13 | Tepsi üstü / hero | ölçü | tepsi üst 452, hero 240 kutu, kapsül 204 | kapsül sahnesi 300 yüksek, 220 kapsül, tepsi `E.panel.top` 18 altında akışta (capsuleEdit.ts:35-42); sahne ekran kısaldıkça küçülüyor: dar için pano değeri yok |
| 14 | Alt sekme çubuğu | fazla | pano çizmiyor (`nav` yok) | sekme çubuğu bu ekranda gizli mi: DOĞRULANAMADI |
| 15 | Rastgele düğmesi | ölçü | 36→dar min 44, ikon 16 | `Btn sm` 36 (capsule.tsx:626-642): dar için 44 yok |

## 92 320 dp, en büyük yazı · Odadakiler — DarOdadakiler.dc.html
Kod: `app/(app)/district/room.tsx`, `src/features/district/People.tsx`, `src/features/district/RoomSheets.tsx`, `src/theme/chatLook.ts`, `src/theme/semt.ts`, `src/components/ChatTopBar.tsx`, `IdentityToggle.tsx`, `Composer.tsx` (PillBar)
Öğe sayısı: 42 (üst çubuk: geri, başlık, alt başlık, anahtar 2, ⋮; süre çipi 2; boş kart 3; öneri çipleri 3; yazı çubuğu 4; örtü; sayfa: tutamaç, geri, başlık, alt başlık, "Sen" satırı 3, "Profiliyle · 2", Elif 4, Mert 4, "Anonim · 3", 3 anonim satır × 4) · uyuyor: 17 · fark: 12 · özellik yok: 8 · kural: 4 · doğrulanamadı: 1
Not: bu panonun ortak (390 px'te de aynı) farkları bkz. 94; burada Dar'a özgü olanlar tam yazıldı.
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Üst çubuk alt başlığı ("Sadece sen buradasın") | eksik | başlığın altında 15,6/20,8 (13 tabanı) 500 muted | yok: `ChatTopBar` semt için `subtitle` almıyor (room.tsx:474-497). yeni-tuval.md "Tuval kararları 3" (6 kişi burada): KURAL 4 (sayı yalnız Odadakiler listesinde; karar bekliyor) |
| 2 | Başlık sarması | davranış | `.who .nm b` white-space normal (sarar) | `titleLines={1}` + sığdırma (room.tsx:476): tek satıra küçülür |
| 3 | Yazı çubuğu emoji düğmesi | özellik yok | 40×40 emoji | yok (bkz. 88 #3) |
| 4 | Yazı çubuğu yüksekliği | ölçü | alan 52, gönder 52 | alan 44 (`KIT.size.composerField`), gönder 44 (`composerSend`) (Composer.tsx:73-77, PillBar; auraKit.ts:1106-1107) |
| 5 | Gönder düğmesi pasif hâli | davranış | gri `--disabled` yuvarlak, hep görünür | PillBar'da `.send.off` var (uyuyor); not |
| 6 | Öneri çipleri ("Selam Beylikdüzü! 👋", "Bu akşam ne yapıyorsunuz?", "Önerin var mı?") | özellik yok | 36 yüksek beyaz çipler, kayar | yok (room.tsx:556-557 yorum "not drawn (no behaviour is given them)") |
| 7 | Boş kart metni | metin | "…İlk mesajı sen yaz, gelenler görür." (virgül) | "…İlk mesajı sen yaz; gelenler görür." (tr.ts:1205) |
| 8 | Boş kart yazı boyları | yazı | başlık 700 16/22; cümle 500 13/18 (Dar'da 20,8/16,9) | `v="h3"` (16/22 600) ve `fine` (ChatEmptyCard.tsx:57-63): başlık ağırlığı 600 ≠ 700 |
| 9 | Süre çipi | ölçü | 32 yük., sol 8/sağ 12, 18 ikon, 700 13 ("2 sa 1 dk" kalın, "kaldı" 500 muted), ortalı, üstten 116 | `timeChip` 32/8/12/6/18 (chatLook.ts:60): uyuyor; yatay/dikey konum DOĞRULANAMADI (güvenli alan) |
| 10 | Kimlik anahtarı (`.tog`) | ölçü | 36 yuva, 3 iç boşluk, 2 aralık, yüz 32, seçili halka 2,5 yeşil DIŞTA (box-shadow), seçili olmayan opaklık .55, seçilinin arka planı yok, kutu zemin surface2 | yuva 36 / pad 3 (chatLook.ts:17); halka 2 İÇTE ve seçilinin arkası beyaz, soluk 0,45 (IdentityToggle.tsx:85-100, auraKit.ts:803-812) |
| 11 | Sayfa başlığı | yazı | 700 21/26 ls -.3 (Dar 27,3/33,8) | `title` 600 21/27 ls -.015em (auraKit.ts:229, motion/Sheet.tsx:196): ağırlık 600 ≠ 700 |
| 12 | Sayfa alt başlığı konumu | düzen | başlığın 2 altında, başlıkla "Seçeneklere dön" yuvarlağı yan yana | sayfa gövdesinin ilk satırı olarak başlıktan ayrı (People.tsx:78-80); başlık altında ayrı `fine` |
| 13 | "Seçeneklere dön" yuvarlağı (40×40, geri oku) | eksik | başlığın solunda | yok; sayfanın kendi kapatması var, kapanınca Seçenekler açılmaz (kayıtlı karar, davranis-eksikleri F:68) |
| 14 | "Arkadaş ekle" düğmesi (profilli satırda 40×40 yeşil +kişi) | özellik yok | Elif, Ayşe, Burak satırlarında | yok; profilli satır yalnız profili açar (kayıtlı karar) |
| 15 | Satır ⋮ düğmesi ("Seçenekler: profili gör, sessize al, şikâyet et") | özellik yok | her satırda sağda 40×40 | yok (OdaMenu alınmadı, kayıtlı karar) |
| 16 | Anonim satırda ⋮ (sessize al, şikâyet et) ve "Sessize aldın" | kural | anonim satırda menü ve sessize alma durumu | KURAL 4: anonim satır hesaba/nick'e bağlanmaz, sessize alma taşımaz; kod bunu doğru biçimde çizmiyor (People.tsx:152-157) |
| 17 | Anonim satır yüzleri | kural | her anonim satırda ayrı kapsül resmi (8 farklı blob) | KURAL 4: anonim satır "yalnızca geliş zamanı taşıyan satır, kapsül taşımaz"; kod herkese aynı işaret (`Avatar kind="default"`, People.tsx:175) |
| 18 | "Sen" anonimse yüz | resim | kendi kapsülün | `LookAvatar` kendi kapsül (People.tsx:166-169): uyuyor |
| 19 | Grup etiketleri ("Profiliyle · 2", "Anonim · 3") | yazı | 600 12/16 ls .24 (Dar 15,6) margin 14 4 4 | `v="tag"` 12/16 600, ls yok (People.tsx:100-109, auraKit tag): harf aralığı .24 eksik |
| 20 | Kişi sayısı alt başlığı | kural | "Beylikdüzü · 6 kişi burada" | KURAL 4 notu: kod aynı yazıyor (tr.ts:1216); kural 4 semt maddesi sayıyı Odadakiler listesine izin veriyor: uyuyor |
| 21 | Satır alt yazısı (geliş zamanı) | davranış | 390'da tek satır nowrap kesilir; Dar'da sarar | `fine` sarar (People.tsx:196): uyuyor |
| 22 | Anonim satır alt yazısı "40 dk önce geldi · Sessize aldın" | kural | anonimde sessize alma | kod yalnız profilli satırda sessize alma yazıyor (People.tsx:154-156): uyuyor (kural gereği) |

## 93 320 dp, en büyük yazı · Oyun lobisi — DarOyunLobi.dc.html
Kod: `src/features/games/GameLobby.tsx`, `src/features/games/vampir/VampirGame.tsx:193-230`, `src/theme/lobby.ts`, `src/i18n/tr.ts` (games, vampir)
Öğe sayısı: 45 (kapat, afiş, ad, kişi aralığı, sohbet düğmesi, 2 kural çipi, "Oyuncular", "10/12 hazır" hapı (halka+sayı), 12 satır × (yüz, hazır tiki, ad, "Bekleniyor"/"Masa sahibi", ⋮), "Gözlemciler" satırı (disk, başlık, alt yazı, "Gözlemci ol"), "Nasıl oynanır" satırı (disk, başlık, alt yazı, ok), alt not, "Oyunu başlat") · uyuyor: 19 · fark: 12 · özellik yok: 8 · doğrulanamadı: 0
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Başlık satırı dar yerleşimi | ölçü | kenar 12, aralık 8, üstte hizalı (flex-start), afiş 60×40 yuvarlak 12 | kenar 16, aralık 12, ortalı hizalama, afiş 84×54 yuvarlak 14, dar için ayrı değer yok (GameLobby.tsx:63-96, lobby.ts:12) |
| 2 | Gövde kenarları (dar) | boşluk | sol/sağ 16 | `KIT.size.side` 20 (GameLobby.tsx:98-104) |
| 3 | Alt çubuk kenarı (dar) | boşluk | 16 yan, alt 30, üst 12, düğme min 56 | yan 20, alt `insets.bottom + 16`, üst 12 (GameLobby.tsx:150-156) |
| 4 | Oyuncular başlığı sağı | özellik yok | "10/12 hazır" hapı: ilerleme halkası 20, kalın sayı, "/12", "hazır"; 30 yüksek; tam dolunca success-soft | yok; kod `12 kişi` düz metin (tr.ts:1288, GameLobby.tsx:LobbyCard `roomCount`); kayıtlı karar: lobide hazır yok (sunucuda lobi hazırlığı yok) |
| 5 | Satırda hazır tiki (yüzün sağ altında 16 yeşil daire, beyaz tik) | özellik yok | 10 kişide var | yok (kayıtlı karar) |
| 6 | "Bekleniyor" alt yazısı | özellik yok | 2 satırda adın altında | yok (kayıtlı karar) |
| 7 | Satır ⋮ düğmesi (32×32, "… için seçenekler") | özellik yok | 11 satırda | yok (kayıtlı karar: kişi eylemi yok) |
| 8 | "Masa sahibi" alt yazısı rengi | renk | `--on-success-soft` 600 11 tabanı | `VENUE[scheme].here.ink` `roomOwner` 600 11 (GameLobby.tsx:360-362); DOĞRULANAMADI sayısal renk eşitliği okunmadı |
| 9 | Gözlemciler alt yazısı | metin | "İzler, puan almaz · 0 kişi" | "İzler, puan almaz." (tr.ts:1435 `watchersNote`); sayı yok (kayıtlı karar) |
| 10 | Gözlemciler satırı dar sarma | davranış | `.lr` flex-wrap: "Gözlemci ol" metnin altına iner, dikey 8 | sarma yok: düğme sağda, metin daralır (GameLobby.tsx:LobbyRow, :471-493) |
| 11 | "Nasıl oynanır" satırı | özellik yok | alt yazı "Roller, gece ve gündüz, kazanma" + sağda ok (18) | alt yazı olarak kuralın tüm metni (tr.ts:1437 `how`), ok yok (kayıtlı karar) |
| 12 | Alt not metni | metin | "2 kişi bekleniyor. Herkes hazır olunca başlatabilirsin." | "Herkes hazırsa oyunu başlat." (tr.ts:1286); uyarı "En az N oyuncu gerekir." (hazır olmama durumu yok) |
| 13 | "Oyunu başlat" düğmesi | ikon | solda oynat ikonu 20, min 56, kapalı (primary off) | ikon yok (ikon setinde yok, kayıtlı karar), `tall` 56 |
| 14 | Kişi satırı ad kesme | davranış | `white-space:nowrap!important`, kesilir | `lines={1} fit` küçülür (GameLobby.tsx:LobbyPeople) |
| 15 | Alt sekme çubuğu | düzen | gizli (`display:none`) | oyun lobisinde sekme çubuğu gizli: DOĞRULANAMADI → uyuyor varsayımı yok, GameLobby kendi ekranı |
| 16 | Kişi satırı ayırıcı | düzen | tek sütun, 2. satırdan itibaren çizgi, 46 soldan | tek sütun (narrow), `i > 0` çizgi `face + 10` = 46 (GameLobby.tsx): uyuyor |
| 17 | Gövde üst konumu | ölçü | gövde top 176 (başlık 52+… sabit), alt 186 sınırlı, taşan gizli | başlık altında 18, kaydırılabilir `ScrollView`, taşan kayar (GameLobby.tsx:99-104) |

## 94 Odadakiler · profilinle görünüyorsun — OdaProfilli.dc.html
Kod: bkz. 92
Öğe sayısı: 44 · uyuyor: 18 · fark: 11 · özellik yok: 9 · kural: 4 · doğrulanamadı: 2
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Üst çubuk alt başlığı | eksik | "Sadece sen buradasın" 500 12/16 | bkz. 92 #1 (room.tsx:474-497: `subtitle` yok). KURAL 4 notu |
| 2 | Anahtar (Profilinle seçili) | ölçü/renk | bkz. 92 #10 | bkz. 92 #10 |
| 3 | Yazı çubuğu 52/52 ve emoji | ölçü/özellik yok | bkz. 92 #3, #4 | bkz. 92 |
| 4 | Öneri çipleri | özellik yok | bkz. 92 #6 | bkz. 92 |
| 5 | Boş kart metni | metin | bkz. 92 #7 | bkz. 92 |
| 6 | Sayfa başlığı ağırlığı | yazı | 700 21/26 | 600 21/27 (bkz. 92 #11) |
| 7 | Sayfa alt başlığı | yazı | 500 13/18, başlığın 2 altında | `fine` 13/18 ayrı satır, 12 aşağıda `P.top` (People.tsx:79-80) |
| 8 | "Seçeneklere dön" yuvarlağı | eksik | 40 | yok (bkz. 92 #13) |
| 9 | "Sen" satırı: "Profilinle görünüyorsun" | metin | aynı | tr.ts:1222 aynı: uyuyor |
| 10 | "Sen" satırı yüzü halkası | ölçü | 2,5 yeşil `box-shadow` dışta | `ring` 2,5 `colors.accent` `borderWidth` dışta `margin -2.5` (People.tsx:119-128): uyuyor |
| 11 | "Arkadaş ekle" düğmesi | özellik yok | bkz. 92 #14 | yok |
| 12 | Satır ⋮ menüsü | özellik yok | bkz. 92 #15 | yok |
| 13 | Anonim satırlarda ⋮ ve "Sessize aldın" | kural | bkz. 92 #16 | KURAL 4 |
| 14 | Anonim satır yüzleri farklı | kural | bkz. 92 #17 | KURAL 4 |
| 15 | Anonim satır adı "Anonim" 600 16/20 | yazı | `.pr p` 600 16/20 | `dmName` 600 16/20 (People.tsx:136): uyuyor |
| 16 | Satır alt yazısı 500 13/17 | yazı | 13/17 | `fine` 13/18: satır yüksekliği 17→18 fark |
| 17 | Etiket harf aralığı | yazı | ls .24 | yok (bkz. 92 #19) |
| 18 | Sessize alınmış satır soluk (profil yüzü %45) | düzen | `.pr.mt .pav{opacity:.45}`, ad muted | yok: kod sessize alınanı soluklaştırmıyor, yalnız alt yazıda "Sessize aldın" (People.tsx:139-157) — profilli satırda anlamlı |
| 19 | Zaman çipi alt/üst konum | ölçü | bkz. 92 #9 | bkz. 92 |

## 95 Odadakiler · uzun liste, kaydırılmış — OdaUzun.dc.html
Kod: bkz. 92
Öğe sayısı: 52 (4 profilli satır, 8 anonim, 2 etiket, kaydırılmış konumda üst −22) · uyuyor: 24 · fark: 6 · özellik yok: 7 · kural: 3 · doğrulanamadı: 1
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | "Sen" satırı ve "Profiliyle · 2" etiketi kaydırılıp üstte kayboluyor (`.scr2 top:-22`) | davranış | liste tek parça kayar, "Sen" satırı kayar | `PeopleBody` `Sheet` içeriği (motion/Sheet kaydırma); DOĞRULANAMADI: sayfanın içeriği kaydırıldığında "Sen" satırının da kaydığı doğrulanmadı |
| 2 | Alt başlık "24 kişi burada" | kural | "Beylikdüzü · 24 kişi burada" | tr.ts:1217 aynı: uyuyor (kural 4 Odadakiler izni) |
| 3 | Etiket "Anonim · 16" (gruplarda "Profiliyle" etiketi yok, ilk dört satır etiketsiz) | düzen | pano ilk 4 profilli satırdan önce etiket yok (kaydırıldı) | kod etiketi her zaman çiziyor; kaydırılmış hâl, uyuyor |
| 4 | Profilli satırlarda ⋮ (3'ünde "Arkadaş ekle" yeşil) | özellik yok | Can, Zeynep ⋮; Ayşe, Burak "Arkadaş ekle" | yok (bkz. 92 #14, #15) |
| 5 | Anonim satır ⋮ ve farklı kapsüller (8 anonim, 4 farklı blob) | kural | KURAL 4 (bkz. 92 #16, #17) | KURAL 4 |
| 6 | Diğer öğeler (üst çubuk, çip, boş kart, çubuk, öneri) | — | bkz. 92 #1-#12 aynı farklar | bkz. 92 |

## 96 Odadakiler · satır ⋮ menüsü — OdaMenu.dc.html
Kod: bkz. 92; menü kodda yok
Öğe sayısı: 48 (OdaProfilli'nin tamamı + seçili satır (surface2, 16 yuvarlak) + açılır menü: "Profili gör", "Sessize al", "Şikâyet et") · uyuyor: 18 · fark: 5 · özellik yok: 12 · kural: 3 · doğrulanamadı: 0
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Satır ⋮ açılır menüsü (256 geniş, 26 yuvarlak, 8 iç boşluk, sağdan 20, üstten 574) | özellik yok | "Mert için seçenekler" menüsü: 3 satır (min 48, ikon 22, 14 aralık, 600 16/20), "Şikâyet et" kırmızı ve üstten 6 | yok; profilli satır dokununca doğrudan profili açar (People.tsx:178-188). Kayıtlı karar (OdaMenu alınmadı) |
| 2 | Menü: "Profili gör" | özellik yok | menü satırı | satırın kendisi profili açıyor (menüsüz) |
| 3 | Menü: "Sessize al" (Odadakiler satırından) | özellik yok | profilli satırdan sessize alma | yok; sessize alma yalnız mesaj menüsünde (room.tsx:408-413) ; satırda yok |
| 4 | Menü: "Şikâyet et" (Odadakiler satırından) | özellik yok | menü | yok; şikâyet yalnız mesajdan (room.tsx:402-407, 480 sheet) |
| 5 | Seçili satır vurgusu (surface2, radius 16) | davranış | seçili satır yeşilimsi zemin | yok (menü yok) |
| 6 | Menünün sayfa üstünde açılışı | davranış | `.pop` sayfanın üstünde z 8 | yok |
| 7 | Diğer öğeler | — | bkz. 92/94 aynı farklar | bkz. 92/94 |

## 97 Odadakiler · odada yalnız sen — OdaTek.dc.html
Kod: bkz. 92; tek kişi hâli `src/features/district/People.tsx:84-90`
Öğe sayısı: 36 · uyuyor: 17 · fark: 5 · özellik yok: 7 · kural: 1 · doğrulanamadı: 0
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Alt başlık "Beylikdüzü · sadece sen buradasın" | metin | aynı | tr.ts:1217 aynı: uyuyor. Üst çubukta "Sadece sen buradasın" yok (bkz. 92 #1, KURAL 4) |
| 2 | Tek kişi illüstrasyonu | resim | "Dürbünle bakan kapsül kanki" blob 4ba27f14…, genişlik 150 | kitin boş durum işareti (`EmptyState kind="empty" compact`, `EmptyMark`) (People.tsx:84-90); kayıtlı karar: resim depoda yok |
| 3 | Boş yazı boyları | yazı | başlık 700 16/22, cümle 500 14/20; iç boşluk 18 24 8 | `stateTitle` 600 15/20, `fine` 13/18 (EmptyState StateWords): 3 değer farklı (ağırlık 600≠700, 15≠16, 13≠14) |
| 4 | "Sen" satırı anonim yüzü | resim | kendi kapsül | uyuyor (People.tsx:166) |
| 5 | Diğer öğeler | — | bkz. 92 #1-#15 | bkz. 92 |

## 98 Semt sohbeti · dolu — SemtDolu.dc.html
Kod: `app/(app)/district/room.tsx:228-405, 465-540`, `src/components/ChatBubble.tsx`, `ChatScreen.tsx` (DayLine), `src/theme/chatLook.ts`
Öğe sayısı: 36 (geri, başlık+alt başlık, anahtar, ⋮, süre çipi, "Bugün" günü, 2 grup avatarı ve nick'leri, 7 balon (zaman, ikisi benim), "1 yeni mesaj" çizgisi, Elif grubu, "yazıyor" balonu, yazı çubuğu) · uyuyor: 20 · fark: 7 · özellik yok: 2 · kural: 3 · doğrulanamadı: 1
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 1 | Üst çubuk alt başlığı "6 kişi burada" | kural | başlık altında 12/16 500 muted | yok (room.tsx:474-497). KURAL 4 (sayı; yeni-tuval.md karar 3 onay bekliyor) |
| 2 | "yazıyor" göstergesi ("sol-p9x2 yazıyor": nick + 3 noktalı balon) | özellik yok | grubun altında nick etiketi "… yazıyor" ve renkli üç nokta balonu | yok (room.tsx:ChatScreen `latest` semt için verilmiyor); KURAL 4: yazıyor/presence yok, sayı ve "son yazanlar" yok, nick'e bağlı canlı gösterge yasak |
| 3 | Okunmamış çizgisi metni | metin | "1 yeni mesaj" | "Okunmamış mesajlar" (tr.ts:1009 `chat.newLine`; CLAUDE.md "Okunmamış mesajlar çizgisi" kararı) |
| 6 | Balon maks. genişliği | ölçü | grup içi balon `max-width:84%` | `DM.share` 0,78 (dm.ts:25); grup balonu için ayrı 84 yok |
| 9 | Avatar tonları ("Elif" turuncu #F2A33A baş harf yuvarlağı) | renk | `.ga.av` #F2A33A | profilli yüz kit avatarı (`faceOf`, `avatarGround`): DOĞRULANAMADI: pano sabit #F2A33A, kodda addan türetiliyor |

## Kapsam
| pano no | öğe sayısı | fark sayısı | okundu |
| --- | --- | --- | --- |
| 86 | 14 | 1 (+2 doğrulanamadı) | evet |
| 87 | 4 | 2 (+1 doğrulanamadı) | evet |
| 88 | 16 | 3 (+5 özellik yok) | evet |
| 89 | 33 | 4 (+1 özellik yok) | evet |
| 90 | 27 | 12 (+3 fazla) | evet |
| 91 | 24 | 9 (+2 fazla, +1 özellik yok) | evet |
| 92 | 42 | 12 (+8 özellik yok, +4 kural) | evet |
| 93 | 45 | 12 (+8 özellik yok) | evet |
| 94 | 44 | 11 (+9 özellik yok, +4 kural) | evet |
| 95 | 52 | 6 (+7 özellik yok, +3 kural) | evet |
| 96 | 48 | 5 (+12 özellik yok, +3 kural) | evet |
| 97 | 36 | 5 (+7 özellik yok, +1 kural) | evet |
| 98 | 36 | 7 (+2 özellik yok, +3 kural) | evet |

Genel notlar (bulgu sayılmayan ama proje sahibine gidecek):
- Oda panolarının (92, 94-98) hepsinde panonun çizdiği anonim satır ⋮/sessize/kapsül ve "Arkadaş ekle" düğmesi değişmez kural 4 ile çelişir; kod bilinçli olarak çizmiyor (davranis-eksikleri F:68). Pano ile kod ayrışıyor; karar proje sahibinde.
- `docs/design/yeni-arayuz/davranis-eksikleri.md:29` "Yükleniyor hâli hiçbir panoda yok" artık yanlış (86-88 panoları var); kod `EmptyState Loading` zaten bu panolara göre yazılmış, yalnız yerleşim (merkez) farkı var.
- 89, 90, 91, 92, 93 dar panolarının dar-özel değerleri (kapak 200, bilet 150, çip 28, başlık satırı 12/8, düğme min 52) kodda ayrı dar değer olarak yok; çoğu "dar" yalnız ölçeklenen yazıya güveniyor.
