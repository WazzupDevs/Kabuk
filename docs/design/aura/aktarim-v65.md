# Birleşik CTO aktarım raporu: skall arayüzü (Aura v65)

> Repoya konan kopya (2 Kasım 2026). Proje sahibinin ilettiği metin değiştirilmedi. `/mnt/project-files/` tasarım oturumunun klasörüdür, repoda yoktur. Repodaki karşılıkları: CSS ve Temel panolar `docs/design/aura/project/`, ikonlar `docs/design/aura/ikonlar/`. Riso görseller (9.1), proje sahibinin gönderdiği `skall-riso-gorseller-v64.zip` dosyasındadır; 1.–3. aşama #338'de birleşti (`docs/decisions/aura-v65-temel.md`). Diğer panolar canlı tuvalden v65 olarak okunur. CTO oturumuna verilen prompt `aktarim-v65-cto-prompt.md` dosyasındadır.

Kaynak: Aura tuvali, **sürüm 65** (sürüm kimliği 1793569092-718f), https://claude.ai/artifact/Fcdza7SJs4i7xyYQJnhRVe. Görünüşün tek ve kesin kaynağı budur. Temiz tuval kaynak değildir.
Bu rapor şunların yerine geçer: `arayuz-revize/cto-aktarim-raporu-aura.md` (v63), `arayuz-revize/28-riso-acilis/cto-aktarim-raporu.md` (riso açılış), `arayuz-revize/aktarim-raporu.md` (zaten geçersiz). Üç dosya kayıt için durur; uygulama bu rapora göre yapılır.
Onaylar (Gökay, 1 Kas 2026): Temel satır 02:22–02:46. Ekranlar (revize notları 1–171) 16:21. Aura tek kaynak 16:27 ve 16:48. Oyunların token geçişi 17:02. Riso tamamlama 17:40 (v61), süs kankiler 17:57 (v62), kayıt sahnesi ve yuvarlak masanın kaldırılması 18:30 (v63), riso açılış 20:43 (v64), kayıt ekranı kanki hareketi 21:34 (v65, yalnız kankiler; zemin durağan).
Birimler dp'dir. Token adları `project/skall.css` içindeki adlardır; koddaki `theme.ts` adlarının kebab yazımıdır. "n.X" revize notlarındaki madde numarasıdır (`/mnt/project-files/arayuz-revize-notlari.md`).
Panoların okunduğu CSS: `skall.css` (tokenlar, bileşenler), `ekran.css` (ekran sınıfları), `koyu.css` (`.dark.pA` koyu tema). Kopyaları (v64 ve v65 aynı): `/mnt/project-files/cto-teslim-v64/aura-v64/` (skall.css, ekran.css, koyu.css, hareket.json).
Uygulama sırası: bölüm 2–4 (Temel) → 5 (ekranlar) → 13 (kayıt, 13.1 kanki hareketi) → 14 (açılış). Kabul maddeleri bölüm 15'te.

---

## 1. Aura panoları (v65)

| Satır (y) | Panolar | Durum |
|---|---|---|
| Temel (39940–43020) | Renkler, Yazi, Olculer · Ikonlar, IkonlarYeni, **IkonlarRevize** · BilesenEylem, BilesenYuzey · SablonSekme, SablonDetay, SablonSohbet, SablonSheet, SablonForm, SablonOyun | Kurallar. Önce bunlar uygulanır |
| Açılış ve kayıt (300) | Main, Telefon, Kod | Yeni tokenlar, gerçek wordmark, riso kayıt sahnesi ve riso süs kankiler (bölüm 13) |
| Keşfet ve giriş (1524) | Kesfet, KesfetMekan, CheckIn, KesfetBos, Aktiviteler, AktivitelerBos | Kesfet, KesfetMekan, Aktiviteler ve AktivitelerBos revize edildi |
| Mekan ve masa (2748) | Mekan, MasaKur, Masa, MasaIstek, MasaBitti | Mekan ve Masa revize edildi. MasaBitti ve MasaIstek riso sahne ve kankiler (bölüm 13) |
| Sohbetler (3972) | Mesajlar, Dm, MekanSohbeti, Bildirimler, MesajlarIstek, DmKaydir, DmKlavye, DmKoyu, MekanSohbetiBos, MekanSohbetiKoyu | Mesajlar ve Bildirimler revize edildi |
| Profil ve oyunlar (5196) | Profil, Kapsul, Kinshi, Krot, ProfilDuzenle, ProfilFoto | Profil, Kapsul ve ProfilDuzenle revize edildi. Kinshi ve Krot yalnız token |
| Mekan ve lobi: hâller (7904) | MekanKaydir, MekanKoyu, MekanYukleniyor, MekanHata, MekanDar | Hâl panosu |
| Galeri (9128) | GaleriMekanSohbeti, GaleriCheckIn, GaleriSohbet | Hâl kataloğu |
| Check-in: hâller (12408) | CheckInNokta, CheckInYukleniyor, CheckInIzin, CheckInDisarida, CheckInDar | CheckInNokta revize edildi |
| Vampir Köylü (13760) | VampirRolKarti, VampirRolun, VampirGece, VampirSabah, VampirGunduz, VampirOylama, VampirEleme, VampirSonuc, VampirOylama12 | Yalnız arayüz tokenları değişti |
| Masa kur: hâller (15020) | MasaKurLobi, MasaKurSimge, MasaKurDar, GaleriMasaKur | Hâl panosu |
| Alt menü (17140) | GaleriAltMenu | Yeni alt menüyle yeniden kuruldu |
| Profil: hâller (19610) | ProfilKoyu, ProfilDar, ProfilDuzenleKlavye, ProfilBaskasi, GaleriProfil | ProfilBaskasi revize edildi |
| Keşfet ve kalanlar (27900) | KesfetHarita, KesfetKoyu, KesfetDar, Ayarlar, GaleriKesfet | KesfetHarita ve Ayarlar revize edildi |
| Arayüz revizesi (37740) | MekanMasali, MekanSecenekler, MasaDavet, Masadakiler, MasaSohbeti, MekanSohbetiDuvar, DmDuvar, DmArkadaslik | Yeni. Her pano 820x844, solda açık, sağda koyu |
| Koyu hâller (38704) | KesfetHaritaKoyu, AktivitelerBosKoyu, AktivitelerKoyu, KesfetMekanKoyu, CheckInNoktaKoyu, MasaKoyu, MesajlarKoyu, BildirimlerKoyu, ProfilBaskasiKoyu, AyarlarKoyu, ProfilDuzenleKoyu, KapsulKoyu | Yeni |
| Riso açılış (6680, x470 ve x940) | AcilisRiso (döngü videosu), mor not motionAcilisRiso | **Yeni (v64).** Aynı satırdaki Hareket panosundan ayrı; aktarıma dahil (bölüm 14) |
| Kayıt kanki hareketi (6680, x1580 ve x2050) | KayitKanki (döngü videosu), mor not motionKayitKanki | **Yeni (v65).** Aktarıma dahil (bölüm 13.1) |
| Hareket (6680, x0), Deneme: yeşil tema (35100–36304), Page 2 "Artboard 1" | Hareket, Tema* (17), Artboard-gg20 | **Aktarım dışı** (bkz. 11) |

Sürüm geçmişi (bilgi için):
- v55: revize edilen ekranlar.
- v56: kalan 38 pano yeni tokenlara geçti.
- v57: Temel satır eklendi, koyu tokenlar birleştirildi.
- v58: oyun panoları geçti.
- v59: koyu harita Grafit oldu.
- v60: IkonlarRevize eklendi.
- v61: hâl panoları ve galerilerdeki tüm resimler riso oldu.
- v62: süs kankiler riso PNG, kayıt ve Masa bitti sahne zemini riso.
- v63: Main ve Masa bitti ortasındaki yuvarlak masa görseli kaldırıldı; kayıt sahnesi riso mekân içi.
- v64: AcilisRiso panosu ve motionAcilisRiso notu eklendi. Başka pano değişmedi.
- v65: KayitKanki panosu ve motionKayitKanki notu eklendi. Başka pano değişmedi.

---

## 2. Tokenlar

### 2.1 Renk: açık (`:root`) ve koyu (`.dark.pA`)

| Token | Açık | Koyu |
|---|---|---|
| canvas (ekran zemini) | #EFF7F1 | #000000 |
| surface | #FFFFFF | #151A18 |
| surface2 | #E6F0E8 | #1B211F |
| raised | #FFFFFF | #151A18 |
| text | #031B0B | #EEF3F0 |
| muted | #4A6550 | #A3AEA8 |
| placeholder | #56785E | #8F9A94 |
| accent / focus | #0B783D | #3DDC84 |
| primary / on-primary | #0E8745 / #FFFFFF | #0E8745 / #FFFFFF |
| primary-pressed | #0A7139 | #0B783D |
| danger / on-danger | #A8301A / #FFFFFF | #FF977E / #1F0A04 |
| danger-soft / on-danger-soft | #FBE1DB / #A8301A | #3A1E22 / (açıkla aynı ad) |
| success / success-soft / on-success-soft | #1C7843 / #CDEFD9 / #0F5C31 | #4CC97E / #173022 / — |
| warn-soft / on-warn-soft | #FFF1D6 / #5C3A00 | #3A2A10 / #FFE2B3 |
| calm / on-calm | #D7EEDC / #055328 | rgba(61,220,132,.14) / #93EBB9 |
| lively / on-lively | #FFE6C7 / #7A4300 | #46290B / #FFD8A3 |
| feature / on-feature (seçili çip, ters yüzey) | #031B0B / #FFFFFF | #EEF3F0 / #0B0E0D |
| disabled / on-disabled | #DCE9DE / #4A6550 | #1F2623 / #A3AEA8 (kart üstünde zemin #2A332F) |
| control / track | #C6E0CC / #E0EDE2 | #2A332F / #1B211F |
| divider / border / card-line | #D6E6DA / #6E8874 / #F1F0F4 | #232A27 / #5E6964 / #1B211F |
| hair (liste ayracı) | rgba(3,27,11,.07) | rgba(255,255,255,.07) |
| read (okundu, DM) | #2C63D6 | #7DB2FF |
| buzz (pembe vurgu, rozet) | #FF4F8B | #FF4F8B |
| signal / event / overlap | #FFB547 | #FFB547 / #FFB547 / #FFFFFF |
| violet | #C51F62 | #FF5C93 |
| scrim / scrim-bg | #031B0B / rgba(3,27,11,.20) | #000000 / rgba(0,0,0,.45) |

Cam ve yüzey efektleri:

| Token | Açık | Koyu |
|---|---|---|
| glass-bg | linear-gradient(180deg, rgba(255,255,255,.80), rgba(255,255,255,.54)) | #121614, düz |
| glass-line | rgba(255,255,255,.86) | rgba(255,255,255,.09) |
| glass-shadow | 0 18 44 rgba(4,73,35,.10), 0 2 6 rgba(4,73,35,.05), inset 0 1 0 #FFF | yok |
| glass bulanıklığı | blur 24 + saturate 170% | aynı (zemin düz, etkisi görünmez) |
| soft-bg / soft-line / soft-shadow | rgba(255,255,255,.74) / #FFF / 0 6 16 rgba(4,73,35,.10) | #121614 / rgba(255,255,255,.10) / yok |
| primary-glow | 0 12 26 rgba(14,135,69,.34), inset 0 1 0 rgba(255,255,255,.28) | 0 12 26 rgba(0,0,0,.35) |
| shadow-card / raised / sheet | 0 10 22 .07 / 0 2 8 .08 / 0 8 22 .13 (renk #031B0B) | yok |
| scrim bulanıklığı | 8 | 8 |

Aura (ekran arkasındaki renk bulutu) yalnız açık temada vardır: `ekran.css .a1–.a5`, blur 64.
- a1: 360x300, (-110, -70), rgba(18,152,79,.34)
- a2: 300x280, sağ -120 / üst 30, rgba(255,79,139,.26)
- a3: 280x210, (80, 220), rgba(255,181,71,.24)
- a4: 420x320, sol -60 / alt -150, rgba(18,152,79,.18)
- a5: 260x260, sağ -90 / alt 120, rgba(255,79,139,.14)
- `.quiet`: opaklık .55.

**Koyu temada aura, gren ve gradyan yoktur** (n.107). Zemin #000000 düz.

### 2.2 Ölçek

- **Yazı** (Plus Jakarta Sans):

  | Stil | Boyut / satır | Ağırlık |
  |---|---|---|
  | display | 32/42 | 500, harf aralığı -0.8 |
  | title | 21/27 | 600 |
  | heading (h3) | 16/22 | 600 |
  | body | 15/22 | 500 |
  | body-strong | 15/22 | 600 |
  | button | 16/20 | 600 |
  | button-small | 14/18 | 600 |
  | label | 13/17 | 600 |
  | fine | 13/18 | 500 |
  | eyebrow | 12/16 | 600, harf aralığı .24 |
  | tag | 12/16 | 600 |
  | caption | 11/14 | 600 |

  Kullanılan boyutlar yalnızca 11, 12, 13, 14, 15, 16, 21 ve 32. Oyun ölçeği: 52, 38, 30, 26, 20.
- **Boşluk:** 4'ün katları; yarım adım yok. Değerler 4, 8, 12, 16, 20, 24, 32, 40, 48, 64. Ekran kenarı 20, bölüm arası 24, kart içi 16.
- **Köşe:** xs 6, sm 12, md 16, lg 22, xl 28, pill.
- **İkon:** sm 16, md 20, lg 24.
- **Dokunma:** en az 44. Düğme 48, sekme 56, büyük 64.

### 2.3 Bileşen ölçüleri (Temel satır, normalleştirme onaylı 02:41)

| Bileşen | Ölçü |
|---|---|
| btn | 56, pill (bugün 54) |
| btn.sm | 40 (bugün 38) |
| round | 44; round.lg 56 |
| chip | 32, iç 12, label 13 |
| tag | 24 |
| badge | 20 |
| field | 56 (bugün 54). Form içinde surface + 1 divider. Çok satırlı alan 104, köşe 22 |
| toggle | 52x32 |
| seg | 44, seçili parça 36 |
| msg (balon) | köşe lg 22, kuyruk köşesi xs 6 |
| sheet | köşe 28, kenarlardan 8, en çok ekranın %90'ı, tutamak 40x4 |
| tabbar | 64, alttan güvenli alan + 12, ekran kenarından 20, iç 8 (bugün 70 / sekme 52 / ikon 26–30 / kenar 18 / iç 6) |
| tab | 48 disk, ikon 24 |

---

## 3. İkon ailesi

- **Tek aile: kapsül ikonları (Revize 1).** Panolar: Ikonlar (30 ana), IkonlarYeni (20 yeni çizim + geçiş tablosu), IkonlarRevize (10).
- Çizim kuralı:
  - viewBox 24.
  - `a` güçlü katman `--ci-a` (varsayılan currentColor).
  - `b` %50 opak gövde `--ci-b`.
  - `o` / `ob` çizgi; `ob` %50.
  - Çizgi kalınlığı 3,2; küçükte 2,6. İnce 1,9 çizgi yok.
- Kapalı (seçili değil) ikon tek renktir, gövde %50. Açık ikonda ön kapsül vurgu rengi, arkadaki pembe (buzz); ikisi de tam opak.
- Geçiş tablosu (IkonlarYeni):
  - Alt menü: Keşfet → compass, Aktiviteler → calendar, Mesajlar → chat, Profil → user. Mekân sekmesi bugünkü iki kapsül işaretidir, değişmez.
  - BarIcon: check, close ve bell.
  - Kullanılmayan 22 çizgi ve 14 çubuk ikonu aileden çıkar. Ionicons yedeği kalkar.
- IkonlarRevize (yeni):
  - flag, userMinus, moreV (dikey üç nokta a/b/a), camera, grid2x2, closeSm, chevron, settings, refresh, checkCircle.
  - settings, refresh ve checkCircle'ın bu çizimleri eskilerinin yerine geçer.
  - Logo renkli üç nokta kalkar, yerine moreV gelir (n.123).
- Uyarı satırlarında kullanılan ünlem ikonu (info ikonunun 180° çevrilmişi) tuvalde türetildi. Ayrı bir çizimi onaylanmadı (bkz. 12).

---

## 4. Bileşenler

**Korunan** (davranış ve yapı aynı, yalnız token ve ölçü değişir):
- cam yüzey (glass)
- düğmeler (primary, soft, ink, danger, off)
- yuvarlak düğme, chip, tag, badge, live noktası
- alan (field), liste satırı (li), avatar
- toggle, seg
- sohbet balonu, sheet, tutamak
- tabbar
- gerçek wordmark (`wordmark.ts`; kesişim rengi açıkta #FFB547, koyuda #FFFFFF)
- kapsül ve kanki çizimleri

**Değişen:**

| Bileşen | Değişiklik |
|---|---|
| Ölçüler | btn 56, btn.sm 40, field 56, tabbar 64 (sekme 48) |
| Pasif düğme | disabled / on-disabled. **Opaklık düşürülmez.** Mor zemin + beyaz yazı kalmaz (n.45, 139, 149, 152, 168) |
| Seçili çip | açık: feature zemin + on-feature yazı. Koyu: #EEF3F0 zemin + #0B0E0D yazı |
| Seçili seg | açık: surface. Koyu: beyaz %94 + #0B0E0D yazı |
| Alt menü | Seçili disk açıkta #FFFFFF + shadow-raised, koyuda beyaz %94 gölgesiz. Seçili ikon ön accent (koyuda #0B783D), arka buzz. Seçili değilse muted, gövde %50. Okunmamış noktası 9, üstten 10, sağdan 11, buzz, 2 zemin rengi kenar |
| Liste | glass sm kart (köşe 22). Ayraç hair, kartın içinde, metin hizasından başlar, sağdan 16 içeride |
| Sheet perdesi | `.scrim`: scrim-bg + 8 bulanıklık. Arka ekran bulanık görünür |
| Sohbet | Kendi balonum primary. Karşı taraf raised (koyuda #121614). DM'de karşı taraf balonu DM mavisi kalır. Başlık camı 56, giriş alanı 56 |

**Yeni:**

| Bileşen | Tanım |
|---|---|
| Bilgi kutusu | surface2, muted ikon, köşe 22, iç 12/16. Dokunulamaz, eylem listesinden ayrı durur (n.67) |
| Uyarı kutusu | warn-soft / on-warn-soft + ikon. Listenin üstünde, düğmeye binmez (n.79) |
| Seçenek kutusu | 96x96, köşe 22, surface. Seçili: 2 accent çerçeve + 2 boşluk (n.167) |
| Parça kutusu | 64x64, köşe 18, kapsül alt kenara oturur, aralık 8 (n.166) |
| Kamera rozeti | 36 yuvarlak surface, avatarın sağ altında (-4, -2), camera md 20, mercek accent (n.155) |
| Riso görsel kutuları | liste simgesi 56 / köşe 18 · satır görseli 52 / 16 · nokta 48 / 14 · boş hâl 240x165 / 28 · masa yok 350x210 / 28 · açık masa yok 160x110 · masa kartı yatay 168 yükseklik / 22 · mekân sahnesi 300 üst, alt köşeler 28 |
| Kenar solması | Kayan içerik, sabit alt alanın ya da alt menünün 32 üstünde solar; sert kesim yok. Liste altında 124 boşluk bırakılır |
| Duvar kâğıdı katmanı | Tam ekran görsel. Üst ve alt kenarda hafif koyu perde (masa sohbeti). Başlık bandı (WallBand) başlığın alt kenarına kadar uzar, son 12'de solar |

---

## 5. Uygulama maddeleri

### Genel

- **U1. Tokenlar.** Bölüm 2.1'deki değerler `theme.ts`'e yazılır.
  - Mor aile (ton 278–325) kalmaz.
  - DM mavisi (balon, okundu #2C63D6 / #7DB2FF) korunur.
  - styleGuard testi yeni değerlere göre güncellenir.
- **U2. Koyu tema.** Uygulamanın tek koyu teması `.dark.pA` değerleridir.
  - Zemin #000000.
  - Cam #121614 düz: gradyan, gölge ve gren yok.
  - Sheet içindeki kart #1B211F.
  - Koyuda aura çizilmez.
- **U3. Aura.** Açık temada bölüm 2.1'deki 5 bulut, sekme ve detay ekranlarının arkasında durur. Sheet, sohbet ve oyun ekranlarında yoktur.
- **U4. Yazı ve boşluk ölçeği.** Ekran başlığı display, sayfa başlığı title, bölüm ve satır başlığı h3, açıklama body muted, saat ve ikincil bilgi fine muted. Kenar 20, bölüm 24, kart içi 16.
- **U5. Bileşen ölçüleri.** Bölüm 2.3'e göre.
- **U6. İkonlar.** Bütün ikonlar bölüm 3'teki aileden gelir. Ionicons ve çizgi aile kaldırılır.
- **U7. Alt menü.** Ölçü ve renkler GaleriAltMenu'deki tablodan. Keşfet haritası açıkken çubuk camsız ve opak olur: #EFF7F1 / #000000.
- **U8. Sheet.** Kenarlardan 8, köşe 28, scrim + 8 bulanıklık, tutamak 40x4, alt iç boşluk 38. En çok ekranın %90'ı (390x844'te üstten 76). Sığmazsa içerik sheet içinde kayar, düğmeler sabit kalır.
- **U9. Sabit alt alan.** Düğme alttan 46. Alt menü varsa düğme alt menünün 12 üstünde (alttan 122). İçerik düğmenin 32 üstünde solar.
- **U10. Pasif düğme.** disabled / on-disabled. Koyu kart üstünde zemin #2A332F.
- **U11. Avatar.** Uygulamada kişinin kendi fotoğrafı gösterilir. Tuvaldeki baş harfli avatar yalnız çizim içindir.
- **U12. Riso görseller.** Hazır PNG/JPG olarak paketlenir, uygulama çizmez (bölüm 9). Arayüz öğeleri (yazı, düğme, cam, ikon) riso değildir.

### Ekranlar

| Madde | Pano | Uygulanacak |
|---|---|---|
| U13 | Kesfet, KesfetKoyu | Başlık display, en çok 2 satır. Çipler tek satır, yatay kayar. Arama ve seçici 56, seçili ikon vurgulu. Bölüm başlığı solda, sayı sağda aynı satırda. Mekân satırı riso simge 56/18, "Sessiz" tag calm. Liste glass kartta. OpenStreetMap satırı caption 11, listenin hemen altında (n.1–11) |
| U14 | KesfetHarita, KesfetHaritaKoyu | Harita stili açıkta: zemin #EAF3EC, yol #FFFFFF, yol kenarı #D2E4D6, blok #DDEBE0, park #CFE8D6, sokak adı #5C7A64. Koyuda: zemin #101513, yol #202825, yol kenarı #2A332F, blok #171D1A, park #14231B, sokak adı #8F9A94. Sokak adı 600 11, tek ton, italik yok. Pin: 3 beyaz halka + gölge + riso simge 56; seçilince 21→27 (mevcut). Pin etiketi tek satırlık cam etiket + tag calm. (i) düğmesi 40 cam, alt menünün 12 üstünde. Üst %26 aura, %26–40 arasında haritaya geçiş (n.12–20). MapLibre `androidView="texture"` kalır |
| U15 | AktivitelerBos (+Koyu) | Seg 44 cam. "İstanbul'daki mekanlardan" eyebrow başlığın üstünde. Boş hâl riso 240x165, metin içerik alanında dikey ortalı, açıklama body muted (n.22–27) |
| U16 | Aktiviteler (+Koyu) | Geçmiş satırı riso görsel 52/16. Gün başlık satırında sağda, sonuç etiketi alt satırda sağda, satır yüksekliği sabit. Bölüm başlığı h3 ana renk. Kazandın tag ok, Kaybettin tag lively. Alt menü solması + 124 (n.28–34) |
| U17 | KesfetMekan (+Koyu) | Sahne en üstten başlar, yükseklik 300, alt köşeler 28, durum çubuğu sahnenin üstünde (ayrı şerit yok). Geri düğmesi 44 açık cam. Kafe tag nötr 28, Sessiz tag calm. Başlık display, semt body, açıklama body muted. Ana düğme primary 56 + pin ikonu. "Bu hafta planlı etkinlik yok." küçük cam kartta (n.35–41) |
| U18 | CheckInNokta (+Koyu) | Sheet şablonu (U8). Nokta görseli riso 48/14. Satır 68, h3, radyo 24. Başlık title, rıza metni body muted. Pasif "Konumumu kullan" U10'a uyar. Vazgeç soft (n.42–48). Seçili halka ve tik accent |
| U19 | Mekan (+Koyu) | Üst çubuk zeminsiz, ayrı şerit yok, gerçek wordmark. Masa yok sahnesi riso 350x210/28; metin solda, title + fine. Masa kur primary sm 40. Açık masa yok: başlık tek satır, açıklama en çok 280, riso 160x110. İç salon çipi 40, seçenekler 44. Mekân sohbeti kartında h3 + fine muted. Alt menü solması + 124 (n.49–56) |
| U20 | MekanMasali | Masa kartının üstünde yatay riso masa kartı (168, köşe 22). Ad koyu cam etikette ("Masan" + ad). Oturanlar görselin sağ altında. Kişi sayısı pips (yeşil) + "Lobide değil" tag soft. Lobiye aç primary sm, Davet et soft sm, eşit genişlik. "şu an aktif" aynı satırda live 13 (n.57–63) |
| U21 | MekanSecenekler | Sheet. Kalan süre başlığın altında fine. "Profilinle görünüyorsun" bilgi kutusu, eylem listesinden ayrı. Satır 56, h3; ikonlar user, personCircle, logout. "Mekandan ayrıl" danger (n.64–70) |
| U22 | Masa (+Koyu) | Üstte görsel şerit 96 + ad + meta + Lobiden çek, altta üyeler. Üst düğmeler 44: chat, invite, list. Bitir danger sm. Üye adı 11/600, avatar 36, "Sen" de aynı boyda. Oyun kapağı riso, logo kapağın içinde. "Yakında" koyu cam etiket sol üstte, "Aç" tag ok (n.71–77) |
| U23 | MasaDavet | Sheet. Masa doluyken Davet et düğmeleri pasif (U10). Uyarı kutusu listenin üstünde. Satır 64, h3, liste glass kartta, açıklama body muted (n.78–82) |
| U24 | Masadakiler | Sheet, üstten 84. Satır 56, avatar 40, h3. Kişi sayısı başlığın altında fine. Masa sahibi tag calm, Sen tag soft, satırın sağında. Liste glass kartta, alt kenarda solma (n.83–87) |
| U25 | MasaSohbeti | Duvar kâğıdı masanın uzun riso kartı. Geri 44. Başlık kapsülü 56 cam: fine "Masa sohbeti" + h3 ad. Boş metni `.day` cam kapsül, giriş alanının üstünde. Giriş alanı 56 cam. Üst ve alt kenarda hafif koyu perde (n.88–92) |
| U26 | MekanSohbeti, MekanSohbetiBos, MekanSohbetiKoyu, MekanSohbetiDuvar | Duvar kâğıdı riso, açık ve koyu iki dosya (bölüm 9). Balon primary, cam başlık 56, kimlik satırı cam kapsül, giriş 56 (n.93–95). Başlık bandı 132 (320 dp ve 1,3x'te başlık 122, bant 194) |
| U27 | Mesajlar (+Koyu) | Başlık display, zil 44 round soft, seg 48 cam. Satır 72, avatar 44, ad h3, önizleme body muted tek satır ve "…". Saat fine 12 muted, ad hizasında. Liste glass kartta. Yeni sohbet düğmesi 56 primary, sağdan 20, alt menünün 16 üstünde (n.96–103) |
| U28 | Dm, DmKaydir, DmKlavye, DmKoyu, DmDuvar | Duvar kâğıdı riso "iki kişi", açık ve koyu iki dosya. Kendi balonum primary, karşı taraf DM mavisi (koyuda gelen balon yazısı #FFFFFF). Okundu tiki read. Başlık camı 56, giriş 56. Tepki rozeti korunur (n.114–116). Başlık bandı 108 + 12 solma |
| U29 | DmArkadaslik | Sheet, alt iç boşluk 38. Satır 56, ikon 24 muted (flag, userMinus, block); Engelle danger. Ayraç ikondan sonra (54) başlar, sağdan 16. Başlık title, Vazgeç soft 56. Başlıktaki daha fazla ikonu moreV. Arkadaki mesaj alanı 104–132 arasında solar (n.117–124) |
| U30 | Bildirimler (+Koyu) | Sheet. Bölüm başlığı fine 12 muted, arkasında şerit yok. Satır 64 glass kartta, avatar 44, sohbet düğmesi 44 round soft. Sayfanın üst kenarından iki riso kanki bakar (peek-p1, peek-p2) (n.108–113) |
| U31 | ProfilBaskasi (+Koyu) | Kart yok. Avatar 120, 4 kenarlı, sola hizalı, üst çubuğun 24 altında. Riso kanki avatarın sağ arkasından bakar. Ad display, avatarın 20 altında, düğmelere 24. Mesaj primary + chat ikonu (ok yok). Arkadaşsınız success-soft / on-success-soft + checkCircle 20. İki düğme 56, eşit genişlik. Üst çubuk 56, düğmeler 44 round soft, moreV (n.125–134) |
| U32 | Profil (+Koyu) | "Profil" ve ad+yaş display, başlık satırı 44, kartlar 16 altında. Ayarlar 44 round soft + settings. Profilin ve Kapsülün kartları glass sm, avatar 96, h3 + fine muted, iç 16, aralık 12. Yenile btn sm off + refresh. Anonim adın bloğu: fine etiket + h3 ad + fine açıklama. Arkadaşlar satırında chevron 20, avatar yığını 32, -8 bindirme. Ayraç 16 içeriden (n.135–145). Kapsül çizimi aynı kalır |
| U33 | Ayarlar (+Koyu) | Sheet, üstten 76. Başlık title, bölüm başlıkları h3, açıklama fine muted, bölüm arası 24. Seg 44. Nick'i yenile btn off + refresh. İçerik Tamam'ın üstünde biter, son 32'de solar. Tamam 56, sabit, alttan 46. Kart içi 16, düğme üstte 12, altta 8 (n.146–151) |
| U34 | ProfilDuzenle (+Koyu), ProfilDuzenleKlavye | Fotoğraf kartı yok. Avatar 88 solda, yanında btn sm soft "Fotoğrafı değiştir". Kamera rozeti. Başlık display, geri 44, üst çubuk 56. Alan surface + 1 divider, 56; Tanıtım 104/22. Etiket label muted, açıklama fine muted, alanlar arası 8, gruplar arası 12. Kaydet pasifken U10. Kaydet alt menünün 12 üstünde; klavye açıkken klavyenin 12 üstünde (n.152–160) |
| U35 | Kapsul (+Koyu) | Ayrı mor üst panel yok; başlık ve kapsül içerikle birlikte kayar. Kapsül 160 + 4 surface halka. Takılı parçalar chip 32 + closeSm, kapsülün altında ortalı, en çok 2 satır. Kategoriler chip 32 (seçili feature), yatay kayar, sağdaki son %20 solar. Paket kartı glass sm + h3 + fine. Paketi tak btn sm soft. Parça ve seçenek kutuları (bölüm 4). Kaydet btn off + check, Hepsini çıkar soft; ikisi eşit genişlik, alt menünün 12 üstünde. Geri ve grid2x2 44, başlık title (n.161–171) |
| U36 | Hâl panoları (bkz. 6) | Renk ve bileşen yeni. Ana ekranın yerleşimi yeni ana panodan alınır, hâle özgü içerik hâl panosundan |
| U37 | Main, Telefon, Kod | Token, ikon ve wordmark değişir; sahne zemini ve süs kankiler riso. Metin aynı. Ayrıntı bölüm 13 |
| U38 | Kinshi, Krot, Vampir* (9) | Yalnız arayüz katmanı değişir. Koyu oyun ekranları `.dark.pA` olur (zemin #000000, cam #121614). Vampir açık zeminleri: #ECE8F4→#EFF7F1, #1B1730→#031B0B, #5E5878→#4A6550, #4B2FD0→#0E8745 (birincil düğme), #2A1A4A / #1D1A28→#0B0E0D. Oyun sanatı değişmez: gökyüzü ve evre renkleri, Köylü #6E4FF0, Vampir #E0245E, #5B3B7E, #3A2560, #4A4458, Kinshi takım rengi. Oyun tasarımının kaynağı `docs/design/vampir/yuvarlak-masa.html` kalır |

---

## 6. Hâl matrisi

✓ = Aura'da çizili. T = ortak bileşenden türetilir (kuralı sağda). — = gerekmez. **E = eksik** (çizilmedi, tahminle yapılmaz).

| Ekran | Açık | Koyu | Yükleniyor | Boş | Hata | Dar (320 dp / 1,3x) |
|---|---|---|---|---|---|---|
| Keşfet liste | ✓ Kesfet | ✓ KesfetKoyu | ✓ GaleriKesfet | ✓ KesfetBos, GaleriKesfet "Sonuç yok" | ✓ GaleriKesfet | ✓ KesfetDar |
| Keşfet harita | ✓ | ✓ | T (GaleriKesfet kutusu, harita üstünde) | — | T (aynı) | **E** |
| Mekân sayfası | ✓ KesfetMekan | ✓ | ✓ GaleriKesfet "Mekan sayfası hâlleri" | ✓ etkinlik yok kartı | ✓ GaleriKesfet | T (sayfa dikey kayar) |
| Şehir ve semt, Ayarlar alt sayfaları | ✓ GaleriKesfet | T | T | T | T | T |
| Check-in | ✓ CheckIn, CheckInNokta | ✓ CheckInNoktaKoyu, GaleriCheckIn | ✓ CheckInYukleniyor | — | ✓ CheckInIzin, CheckInDisarida, GaleriCheckIn | ✓ CheckInDar |
| Aktiviteler: Etkinlikler | **E** (dolu liste) | ✓ AktivitelerBosKoyu (boş) | **E** | ✓ AktivitelerBos | **E** | **E** |
| Aktiviteler: Geçmiş | ✓ Aktiviteler | ✓ AktivitelerKoyu | T (GaleriKesfet kutusu) | **E** (riso sahnesi yok) | T | T |
| Mekân (masasız) | ✓ Mekan, MekanKaydir | ✓ MekanKoyu | ✓ MekanYukleniyor | ✓ Mekan (masa yok, açık masa yok) | ✓ MekanHata | ✓ MekanDar |
| Mekân (masalı) | ✓ MekanMasali | ✓ MekanMasali sağ | T (MekanYukleniyor) | — | T (MekanHata) | T (MekanDar kuralı) |
| Süren masalar, lobi satırı, mekân sohbeti kartı | ✓ GaleriMekanSohbeti | ✓ | ✓ | ✓ | ✓ | ✓ |
| Mekân seçenekleri | ✓ MekanSecenekler | ✓ | — | — | T (FEEL_ERROR, mevcut) | T (U8) |
| Masa kur | ✓ MasaKur, MasaKurLobi, MasaKurSimge | ✓ GaleriMasaKur | ✓ GaleriMasaKur "kuruluyor" | — | ✓ GaleriMasaKur "kurulamadı", "fotoğraf gerekli" | ✓ MasaKurDar |
| Masa | ✓ Masa, MasaIstek, MasaBitti | ✓ MasaKoyu | T | — | T | **E** |
| Davet | ✓ MasaDavet (dolu) | ✓ | T | — | T | T (U8) |
| Masadakiler | ✓ | ✓ | T | — | T | T (U8) |
| Masa sohbeti | ✓ MasaSohbeti (boş) | ✓ | T (GaleriSohbet) | ✓ | T (GaleriSohbet) | T (GaleriSohbet 320 + 1,3x) |
| Mekân sohbeti | ✓ MekanSohbeti, MekanSohbetiBos | ✓ MekanSohbetiKoyu | ✓ GaleriMekanSohbeti | ✓ | ✓ | ✓ GaleriSohbet |
| Mesajlar | ✓ Mesajlar, MesajlarIstek | ✓ MesajlarKoyu | ✓ GaleriSohbet "Sohbetler" | ✓ GaleriSohbet | ✓ GaleriSohbet | ✓ GaleriSohbet |
| DM | ✓ Dm, DmKaydir, DmKlavye, DmArkadaslik | ✓ DmKoyu | ✓ GaleriSohbet | ✓ GaleriSohbet | ✓ GaleriSohbet (Gönderilemedi) | ✓ GaleriSohbet |
| Bildirimler | ✓ | ✓ | T (GaleriKesfet kutusu) | **E** | T | T (U8) |
| Profil | ✓ Profil | ✓ ProfilKoyu | ✓ GaleriProfil | ✓ GaleriProfil "ad yok, fotoğraf yok" | ✓ GaleriProfil | ✓ ProfilDar |
| Başkasının profili | ✓ ProfilBaskasi | ✓ | ✓ GaleriProfil | — | ✓ GaleriProfil "görüntülenemiyor" | T (U4, dikey kayar) |
| Profili düzenle | ✓ ProfilDuzenle, ProfilDuzenleKlavye | ✓ | — | — | ✓ GaleriProfil | ✓ GaleriProfil "Kaydet: sabit alt alan" |
| Kapsülün | ✓ Kapsul | ✓ | — | — | ✓ GaleriProfil "kaydedilmedi" | T (kayar, kategoriler yatay) |
| Ayarlar | ✓ | ✓ | — | — | T | T (U8) |
| Alt menü | ✓ GaleriAltMenu | ✓ | — | — | — | ✓ 320 dp |

Türetme kuralları:
- **Yükleniyor:** buluşan kapsüller yükleyicisi. 300 ms sonra görünür, en az 600 ms kalır (GaleriMekanSohbeti).
- **Hata:** cloudOff ikonu + metin + "Tekrar dene" btn sm soft (GaleriKesfet "Yükleniyor ve hata").
- **Dar:**
  - Metin "…" ile kesilmez; tek satırlık önizlemeler hariç.
  - Düğme yazısı iki satıra bölünmez.
  - Sığmayan içerik kayar.
  - Dokunma alanı küçülmez.
- **Hâl panolarında yerleşim:** hâl panosu eski yerleşimin üstüne çizilmişse ana ekranın yeni yerleşimi geçerlidir. Örnekler: MekanDar ve MekanKaydir'deki masa yok sahnesi, U19'daki riso sahnesiyle aynıdır. ProfilDar'da da U32'deki kart yerleşimi geçerlidir.

---

## 7. Platform farkları

| Konu | iOS | Android |
|---|---|---|
| Cam bulanıklığı, scrim bulanıklığı | var | Android 12 ve üstünde var. Altında bulanıklık yok: cam yarı saydam düz renk, scrim yalnız renk |
| Ekran gelişi (arrive 12 px blur) | var | Android 12 altında yalnız opaklık |
| Mekân sohbeti önizlemesi (tek satır) | "…" | Son 44'te gerçek yatay kenar solması, yalnız taşan satırda, ölçümsüz |
| Alt güvenli alan | ana ekran çizgisi 34 | hareketle gezinme 24, üç tuş 48. Tabbar altı = güvenli alan + 12. Değer cihazdan okunur |
| Geri | geri düğmesi, kaydırarak geri | geri düğmesi + sistem geri, aynı yol |
| Klavye | native, özel animasyon yok | native, özel animasyon yok |
| Harita | MapLibre | MapLibre `androidView="texture"` kalır. Harita üstünde tabbar opak (U7) |
| Koyu tema | düz renkler; çalışma anı gradyanı yok, bantlaşma riski yok | aynı |

---

## 8. Hareket, tetik, titreşim

Yeni hareket ve yeni titreşim yok. Değerler `hareket.json` ve uygulamanın bugünkü sürelerindendir. Ayrıntı panodaki hareket notlarındadır: motionAltMenu, motionChat, motionDm, motionVenueChat, motionVenueChatScreen, motionCheckIn, motionMasaKur, motionProfil, motionKesfet, motionLobby.

| Yer | Tetik | Hareket | Titreşim |
|---|---|---|---|
| Alt menü | sekmeye dokunuş | Disk kayar: tabLead 420/30, tabTrail 200/24, en çok %10 basılma. Eski ikon 160 ms'de söner, yeni ikon 60 ms sonra 140 ms'de 0,5'ten büyür. Ekran 450 ms arrive, 12 dp alttan. Basış 100 ms 0,96 | selection (mevcut) |
| Alt menü | açık sekmeye dokunuş | İç sayfadaysa yığının başına döner. Profili düzenle'de değişiklik varsa önce sorar | yok |
| Alt menü görünürlüğü | — | Gizli: DM, Masa ve oyunlar, Mekân sohbeti, kişi profili, ayar alt sayfaları, hukuki metinler. Sekme içi sayfalarda görünür: Mekan sayfası, Profili düzenle, Kapsülün, Arkadaşlar. Sheet'ler çubuğun üstünde açılır. Klavye çubuğu örter | — |
| Sohbet gönderimi | sunucu yanıtı | İşaret swap 200 ms. Balon opaklığı 0,6→1 | mevcut |
| Gönderilemedi / Tekrar dene / Sil | hata, dokunuş | Satır arrive 450 ms, yükseklik swap 300 ms. Çıkış leave 220 ms | mevcut |
| Sabit tarih etiketi | kaydırma başlar / durduktan 1,2 s sonra | opaklık 150 ms. DM'de konum 116 | — |
| En alta in | son satır görünmez / görünür | Opaklık 150 ms. Rozet pop 260/17, sayı değişimi leave 120 / arrive 180 | — |
| Mekân sohbeti kartı | okunmamış, aktiflik, yeni satır | Rozet pop. "şu an aktif" arrive 450 / leave 220. Satır swap 300. Yer tutucu 300 / 600 | — |
| Check-in sheet | açılış ve kapanış | 320 ms ease-out (0.2, 0.8, 0.2, 1). Kankiler pop yayıyla 80 ms arayla belirir | mevcut |
| Check-in | uyarı / başarı | Sheet swap 300 ile uzar, kart arrive 450. Başarıda doğrudan Mekân açılır, ara ekran yok | mevcut |
| Nokta seçimi | satıra dokunuş | accent halka + tik pop. Düğme pasiften etkine swap 200 | mevcut |
| Masa kur | açılış | 320 ms, ekranın üstünden 96 aşağıda durur | — |
| Masa kur | lobide görünsün, tema çipi | anahtar topu press yayıyla kayar | selection |
| Masa kur | Masayı kur başarılı / hata | Masa açılır / uyarı satırı belirir | tableOpened / FEEL_ERROR |
| Profil kapsülü | dokunuş | JUMP 500 ms, göz kırpma | selection |
| Kapsülün | duygu, parça, karıştır, kaydet | 1850 ms, JUMP, SHUFFLE | selection; kaydedince accountReady |
| Profil grubu hataları | kaydetme, fotoğraf, nick, istek, engelleme | — | FEEL_ERROR (alan doğrulama hatasında yok) |
| Keşfet | sekme açılışı | Stagger 70 / 60. Harita pini 21→27. Mekân sahnesi 320 ms bekler, 500 ms'de netleşir | Liste/Harita anahtarında selection |
| Lobi | ilk yükleme | listRowMs 60 | — |
| Açılış perdesi | soğuk, ilk ve hızlı açılış | Riso "baskı ayrılır" açılışı, zamanlama aynı. Ayrıntı bölüm 14 | yok |
| Kayıt ekranı kankileri | ekran görünür kaldıkça, 6 sn döngü | Nefes, salınım, göz kırpma, iki kanki zıplar; zemin durağan. Ayrıntı bölüm 13.1 | yok |

- **Reduced Motion:** her harekette anında geçiş. Titreşimler değişmez.
- **Titreşim kuralı (31 Eki 07:09):** mevcut haptik davranış aynen korunur. Yeni titreşim eklenmez. Mevcutların süresi, şiddeti ve tetiği değişmez. Notlardaki "titreşim tanımlanmadı (karar açık)" ifadeleri bu kararla kapanmıştır.
- Solmalar (kenar, alt alan, WallBand) sabit maskedir, hareket değildir.

---

## 9. Görsel dosyalar

### 9.1 Hazır

Kök: `/mnt/project-files/`. Uygulamaya @2x ya da @3x olarak bu kaynaklardan dışa aktarılır.

| Kullanım | Dosya | Ölçü |
|---|---|---|
| Mekân simgesi ve harita pini: kafe | arayuz-revize/01-kesfet/riso-ikon/riso-kafe.png | 400x400 |
| Mekân simgesi ve harita pini: restoran | arayuz-revize/01-kesfet/riso-ikon/riso-restoran.png | 400x400 |
| Mekân simgesi ve harita pini: kampüs, çay bahçesi | arayuz-revize/26-riso-tamamlama/riso-kampus.png, riso-cay.png | 400x400 |
| Etkinlikler boş hâli | arayuz-revize/04-aktiviteler/riso-bos.png | 640x440 |
| Geçmiş satırı: sohbet | arayuz-revize/05-gecmis/riso-sohbet.png | 400x400 |
| Geçmiş satırı: Vampir Köylü | arayuz-revize/05-gecmis/riso-vampir.png | 400x400 |
| Mekân sayfası sahnesi (tek genel sahne) | arayuz-revize/06-mekan-detay/riso-detay.png | 800x600 |
| Check-in noktası: İç salon | arayuz-revize/07-checkin/riso-icsalon.png | 400x400 |
| Check-in noktası: Bahçe | arayuz-revize/07-checkin/riso-bahce.png | 400x400 |
| Mekân: masa yok | arayuz-revize/08-mekan/riso-masayok.png | 700x420 |
| Mekân: açık masa yok | arayuz-revize/08-mekan/riso-acikyok.png | 320x220 |
| Masa görseli yatay (55 masa) | masa-kartlari/55-kart/yatay/NN-ad.png (ad listesi: 55-kart/masa-adlari.md) | 2000x1200 |
| Masa sohbeti duvar kâğıdı (55 masa) | masa-kartlari/55-kart/uzun/NN-ad.png | 900x1950 |
| Oyun kapağı + riso logo | arayuz-revize/11-masa/riso-g_vampir.png, riso-g_signum.png, riso-g_kinshi.png, riso-g_krot.png | 600x400 |
| Mekân sohbeti duvar kâğıdı | arayuz-revize/15-mekan-sohbeti-duvar/mekan-sohbeti-acik.png, mekan-sohbeti-koyu.png | 900x1950 |
| DM duvar kâğıdı | arayuz-revize/19-dm-duvar/dm-sohbeti-acik.png, dm-sohbeti-koyu.png | 900x1950 |
| Bakan kankiler (Bildirimler, başkasının profili) | arayuz-revize/18-bildirimler/peek-p1.png, peek-p2.png | 160x200, saydam |
| Kayıt sahnesi (Main, Telefon, Kod) | arayuz-revize/26-riso-tamamlama/riso-kayit.png | 800x920 |
| Masa bitti ve Gelen istek sahnesi | arayuz-revize/26-riso-tamamlama/riso-sahne.png | 800x1000 |
| Süs kankiler (12) | arayuz-revize/26-riso-tamamlama/kankiler/riso_*.png | 320x420, saydam |
| Kapalı göz kankiler (Main'deki 7 kanki) | arayuz-revize/27-riso-animasyon/kaynak/kk/<id>_c.png (aynı kankinin gözü kapalı riso baskısı; açık göz eşi kankiler/riso_<id>.png) | 320x420, saydam |

Notlar:
- Tuvaldeki `riso-lale.jpg` ve `riso-lale-uzun.jpg` önizleme kopyalarıdır. Uygulamada 55-kart'taki `16-lale.png` kullanılır.
- `*-soldurulmamis.png` dosyaları ham baskıdır; uygulamaya girmez.
- Çözünürlük: kaynaklar çoğunlukla @2x'tir (ör. riso-kayit 800 genişlik ↔ 390 ekran; riso-detay 800 ↔ 390). @3x için yeniden üretim gerekir; büyütülerek kullanılmaz. Uygulamaya WebP olarak dışa aktarılabilir.
- Kaynak üreticiler: `masa-kartlari/55-kart/kaynak/`, `arayuz-revize/_uretici/` ve klasörlerdeki `ikon.js`.

### 9.2 Hazır değil (uygulanmış sayılmaz)

- Kafe, restoran, kampüs ve çay bahçesi dışındaki mekân türlerinin riso simgesi ve pini.
- Mekâna özel sahneler. Bugün tüm mekânlar için tek genel sahne var (riso-detay).
- İç salon ve Bahçe dışındaki check-in noktalarının riso görseli.
- Signum, Kinshi ve Krot için Geçmiş satırı görseli. Yalnız sohbet ve Vampir hazır.
- Masa ekranında "Yakında" altındaki iki oyunun kapağı (n.77).
- Geçmiş ve Bildirimler boş hâl sahnesi. Etkinlikler dolu hâli.
- **Riso açılış doku seti** (bölüm 14): `zemin-lif`, `parilti-yarimton` x3, `mor-doku` x3, `pembe-doku` x3, `beyaz-doku` x3, `harf-s/k/a` x3. Dışa aktarılmadı. Klasördeki `L_s/L_k/L_a.png` yalnız harf maskesidir (780x1688, siyah zemin beyaz harf), doku değildir. Değerler `28-riso-acilis/kaynak/render.py` içindedir (`cov()`, `SCR`, `BOIL`).
- Kapsül çizimleri: `22-profil/kapsul.png` ve `25-kapsul-susle/k-*.png` ekran görüntüsünden alınmıştır, teslim dosyası değildir. Kapsülleri uygulama bugünkü gibi kendisi çizer.

### 9.3 Hâl panolarında ve galerilerde riso geçişi (v61)

Uygulamadaki eski masa simgeleri (3B çizim, 100 adet) yerine 55 riso masa kartı kullanılır. Tuvalde eski simgeler tema olarak en yakın karta çevrildi; kare kesit = yatay kartın ortası (1200x1200 → 400).

| Eski simge | Riso kart |
|---|---|
| Deniz feneri | 01-fener |
| Balkabağı | 04-kabak |
| Roket | 05-roket |
| Salon (ahşap ev) | 07-kusevi |
| At nalı ahır (Masa kur sahnesi dahil) | 09-atnali |
| Yel değirmeni | 10-yeldegirmeni |
| Kara tahta | 13-mikroskop |
| Yemek tepsisi | 23-demlik |
| Ağaç ve bank | 25-agacev |
| Kamp ateşi | 26-ates |
| Saat kulesi | 29-saatkulesi |
| Kütüphane | 30-kutuphane |
| Şerif yıldızı | 45-kupa |
| Gün batımı | 53-dondurma |

Diğer değişiklikler:
- Mekân türü simgeleri: kafe riso-kafe. Kampüs ve çay bahçesi yeni çizildi: arayuz-revize/26-riso-tamamlama/riso-kampus.png, riso-cay.png (400x400).
- Check-in arkasındaki mekân sahnesi: riso-detay.
- Mekân hâlleri (MekanKaydir, MekanYukleniyor, MekanHata, MekanDar): "Henüz masan yok" sahnesi riso-masayok, "Açık masa yok" riso-acikyok.
- Mesajlar İstekler boş hâli ve GaleriSohbet'teki sohbet boş hâlleri: riso-sohbet 96x96, köşe 22.
- GaleriSohbet DM duvar örneği: dm-sohbeti-acik.

Değişen panolar:
- CheckIn, CheckInDar, CheckInDisarida, CheckInIzin, CheckInYukleniyor
- KesfetDar
- Main
- MasaBitti, MasaIstek
- MasaKur, MasaKurDar, MasaKurLobi, MasaKurSimge
- MekanDar, MekanHata, MekanKaydir, MekanYukleniyor
- MesajlarIstek
- Galeriler: GaleriCheckIn, GaleriKesfet, GaleriMasaKur, GaleriMekanSohbeti, GaleriSohbet

Süs kankiler (v62):
- Check-in sheet kenarındaki, kayıt ekranlarındaki (Main, Telefon, Kod) ve Masa bitti / Masa isteğindeki kankiler riso baskıdır.
- Dosyalar: arayuz-revize/26-riso-tamamlama/kankiler/riso_*.png, saydam PNG, 320x420 (12 dosya). Aynı kapsül süsleri (kedi kulağı, korsan, anten, parti şapkası, kulaklık, hale, çiçek, gözlük, büyücü, tavşan, kovboy) riso dört mürekkebe ayrılmıştır. Riso'da mavi ve mor mürekkep yoktur; mavi kankiler teal basılır.
- Kayıt sahnesi (Main, Telefon, Kod): riso-kayit.png (800x920, mekân içi: pencereler, raf, ışık zinciri, lambalar, uzun masa). Masa bitti sahnesi: riso-sahne.png (800x1000). İkisi de cover, alttan hizalı.
- Main ve Masa bitti'de ortadaki yuvarlak masa görseli yok (Gökay, 1 Kas 18:30). Uygulamada bu görsel varsa **kaldırılır** (açık kaldırma talimatı).

Riso olmayan ve öyle kalanlar:
- Kişinin kendi kapsülü (avatar, kimlik satırı, mesaj adı yanında): uygulama kişinin süslediği kapsülü çizer.
- Vampir, Kinshi ve Krot oyun sanatı.
- Yükleyici ve hata simgeleri: arayüz öğesidir.

---

## 10. Korunacak ürün davranışları ve gizlilik

Görünüş değişikliği hiçbir işlevi kaldırmaz. Hiçbir ekranda metin değişmedi.

- **DM:**
  - Teslim durumları: saat, tek tik, çift tik, okundu, Gönderilemedi + yeniden deneme.
  - Gönderilemedi metinleri ayrı anahtarlardadır: chat.notSent, retry, discard.
  - Gelen kutusunda "Gönderiliyor" gösterilmez.
  - Okundu tiki DM mavisidir.
- **Mekân sohbeti:**
  - Kendi balonunda tik yok.
  - Mesaj başına bekleyen ya da başarısız hâl bugün yok. Çizimdeki hâl tasarım hedefidir, ayrı iş olarak planlanır.
  - DM mavi, mekân sohbeti yeşil.
- **Check-in:**
  - Açık rıza kutusu yok.
  - Başarılı check-in doğrudan Mekân'ı açar (K4).
- **Vampir Köylü:**
  - Rol kartı görülmeden "Hazırım" pasiftir (K1).
  - Kum saatiyle birlikte küçük sayısal geri sayım gösterilir (K2).
- **Masa kur:**
  - İçerik kayar, "Masayı kur" sabit kalır.
  - Lobide görünürlük varsayılan olarak kapalıdır.
  - 320 dp'de sıkıştırma yok.
- **Süren masalar:**
  - Bölüm kalır.
  - 0 masada açıklama gizlenir.
- **Gizlilik:**
  - Lobide yalnız masa adı, simge, telefon sayısı ve etiket görünür. Cinsiyet, doğum tarihi, telefon ve konum gösterilmez.
  - Anonim kişi kapsül + kapsül adıyla görünür.
  - Hesap'ta maskeli telefon ve doğum tarihi yalnız kişinin kendisine görünür.
  - Profilde yaş görünebilir.
  - Kapsül süslemesi herkeste kendi kapsülüyle görünür.
- **Keşfet:**
  - Boş sonuç metni nedene göre seçilir: arama, tür, semt. Veri yoksa genel boş metni.
  - Nokta değiştir, Kapsül karakterler ve Engellenenler mevcut davranışta kalır.
- **Genel:**
  - Native geçişler korunur (K5).
  - Sekmeler canlı kalır; dönüşte kaydırma konumu korunur.
  - Mekân sekmesinin ikonu bugünkü ikondur.
- **Titreşim:** bölüm 8.

---

## 11. Aktarım dışı

- Hareket panosu (x0 y6680): eski renkli hareket filmi. Aynı satırdaki AcilisRiso ve motionAcilisRiso bu kapsamda değildir, aktarıma dahildir.
- Kayıt sahnesi zemin animasyonu (`27-riso-animasyon/kayit-riso-animasyon-demo.mp4` içindeki lamba, ışık zinciri, yıldız, buhar ve kaynama): Gökay 21:34'te yalnız kanki hareketini seçti. Zemin hareketi uygulanmaz (video arka plan gerektirir, sınır dışı). Zamanlama referansıdır, renkleri geçersizdir.
- "Deneme: yeşil arayüz teması" satırı (Tema*, 17 pano): karşılaştırmadır. `aura.css` ve `aura-yesil.css` yalnız bu panolar ve Hareket için projede durur. Uygulamada kullanılmaz.
- Page 2 "Artboard 1": boş pano.
- Oyunların kendi tuvallerinde onay bekleyen revizeler Aura'ya alınmadı. Oyun panoları yalnız token geçişidir. İkisi ayrışabilir.

---

## 12. Tamamlanmamış işler ve açık kararlar

Tahminle doldurulmaz. Karar gelene kadar bugünkü uygulama davranışı korunur.

1. **POI simgeleri:** KAPANDI (Gökay, 2 Kas): hazır POI simgeleri kalır (n.17).
2. **Masa sohbeti gönder düğmesi:** KAPANDI (Gökay, 2 Kas): alan boşken pasif (`.send.off`), bütün sohbetlerin ortak giriş alanında (n.92).
3. **Kapsül kategorileri:** 5. ve 6. çipin adı (çizimde "Ağız", "Boyun") ekran görüntüsünden okunamadı. Uygulamadaki adlar kalır (n.163).
4. **Tanıtım yer tutucusu:** Profili düzenle'de okunamadı. Uygulamadaki metin kalır (n.160).
5. **Uyarı ikonu:** ünlem ikonunun ayrı kapsül çizimi onaylanmadı. Tuvalde info ikonunun 180° çevrilmişi kullanıldı.
6. **Masa simgesi 100 → riso kart 55 eşleşmesi:** Tuvalde yalnız 14 eski simgenin karşılığı var (9.3). Uygulamadaki 100 simgenin kalan 86'sının hangi karta gideceği, 45 simgenin fazlası (birleşme mi, yeni kart mı) ve masa kur seçicide kaç seçenek görüneceği karar bekliyor. Karar gelene kadar uygulama bugünkü 100 simgeyi gösterir; yalnız 9.3'teki 14 eşleşme uygulanabilir.
7. **Riso görseller:** 9.2'deki görseller çizilmedi.
8. **Eksik hâller:** 6'daki E hâlleri çizilmedi. Aura tuvaline çizilecek (Gökay, 2 Kas); çizilince aktarılır.
   - Keşfet harita dar.
   - Etkinlikler dolu, yükleniyor, hata ve dar.
   - Geçmiş boş.
   - Masa dar.
   - Bildirimler boş.
   - Kayıt ekranları (Main, Telefon, Kod) ve Masa bitti koyu: pano yok, koyu riso sahne yok.
9. **Hâl panolarının yerleşimi:** v56'da çevrilen hâl panoları (Mekan*, CheckIn*, MasaKur*, ProfilDar, Dm*, MekanSohbeti*) renk ve bileşen olarak günceldir ama yerleşimleri eski ana ekrana dayanır. Kural U36'dır. Yeniden çizim istenirse ayrı iş.
10. **Anonim adın tekrarı:** KAPANDI (Gökay, 2 Kas): anonim ad ve Yenile yalnız Profil'de; Ayarlar'dan kalktı (n.151 notu).
11. **İlk açılışın halka ve parıltısı (ring, flare):** KAPANDI (Gökay, 2 Kas): ring/flare/glint bugünkü düz hâliyle kalır, zamanları değişmez.
12. **Kayıt sahnesi animasyonu:** KAPANDI (Gökay, 1 Kas 21:34): yalnız kankiler hareket eder, zemin durağan (bölüm 13.1).
13. **MasaBitti sahne köşesi:** KAPANDI (Gökay, 2 Kas): ölçeğe çekildi, alt köşeler 28.

---

## 13. Kayıt ekranları ve Masa bitti (v62–v63)

Panolar: Main ("Açılış", kayıt girişi), Telefon, Kod, MasaBitti, MasaIstek. Metin değişmedi.

| Madde | Pano | Uygulanacak |
|---|---|---|
| U39 | Main | Sahne kutusu (`.scene`, köşe 28) içerik akışında `flex: 1`. Zemin `riso-kayit.png`, cover, alttan hizalı. Zemindeki beyaz ışık elipsi (`.floor`) çizilmez. Ortadaki yuvarlak masa görseli yok. 7 riso süs kanki sahnenin içinde durur (tablo aşağıda). Üstte wordmark 32 yükseklik; başlık 32/42 500; açıklama body; Başla btn primary block 56; "18 yaş" fine. İçerik iç boşluğu 58 üst / 20 yan / 36 alt, öğe arası 22 |
| U40 | Telefon, Kod | `.quiet` aura (opaklık .55, a3 yok). Sahne zemini aynı `riso-kayit.png`, cover, alttan. Sahnede iki riso kanki ve konuşma balonu (glass, köşe 22/22/8/22). Alanın üstünden bir riso kanki bakar (`.behind > .peek`, alanın 58 üstü). Adım göstergesi: seçili 22x6 primary, diğerleri 6x6 |
| U41 | MasaBitti | Sahne ekranın üstünde, yükseklik 320, alt köşeler 36, zemin `riso-sahne.png` cover alttan; `.floor` yok, yuvarlak masa yok. 6 konfeti çubuğu 8x18 köşe 4 (accent, #FF4F8B, #FFB547). Altta 3 riso kanki (sol 20 / 110x144, orta 139 / 112x147, sağ 260 / 110x144; alttan -16 / -26 / -16). Liste glass, Mekana dön btn glassy block |
| U42 | MasaIstek | Sahne zemini ve süs kankiler riso (v61–v62). Yerleşim değişmedi |

Main kanki yerleşimi (sahne kutusuna göre; `stand` = kanki görseli + altında gölge elipsi):

| Dosya (kankiler/) | sol | alt | genişlik x yükseklik |
|---|---|---|---|
| riso_b83534.png | 70 | 100 | 72x95 |
| riso_7d5ef2.png | 208 | 100 | 72x95 |
| riso_3c95b1.png | 139 | 108 | 72x95 |
| riso_4957ac.png | -10 | 62 | 96x126 |
| riso_1a80a9.png | 264 | 62 | 96x126 |
| riso_6f419d.png | 34 | -18 | 118x155 |
| riso_f280a5.png | 198 | -18 | 118x155 |

- Kanki gölgesi (`.stand i`): genişliğin %50'si, yüksekliğin %7'si, alttan %2,5, rgba(4,73,35,.24), blur 3.
- Telefon, Kod, MasaBitti ve MasaIstek'teki kankiler de `kankiler/` klasöründeki 12 dosyadandır. Dosya adı tuvaldeki görselle eşlenir (MasaBitti solda riso_4957ac, ortada riso_6f419d; Telefon sağda riso_6f419d).
- Koyu tema: kayıt ekranlarının koyu panosu yok. Koyu temada zemin #000000, aura yok; sahne görseli aynı dosyadır (riso-kayit'in koyu sürümü çizilmedi; bkz. 12.8 eksik hâller).
- Hareket: Main'deki 7 kanki hareket eder (13.1). Telefon ve Kod'daki kankiler aynı kurala göre hareket eder; yalnız Main için kanki başına değer tanımlıdır. Telefon ve Kod için evre ve göz kırpma anları açık soru: tanım gelene kadar Telefon ve Kod kankileri durağan kalır.

### 13.1 Kayıt ekranı kanki hareketi (v65, onay 1 Kas 21:34)

Panolar: KayitKanki (x1580 y6680, gerçek hız döngü videosu), mor not motionKayitKanki (x2050). Kaynak: `arayuz-revize/27-riso-animasyon/kanki-hareketi/` (kayit-kanki.mp4, comp3.js, main.html).

- Zemin (`riso-kayit.png`) durağan: kaynama, lamba, ışık zinciri, yıldız ve buhar yok.
- Döngü 6 sn. Her hareket yalnız transform (translateY, rotate, scaleX, scaleY) ve görsel değişimi. Dönüş ve ölçek merkezi kanki görselinin %50 / %96 noktası (alt orta).
- **Nefes:** scaleY = 1 + 0,022·sin(2π·t/P + φ), scaleX = 1 − 0,012·sin(2π·t/P + φ).
- **Salınım:** rotate = 2,2°·sin(2π·t/3 + 0,9·φ).
- **Göz kırpma:** 125 ms boyunca açık göz görseli gizlenir, kapalı göz görseli (`<id>_c.png`) görünür.
- **Zıplama** (600 ms, u = (t − başlangıç)/0,6): u < 0,15 çömelme scaleY −0,07·sin(πu/0,15), scaleX +0,05·aynı; 0,15–0,85 arası translateY = −12·sin(πv), v = (u−0,15)/0,7, scaleY +0,04·sin(πv), scaleX −0,02·sin(πv); 0,85–1 iniş scaleY −0,05·sin(π(u−0,85)/0,15), scaleX +0,04·aynı. Zıplarken salınım ×0,3. Gölge elipsi ölçek ve opaklık = 1 + translateY/30.

| Kanki | P (sn) | φ | Göz kırpma (sn) | Zıplama başı (sn) |
|---|---|---|---|---|
| riso_b83534 | 2 | 0 | 0,9 · 4,1 | — |
| riso_7d5ef2 | 3 | 1,1 | 2,3 | — |
| riso_3c95b1 | 2 | 2,2 | 1,6 · 1,85 · 5,0 | — |
| riso_4957ac | 3 | 3,0 | 3,2 | 5,15 |
| riso_1a80a9 | 2 | 4,0 | 0,4 · 3,9 | — |
| riso_6f419d | 3 | 5,0 | 2,8 | — |
| riso_f280a5 | 2 | 0,6 | 1,2 · 4,6 · 4,85 | 3,4 |

- Tetik: ekran görünürken sürekli; dokunuş tetiği yok. Ekran görünmezken durur.
- Titreşim: yok.
- Hareketi azalt: tüm kankiler durağan, gözler açık.
- Uygulama: Reanimated 4 ile UI thread'de; her kanki için açık ve kapalı göz görseli üst üste, görünürlük 0/1.

---

## 14. Riso açılış (v64, onay 1 Kas 20:43)

Panolar: AcilisRiso (x470 y6680, gerçek hız döngü videosu), mor not motionAcilisRiso (x940 y6680). Demo: `arayuz-revize/28-riso-acilis/acilis-riso-demo.mp4` (gerçek hız + 0,5x), `acilis-riso-dongu.mp4`.
Kod yeri: `apps/mobile/src/features/launch/LaunchCurtain.tsx`, `apps/mobile/src/theme/launchMotion.ts` (Kabuk c0e0de7'de okundu).

### 14.1 Değişmeyen
- `launchTimeline`, `launchGeometry`, `wordStage` değerleri ve yaylar: C0 500, C1 620, M0 620 yay 220/20, B +40 ms, L0 760 yay 260/26, harfler 0/24/48 ms; gate 1480, R0 1530, R1 1950 (soğuk). Bekleme hareketleri (ll ve işaret tahterevallisi) aynı.
- `launchStore`, `launchGuard`, SPLASH_HANDOFF_MS 420, KIND_TIMEOUT_MS 300, testID `launch-curtain`, uygulamanın ağaçtaki yeri, 1,06→1 oturma.
- Sistem splash (expo-splash-screen, `assets/icon/splash.png`, zemin `BRAND.ink` #14112B): düz kalır.
- Logo renkleri: BRAND.purple #7B5CFF, BRAND.pink #FF4F8B; kesişim ve harfler BRAND.white.
- İlk açılışın ring, flare ve glint zamanları ve görünüşleri (12.11 kararı gelene kadar).

### 14.2 Değişen
1. **Pencere maskesi kalkar.** `WindowArt` (SVG `Mask` + tam ekran SVG) kullanılmaz. R0→R1 (soğuk 420 ms, hızlı 400 ms) "baskı ayrılır" olur; u = seg(t, R0, R1):
   - Mor katman translate (−60·u^1,6, −30·u^1,6); pembe (+60·u^1,6, +30·u^1,6); kesişim (0, −20·u^1,6); harfler (0, −40·u^1,6).
   - Perde opaklığı 1 − bezier(0.65,0,0.35,1)(seg(u, 0.2, 1)).
   - Uygulama ölçeği 1 + 0,06·(1 − bezier(0.2,0.8,0.2,1)(u)), merkez kapsüllerin kesişimi (mevcut `origin`).
   - Kelime işareti R0'daki konumunda kalır, açılışta büyümez.
2. **Riso dokusu.** Perde hazır görsel katmanlardan oluşur; her karede yalnız transform ve opacity değişir:
   - Zemin #14112B + kağıt lifi %6.
   - Parıltı (`LAUNCH_LIGHT.glow` #3B2B92): yarım ton, elips 240x270, yoğunluk merkezde 0,8 → kenarda 0 (üs 1,3), tram 75°, hücre 3. Mevcut `glow` opaklık eğrisi aynen.
   - Kapsüller: yarım ton doku, yoğunluk %86, mor 15°, pembe 45°, hücre 2,6, gren, %2,5 beyaz benek. Kapsül = `overflow: hidden` + `borderRadius: w/2` View, içinde ölçeklenmeyen doku görseli (kapsül büyürken nokta boyu sabit).
   - Kesişim: A'nın kırpma View'i içinde B şeklinde beyaz doku (mevcut clip mantığı, View ile).
   - Harfler s, k, a: ayrı beyaz riso görselleri, mevcut `lettersClip` ile `overflow: hidden` kap içinde.
   - Sabit hizasızlık: mor (−1, −0,7), pembe (+1, +0,7), beyaz (0, +0,5).
3. **Kaynama.** Her dokunun 3 varyantı (gren ve benek farklı; lif ve mürekkep lekeleri aynı). Varyant 125 ms'de bir döner (8 fps), her varyantta katman başına ek kayma ±0,5. Perde görünür kaldıkça sürer (bekleme dahil). Geçiş opaklık 0/1, üç görsel üst üste; yeni görsel yüklenmez.
4. **Devir.** Perdenin ilk karesi splash ile aynı düz çizimdir. SPLASH_HANDOFF_MS (420) içinde riso dokusu 300 ms'de (bezier 0.65,0,0.35,1) 0→1 belirir.
5. **Hareketi azalt.** Kaynama ve hizasızlık titreşimi yok (varyant 0 sabit). Mevcut azaltılmış akış (F0–F1 solma, R0–R1 perde solması) aynen. Ayrılma yok.
6. **Titreşim:** yok (bugün de yok).

### 14.3 Yeni ortak öğe
- Riso doku seti (açılış): `zemin-lif`, `parilti-yarimton` x3, `mor-doku` x3, `pembe-doku` x3, `beyaz-doku` x3, `harf-s/k/a` x3. Önerilen 3x, WebP. **Hazır değil** (9.2); değerler `28-riso-acilis/kaynak/render.py`.

---

## 15. Kabul maddeleri

Her madde ayrı doğrulanır. Cihaz kontrolleri (K-C) son toplu kabul testinde yapılır.

**Temel**
- K1. `theme.ts` renkleri bölüm 2.1 ile birebir; mor aile (ton 278–325) hiçbir rolde yok; DM mavisi #2C63D6 / #7DB2FF duruyor. styleGuard testi geçiyor.
- K2. Koyu temada zemin #000000, cam #121614 düz; gradyan, gölge, gren ve aura yok.
- K3. Açık temada 5 aura bulutu sekme ve detay ekranlarında var; sheet, sohbet ve oyunlarda yok.
- K4. Kullanılan yazı boyutları yalnız 11, 12, 13, 14, 15, 16, 21, 32 (oyunlarda ek olarak 52, 38, 30, 26, 20).
- K5. btn 56, btn.sm 40, field 56, tabbar 64, tab 48.
- K6. Tüm ikonlar kapsül ailesinden; Ionicons ve çizgi aile kod tabanından kalktı.
- K7. Pasif düğmeler disabled / on-disabled; opaklık düşürülmüyor.
- K8. Sheet: kenarlardan 8, köşe 28, en çok %90, scrim + 8 bulanıklık.

**Ekranlar**
- K9. U13–U38'in her biri kendi panosuyla açık ve koyu temada karşılaştırıldığında aynı (ölçüler bölüm 5'teki sayılar).
- K10. Hiçbir ekranda metin değişmedi; bölüm 10'daki davranışlar duruyor.
- K11. 320 dp ve 1,3x yazıda önizleme satırları dışında "…" yok, düğme yazısı iki satıra bölünmüyor.

**Riso görseller**
- K12. Bölüm 9.1'deki her görsel kendi yerinde; 9.2'dekiler için bugünkü görsel duruyor (uydurma görsel yok).
- K13. Kişinin kendi kapsülü riso değil; süs kankiler riso.

**Kayıt ve Masa bitti**
- K14. Main, Telefon, Kod: sahne zemini riso-kayit.png, alttan hizalı; beyaz zemin elipsi ve yuvarlak masa yok.
- K15. Main'de 7 kanki bölüm 13 tablosundaki konum ve ölçüde.
- K16. MasaBitti: sahne 320, zemin riso-sahne.png, yuvarlak masa yok, 3 kanki riso.

**Açılış**
- K17. Açılışta `react-native-svg` `Mask` yok; perde boyunca hiçbir SVG her karede yeniden çizilmiyor.
- K18. Splash'tan perdeye geçişte konum, boyut ve renk sıçraması yok; doku 300 ms'de beliriyor.
- K19. Kapsüller ve parıltı yarım ton; kapsül büyürken nokta boyu sabit.
- K20. Doku 125 ms'de bir değişiyor; lif ve mürekkep lekeleri yerinde.
- K21. Soğuk açılışta harfler L0 760'ta çıkıyor, perde R1 1950'de bitiyor.
- K22. Açılışta mor sola-yukarı, pembe sağa-aşağı 60/30 ayrılıyor, harfler 40 yukarı kayıyor, perde u 0,2'den itibaren soluyor; uygulama 1,06→1.
- K23. Hareketi azalt açıkken kaynama ve ayrılma yok, perde yalnız soluyor.
- K24. Perde boyunca uygulama dokunuş alıyor ve yeniden monte olmuyor.

**Kayıt kanki hareketi**
- K25. Main'de 7 kanki 13.1 tablosundaki P ve φ ile nefes alıyor ve salınıyor; zemin kıpırdamıyor.
- K26. Göz kırpmalar tablodaki anlarda 125 ms; kapalı göz görseli açık gözle aynı konum ve ölçüde.
- K27. riso_f280a5 3,4 sn'de, riso_4957ac 5,15 sn'de 600 ms zıplıyor, en yüksek nokta 12; gölge küçülüp soluyor.
- K28. Hareketi azalt açıkken kankiler durağan ve gözler açık; ekran arka plandayken animasyon durmuş.

**Cihaz**
- K-C1. Orta sınıf Android 12+ cihazda açılış 60 fps, kare düşmesi yok.
- K-C2. Android 12 altında cam ve scrim bulanıklığı yok, düz renk (bölüm 7).
- K-C3. Harita MapLibre `androidView="texture"` ile çalışıyor, harita üstünde tabbar opak.

---

## 16. Teslim dosyaları

Kök `/mnt/project-files/`. Gökay CTO'ya iletir.

| Ne | Yer |
|---|---|
| Bu rapor | cto-teslim-v64/birlesik-aktarim-raporu.md |
| CTO promptu | cto-teslim-v64/cto-prompt.md |
| Aura v65 CSS ve hareket değerleri | cto-teslim-v64/aura-v64/ (skall.css, ekran.css, koyu.css, hareket.json) |
| Riso görseller (55 kart hariç, tek paket) | cto-teslim-v64/skall-riso-gorseller-v64.zip |
| 55 masa kartı | masa-kartlari/55-kart/yatay/, uzun/, masa-adlari.md |
| Ekran başına önce/sonra görselleri | arayuz-revize/NN-*/*-once-sonra.png |
| Açılış demosu | arayuz-revize/28-riso-acilis/acilis-riso-demo.mp4 |
| Kayıt kanki hareketi videosu | arayuz-revize/27-riso-animasyon/kanki-hareketi/kayit-kanki.mp4 |
| Kapsül ikon SVG'leri (30) | ikon-paketi/revize-1/ ; yeni 20 + revize 10 ikonun çizimi tuvalde (IkonlarYeni, IkonlarRevize panolarındaki inline SVG) |
