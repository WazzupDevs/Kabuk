# Mağaza inceleme hesabının konum istisnası (26 Kasım 2026)

**Karar (proje sahibi):** Play ve App Store incelemecisinin girdiği tek test numarası (`REVIEW_PHONE`) check-in'de kampüs sınırı kontrolünden muaftır (`docs/SPEC_V4.md` §4.Z; CLAUDE.md kural 6'nın ikinci istisnası).

**Gerekçe:** Play Console → Uygulama erişimi: "Uygulamanız normalde konuma bağlı bir şifre (ör. coğrafi sınır) kullanıyorsa kullanıcı konumundan bağımsız olarak geçerli olan oturum açma bilgilerini sağlayın." Açık yerler yalnız iki kampüs; incelemeci oralarda değildir. Önceki plan (yalnız video, `PLAY_CHECKLIST.md` §3.3) bu şartı karşılamıyordu ve üç telefonla kampüste çekim istiyordu.

**Seçilmeyenler:** dev'deki `CHECKIN_SKIP_LOCATION`'ı üretimde açmak (herkes için kuralı kaldırırdı); hesap kimliğiyle tanımlamak (ilk girişten önce bilinmez, test edilemezdi); üretimde test botları (oyunlar 3 telefon ister; incelemeye gerekmedi, açılmadı).

**Kabul edilen risk:** kodu bilen biri uzaktan bir kampüse check-in yapıp mekanda check-in'i olana açılan her şeyi görebilir (kural 4): lobi, mekan sohbeti ve akış, profilli mesajların ve gönderilerin profili (ad, yaş, fotoğraf, kapak, biyografi, rozetler), katıldığı masadaki profiller. Kimsenin konumu açılmaz. Kod sızarsa panel ve Play Console'da birlikte değiştirilir.
