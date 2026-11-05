# Krot ekranları: gizli kart ve şüpheli sırası (5 Kasım 2026)

Aura v86 "Krot (gizli kart ve şüpheli sırası)" satırı ve `Krot` panosu; kabul raporu proje sahibinin onayıyla (4 Kasım 22:41). Ekranlar `features/games/sahtekar/KrotGame.tsx` ve `KrotParts.tsx`, ölçüler `theme/krot.ts`; sunucu #464 (`docs/decisions/4.6.3-krot.md`) değişmedi. `content/games.json` → `sahtekar.available: true`.

## Ortak parçalar

Kinshi'nin üst çubuğu, zaman kapsülü ve şeridi, 3B destesi, kankileri ve yüzleri artık iki oyunun ortak parçası: `features/games/riso/RisoParts.tsx` (`GameTopBar`, `TimeStrip`, `TimeCapsule`, `Deck`, `PeekPair`, `Buddy`, `Face`, `FaceStack`, `Pop`), görseller `riso/risoArt.ts` (dosyalar `assets/games/kinshi/`'de kaldı), ölçüler `theme/riso.ts` (`risoDeck`; `kinshiDeck` onun üstüne kelime bandını ve paneli ekler). Kinshi'nin ekranları ve testleri değişmedi.

## Oturumun seçtikleri (tasarım tanımlamıyor; proje sahibi telefonda bakınca onaylar ya da düzeltir)

- Zaman kapsülü: fazın en az dörtte üçü kalmışken dolu, sonra yarım, son 10 sn az. Panolar tek kurala uymuyor (Oylama 72/90 yarım çizili); Rol 24/30 ve İpucu 29/30 dolu, Rol 21/30 yarım, Son şans 9 az ile uyumlu.
- Süre sayısı Rolünü gör ve Sonuç'ta çıplak saniye ("24", "12"), öteki fazlarda dakika:saniye (panolar gibi).
- Rolüm basılı tutulunca şüpheli sırasının yerinde rol kartının yüzü görünür (deste, "Basılı tut" hapı olmadan).
- Sahtekar kartını basılı tutarken arkadan bakan kankiler sahtekar panosundakiler olur; kart kapalıyken herkesinki aynı (rol omuz üstünden belli olmasın).
- Hazırım kart bir kez görülmeden basılamaz (eski Krot'un "Gördüm"ü; rapor açık soru 2 yanıtlanana kadar).
- 320 dp: şüpheli sırası Kinshi'nin sahneleri gibi bütün olarak ölçeklenir (`krotLineup`, en çok 1); deste `risoDeck` ile.
- 6 ve üstü oyuncu: sütunlar aynı 320'lik aralığı paylaşır, yüzler sütunla küçülür (rapor açık soru 4 yanıtlanana kadar geçici).
- İki sahtekarda: oy düğmesi "Ece ve Can'a oy ver"; gözlemci kartı "Sahtekar: A, B."; Sonuç kartı her sahtekarı "Yakalandı" ya da "Kaçtı" (eski Krot tuvali) ile yazar; Oyun sonu sahnesi iki yüz yan yana.
- Sonuç'ta kimse yakalanmadıysa şerit başlığı "Sahtekar kazandı"; yakalanan varsa "Son şans" ve "Şimdi kelimeyi tahmin ediyor…". Son şans sürerken tahmin etmeyen herkes Sonuç düzenini görür.
- Oyun sonu açıklaması yalnızca masa kazanınca ("Sahtekar yakalandı ve kelimeyi bilemedi."); tahmin sunucuda saklanmadığından "(tahmini: ÇAY)" yok (rapor açık soru 3). Sahtekar kazandığında ya da oyundan çıktığında tasarımda metin olmadığından açıklama satırı yok.
- Konuşan değişince yüz yeni boyuna swap eğrisiyle (hareket.json → curves.swap) 220 ms'de geçer; hareketi azaltta hemen.
- "Bir koltuk seç" oy düğmesinin seçim yokkenki yazısı olarak duruyor (rapor açık soru 1).
