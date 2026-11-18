# Pano–kod denetimi, grup 07 (pano 51–62a)

Genel notlar (her panoda geçerli, ilkinde tam yazıldı, sonrakilerde "bkz"):
- Çerçeve: 390 × 844, durum çubuğu 47, alt güvenli alan 34 varsayıldı (kodun kendi yorumu: Screen.tsx:101-107, gifts/stage.tsx:11-14). Sayılar bu varsayımla hesaplandı; telefonda ölçülmedi.
- Resimler (`/_blob/…`) depoda yok (BLOBLAR.md: "depodaki karşılık yok"); kodda `assets/riso/kayit/*.webp` ve `assets/gifts/pack-*.webp` açılıp bakıldı: kayıt resimleri alt metinleriyle uyuşuyor (kod resmi görüldü), piksel eşitliği DOĞRULANAMADI (sha eşleşmesi yok).
- Simgeler: panelin satır içi çizimleri ile `theme/capIcons.generated.ts` karşılaştırıldı. Fark veren ortak simgeler ilk panoda yazıldı (51, 52, 55, 59).

---

## 51 Kayıt 4/7 · Ad — project/KayitAd.dc.html
Kod: `app/(onboarding)/name.tsx`, `src/features/onboarding/SignupStep.tsx`, `SignupField.tsx`, `theme/signup.ts`, metin `tr.ts` signup.*
Öğe sayısı: 13 · uyuyor: 6 · fark: 6 · fazla: 1 · doğrulanamadı: 1
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 51.1 | Üst satırda Geri düğmesi (`.ktop .round`, 44) | eksik | var, sol başta, adım çubuğunun önünde | name.tsx:41-55: `SignupStep`e `onBack` verilmemiş, düğme çizilmiyor (birth/gender'da var) |
| 51.2 | Başlığın altındaki `.kd` açıklaması | fazla | yok: "Adın" başlığından hemen sonra "Görünen ad" etiketi (`.lab` margin 24 0 8) | name.tsx:37 `body={tr.signup.nameBody}` = "Bu adı arkadaşların görür; profilinle göründüğün masalarda ve mekan sohbetinde orada bulunanlar da görür." (tr.ts:228); etiket bu yüzden 22 px aşağıda |
| 51.3 | Başlık satır yüksekliği (`.kh`) | ölçü | 800 32/38, -0.8 | 41 (`SIGNUP_TYPE.title`, signup.ts:127: "yüzün kendi boyu"); başlık 3 px yüksek, altındaki her şey 3 px aşağı (bütün kayıt panolarında aynı) |
| 51.4 | "Böyle görünürsün" ÖNERİ bölümü: bölüm başlığı (13/18 700, margin 22 0 4) + önizleme satırı (44 daire "E" #E2456F, "Elif" 16/20 600, "Masada · profilli" 13/18) + mesaj önizlemesi (yazar adı 12/16 700 #E2456F, balon "Ben de oynamak istiyorum!" 15/20, köşe 18/18/18/6) | özellik yok | var (ÖNERİ etiketli) | name.tsx'te yok; tr.ts'te metni de yok. Not: yalnız kişinin kendi adını kendine gösterir, kural ihlali yok |
| 51.5 | Ayak: "Devam" altta 34'ten (`.kft bottom:34`) | ölçü | düğmenin alt kenarı ekran dibinden 34 | Screen.tsx:263-276 `FOOTER_LIFT=12` + güvenli alan 34 = 46; 12 px yukarıda (bütün kayıt panolarında aynı) |
| 51.6 | Geri düğmesi koyu kenarı | koyu | `.dark .ktop .round`: #121614, kenar rgba(255,255,255,.08), gölge yok | `raisedEdge` koyu rgba(255,255,255,.10) (auraKit.ts:530); dolgu #121614 uyuyor |
| 51.7 | Üst resim (a0de9d6a… "Ad etiketi takan kapsül kanki", 120×98, margin 0 0 10 -6) | resim | 360×294 png, 120×98 çizilir | `assets/riso/kayit/ad.webp` görüldü: aynı sahne; boyut/margin uyuyor (signup.ts:70). Piksel eşitliği DOĞRULANAMADI |

---

## 52 Kayıt 5/7 · Doğum tarihi — project/KayitDogum.dc.html
Kod: `app/(onboarding)/birth.tsx`, `SignupStep.tsx`, `InfoRows.tsx`, `SignupField.tsx`
Öğe sayısı: 12 · uyuyor: 6 · fark: 4 · fazla: 0 · doğrulanamadı: 1 (resim) · özellik yok: 2 (sayılmış)
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 52.1 | Tarih seçici `.whl` | düzen / özellik yok | tek tekerlek bloğu: yükseklik 180, 3 sütun (gün, ay adı, yıl) 6 aralıklı, her satır 36, 5 satır görünür, seçili satır bandı (üstten 72, yükseklik 36, köşe 12, `--surface` + 1 px iç çizgi; koyuda #1B211F), seçili 20/700, komşu 17 .55, uzak 15 .22 opaklık; sütun oranı gün 1 · ay 1.5 · yıl 1; örnek seçim 14 Haziran 1999; etiket yok | birth.tsx:86-106: üç sayı kutusu (Gün/Ay/Yıl, number-pad, her biri 56 yüksek), etiketli (`SIGNUP_TYPE.label`), ay sayı olarak, oran 1 : 1 : 1.5 (yıl geniş, birth.tsx:97); tekerlek bileşeni kodda yok |
| 52.2 | Yaş çipi "27 yaşındasın" ÖNERİ (32 yüksek, köşe 999, 14/18 600, 14 üstte, simge 18 pasta) | özellik yok | var | birth.tsx'te yok; hesaplanıp gösterilmiyor (yaş yalnız onay penceresinde, birth.tsx:55) |
| 52.3 | Başlık satırı, ayak boşluğu, Geri kenarı | ölçü/koyu | bkz 51.3, 51.5, 51.6 | bkz |
| 52.4 | Simgeler (`.ir`): göz-kapalı, kilit, kullanıcı | ikon | eyeOff: göz yolu + çapraz çizgi (stroke 2.8, kapak yok); lock: gövde 14.8×11 + yay (stroke 2.6) + nokta r1.9; user: daire cy 8 r4.4 | capIcons.generated.ts:108 eyeOff = göz + gözbebeği r2.8 + dik çubuk; lock = gövde 15.2 + 2.6 çubuk; user = cy 7.6 r3.9. Üçü de panelden farklı çizim |
| 52.5 | Bilgi satırı metinleri ve sırası | metin | "Doğum tarihin kimseye görünmez." + "Profilinde yalnızca yaşın görünür." / "Sonra değiştiremezsin." / "skall 18 yaş ve üzeri içindir." | uyuyor (birth.tsx:107-115, tr.ts:238-241, 226) |
| 52.6 | Resim (08e2d5dd… pasta) | resim | 120×98 | dogum.webp görüldü (pasta + kanki); DOĞRULANAMADI piksel |

---

## 53 Kayıt 5/7 · Doğum tarihi onayı — project/KayitDogumOnay.dc.html
Kod: `birth.tsx:56-72` (`confirm`), `src/motion/Dialog.tsx`, `lib/overlayStore.ts`
Öğe sayısı: 18 (52'nin 12'si + örtü, kart, başlık, açıklama, "Evet, doğru", "Düzelt") · uyuyor: 12 · fark: 6
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 53.1 | Arkadaki sayfa | düzen | bkz 52.1, 52.2 | bkz |
| 53.2 | "Düzelt" düğmesi | düzen/renk | `.btn.ghost`: dolgusuz, kenarsız, yazı `--text`, üstte 8 | Dialog.tsx:206-213: vazgeç düğmesi her zaman `variant="glassy"` (yumuşak beyaz dolgu, kenar, gölge); `ghost` türü var (buttonGlass.ts:80) ama pencerede kullanılmıyor. Her onay penceresinde aynı (54-61 dahil) |
| 53.3 | Başlık yazısı | ölçü | `.dt` 700 20/26 -0.3 | `KIT_TYPE.pageBarTitle` 700 21/26 (auraKit.ts:197); 1 px büyük. (Engelle panosunda `.dt` 21 → orada uyuyor) |
| 53.4 | Kartın dikey yeri | düzen | `.dlg top:280` (sabit); kart ~244 yüksek | Dialog.tsx:~127 `justifyContent:'center'`: ortalanır, ~ üstten 300 (≈20 px aşağıda; yükseklik tahmini, DOĞRULANAMADI kesin sayı) |
| 53.5 | Metinler | metin | "14 Haziran 1999 doğru mu?" · "Profilinde 27 yaşında görünürsün. Doğum tarihini sonra değiştiremezsin." · "Evet, doğru" · "Düzelt" | uyuyor (tr.ts:243-250) |
| 53.6 | Kart ölçüleri (28 yan boşluk, köşe 28, iç 24/20/20, örtü rgba(3,27,11,.42) / koyu .7, gölge, koyu #151A18 + 1 px halka) | ölçü/koyu | bkz | uyuyor (auraKit.ts:1155-1254) |
| 53.7 | Açıklama–düğme boşluğu | ölçü | `.dx margin 6 0 20` | dialogTextTop 6, dialogTextBottom 20: uyuyor |

---

## 54 Kayıt 6/7 · Cinsiyet — project/KayitCinsiyet.dc.html
Kod: `app/(onboarding)/gender.tsx`, `src/features/account/GenderChoice.tsx`, `InfoRows.tsx`
Öğe sayısı: 14 · uyuyor: 11 · fark: 3
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 54.1 | Başlık satırı, ayak boşluğu, Geri kenarı | ölçü/koyu | bkz 51.3, 51.5, 51.6 | bkz |
| 54.2 | Simgeler: göz-kapalı, kilit | ikon | bkz 52.4 | bkz 52.4 |
| 54.3 | Satırlar (`.cr.big` 68, radyo 24, çizgi 38'den, "Kadın/Erkek/Belirtmek istemiyorum" 15/21 600 + not 12/16, liste üstte 12, bilgi satırları 18 altta, 2 simge satırı) | ölçü/metin | — | uyuyor (GenderChoice.tsx:35-95, tr.ts:251-262, signup.ts:96-107). Panelde "Kadın" seçili örnek; kodda başlangıç boş ve "Devam" kapalı (durum, fark sayılmadı) |

Kural: pano cinsiyete göre masa kuralını (anonim/profilli) yalnızca kişinin kendisine yazıyor; KURAL 12 ihlali yok (başkasına gitmiyor). Karar proje sahibinin.

---

## 55 Kayıt 7/7 · Profil fotoğrafı — project/KayitFoto.dc.html
Kod: `app/(onboarding)/extras.tsx`, `SignupStep.tsx`, `InfoRows.tsx`
Öğe sayısı: 16 · uyuyor: 8 · fark: 6 · fazla: 1 · özellik yok: 2 (sayılmış)
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 55.1 | "Nerede görünür" ÖNERİ bölümü: bölüm başlığı + 3 kutu (`.slot`: 52 kesikli daire + artı 22, "Masada/koltuğunda", "Sohbette/mesajlarında", "Profilde/adının yanında"; kutu köşe 18, 10 aralık, `--surface` + 1 px çizgi) | özellik yok | var | extras.tsx'te yok; tr.ts'te metinleri yok. Kodda yalnızca fotoğraf varsa 120'lik fotoğraf (extras.tsx:85-89, panelde yok: FAZLA durum) |
| 55.2 | Uyarı satırı (`.ir.wr`) "Fotoğrafın yoksa masalara katılamazsın, masanı da lobiye açamazsın." | davranış | herkese her zaman görünür | extras.tsx:36,92-103: yalnız erkek/belirtmeyen ve fotoğraf yokken (`mayStayAnonymous`); kadında yok (kural 4/12 ile uyumlu; panel kadın için yanlış söylüyor) |
| 55.3 | Uyarı simgesi | ikon | üçgen (`M12 3.2 22 20.4H2z`) + dik çubuk + nokta | `warn` = halka r8.2 + dik çubuk + nokta (capIcons.generated.ts:warn): üçgen yerine daire |
| 55.4 | Ana düğme simgesi | ikon | "Fotoğraf ekle" önünde kamera simgesi (24) | extras.tsx:58-61 `action`'da simge yok (`Btn icon` verilmiyor, SignupStep.tsx:99-107 simge alanı da yok) |
| 55.5 | "Fotoğrafı sonra Profil'den de ekleyebilirsin." | metin | düz kesme işareti ' | tr.ts:232 tipografik ’ (U+2019) |
| 55.6 | Üst satırda Geri yok, adım çubuğu 7/7 dolu, "7/7" | — | — | uyuyor (extras.tsx:60 `step="photo"`, onBack yok; Android geri de kapalı) |
| 55.7 | Başlık satırı, ayak boşluğu | ölçü | bkz 51.3, 51.5 | bkz |
| 55.8 | Düğmeler 56 yüksek, 8 aralık, "Fotoğraf ekle" / "Fotoğrafsız bitir" (ghost) | ölçü/metin | — | uyuyor (`Btn tall` 56, ghost: SignupStep.tsx:108-118; tr.ts:828-833) |
| 55.9 | Resim (99b4e402… fotoğraf makinesi) | resim | 120×98 | foto.webp görüldü; piksel DOĞRULANAMADI |

---

## 56 Metinler güncellendi — project/KayitMetinler.dc.html
Kod: `app/(onboarding)/consents.tsx` (`hasProfile` dalı), `ConsentBoxes.tsx`, `SignupStep.tsx`; metin tr.ts `consents.*`
Öğe sayısı: 15 · uyuyor: 6 · fark: 8 · fazla: 0 · özellik yok: 3 (sayılmış)
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 56.1 | Üst satır yok, içerik 76'dan | ölçü | `.kc top:76` | uyuyor (signup.ts contentTopBare 29 + 47) |
| 56.2 | Açıklama | metin | "Metinler güncellendi. Lütfen tekrar onayla." | tr.ts:214 "Metinler güncellendi. Devam etmek için yeniden oku." |
| 56.3 | Koşullar satırı | metin/düzen | başlık "Kullanım Koşulları" (15/21 600) + alt satır "Okudum ve kabul ediyorum." (12/16 muted) | ConsentBoxes.tsx:25-26,111: tek satır "Kullanım Koşulları’nı okudum ve kabul ediyorum." (tr.ts:207), alt satır yok |
| 56.4 | KVKK satırı | metin/düzen | "KVKK Aydınlatma Metni" + alt "Okudum." | tr.ts:209 "KVKK Aydınlatma Metni’ni okudum ve anladım." (kodda KVKK Kurulu gerekçesi yorumda; pano ayrışıyor) |
| 56.5 | "12 Kasım'da güncellendi" çipi (`.upd` 20 yüksek, #FFF1D6/#8A5A00, koyu rgba(255,181,71,.14)/#FFC86B) + ÖNERİ | özellik yok | var | yok; sürüm tarihi istemcide yok (`CURRENT_TERMS_VERSION` yalnız sürüm) |
| 56.6 | Onay kutuları | düzen | iki kutu boş, "Oku" bağlantısı 14/20 700 altı çizili | uyuyor (ConsentBoxes.tsx:56-109) |
| 56.7 | "Bilmen gerekenler" ÖNERİ bölümü + 2 bilgi satırı ("Değişen bölümler metinde işaretli gösterilir." not simgesi; "Onaylayana kadar uygulamaya devam edemezsin." kilit simgesi) | özellik yok | var | yok. "işaretli gösterilir" için metin farkı işaretleme özelliği de yok (`LegalText` değişen bölümü işaretlemiyor, DOĞRULANAMADI: legal sayfa kodu okunmadı) |
| 56.8 | Ayak notu | metin/ölçü | "İkisini de okuyup onaylaman gerekir." (12/16), düğmeyle arası 12 (`margin 0 0 4` + gap 8) | tr.ts:213 "İkisini de okuman gerekir."; arası 8 (Screen.tsx FOOTER_GAP) |
| 56.9 | Düğme | metin | "Onayla ve devam et" (kapalı) | tr.ts:211 "Devam et" |
| 56.10 | Başlık satırı, ayak boşluğu | ölçü | bkz 51.3, 51.5 | bkz |
| 56.11 | Kilit simgesi | ikon | bkz 52.4 | bkz |
| 56.12 | Resim (67e83e76… tomar) | resim | 120×98 | metinler.webp görüldü; piksel DOĞRULANAMADI |

---

## 57 Mekan sohbetinden profil — project/MekanProfil.dc.html
Kod: `app/(app)/venue-chat/[messageId].tsx`, `src/features/profile/SenderProfileScreen.tsx`, `ProfileCard.tsx` (`ProfileTopBar`, `OtherHead`), `ProfileCover.tsx`, `theme/profileCover.ts`
Öğe sayısı: 9 · uyuyor: 1 · fark: 8 · fazla: 3 · özellik yok: 1 (sayılmış)
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 57.1 | Kapak | düzen | tam genişlik, üstten 250 yüksek, ekran kenarına taşar; üstte rgba(0,0,0,.28)→0 (34%) kararma, altta zemine erir (koyuda .35 → #000) | ProfileCard.tsx:77-86: yalnız `coverUrl` varsa 190 yüksek, kenarlardan 20 içeride, köşe 22 band, erime yok; kapak yoksa hiçbir şey (profile.coverUrl ChatProfileView'da var, boşsa band yok) |
| 57.2 | Üst düğmeler konumu | ölçü | `.tp` top 52, sol/sağ 16 | ProfileTopBar: Screen `top` → barSide verilmemiş = 20, barTop 8 → 55; yatay 4, dikey 3 px fark (SenderProfileScreen.tsx:126-133) |
| 57.3 | Üst düğmeler görünümü (kapak üstünde) | renk/koyu | dolgu rgba(255,255,255,.78) kenar rgba(255,255,255,.9) gölge yok; koyuda rgba(18,22,20,.72) kenar .12 | `Round glassy`: açık .74 + #FFF kenar + yumuşak gölge (kit.tsx:~625, auraKit.ts:436-439); koyu #121614 kenar .10 gölgesiz |
| 57.4 | "⋮" simgesi | ikon | 3 daire r2.2 (cy 5/12/19), hepsi güçlü | `moreV` = 3 yuvarlak kare 4.8, ortadaki yumuşak (b) (capIcons.generated.ts) |
| 57.5 | Geri simgesi | ikon | stroke 3 yuvarlak uçlu çatal `M14.5 5.5 8 12l6.5 6.5` | `back` = iki döndürülmüş çubuk, alt kol yumuşak (b) |
| 57.6 | Avatar | ölçü | 112, kenar 4 `--canvas`, ortada, ad harfi 40/700 beyaz, zemin düz renk | `Av size="hero"` 120 (auraKit.ts:932), halka+gölge (kit.tsx:1356-1390), zemin gradyan (`avatarGround`); sola yaslı, kapak yoksa 24 üstte / kapak varsa -60 (ProfileCard.tsx:96-103); 8 px büyük, kenar türü farklı |
| 57.7 | Avatar arkasında peek kankisi | fazla | yok | ProfileCard.tsx:104-118 rastgele riso kanki (64 geniş, 14° dönük) çiziliyor |
| 57.8 | Ad "Ece, 24" | ölçü/yazı | ortalı, 28/34 600, harf aralığı -0.6, avatardan 12 aşağıda | `T v="display"` 500 32/42 (auraKit.ts:35), sola yaslı, avatardan 20 aşağıda (ProfileCard.tsx:121-124) |
| 57.9 | Biyografi "Kahvesiz oyun oynamam" | düzen | ortalı 15/22 muted, adın 4 altında | sola yaslı (ProfileCard.tsx:126-130), 15/22 uyuyor |
| 57.10 | Eylem: "Arkadaşlık isteği gönder" (primary, tam genişlik, 48, kapsül, `invite` simgesi) | ölçü | adın/biyografinin 20 altında | `Btn block bar={btnRow=48} icon="invite"`: yükseklik, simge, metin uyuyor (tr.ts:1087); bio altı 24 (ProfileCard.tsx:132) vs 20; sola yaslı değil, tam genişlik uyuyor |
| 57.11 | "Mekan sohbetinden" ÖNERİ (13/18 muted, ortalı, düğmenin 12 altında) | özellik yok | var | yok (SenderProfileScreen.tsx:158-181) |
| 57.12 | Alt "Geri dön" düğmesi | fazla | yok | SenderProfileScreen.tsx:126 `footer={<Btn glassy label=tr.profile.back>}` (tr.ts:867 "Geri dön") |
| 57.13 | Durum satırları (gönderildi yazısı, hata bandı, "Arkadaşsınız") | fazla | yok (durum) | SenderProfileScreen.tsx:143-176; panelde çizilmeyen durumlar |

---

## 58 Arkadaşlık isteği onayı — project/MekanProfilIstek.dc.html
Kod: `SenderProfileScreen.tsx:79-93` (`ask` → `confirm`), `motion/Dialog.tsx`; tr.ts `venueChat.*`
Öğe sayısı: 15 (57'nin 9'u + örtü, kart, avatar, başlık, açıklama, çipler, 2 düğme) · uyuyor: 4 · fark: 11
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 58.1 | Arka sayfa | düzen | bkz 57 | bkz 57.1–57.13 |
| 58.2 | Kart üstü avatar | eksik | 64 daire, "E", #2C63D6 (`.dav`, 26/700), kartın 14 altında başlık | kod `icon:'invite'` ile 56'lık yeşil disk çiziyor (Dialog.tsx:149-163); kişi yüzü yok (`face` seçeneği var ama verilmiyor) |
| 58.3 | Başlık | metin | "Ece'ye istek gönderilsin mi?" (ad + yönelme eki, 21/26 700) | tr.ts:1088 "İstek gönderilsin mi?" (ad yok; ek `inflectTr` ile yazılmalı) |
| 58.4 | Açıklama | metin | "İstek gönderirsen profilin ona görünür:" (alt boşluk 12) | tr.ts:1089 "İstek gönderirsen profilin ona görünür: adın, yaşın ve fotoğrafın." (tek cümle) |
| 58.5 | Çipler `.pvl` | eksik | 3 çip "Adın", "Yaşın", "Fotoğrafın" (28 yüksek, 10 yan, 12/16 600, `--surface2`, koyu #1B211F, 6 aralık, ortalı, altta 18) | yok (`dialogPill` token'ı auraKit.ts:1256 var ama kullanılmıyor) |
| 58.6 | Ana düğme | ikon | "İsteği gönder" önünde `invite` simgesi | SenderProfileScreen.tsx:82-92 `confirmIcon` verilmiyor: simge yok |
| 58.7 | "Vazgeç" | düzen | ghost (dolgusuz) | bkz 53.2 (glassy) |
| 58.8 | Kartın dikey yeri | düzen | `top:250` | ortalı, bkz 53.4 |
| 58.9 | Boşluklar | ölçü | başlık 14 üstte, açıklama 6/12, düğme 8 | uyuyor (auraKit.ts dialog*) |

---

## 59 Profil ⋮ menüsü — project/MekanProfilMenu.dc.html
Kod: `SenderProfileScreen.tsx:184-228`, `motion/Menu.tsx` (`MenuPop`), `app/(app)/people/[publicId].tsx:134-141,450-485` (aynı menünün çapalı hâli)
Öğe sayısı: 14 (57'nin 9'u + açılır menü, 3 satır, ayırıcı çizgiler) · uyuyor: 6 · fark: 5 · fazla: 2 · eksik: 1
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 59.1 | Menü biçimi | düzen | düğmeden çıkan açılır menü: sağ 12, üst 104, 292 geniş, köşe 28, iç 16/8/8, örtüsüz | SenderProfileScreen.tsx:184-228: alt sayfa (`Sheet`, başlık = kişi adı, `Menu` kartı, altta "Vazgeç"); çapalı `Menu anchor` yalnız people/[publicId].tsx'te kullanılıyor. `MenuPop` ölçüleri (292, 28, 16/8/8, satır 48, simge 22, 14 boşluk, çizgi 48'den; auraKit.ts:1241-1266) panoyla uyuyor ama bu ekranda kullanılmıyor |
| 59.2 | "Sessize al" satırı (+ alt metin "Mekan sohbetinde mesajlarını gizler") | eksik | var, ilk satır, sessize alma simgesi | venue-chat/[messageId].tsx:20-39: `mute` verilmiyor (`SenderProfileScreen` `mute` prop'u yalnız mekan akışında kullanılıyor); sunucu ucu var: `venueChatApi.mute(messageId)` (api.ts:485). Alt metin tr.ts'te yok |
| 59.3 | "Şikayet et" satırı | uyuyor | bayrak simgesi, 16/20 600, yeşil simge (`--primary`) | MenuItem cap="report" negative: kırmızı yazı ve simge (SenderProfileScreen.tsx:200-210 `negative`): renk FARK, pano yeşil |
| 59.4 | "Engelle" satırı | renk | kırmızı `--danger` (#A8301A; koyu #FF977E), simge engel | uyuyor (menuDanger), sırası son uyuyor |
| 59.5 | Satır ayırıcıları | ölçü | 1 px rgba(3,27,11,.10) soldan 48, sağdan 12 | Sheet görünümünde 16+24+14=54'ten (Menu.tsx sheet look); çapalı görünümde uyuyor |
| 59.6 | Alt sayfadaki "Vazgeç" düğmesi | fazla | yok | SenderProfileScreen.tsx:227 |
| 59.7 | Sessize alma simgesi | ikon | hoparlör gövdesi + çarpı (`M3.6 9.4h3.2…`, stroke 2.6) | `mute` = gövde + iki çubuk (capIcons.generated.ts): biçim farkı |
| 59.8 | Menü adı | davranış | `aria-label` "Ece seçenekleri" | `title` = displayName (görsel başlık olarak da çiziliyor, panoda yok) |

---

## 60 Şikayet et — project/SikayetEt.dc.html
Kod: `src/features/chat/ReportModal.tsx`, `SenderProfileScreen.tsx:96-106,213-221`, `motion/Sheet.tsx`; metin tr.ts `safety.*`
Öğe sayısı: 20 (57'nin 9'u + örtü, tutamak, başlık, açıklama, 4 radyo satırı, metin alanı, düğme) · uyuyor: 8 · fark: 8 · özellik yok: 1 · fazla: 3
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 60.1 | Alt sayfa kabuğu | ölçü | 8 kenar, köşe 28, iç 10/20/34, tutamak 40×5, 16 altında | uyuyor (auraKit.ts sheet*) |
| 60.2 | Başlık | metin/yazı | "Ece'yi neden şikayet ediyorsun?" (21/26 700, ad + belirtme eki) | tr.ts `safety.reportTitle` "Neden şikayet ediyorsun?" (ad yok), `T v="title"` 600 21/27; başlıkta yeşil `report` simgesi 24 (ReportModal.tsx:46 `titleIcon`, Sheet.tsx: panoda yok) |
| 60.3 | Alt başlık | özellik yok | "Şikayetin gizli kalır; kimin şikayet ettiği ona söylenmez." (14/20 muted, ÖNERİ) | yok |
| 60.4 | Sebepler | düzen | 4 radyo satırı (Taciz, Uygunsuz içerik, Spam, Diğer), 24 radyo, min 52, çizgi 36'dan, 16/20 600; biri seçilir, ardından gönderilir | ReportModal.tsx:51-63: 4 yumuşak blok düğme (aralık 8); birine basınca hemen gönderilir (`onReport`), seçim durumu yok. Metinler uyuyor (tr.ts:1267-1270) |
| 60.5 | "Ne oldu? (isteğe bağlı)" 0/280 metin alanı (72 yüksek, köşe 18, `--surface2`) | özellik yok | var | arayüzde yok; sunucuda da yok: `safety` rapor isteği yalnız `reason` alır (api.ts:351-357; `REPORT_REASONS`), serbest metin ucu yok |
| 60.6 | "Şikayeti gönder" (danger düğme, bayrak simgesi, üstte 14) | eksik | var | yok (gönderme sebebe basınca oluyor) |
| 60.7 | "Vazgeç" | fazla | yok (kapatma tutamak/dışarı) | ReportModal.tsx:42 `footer` "Vazgeç" glassy |
| 60.8 | Gönderi sonrası | fazla | çizilmemiş | SenderProfileScreen.tsx:100 sistem `Alert.alert("Şikayetin alındı. Teşekkürler.")` |

---

## 61 Engelle onayı — project/EngelleOnay.dc.html
Kod: `SenderProfileScreen.tsx:215-228`, `src/features/friends/ConfirmWithReport.tsx`, `Dialog.tsx`; tr.ts `safety.*`, `venueChat.*`, `friends.*`
Öğe sayısı: 16 (57'nin 9'u + örtü, kart, disk+simge, başlık, açıklama, onay kutusu satırı, 2 düğme) · uyuyor: 10 · fark: 5 · fazla: 1
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 61.1 | Disk ve simge | ölçü/renk | 56 disk, simge 28 `block`, açık rgba(214,64,40,.10)/#A8301A, koyu rgba(255,151,126,.12)/#FF977E | uyuyor (auraKit.ts:1160-1161,1208-1209, 1249-1250) |
| 61.2 | Başlık | metin | "Ece engellensin mi?" | uyuyor (tr.ts:1263 `blockNamedTitle`, SenderProfileScreen.tsx:219-221; ad yoksa eski başlık) |
| 61.3 | Açıklama | metin | "…Engeli Ayarlar'dan kaldırabilirsin." (A büyük, kesme işareti) | tr.ts:1093 "…Engeli ayarlardan kaldırabilirsin." (küçük a, kesme yok) |
| 61.4 | Onay kutusu satırı | düzen | `.chk`: 24 kutu (köşe 7, 2 px çizgi, işaretli: #031B0B + beyaz tik 18), "Şikayet de et" 15/20 600 + "Neden olduğunu sonraki adımda seçersin." 13/18; üst-alt çizgi rgba(3,27,11,.08), iç 12 | uyuyor (ConfirmWithReport.tsx:40-90; tr.ts friends.alsoReport*). Kutunun üstünde/altında boşluk panoda 18/18, kodda 20/20 (dialogTextBottom, Dialog.tsx:187-194): 2 px |
| 61.5 | Danger düğmesi | uyuyor | "Engelle", `block` simgesi | uyuyor (confirmIcon) |
| 61.6 | "Vazgeç" | düzen | ghost | bkz 53.2 (glassy) |
| 61.7 | Kartın yeri | düzen | `top:210` | ortalı, bkz 53.4 |
| 61.8 | Hata durumu | fazla | çizilmemiş | üstte toast (OverlayHost) |

---

## 62 Hediye paketleri · açılacak paket yok — project/HediyePaket.dc.html
Kod: `app/(app)/gifts.tsx`, `src/features/gifts/PackRing.tsx`, `parts.tsx` (`GiftTopBar`, `LoginBar`, `SoonTag`, `CanOpenBadge`), `theme/gifts.ts`, `art.ts`, `stage.tsx`
Öğe sayısı: 16 · uyuyor: 7 · fark: 9 · fazla: 1 · doğrulanamadı: 2
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 62.1 | Üst bar konumu | ölçü | `.hpw padding-top 52`, `.hpt` 56 yüksek, 20 yan | `Screen top` barTop 8 → 55 (3 px aşağı), 56 yüksek, 20 yan uyuyor (parts.tsx:175-196) |
| 62.2 | Başlık | düzen/yazı | "Hediye paketleri" sola yaslı, geri düğmesinin 12 yanında, 700 21/28 -0.3 | ortalı, sağda 44'lük boşlukla dengeli (parts.tsx:186-193), `T v="title"` 600 21/27 -0.015em, aralık 8 |
| 62.3 | Geri düğmesi | renk | `round soft` | uyuyor (bkz 51.6 koyu kenar .10 vs .09/.08: pano `.dark.pA` soft-line .10, burada uyuyor) |
| 62.4 | Paket çemberi (ön 236, yanlar 168, ±150, 7° dışa) | düzen | sol paket `rotate(-7deg)`, sağ paket `rotate(+7deg)` | PackRing.tsx:~262 `rotate: ${-TURN*sin}deg`: sağdaki paket (sin=+1) -7°, soldaki +7°; panoyla ters yön (içe eğik). Yorum "7° outward" (PackRing.tsx:22) ile de çelişiyor. Koddan çıkarım; telefonda bakılmalı |
| 62.5 | Paket gölgesi | ölçü/renk | `drop-shadow(0 14px 18px rgba(3,27,11,.22))`; koyu `0 14px 18px rgba(0,0,0,.6)` | `PACK_DROP`: y 10, sapma 6, rgba(4,73,35,.22); koyu y 10, sapma 7, rgba(0,0,0,.55) (theme/gifts.ts:158-168) |
| 62.6 | Paket resimleri (sol febcf449, sağ 538783aa, orta e8b14344 "Bronz paket") | resim | 720×1134 | `pack-*.webp`: hangi paketin soldaki/sağdaki olduğu panoda belli değil; DOĞRULANAMADI. Orta bronz uyuyor (`packsInOrder`) |
| 62.7 | "Yakında" etiketleri | ölçü/yazı/ikon | 24 yüksek, iç 0 9 0 7, aralık 4, yazı 11/1 600, kilit 12 (dolu gövde + yay), rgba(3,27,11,.78) | `Tag`: 24 yüksek, iç 8/8, yazı 12/16 600, kilit 16 (`ICON.sm`), `lock` farklı çizim (parts.tsx:72-82, kit.tsx Tag, capIcons lock). Konum (paketin %86'sı = 300) uyuyor |
| 62.8 | Noktalar | renk/koyu | 6×6, seçili 20 geniş; açık: seçili #031B0B, diğer rgba(3,27,11,.18); koyu: seçili #fff, diğer rgba(255,255,255,.22) | seçili `c.ink` (koyu #EEF3F0), diğer `c.emptyMark` açık .18 uyuyor, koyu #1B211F (PackRing.tsx:~350, auraKit.ts:462,547) |
| 62.9 | Paket adı "Bronz paket" | yazı | 700 21/28 | `T v="title"` center 600 21/27 (gifts.tsx:372) |
| 62.10 | Durum "Açılacak paket yok" | yazı | 600 15/20, `--text` | `T v="fine" strong` 13/18 (gifts.tsx:387); renk uyuyor |
| 62.11 | İlerleme "2/3 giriş" | ölçü/renk | 3 parça 28×6 köşe 3 aralık 4 (92), açık dolu `--success`; boş rgba(3,27,11,.12) / koyu rgba(255,255,255,.16); koyu dolu #3DDC84; metin 13/18 600 muted, çubuğun 8 yanında; durumun 10 altında | LoginBar 92, 6 yük., dolu `colors.success` (koyu #4CC97E), boş `c.emptyMark` (açık .18, koyu #1B211F); metin `T fine strong` renk ink (muted değil); durumun 4+4=8 altında (gifts.tsx:391-409) |
| 62.12 | Not "Günde 1 giriş sayılır. 3 girişte 1 paket." | ölçü | 13/18 muted, max 280, ilerlemenin 6 altında | metin uyuyor (tr.ts:408), max 280 uyuyor, boşluk 4 (gap SPACING[1]) |
| 62.13 | "Aç" (kapalı) ve "Oranlar" düğmeleri | ölçü | `.fx .btn` 56 yüksek, 12 aralık, alt 46 | `Btn` varsayılan 48 (`tall` yok, gifts.tsx:413-431); alt 46 uyuyor, aralık 12 uyuyor, kapalı: simgesiz uyuyor, "Oranlar" `info` simgeli uyuyor (simge çizimi r9.4 vs r9: bkz) |
| 62.14 | Üst bölüm yükseklikleri | ölçü | kapak çemberi üstten 132 (52+56+24), noktalar 548, bilgi 574 | PackRing.tsx:35-39 RING_FROM 128 (4 px fark), DOTS_AT 548, INFO_AT 574 uyuyor; 128 ↔ 132 DOĞRULANAMADI (düzende gerçek üst kenar ölçülmedi) |
| 62.15 | Yükleme ve hata hâlleri | fazla | çizilmemiş | gifts.tsx:445-528 iskelet ve hata (panoda yok; kural gereği var) |

---

## 62a Hediye paketleri · 1 paket açılabilir — project/HediyePaketAc.dc.html
Kod: aynı. Pano 62'den farkı: rozet "1", durum "1 paket açılabilir" yeşil, "Aç" etkin primary.
Öğe sayısı: 17 · uyuyor: 8 · fark: 9 (62.1–62.14'ün aynıları, bkz 62) + rozet farkları
| # | öğe | tür | pano | kod (dosya:satır) |
| --- | --- | --- | --- | --- |
| 62a.1 | Rozet | ölçü/yazı/hareket | `.bd` min 26×26, `--buzz`, beyaz 13/26 700, halka 3 `--canvas`; pakete göre sağ üst: merkezden +98 sola kenar, üstten 28; durağan | `CanOpenBadge` 24×24, yazı `stamp` 11/14 600, beyaz 2.5 halka + 8 px hale + 18 px parıltı + her 1.6 sn atış ve yayılan halka (parts.tsx:84-138, theme/gifts.ts:53-59); pakete göre sağ -4, üst 10 (PackRing.tsx:42-45): sol kenar 98 uyuyor, sağ kenar 2 px içeride, üst ~1 px |
| 62a.2 | "1 paket açılabilir" | renk/yazı | `.st.ok` 600 15/20, açık `--success`, koyu #3DDC84 | `T fine strong` 13/18, `colors.success` (koyu #4CC97E) (gifts.tsx:387) |
| 62a.3 | "Aç" düğmesi | ölçü | primary 56, açık #031B0B | 48 yüksek, bkz 62.13 |
| 62a.4 | Diğerleri | — | bkz 62.1–62.14 | bkz |

---

## Kapsam
| pano no | öğe sayısı | fark sayısı | okundu |
| --- | --- | --- | --- |
| 51 | 13 | 6 (+1 fazla, +1 doğrulanamadı) | evet |
| 52 | 12 | 4 | evet |
| 53 | 18 | 6 | evet |
| 54 | 14 | 3 | evet |
| 55 | 16 | 6 (+1 fazla) | evet |
| 56 | 15 | 8 | evet |
| 57 | 9 | 8 (+3 fazla) | evet |
| 58 | 15 | 11 | evet |
| 59 | 14 | 5 (+1 eksik, +2 fazla) | evet |
| 60 | 20 | 8 (+3 fazla) | evet |
| 61 | 16 | 5 (+1 fazla) | evet |
| 62 | 16 | 9 (+1 fazla, +2 doğrulanamadı) | evet |
| 62a | 17 | 9 | evet |

Kural işaretleri: yok. Pano 51-62a hiçbir öğesiyle kuralın yasakladığı bilgiyi (kişi sayısı, başkasının kapsülü/nick'i, konum, cinsiyet, kimin beğendiği) başkasına göstermiyor; 54 ve 55'te cinsiyete bağlı metin yalnız kişinin kendi ekranında (kural 12 ile uyumlu; 55.2'de pano kadına da "masalara katılamazsın" diyor, kural 4'e ters, proje sahibinin kararı).
