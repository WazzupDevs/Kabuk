# Kibrit (5 Kasım 2026)

Proje sahibinin onayı: Aura v90 "Kibrit (gizli soru, gizli oy)" satırı (11 pano) ve 5 Kasım'daki kararlar (K-85, `docs/SPEC_V4.md` Adım 4.6.8).

- **Neden puan yok:** Kibrit sosyal etkileşim oyunu; rekabet yok. `game_results` yazılmaz, kazanan ve sıralama yok.
- **Neden 3–4 kişide sayı yok:** küçük masada oy sayıları kimin kime oy verdiğini çıkarılabilir kılar (3 kişide 3 oy alan, herkesin oyudur). 5 ve üstünde sayılar kibrit çöpleriyle görünür. Hiçbir düzende mutlak gizlilik yoktur; belge bunu açıkça söyler.
- **Neden tikler kalktı:** yazanların ve oy verenlerin tek tek işaretlenmesi, az kâğıtta yazarı daraltır. Yalnız toplamlar görünür; en az üç farklı oyuncudan geçerli kâğıt yoksa oyun başlamaz.
- **Neden revizyon istisnası:** tasarım "Kâğıdı değiştir" ve "Oyu değiştir" istiyor. Kural 3 aynı adıma ikinci eylemi yok sayar. İstisna yalnız `write` ve `vote` içindir. Artan `rev` numarası tekrar gönderilen ya da sırası karışan isteğin eski hâli geri getirmesini önler; adım başına en çok 20 revizyon.
- **Neden sonuç ekranı kendiliğinden geçmez:** masa sonucu konuşur; sahip ilerletir ya da herkes hazır olur. Sahip kaybolursa 120 sn sonra herhangi bir telefonun `advance`'i geçirir.
- **Neden kâğıt kalır:** kavanozdan sonra çıkanın kâğıdı kaybolsaydı yazarı belli olurdu.
- **Katalog:** `content/games.json` sunucunun oyun listesidir; eski yedi oyunun satırları (Vampir Köylü, Kapsül Anlat, İbre, Sahtekar, Harf Kapmaca, Şarkıda Geçsin, Sohbet kartları) kendi fonksiyonlarıyla kalır. Masa ekranının kartları `PosterCard` → `GAME_CARDS`'tır (K-77'nin altısı ve Kibrit); kart, katalog satırına `conceptOf` ile bağlanır. Kibrit'in satırı kartla aynı adı taşır ve sunucusuyla birlikte gelir; ekranlar bitene kadar `available: false`.
- **Bildirim ve temizlik:** yazar yalnız sunucuda. Bildirilen sorunun metni ve yazarı `reports`'a kopyalanır (30 gün). Oyun bitince bütün kâğıtlar ve oy satırları silinir; oyun sonu özeti masanın sonraki oyununda ya da masa kapanınca gider.
