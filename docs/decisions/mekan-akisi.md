# Mekan akışı (17 Kasım 2026)

**Karar (proje sahibi, 17 Kasım):** yeni arayüz tuvalinin Mekan akışı (panolar 27–30) aşağıdaki sınırlarla kurulur. Ürün metni `docs/SPEC_V4.md` §4.Y.

- Masa ekli gönderi alınmaz: profilli bir kişiyi masa adına ve telefon sayısına bağlar; bugün sohbette masa adı gitmez, lobide kimin hangi masada olduğu görünmez; üniversitede kart masanın yerleşkesini de söylerdi.
- Gönderi 24 saat yaşar. Okuyan: mekanda check-in'i olan; yazan: profil fotoğrafı olan. Akışta anonim yazılmaz.
- Yanıt tek kat. ⋯ menüsü: kendi gönderinde Sil; başkasınınkinde Şikayet et, Sessize al.
- Beğeni yalnız sayı ve "ben beğendim mi"; kimin beğendiği gitmez, bildirim üretmez.
- Panoda olup davranışı tanımsız düğmeler (Paylaş, Yol tarifi, mesafe, öneri satırı) alınmaz.

**Neden mekan sohbetinin üstüne kurulmadı:** sohbet 200 karakter, anonim yazılabilir ve tepkileri altı yüzdür; akış 280 karakter, yalnız profilli ve tek beğenili. Aynı tabloya iki anlam yüklemek sohbetin gönderme, sayfa ve şikayet yollarının hepsine dokunurdu. Ayrı tablolar ve ayrı fonksiyon (`venue-feed`) seçildi; kapsam (üniversitenin yerleşkeleri), check-in denetimi, sessize alınanlar ve Realtime konuları sohbetle ortaktır.

**Realtime:** yeni kanal türü açılmadı; `venue_chat:{venue_id}` konularında veri içermeyen `venue_post` olayı. Politika değişmedi.

**Sonraya kalan:** gönderiden profil açma ve arkadaşlık isteği; analitik olayları; istemci (Masalar/Akış seçicisi, akış, yazma sayfası, yanıtlar). Kadının başlıktaki anonim/profil seçicisinin Akış görünümünde ne göstereceği istemci paketinde sorulur (öneri: gizlenir, "Akışta herkes profiliyle yazar." notu kalır).
