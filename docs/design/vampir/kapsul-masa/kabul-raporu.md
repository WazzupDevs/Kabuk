# Vampir Köylü: kapsül masa, kabul raporu

Onay: Gökay, 4 Kasım 2026 21:01. Aura tuvali sürüm 83 (1793826542-d393). Değişen panolar (aynı yer ve ad, 360x760, satır y13760): VampirRolun, VampirGece, VampirSabah, VampirOylama, VampirSonuc, VampirOylama12. Değişmeyen eski tasarım panoları: VampirRolKarti, VampirGunduz, VampirEleme (yeni dile çevrilmedi; açık soru 6). Pano yapısı: masa ve oda sahnesi asset görseli (`vampir-sahne-*.webp`), kişiler, kartlar (`kart-*.webp`), yazılar ve düğmeler katman. Çalışma dosyası: `pilot-oyunlari/3-vampir/kapsul-masa/vampir-koylu-kapsul-masa.html`. Bu sürüm `mekan-masa/`, `riso/`, `3d*/`, `varyantlar/`, `konseptler/` klasörlerinin yerini alır.

## Ekranlar (360x760)
1 Rolün, 2 Gece, 3 Sabah, 4 Oylama, 5 Sonuç, 6 Oylama 12 kişi. PNG: `01-rolun.png` … `06-oylama-12-kisi.png`.

## Düzen
- Masa dikey stadyum: merkez (180, 380), yarı genişlik 118, düz kısım yarı boyu 112 (toplam 236x460).
- Koltuklar masa kenarından 18 (12 kişide 15) dışarıda, çevre boyunca eşit yay aralığıyla; 1. koltuk (Sen) en altta, saat yönünün tersine dizilir.
- Kart: her kişinin önünde, masa kenarından 27 (12 kişide 22) içeride, alt kenarı kişiye dönük. 24x33 (12 kişide 19x26), köşe 3. Oyun boyunca kapalı (`rc-arka`); Sonuç'ta hepsi açılır, vampir kartı pembe ışıltı (#FF4F8B).
- Mum: kartın yanında, teğet yönde 22 (12 kişide 17) uzakta. Ölen kişinin mumu söner (duman), kartı kararır (brightness .42).
- Masa ortası sahne alanı: x 105–255, tüm faz içeriği burada (başlık hapı, başlık 16/800, açıklama 11/500, süre, olay).

## Faz içerikleri (masanın ortasında)
- Rolün: kişinin kartı ortada büyük açılır (104x139, -2°), önündeki yeri boş çerçeve kalır; altında "Rolün: Vampir", açıklama, diğer vampir yüzü 22, "Hazır: 5/8". Düğme "Hazırım".
- Gece: "Gece 1" hapı, başlık, süre kadranı (r34), seçilen hedefin yüzü 44 pembe halka + pembe ad etiketi; hedefin koltuğu da pembe. Düğme "Seç".
- Sabah: "Sabah" hapı, ölenin gri yüzü 56, "Gece kapsul-fv10 öldü", süre (r26, son saniyeler pembe sayı). Alt cam hap "Gündüz başlıyor".
- Oylama: "Oylama" hapı, süre (r22), başlık; en çok oy alan yüz 46, oy verenler yüz 18 halka (amber kenar #FFB547) üstte; diğer adaylar yüz 30, oy veren 15. 12 kişide 3+ ek adayda ad yerine yalnız sayı hapı. Koltuk adında amber sayı hapı kalır.
- Sonuç: "Oyun bitti" hapı, kazanan iki yüz 48 pembe halka, "Vampirler kazandı" 20/800. Düğmeler "Masaya dön" (126, cam) + "Yeniden oyna".

## Süre göstergesi
- Pirinç çerçeveli koyu kadran, içinde yalnız sayı (role=timer). Dakika çizgileri ve kalan süre halkası YOK (Gökay kararı).

## Görsel dil (yeni)
- Karışık teknik: arka plan (tahta zemin, yün halı) yumuşak ve gerçekçi, 1,4 px odak dışı; masa ve tüm objeler çizgi film: düz renk, yumuşak tek gölge, parlama hapı yok, kontur #141016 (1,7–3,2 px), sert düşen gölge.
- Masa tablası ceviz tahta (keçe yok), ortada sıcak lamba ışığı.
- Avatar: krem kenar 2 px + #141016 kontur 4 px; tabure avatarla eş merkezli (8 kişi R27, 12 kişi R22), gölge yalnız altta.
- Oda objeleri: fıçı x2, şişe kasası (şişeler uygulama yeşil/pembe/turuncu/mavisi), saksı x2, kitap yığını.
- Riso yalnız rol kartlarında; sahnede riso dokusu ve gren yok.

## Fazlar
| Faz | Renk filtresi (multiply) | Lamba | Vinyet | Pencere ışığı |
|---|---|---|---|---|
| Gece (Rolün, Gece) | #6C76C8 | 1,25 | .66, mavi | mavi .20 |
| Şafak (Sabah) | #F2B09C | .8 | .42 | turuncu .24 |
| Gündüz (Oylama) | yok, +.12 aydınlatma | .35 | .16 | sıcak beyaz .36 |
| Son (Sonuç) | #C8606E | 1,1 | .58 | kırmızı .16 |

## Titreşim
Mevcut haptik davranış korunur; yeni titreşim yok.

## Kaldırılanlar
Duvar, kara tahta, duvar saati, iğneli rol kartı, oy mühürleri, kedi. Mevcut oyun mantığı (oylama kuralı, rol açılma zamanı) değişmedi.

## Açık sorular
1. Hareket: kartın ortaya gelip açılması, mumun sönmesi, faz geçişinde renk değişimi; süre ve eğri tanımlı değil.
2. Açık tema: oyun koyu varsayılan; faz renkleri açık temada da aynı mı kalsın.
3. 320 dp ve en büyük yazı boyutu: masa genişliğe göre ölçeklenir varsayımı; ayrıca çizilmedi.
4. Yükleniyor ve bağlantı hatası hâlleri çizilmedi.
5. Masa ve odanın uygulamada çizimi: canvas/SVG ile mi, hazır görsel olarak mı verilecek.
6. Rol kartı (basılı tut), Gündüz ve Eleme ekranları yeni masa diline çevrilecek mi; şimdilik eski tasarımda duruyor, davranışları kaldırılmadı.
