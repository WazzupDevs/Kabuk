# Vampir Köylü: kapsül masa, kabul raporu

Onay: Gökay, 4 Kasım 2026 21:01 (Aura v83). Eksik hâller: 5 Kasım 2026, Aura tuvali sürüm 93 (1793840227-16c2), Gökay'ın kararı Claude'a bıraktığı maddeler; Gökay inceleyip CTO'ya aktarır.

Panolar (satır y13760): VampirRolKarti x0, VampirRolun x440, VampirGece x880, VampirSabah x1320, VampirGunduz x1760, VampirOylama x2200, VampirEleme x2640, VampirSonuc x3080, VampirOylama12 x3520, not vampirSource x3960, VampirOylamaDar x4520 (320x676), VampirYukleniyor x4920, VampirHata x5360. Hepsi 360x760 (Dar hariç). Artık eski tasarımda pano kalmadı.

Pano yapısı: masa ve oda sahnesi asset görseli (`vampir-sahne-*.webp`), kişiler, kartlar (`kart-*.webp`), yazılar ve düğmeler katman. Çalışma dosyası: `vampir-koylu-kapsul-masa.html`. Kaynak: `kaynak/` (build.py, real2.js, toon2.js, gen_dc.py).

## Ekranlar
1 Rolün, 2 Gece, 3 Sabah, 4 Oylama, 5 Sonuç, 6 Oylama 12 kişi, 7 Rol kartı, 8 Gündüz, 9 Eleme, 10 Yükleniyor, 11 Bağlantı hatası, 12 Oylama 320 dp en büyük yazı. PNG: `01-rolun.png` … `12-oylama-320dp-buyuk-yazi.png`, hepsi `hepsi.png`.

## Düzen
- Masa dikey stadyum: merkez (180, 380), yarı genişlik 118, düz kısım yarı boyu 112 (toplam 236x460).
- Koltuklar masa kenarından 18 (12 kişide 15) dışarıda, çevre boyunca eşit yay aralığıyla; 1. koltuk (Sen) en altta, saat yönünün tersine dizilir.
- Kart: her kişinin önünde, masa kenarından 27 (12 kişide 22) içeride, alt kenarı kişiye dönük. 24x33 (12 kişide 19x26), köşe 3. Oyun boyunca kapalı (`rc-arka`); Sonuç'ta hepsi açılır, vampir kartı pembe ışıltı (#FF4F8B).
- Mum: kartın yanında, teğet yönde 22 (12 kişide 17) uzakta. Ölen ya da elenen kişinin mumu söner (duman), kartı kararır (brightness .42).
- Masa ortası sahne alanı: x 105–255, tüm faz içeriği burada (başlık hapı, başlık 16/800, açıklama 11/500, süre, olay).
- Düğme: uygulamanın ana düğmesi, yükseklik 48, alttan 26, #0E8745 (2 Kas kararı). Tüm Vampir panolarında 48'e çekildi.

## Faz içerikleri (masanın ortasında)
- Rol kartı: "Rolünü gör" hapı, kişinin kartı ortada kapalı büyük (104x139, -2°, `rc-arka`) ve ortasında basılı tutma halkası; önündeki yeri boş çerçeve. "Kartı basılı tut", "Rolünü yalnızca sen gör. Kimse görmesin.", "Hazır: 5/8". Altta "Geceyi başlat" (150, cam) + "Hazırım", ikisi de pasif (rol görülmeden Hazırım pasif, K1; herkes hazır olmadan Geceyi başlat pasif). Pasif düğme: dolgu #2A2622, yazı krem %50, ince kenar; opaklık kullanılmaz.
- Rolün: kart ortada açık (104x139, -2°); "Rolün: Vampir", açıklama, diğer vampir yüzü 22, "Hazır: 5/8". Düğme "Hazırım".
- Gece: "Gece 1" hapı, başlık, süre kadranı (r34), seçilen hedefin yüzü 44 pembe halka + pembe ad etiketi; hedefin koltuğu da pembe. Düğme "Seç".
- Sabah: "Sabah" hapı, ölenin gri yüzü 56, "Gece kapsul-fv10 öldü", süre (r26, son saniyeler pembe sayı). Alt cam hap "Gündüz başlıyor".
- Gündüz: gündüz ışığı. "Gündüz 1" hapı, "Vampir kim?", "Tartışın. Süre bitince oylama açılır."; altında süre kadranı r34 (y420) "1:40". Kum saati ve madalyon yok. Düğme "Oylamaya geç".
- Oylama: "Oylama" hapı, süre (r22), başlık; en çok oy alan yüz 46, oy verenler yüz 18 halka (amber kenar #FFB547) üstte; diğer adaylar yüz 30, oy veren 15. 12 kişide 3+ ek adayda ad yerine yalnız sayı hapı. Koltuk adında amber sayı hapı kalır.
- Eleme: akşam ışığı (şafak paleti). "Oylama bitti" hapı, elenenin gri yüzü 56 + altında amber "3 oy" hapı, "kapsul-sd62 elendi", "Rolü oyun sonunda açılır."; süre kadranı r26 (y488) son saniyeler pembe "0:04". Elenenin mumu söner, kartı kararır, rolü açılmaz. Alt cam hap "Gece geliyor".
- Sonuç: "Oyun bitti" hapı, kazanan iki yüz 48 pembe halka, "Vampirler kazandı" 20/800. Düğmeler "Masaya dön" (126, cam) + "Yeniden oyna".

## Yükleniyor ve hata
- Yükleniyor: gece sahnesi, masa ve boş tabureler (nötr minder #6A5A48), kişi, kart ve mum yok. Masa ortasında kapsül yükleyici (iki kapsül #7B5CFF / #FF4F8B, kontur #141016, 56), role=progressbar, yazı yok. Hareket: kapsüller sırayla hafif zıplar; azaltılmış harekette durağan.
- Bağlantı hatası: oyun sahnesi olduğu gibi kalır, üstüne koyu perde (`.dim`). Ortada cam blok (sol/sağ 40, köşe 24, #140E0A %78 + blur 14): uygulamanın hata simgesi (iki kapsül, 40), "Bir şeyler ters gitti. Tekrar dener misin?" 15/700, cam "Tekrar dene" düğmesi (40). role=alert. Metin ve simge MekanHata ile aynı; yeni metin yok. Mevcut FEEL_ERROR titreşimi aynen.

## 320 dp ve en büyük yazı (VampirOylamaDar, en zor faz olduğu için Oylama)
- Sahne genişliğe göre ölçeklenir: k = genişlik / 360 (320 dp'de 0,889); masa, koltuk, kart, mum, kadran aynı oranda küçülür. Yükseklik yetmezse k = min(w/360, h/760).
- Yazı ×1,3 (sistem en büyük yazı): koltuk adı 13, hap 13, başlık 21, açıklama 14,3, süre sayısı 17, düğme yazısı 21 ve düğme 56 (fiziksel dp).
- Yer kazanmak için: süre kadranı hapın sağına aynı satıra geçer; ortada yalnız en çok oy alan aday kalır, diğer adayların oyları koltuk adındaki amber haplarda görünür; sahne alanı x 104–256.
- Uzun koltuk adı en fazla 75 dp (fiziksel), başından kısalır ("…sul-sd62"); ayırt edici son ek görünür. Kenar koltuklarda etiket ekran içine kaydırılır (kenar boşluğu 4). "Sen" etiketi düğmeye binmesin diye yüzün sağ üstüne geçer.
- Kural: süreli ekranlarda süre, soru ve düğme kaydırmadan görünür; kaydırma yok.

## Açık tema
Oyun her temada koyu kalır (şablon kuralı "oyun koyu"); faz renkleri, sahne ve kartlar açık temada değişmez. Oyundan çıkınca uygulama temasına dönülür. Ayrı pano gerekmez.

## Süre göstergesi
- Pirinç çerçeveli koyu kadran, içinde yalnız sayı (role=timer). Dakika çizgileri ve kalan süre halkası YOK (Gökay kararı).

## Görsel dil
- Karışık teknik: arka plan (tahta zemin, yün halı) yumuşak ve gerçekçi, 1,4 px odak dışı; masa ve tüm objeler çizgi film: düz renk, yumuşak tek gölge, parlama hapı yok, kontur #141016 (1,7–3,2 px), sert düşen gölge.
- Masa tablası ceviz tahta (keçe yok), ortada sıcak lamba ışığı.
- Avatar: krem kenar 2 px + #141016 kontur 4 px; tabure avatarla eş merkezli (8 kişi R27, 12 kişi R22), gölge yalnız altta.
- Oda objeleri: fıçı x2, şişe kasası, saksı x2, kitap yığını.
- Riso yalnız rol kartlarında; sahnede riso dokusu ve gren yok.

## Fazlar
| Faz | Ekranlar | Renk filtresi (multiply) | Lamba | Vinyet | Pencere ışığı |
|---|---|---|---|---|---|
| Gece | Rol kartı, Rolün, Gece, Yükleniyor, Hata | #6C76C8 | 1,25 | .66, mavi | mavi .20 |
| Şafak / akşam | Sabah, Eleme | #F2B09C | .8 | .42 | turuncu .24 |
| Gündüz | Gündüz, Oylama | yok, +.12 aydınlatma | .35 | .16 | sıcak beyaz .36 |
| Son | Sonuç | #C8606E | 1,1 | .58 | kırmızı .16 |

## Titreşim
Mevcut haptik davranış korunur; yeni titreşim yok.

## Kaldırılanlar
Duvar, kara tahta, duvar saati, iğneli rol kartı, oy mühürleri, kedi, kum saati ve madalyon (Gündüz, Eleme). Mevcut oyun mantığı (oylama kuralı, rol açılma zamanı) değişmedi.

## Kapanan açık sorular (5 Kas)
- 2 Açık tema: oyun koyu kalır, faz renkleri aynı.
- 3 320 dp ve en büyük yazı: VampirOylamaDar.
- 4 Yükleniyor ve bağlantı hatası: VampirYukleniyor, VampirHata.
- 6 Rol kartı, Gündüz, Eleme: yeni masa diline çevrildi.

## Kalan açık sorular
1. Hareket: tasarımda süre ve eğri yok; CTO hareket.json MOTION değerlerini kullanır, azaltılmış harekette anında.
5. Uygulamada çizim yöntemi: CTO kararı (react-native-svg ya da hazır görsel).
