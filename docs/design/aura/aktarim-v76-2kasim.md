# Aktarım raporu: 2 Kasım arayüz kararları

- Kaynak: Kabuk `docs/ui-hatalar-2026-11-02.md`, §1 "Proje sahibinin bu oturumdaki kararları" ve "Ek C: Bütünlük kuralları" (main b2c9a32).
- Tuval: Aura, https://claude.ai/artifact/Fcdza7SJs4i7xyYQJnhRVe, **v76** (v72 panolar, v73 alt menü notu, v76 birleşen P-E koduyla eşitleme + MekanMasaDolu).
- Yeni satır: "2 Kasım kararları: ölçek, sohbet, düzenleme, boş durumlar" (y50240). Hareket notu: mor not `motionKarar2Kas` (x4280 y50500).
- Kodda olanlar (main b3bfebd: P-A #379, P-B #380, P-C #381, P-D #382, P-E #384, P-F #385, P-G #386 birleşti): tuval P-A…P-E ve P-G profil düğmesine eşitlendi, sonraki aktarım geri almasın.
- Kodda olmayan: P-H riso boş durumlar (tuval tanımlıyor) ve aşağıdaki F1 farkı. P-F (Keşfet) ve P-G'nin geçmiş sayfası, büyütülmüş fotoğraf ve şikayet sayfası kodda tuvalden ileride: tuvaldeki eski hâle göre geri alınmaz.
- Son görsel: `/mnt/project-files/ui-2kasim/riso-bos/riso-bos-hepsi.png`.

## 1. Ölçek (token)

| Öğe | Önce (tuval) | Şimdi | Kod karşılığı |
|---|---|---|---|
| Ana düğme | 50–58 | 48 | KIT.size.btn / btnTall / btnRow |
| Küçük düğme | 38–46 | 36 | KIT.size.btnSm / btnMid |
| Yuvarlak ikon düğme | 46–56 | 44, köşe 22 | KIT.size.round / roundLg |
| Çip | 32–40 | 36 | KIT.size.chip / chipTall / chipLg |
| Form alanı | 54–56 | 48 | KIT.size.field / fieldLg |
| Çok satırlı alan | — | 104, köşe 22 | fieldLgTall |
| Mesaj alanı + gönder | 54 / 62 | 44 / 44, köşe 22 | composerField / composerSend |
| Sohbet üst barı (geri, ad hapı, menü) | 56 | 44; ad hapı avatarı 36, iç boşluk 4 | dmPill |
| Yeni sohbet FAB | 56 | 56 (değişmedi) | newChat |
| Küçük mekân logosu | yükseklik 38 | 28 (genişlik 83,4) | WORDMARK_HEIGHT |
| Tepki çipi (balon altı) | 30 | 30 (dokunulmadı) | — |

CSS: `project/skall.css` (.btn 48, .btn.sm 36, .round.lg 44, .chip 36, .field 48), `project/ekran.css` (.send 44, .composer/.cmp .field 44). Panolardaki satır içi ölçüler aynı değerlere çekildi. Tema*, Vampir*, Kinshi ve Krot panolarının satır içi ölçülerine dokunulmadı, ama genel .btn kuralı onları da 48 yapar.

## 2. Renk ve yüzey (token)

| Token | Açık | Koyu | Kod |
|---|---|---|---|
| --primary-glow (ana düğme gölgesi) | değişmedi | `0 10px 22px rgba(0,0,0,.35)`, yeşil hale yok | primaryShadow (dark) |
| --in-sheet (alt sayfa içindeki kart/düğme) | #FFFFFF | #1B211F | glassInSheet / raisedInSheet |
| --in-sheet-line | rgba(3,27,11,.09) | rgba(255,255,255,.09) | edge |
| --photo-scrim | rgba(0,0,0,.82) | rgba(0,0,0,.82) | photoScrim |
| Canlı nokta halkası | var | yok | live dot |
| Mesaj alanı | bulanıklık yok, düz yüzey | aynı | composer |
| Kapalı düğme | ikon gizli | aynı | disabled Btn |

Alt sayfa içinde kart ve ikincil düğmeler: zemin `--in-sheet`, 1 px `--in-sheet-line`, bulanıklık ve gölge yok.

Kişi çubukları, 12 renk (`--pip1`…`--pip12`, nth-child(12n+k)), kodla aynı (theme/aura.ts AURA.pips.colors), iki temada aynı:
#0B783D, #FF4F8B, #FFB547, #8FB82E, #2FA8E0, #FF7A3D, #3CC47C, #9A6B4E, #F2C230, #E8455A, #1FB5A8, #5468FF.

## 3. Panolar

Değişen (61 dosya; ölçek ve logo dönüşümü dahil): Mekan*, MekanMasali, MekanSecenekler, MekanSohbeti/Koyu, MekanKimlikDegistir, MekanNoktaDegistir, CheckIn*, Dm/DmKaydir/DmKlavye/DmKoyu/DmArkadaslik, Kesfet*, KesfetMekan/Koyu, Masa/MasaKoyu/MasaDavet/MasaIstek/MasaSohbeti/Masadakiler, MasaKur/MasaKurLobi/MasaKurSimge/MasaKurDar, MesajlarIstek, Profil*: ProfilDuzenle/Koyu/Klavye, ProfilFoto, ProfilDar, ProfilBaskasi/Koyu, Kapsul/KapsulKoyu/KapsulKarakterler, Galeri: CheckIn, Kesfet, MasaKur, Profil, Sohbet.

Yeni panolar (satır y50500):

| Pano | Konum | İçerik |
|---|---|---|
| KapsulKaydir | x0 | Kapsülün kaydırılmış hâli |
| MasaLobiyeAc | x900 | Lobiye aç sheet'i (kodla aynı): açıkta Oyun seçili + oyun satırı, koyuda Sohbet seçili, oyun satırı yok; kartsız, tek yardım satırı, Vazgeç küçük ortada |
| Galeri2Kasim | x1800 | Ölçek, sohbet barı, mesaj alanı, sheet içi kart, 12 renk, fotoğraf örtüsü; açık ve koyu |
| BosDurumlar | x2760 | 12 boş durum, riso resimleriyle |
| MekanMasaDolu | x4920 | Masa dolu: 12 kişi, 12 renk çubuk, Davet et kapalı, altında "Masa dolu. Masada en çok 12 kişi olur." |

### Ekran kararları

| Karar | Pano | Tuvaldeki hâl |
|---|---|---|
| Masa kartı | MekanMasali, MekanSecenekler, MekanMasaDolu | Ad sol üstte (top 12); yüzler resmin altında soldan tüm genişlikte; kişi çubukları 12 renk |
| Masa dolu (7.4, Gökay 3 Kas 01:13) | MekanMasaDolu | 12 kişide Davet et kapalı, ikonu yok; altında tr.invite.full |
| Profili düzenle | ProfilDuzenle/Koyu | "Fotoğrafı değiştir" düğmesi yok, fotoğraf ortada, fotoğrafa dokunuş değiştirir; sekme çubuğu yok; Kaydet sabit alt alanda, alttan 46 |
| Kapsülün | Kapsul/Koyu, KapsulKaydir | Sekme çubuğu yok; kategori çipleri 36; sayaç metni "Pakette 5 parça · burada 2" (tr: "Pakette N parça · burada M") |
| Kapsül karakterler | KapsulKarakterler | Sekme çubuğu yok |
| Lobiye aç / Masa kur | MasaLobiyeAc, MasaKurLobi, MasaKurDar, GaleriMasaKur | "Etiket yok" ve "Fark etmez" yok; oyun satırı etiketsiz, tek satır kayar, yalnız niyet Oyun iken; altında tek yardım satırı (Oyun: gameTagHint, Sohbet: intentHint.chat) |
| Başkasının profili | ProfilBaskasi/Koyu, GaleriProfil | "Arkadaşsınız" yerine glassy "Arkadaşlıktan çıkar" (personRemove, İÇERİK GENİŞLİĞİNDE); Mesaj kalan genişlik (F1); kapsül süsü sayfa açılışında rastgele (kodla aynı), panoda bir örnek |
| Fotoğraf örtüsü | ProfilFoto | var(--photo-scrim) |
| Mekân logosu | Mekan*, MasaKur* | 28 yükseklik |

## 4. Boş durumlar ve riso (madde 9.1, P-H)

Resimler çizildi (riso, 4 mürekkep, kapsül kankiler). 320×220 mantıksal, 640×440 dışa aktarım. Dosyalar: `/mnt/project-files/ui-2kasim/riso-bos/` (+ kaynak/).

| Ekran | Önerilen asset adı | Tuval asset id | Boy |
|---|---|---|---|
| Sohbetler | riso/empty-chats | a8b3dc4f… | tam ekran 240×165 r28 |
| İstekler | riso/empty-requests | a0679e89… | tam ekran |
| Bildirimler | riso/empty-notifications | 337a70c6… | tam ekran |
| Arkadaşlar | riso/empty-friends | 09455a9d… | tam ekran |
| Geçmiş (activities noHistory) | riso/empty-history | f6122867… | tam ekran |
| Engellenenler | riso/empty-blocked | 7f87032e… | tam ekran |
| Sessize alınanlar | riso/empty-muted | 582f6159… | tam ekran |
| Keşfet sonuç yok | riso/empty-venues | f57bd1ad… | tam ekran |
| DM ilk mesaj | mevcut history-sohbet | e001a82d… | küçük 160×110 r22 |
| Bu hafta planlı etkinlik yok | mevcut empty-events | 77b2ec88… | küçük |
| Davet sheet'i (InviteSheet) | riso/empty-friends | 09455a9d… | küçük |
| Mesajlar istek sekmesi | riso/empty-requests | a0679e89… | tam ekran |

Tam ekran: 240×165, köşe 28, `--shadow-card`. Küçük (kart ve sheet içi): 160×110, köşe 22, `--shadow-raised`. Metinler değişmedi.

## 5. Hâller

| Ekran | Hâl | Pano |
|---|---|---|
| Kapsülün | üstte / kaydırılmış | Kapsul, KapsulKaydir |
| Lobiye aç | Oyun seçili / Sohbet seçili | MasaLobiyeAc (açık / koyu) |
| Düğme | etkin / kapalı (ikon yok) | Galeri2Kasim |
| Kişi çubukları | 1–12 kişi, 12 sonrası renk döner | Galeri2Kasim |
| Boş durumlar | 12 ekran | BosDurumlar |
| Profili düzenle | boş / klavye açık | ProfilDuzenle, ProfilDuzenleKlavye |

## 6. Hareket (motionKarar2Kas)

- Kapsülün: üst çubuk (geri, başlık, menü) kaymaz. İçerik yukarı kayınca (tek olayda 4 dp üzeri) giyilen çipler, yuva sekmeleri ve Hepsini çıkar / Kaydet barı gizlenir; kapsül 24 dp yukarı çıkar, görünür kalır. Ters yönde ya da en üstten 24 dp içinde hepsi geri gelir. 220 ms (MOTION.dissolve.outMs), cubic-bezier(0.4, 0, 0.2, 1) (MOTION.curves.swap). Hareketi azalt: anında. Gizliyken dokunuş almaz.
- Düzenleme ekranları: sekme çubuğu hiç görünmez, kaydırmayla da gelmez. motionAltMenu madde 5 buna göre düzeltildi (v73).
- Lobiye aç: yeni hareket yok; seçili çipe yeniden basınca seçim kalkar.

## 7. Titreşim

Yeni titreşim yok. Mevcutların süre, şiddet ve tetikleyicisi değişmez.

## 8. Sınır dışı istek

Yok.

## 9. Tuval ile kod farkı

- **F1 Arkadaşlıktan çıkar genişliği.** Kodda (FriendActions.tsx) düğme Mesaj ile eşit genişlikte (flex 1). 390 dp'de "Arkadaşlıktan çıkar" eşit yarıya sığmıyor, yazı kesiliyor (yerel ölçüm). Tuval: düğme içerik genişliğinde, Mesaj kalan yeri alır. 320 dp'de ya da yazı büyütmede yine sığmazsa iki düğme alt alta (öneri, onay bekliyor).

## 10. Açık sorular

1. Riso boş durum resimleri onay bekliyor.
2. F1'in 320 dp alt alta hâli onay bekliyor.

Kapananlar: 7.4 masa dolu (Gökay 3 Kas 01:13), 15.3/15.4 ve 12 renk (koddaki hâl tuvale alındı).

## 11. Kabul maddeleri

- K1: Ana düğme 48, küçük düğme 36, yuvarlak ikon düğme 44, çip 36, form alanı 48 (Galeri2Kasim ile karşılaştır).
- K2: DM ve Mekân sohbeti üst barında geri, ad hapı ve menü 44; ad hapı avatarı 36.
- K3: Mesaj alanı ve gönder 44, köşe 22, alanda bulanıklık yok.
- K4: Koyu temada ana düğmenin çevresinde yeşil hale görünmez; gölge siyah %35.
- K5: Alt sayfa içindeki kart ve ikincil düğme zeminden ayrışır (açık #FFFFFF, koyu #1B211F, 1 px çizgi).
- K6: Profil fotoğrafı örtüsü rgba(0,0,0,.82), iki temada aynı.
- K7: Mekân logosu 28 yükseklikte.
- K8: Masa kartında ad sol üstte, yüzler altta soldan; 12 kişide 12 farklı renk çubuk.
- K9: Profili düzenle'de "Fotoğrafı değiştir" düğmesi yok; sekme çubuğu yok; Kaydet alttan 46.
- K10: Kapsülün ve Kapsül karakterler'de sekme çubuğu yok; kaydırma davranışı §6 ile aynı.
- K11: Lobiye aç'ta "Etiket yok" ve "Fark etmez" yok; oyun satırı yalnız Oyun seçiliyken.
- K12: Başkasının profilinde arkadaşken "Arkadaşlıktan çıkar" yazısı 390 dp'de ve en büyük yazıda kesilmeden görünür, yanında ya da üstünde Mesaj.
- K13: Kapalı düğmede ikon yok.
- K14: §4'teki her boş durum kendi riso resmini gösterir; metinler değişmez.
- K15: Koyu temada canlı noktada halka yok.
- K16: Yeni titreşim yok.
- K17: 12 kişilik masada Davet et kapalı ve basılamaz; altında "Masa dolu. Masada en çok 12 kişi olur."
