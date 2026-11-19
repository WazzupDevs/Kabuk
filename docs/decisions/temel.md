# Temel: ortak ölçek ve parçalar (19 ve 20 Kasım 2026, proje sahibinin kararları)

Yerel oturumun (emülatör + Metro, `docs/decisions/calisma-duzeni.md`) ilk işi. Proje sahibi tuvalin değerlerle taramasını gördü (203 panoda yaklaşık 87 yazı stili, 15 köşe değeri, 220 elle yazılmış renk, aynı parçanın ekran ekran farklı çizimi), "referans aldığımız tuval sağlıklı olmazsa yaptığımız hiçbir aktarımın anlamı olmaz" dedi ve önce ortak temelin kurulmasını istedi. Her parça emülatörde önizlemede ya da gerçek ekranda gösterildi; proje sahibi görüp sohbette "onaylandı" dedi.

**Durum: deneme.** Hepsi yerel `temel` dalında (main'e 19 commit, 27 dosya); GitHub'a gönderilmedi, `ci`'dan geçmez. Kalıcılaştırma listesi en altta.

## Çalışma kuralı

- Değerlerin kaynağı kod ve bu belgedir; tuval "ekranda ne var, hangi sırayla, hangi metinle" sorusunun kaynağıdır. Ölçü, köşe ve yazı stili panodan okunmaz. Pano ile temel çelişirse temel geçerlidir (16 ve 17 Kasım'ın "pano geçerlidir" kuralının yerine; CLAUDE.md kalıcılaştırmada güncellenir).
- Tuvalde hazır olan çizim (boş hâl resmi gibi) tuvalden alınır (`BLOBLAR.md`); proje sahibi: "tuvalden ilgili görselleri çekebilirsin".
- Başlıkta tek kelime alt satıra düşüyorsa cümle kısaltılır; yazı küçültülmez.
- Lisans kuralı: Bluesky'ın ölçeğine yalnız yöntem için bakıldı (kaç adım, ne kadar aralıklı); değer alınmadı.

## Kararlar

| Parça | Karar |
| --- | --- |
| Yazı | 8 boy, yaklaşık 1,15 aralıklı: 10, 11, 13, 15, 17, 20, 24, 30 (36 üstü ve 10 altı olduğu gibi). Büyük başlıklar 700. |
| Boy | Ana düğme ve form alanı 44, küçük düğme ve çip 32, süzgeç çipi 28, yuvarlak ikon düğmesi ve üst bar düğmesi 40, satır düğmeleri 28/32/36. Büyük düğme (56) yok. 18 Kasım'ın boy kararının yerine. |
| Düğme | 4 tür (ana, yumuşak, tehlikeli, dolgusuz), 2 boy, tek yazı kalınlığı (600). Bekleyen düğmenin kapsülleri tek renk, yazının rengi. Yumuşak ve koyu temadaki tehlikeli dolgu düz renk (saydam değil). Koyu temada kapalı düğme her türde aynı. |
| Yuvarlak düğme | 3 görünüş: kalkık, ana (düğmenin mürekkebi; yeşil yuvarlak yok), halkasız. |
| İkonlar | Oklar tek aile, iki parçalı (geri, ileri, aşağı); kapat ve düzenle birer çizim; tek çizgi kalınlığı (3). |
| Çip ve seçici | Çip 32 ve süzgeç 28; bölmeli seçici tek boy; seçili çipte ikon yazı kadar net; koyu temada anahtar topuzu açık renk. Anahtarın yeşili, rozetin pembesi kalır. |
| Üst bar | Geri düğmesi her bar türünde aynı kenar boşluğunda ve hizada; ⋮ bütün sohbetlerde kutunun içinde, halkasız. |
| Satır | Tek kişi satırı (yüz 44, ad 15/600, alt satır 13/500); çizgi yalnız ikonlu ayar satırları arasında; tek bölüm başlığı (13/700). |
| Alan | Tek satırlık alan ve arama kutusu tam 44, aynı iç boşluk; tek etiket (13/700, gri); alan yazısı gövde boyu. Sohbetlerde tek yazma alanı: düz dolgu, gönder düğmesi hep yerinde. |
| Onay penceresi | Değişmedi (tek bileşen). Başlıklar kısaldı: "Sohbetten çıkılsın mı?", "Sohbete devam edelim mi?", "Bu kişi engellensin mi?". |
| Menü | ⋮ menüsünün ikonları mürekkep renginde ve iki tonlu (Ayarlar satırı gibi); kırmızı satır kırmızı. |
| Boş hâl | Başlık noktasız; resim çerçevesiz çizim (Aktiviteler ve Bildirimler tuvalden alındı); Aktiviteler'de ortada. |
| Alt sayfa | Başlık 700; "Vazgeç" dolgusuz; içindeki etiket bölüm başlığı. |

İptal: üst barın halkasız geri düğmesi (19 Kasım'da denendi, proje sahibi geri aldırdı; yuvarlak kaldı, yalnız oku iki parçalı oldu).

## Kalıcılaştırma (yapılmadı)

1. `theme/auraKit.ts` → `t()` içindeki otomatik yuvarlama (`TEMEL_SCALE`, `snap`) kalkar; 225 yazı adı adlandırılmış az sayıda stile bağlanır. Eski yazı sistemi (`theme/tokens.ts`, `theme/theme.ts`; karşılama ve oyunlar) hiç değişmedi.
2. `capIcons.generated.ts` elle değişti: kaynak çizimler (`docs/design/aura/ikonlar`) düzeltilir, betik yeniden çalıştırılır.
3. Boyları ve yazıları sabitleyen testler yeni değerlere çevrilir (`skeleton.test.ts`, `aura.test.ts`, `contrast.test.ts`, `styleGuard`, `mutationHaptics`); `pnpm check` Windows'ta kendiliğinden de düşüyor (yol ayracı, zaman aşımı).
4. Tek bileşene inecekler: `Seg` ve `Segmented`; `Btn`'in yedi boy seçeneği; `Input`'un `box`/`large`/`boxed`; boş hâlin ekrandaki yeri (her ekran kendi boşluğunu veriyor).
5. Belgeler: CLAUDE.md → "Ekran davranışı" boy satırı ve "pano geçerlidir" kuralı, `docs/design/iskelet.md` → 2.1, 3.1, 5.9; kapsam kaydında dokunulan satırların kanıtı ya da muafiyeti.
6. Görülmeyenler: mekân, masa ve oyun ekranları, kayıt ekranları, uzun basma menüsü, onay penceresinin ikonlu ve tehlikeli hâli, koyu temanın büyük kısmı, 320 dp ve en büyük yazı.
7. Açık küçükler: "Şehir" ve "Set balonu" başlıkları mürekkep renginde (ötekiler gri); yazma alanının kenar boşluğu DM'de dar; "kartta" alan çerçeveli; DM'de gönder düğmesinin hep görünmesi proje sahibine soruldu, yanıt gelmedi (öneriyle gidildi).
