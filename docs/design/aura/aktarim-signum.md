# Signum: kelime ızgarası ve kaptan, kabul raporu

Onay: Gökay, 4 Kasım 2026 23:06 ("tuvale ekle"). Aura tuvali sürümü: 87 (1793833698-307e). Revize 1 (23:00) dahil. Dosya `pilot-oyunlari/4-signum/signum.html` (13 pano, 390x844). Şablon kararı: Gökay, 4 Kas 22:47 (kelime ızgarası + kaptan). SPEC'te Signum yok; tek kaynak K-77 "Signum (Kodu çöz, 4+)" ve riso poster. Tüm metinler ÖNERİ (eski onaylı Signum metni yok).

## Panolar (390x844)
Yeni satır "Signum (kelime ızgarası ve kaptan)" başlık y57760, panolar y58020, aralık 470: `SignumTakimlar` x0, `SignumRolKapali` x470, `SignumKaptan` x940, `SignumTahminci` x1410, `SignumIpucu` x1880, `SignumBekle` x2350, `SignumTahmin` x2820, `SignumDogru` x3290, `SignumRakip` x3760, `SignumKara` x4230, `SignumOyunSonu` x4700, `SignumIpucuAcik` x5170, `SignumTahminAcik` x5640; mor not `signumSource` x6110. Değişen mevcut pano yok.

## Ortak düzen (Krot ile aynı)
skall.css + koyu.css `.dark.pA`, koyu varsayılan. Üst çubuk top 54: Çık 44 | cam skor hapı 44 (Mor/Pembe çubuk 8x16 + kalan kart 800/18) | Sohbet 44 (kaptanda Anahtar kartı, basılı tut). Süre satırı top 106: zaman kapsülü 60x90 + sayı 800/30. Riso kankiler panonun arkasından bakar (top 184). Düğmeler 48, alttan 34.

## Yeni ortak bileşenler
| Bileşen | Tanım |
|---|---|
| Kelime panosu | 350x294 köşe 22, padding 10, 5x5 ızgara gap 6, satır 50; zemin s-masa.webp (riso çuha). |
| Kelime karosu | ~61x50 köşe 10, kapalı: t-kapali.webp + kelime 800/12 #141016 tek satır. Açık: t-mor / t-pembe / t-notr (uyuyan kanki) / t-kara (maskeli kanki) + kelime etiketi 700/11 beyaz, zemin rgba(20,16,22,.78). Seçili: 3 px --buzz + 7 px %30 hale, sağ üstte gösterenlerin kapsülleri 18. |
| Kaptan görünümü | Kapalı karo üstünde renk: Mor %42 #8E6CF0 + 3 px #7B5CFF iç çizgi; Pembe %36 #FF3478 + 3 px #E8336F; Nötr %22 #F1D96A; Kara #141016 zemin, beyaz yazı, 3 px #FFFFFF + 2 px #141016 iç çizgi (takım rengi değil; revize 1). Açık kara karo: siyah zemin, krem maskeli kanki. |
| İpucu paneli | cam 350 genişlik köşe 22: kaptan kapsülü 36, "Ad · ipucu" eb, kelime 800/21 + sayı etiketi 30 (takım rengi), sağda Kalan tahmin. |
| İpucu girişi | alan 48 + sayı seçici 4 x 40 (seçili --primary) + renk lejantı 600/12. |
| Rol kartı | Krot 3B destesi 296x395. Arka s-arka.webp (revize 1): yazısız sinyal panosu posteri; gece, ışın huzmeleri, 5x5 renkli lamba panosu (ortada maskeli kara lamba), merdivende bayraklı kaptan kanki, altta iki takımın kankileri (mor, pembe). Ön: s-kaptan.webp (teal bant, anahtar kartı 5x5 22 px hücre, dürbünlü kaptan kanki) / s-tahminci.webp (pembe bant, büyüteçli kankiler). |

## Hâller
| Hâl | Nasıl |
|---|---|
| Açık tema | İpucu ver ve Tahmin panoları |
| Son 10 sn | Sayı --buzz, kapsül az |
| Dar ekran 320 dp | Çizilmedi: karo ~50 px; en uzun kelime (6 harf, 800/12) sığıyor, 7+ harfte açık soru 2 |
| Yükleniyor / hata | Çizilmedi |

## Hareket ve titreşim
Önerilen, onay bekler: karo açılınca 180° döner (Krot kart dönüşüyle aynı), seçimde karo hale belirir. Titreşim yalnız mevcutlar (selection, timeUp, FEEL_ERROR).

## Sınır dışı istek
Yok.

## Açık sorular
1. Oyun kuralları SPEC'te yok: kart dağılımı (9/8/7/1), süreler (ipucu 90, tahmin 60 sn), sayı aralığı 1–4 öneri.
2. 7+ harfli kelimeler 320 dp'de nasıl sığar (kelime havuzu sınırı mı, karo küçük yazı mı).
3. "Kara kart" adı ve takım adları Mor/Pembe (Kinshi'den) uygun mu.
4. Tahminciler kartı tek tek mi açar, yoksa takım çoğunluğu mu (çizimde gösteren kapsüller + "Kartı aç").

## Kabul maddeleri
1. Kelime panosu 350x294, 5x5 karo, gap 6; kapalı karoda kelime 800/12 tek satır, "…" yok.
2. Açılan karo takım riso karosuna döner; kelime etiketi 700/11 beyaz.
3. Kaptan görünümünde Mor/Pembe/Nötr renk katmanı; Kara karo #141016, çerçeve beyaz, takım rengi değil.
4. Seçili karo --buzz halka + gösterenlerin kapsülleri 18.
5. Rol kartı 3B deste 296x395; arka yazısız sinyal panosu posteri; kaptan kartında 5x5 anahtar haritası.
6. Süre zaman kapsülü + 800/30 sayı; son 10 sn --buzz.
7. Riso: kart yüzleri, karolar, masa zemini, kankiler; kapsül avatarlar riso değil.
