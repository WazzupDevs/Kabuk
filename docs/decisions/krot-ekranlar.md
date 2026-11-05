# Krot ekranları: gizli kart ve şüpheli sırası (5 Kasım 2026)

Aura v86 "Krot (gizli kart ve şüpheli sırası)" satırı ve `Krot` panosu; kabul raporu proje sahibinin onayıyla (4 Kasım 22:41). Ekranlar `features/games/sahtekar/KrotGame.tsx` ve `KrotParts.tsx`, ölçüler `theme/krot.ts`; sunucu #464 (`docs/decisions/4.6.3-krot.md`) değişmedi. `content/games.json` → `sahtekar.available: true`.

## Ortak parçalar

Kinshi'nin üst çubuğu, zaman kapsülü ve şeridi, 3B destesi, kankileri ve yüzleri artık iki oyunun ortak parçası: `features/games/riso/RisoParts.tsx` (`GameTopBar`, `TimeStrip`, `TimeCapsule`, `Deck`, `PeekPair`, `Buddy`, `Face`, `FaceStack`, `Pop`), görseller `riso/risoArt.ts` (dosyalar `assets/games/kinshi/`'de kaldı), ölçüler `theme/riso.ts` (`risoDeck`; `kinshiDeck` onun üstüne kelime bandını ve paneli ekler). Kinshi'nin ekranları ve testleri değişmedi.

## Oturumun seçtikleri (tasarım tanımlamıyor; proje sahibi telefonda bakınca onaylar ya da düzeltir)

- Zaman kapsülü: fazın en az dörtte üçü kalmışken dolu, sonra yarım, son 10 sn az. Panolar tek kurala uymuyor (Oylama 72/90 yarım çizili); Rol 24/30 ve İpucu 29/30 dolu, Rol 21/30 yarım, Son şans 9 az ile uyumlu.
- Süre sayısı Rolünü gör ve Sonuç'ta çıplak saniye ("24", "12"), öteki fazlarda dakika:saniye (panolar gibi).
- Rolüm basılı tutulunca şüpheli sırasının yerinde rol kartının yüzü görünür (deste, "Basılı tut" hapı olmadan).
- Sahtekar kartını basılı tutarken arkadan bakan kankiler sahtekar panosundakiler olur; kart kapalıyken herkesinki aynı (rol omuz üstünden belli olmasın).
- 320 dp: şüpheli sırası Kinshi'nin sahneleri gibi bütün olarak ölçeklenir (`krotLineup`, en çok 1); deste `risoDeck` ile.
- İki sahtekarda: oy düğmesi "Ece ve Can'a oy ver"; gözlemci kartı "Sahtekar: A, B."; Sonuç kartı her sahtekarı "Yakalandı" ya da "Kaçtı" (eski Krot tuvali) ile yazar; Oyun sonu sahnesi iki yüz yan yana.
- Sonuç'ta kimse yakalanmadıysa şerit başlığı "Sahtekar kazandı"; yakalanan varsa "Son şans" ve "Şimdi kelimeyi tahmin ediyor…". Son şans sürerken tahmin etmeyen herkes Sonuç düzenini görür.
- Konuşan değişince yüz yeni boyuna swap eğrisiyle (hareket.json → curves.swap) 220 ms'de geçer; hareketi azaltta hemen.

## Proje sahibinin kararları (5 Kasım, kabul raporunun açık soruları)

1. Oy düğmesi: seçim tamamlanmadan "1 şüpheli seç" ya da "2 şüpheli seç" (`tr.krot.pickSuspects`), tamamlanınca "Ece'ye oy ver" / "Ece ve Can'a oy ver". "Bir koltuk seç" Krot'tan kalktı.
2. Hazırım yalnızca rol bilgisi yüklenip basılı tutulurken gösterildikten sonra açılır (`krotView.ts` → `krotRoleShown`, #475).
3. Oyun sonu: tahmin metni saklanmaz ve gösterilmez. Açıklama satırı yalnızca sunucunun `guessedRight`'ına göre (`krotView.ts` → `krotGuessLine`): `true` "Sahtekar kelimeyi doğru tahmin etti!", `false` "Sahtekar kelimeyi bilemedi!", `null` (kimse yakalanmadı ya da tahmin gelmedi) satır yok. `impostor_left`'te başlık "Sahtekar oyundan çıktı" aynı.
4. Şüpheli sırası: 5 oyuncuya kadar tuvalin tek sırası. 6–12 oyuncuda iki sıra (`theme/krot.ts` → `krotLineup`, `KROT.lineup.rows`, `krot.test.ts`); tuvalde pano yok, geometri tuvalin ölçülerinden türetildi ve proje sahibi onayladı ("kutu 300'e uzar"):
   - Kutu 350 × 300 (280 yerine), k-sira zemini aynı. Üst sıra ilk `ceil(n/2)` kişi, alt sıra kalanlar; konuşma sırasıyla soldan sağa, üstten alta; her sıra ortalı.
   - Sıra yukarıdan sıkı: "Yakalandı" 0, 62'lik yüz 24'te (52'lik aynı merkezde), plaka 94, iki satırlık ad 120–148; sıralar arası 4.
   - Sütun sırada en çok 5 kişiyken 66 (seçilen iki komşunun halkası birbirinin yüzüne binmesin diye tuvalin 64'ünden 2 geniş), yüzler 52/62. Sırada 6 kişi (11–12 oyuncu) 350'den kenarlarda 4 bırakıp paylaşır: sütun 57, yüzler 45/54 (halka kutunun içinde kalır, kenardakinin halesi köşede kırpılabilir). Ad 700/12'de kalır, satır kırılır, "…" yok.
