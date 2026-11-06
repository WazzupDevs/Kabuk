# Kaupholl ekranları: geçmeden en yakına yatır (6 Kasım 2026)

Aura v89 "Kaupholl (en yakına yatır)" satırı ve `docs/decisions/kaupholl.md` §6'nın panoları (24 pano; KartKapali, Soru, TahminYazAcik ve TahtaAcik tuval sürümü `1793928173-5bae`'den benzerleriyle kuruldu), kurallar `docs/SPEC_V4.md` → Adım 4.6.10 ve K-87, ekran notları `docs/decisions/senaryo-kaupholl.md` §4 (E-1…E-7). Ekranlar `features/games/kaupholl/KauphollGame.tsx` ve `KauphollParts.tsx`, saf yardımcılar `kauphollView.ts` (testli), ölçüler `theme/kaupholl.ts`; üst çubuk, şerit, deste, kankiler ve yüzler riso ortak parçaları (`features/games/riso/`), faz hapı ve Hazır çipi Krot'unkiler, sayfa ve sahneler Sprengja'nınkiler. Sunucu değişmedi. `content/games.json` → `kaupholl.available` hâlâ `false` (ayrı PR, proje sahibinin onayıyla).

## Oturumun seçtikleri (tasarım tanımlamıyor; proje sahibi telefonda bakınca onaylar ya da düzeltir)

- Soru açıldı (çizilmedi): tahmin aşamasının başında destede açık kart (kick "SORU 3/5", soru, birim çipi) ve "Tahmin yaz"; basınca alan klavyeyle açılır. Kart kapalıyken süre gösterilmez (KaupholHata/KaupholYukleniyor'daki gibi başlık ve not); süre dolunca sunucu açar.
- Tahmin alanı: sistem klavyesi; tam sayılı soruda `number-pad` (virgül yok, T-1), ondalıklı soruda `decimal-pad`. Alan binlik noktaları kendisi çizer; yazılan virgül ya da çizilenden fazla nokta ondalık sayılır (E-2). Altıdan fazla hane kabul edilmez, "En çok 6 hane" kırmızılaşır. Büyük sayı panelde, cevapta ve dilimde sığmazsa küçülür, "…" yok.
- Jeton yerleştirme: dilime dokunmak boş jetonu oraya koyar; boş jeton yoksa o dilimdeki jetonlardan biri geri gelir; dilimde jetonun da yoksa ilk jetonun oraya taşınır (`tapSlot`). Her dokunuş `bet { lock: false }` olarak sıraya girer; "Yatırdım" `lock: true`.
- `seq`: kapsam başına yolda tek istek, yoldayken yapılan değişiklikler birleşir, sonuncusu yanıt gelince bir sonraki `seq` ile gider (`Lane`). Başlangıç `seq`'i `view`'dan (tahmin) ya da açık durumdaki `bets`'ten (yatırım). Bağlantı geri gelince bekleyen atılır, sunucunun hâlinden devam edilir; ekran yeniden açılınca kuyruk zaten yoktur. `seq_conflict` hata gösterilmez: `view` okunur, oradan devam edilir. Hata titreşimi yalnız "Kesinleştir", "Yatırdım" ve "Oyunu başlat"ta (ve çerçevenin çıkış, gözlemci ol, yeniden oyna düğmelerinde); "Kartı aç", "Tahmini gönder", "Hazırım" ve süre dolunca `advance` titreşimsiz.
- Tahta sıkı düzeni 7 dilimde ya da 1× üstü yazıda; 360 dp altında 320 panosunun ölçüleri (yanlar 16, jeton alanı 92). Kişi başına jeton kişinin yüzüyle; dilimin jeton alanına sığmayınca yığın ("×n" ve üst üste yüzler). Tahta sığmazsa kendi içinde kayar: altı kararır (kaydırma çubuğu hiçbir ekranda yok, 29 Ekim kararı; panodaki çubuk çizilmedi); süre, cüzdan ve "Yatırdım" sabit.
- Otomatik kesinleşti: tahmin süresi biterken telefonun son gördüğü çip "yazdı" ise tahtada kendi diliminde "Kesinleşti" etiketi, ilk jeton konana kadar.
- Cevap: açıklama (`note`) cevap kutusunun altında ince satır (panoda yok, ürün belgesi istiyor). Ara ekranlarda (Cevap, Soru sonu) panolardaki gibi süre gösterilmez; en çok 10 sn sonra sunucu ilerletir.
- Soru sonunda kazanan tahminin yazarı 1 ad, 2 ad, 3+ "n kişi"; puan tablosunda yalnız oyunda kalanlar.
- Oyun sonu: "3 soruda kazanan tahmin" satırı açık durumda soru başına kazanan tutulmadığı için yazılmaz, yalnız puan. "Kazanan yok"ta konfeti ve kapsül yok.
- Oyuncular sayfasına Sprengja'daki gibi "Gözlemciler" kutusu ("Gözlemci ol") eklendi (panoda yok, kural gerektiriyor); 7+ oyuncuda başlat kapalı, "fazlası gözlemci olsun" (E-4).
- Oyun yarıda kaldı: oyun sonu yok, masa ekranında üstte cam bildirim; ekran oyunu süren gördüyse bir kez, Telegram Android'in uzun bülteni kadar (2750 ms) ya da dokununca kapanır.
- Gözlemci: kart, soru, çipler, tahta ve cevap görünür; düğme yerine "Gözlemcisin; tahmin yazmaz, jeton yatırmazsın." (E-3).

## Tasarıma sorulacaklar (çizilmedi)

Soru açıldı panosu, açık temada tahmin ve tahta, gözlemcinin ekranları, cevap açıklamasının yeri, uzun soru (destede en çok altı satıra küçülür).
