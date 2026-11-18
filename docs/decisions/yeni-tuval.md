# Yeni arayüz tuvali (16 Kasım 2026)

**Karar (proje sahibi, 16 Kasım):** yeni arayüz "skall yeni arayüz" tuvalinden aktarılır: https://claude.ai/artifact/7QxRyG1sRhLgkYwGDakRv9 (114 pano, her biri açık|koyu çift, 390×844). Bu tuvalin çizdiği ekranlarda görünüşün kaynağı bu tuvaldir; 8 Kasım'ın "var olan ekranın kaynağı uygulama" kararı (`tuval-kaynak.md`) bu ekranlar için yerini buna bırakır. Tuvalin çizmediği ekran ve hâl uygulamadaki bugünkü hâliyle kalır. Eski aura tuvali (`docs/design/aura/`) yalnız yeni tuvalin çizmediği yerde ve hareket kaynağı (`hareket.json`) olarak geçerlidir.

**Sınırlar:**

- Davranış, veri ve gizlilik: ürün belgesi ve değişmez kurallar. Pano bir kuralla çelişirse kural geçerlidir, çelişki proje sahibine soru olur.
- Panodaki örnek sayılar (53 parça, 6 kişi, 12 arşiv) sabit değildir.
- Panodan asset kırpılmaz; ekranın tamamı resim olarak kullanılmaz.

**Hareket:** panolar statiktir; süre ve eğri yalnız `hareket.json` → `MOTION`. Panonun gerektirdiği ama orada olmayan hareket tahmin edilmez, tasarımdan istenir. 16 Kasım'da istendi: uzun basma menüsü, merkez dialog, satır yer değiştirme, DM düzenleme, Süsle ve katalog geçişleri, Odadakiler geçişi.

**Aktarım düzeni:**

- Her paket yalnız ilgili panoları canlı tuvalden okur ve o panoların kaynağını paketle birlikte `docs/design/yeni-arayuz/project/` altına koyar; toptan kopya yok. `.claude/skills/tuval-aktarim` yordamı geçerlidir.
- Sıra: ortak temel (tema, düğme, başlık; sheet, dialog ve menü için tek overlay altyapısı) → kapsül pilotu (Profil → Süsle → Tüm aksesuarlar → tek kayıt) → liste ve sohbet → Keşfet, mekan, masa, lobi → kayıt.
- Efekt azaltma yok.
- Panoların çizmediği davranışlar: `docs/design/yeni-arayuz/davranis-eksikleri.md`.

**Cihaz kabulü:** çizici, önbellek, hareket (gesture), native yama ve ortak ekran iskeleti değişikliklerinde PR durumu üç basamaktır: kod geçti / telefonda doğrulandı / kullanıcı sorunu kapandı.

## Proje sahibinin verdiği ürün kararları (16 Kasım)

Hiçbiri henüz uygulanmadı; her biri ayrı sunucu paketi ve `guvenlik` denetimiyle gelir.

a. **Odadakiler (semt sohbeti; sunucusu uygulandı, `district-chat/people`, `docs/SPEC_V4.md` §4.V; 17 Kasım akşam yeniden onaylandı):** panodaki gibi tam liste: kişi sayısı, profilli ve anonim herkes (yazmayanlar dahil), geliş zamanı. Bu, değişmez kural 4'ün semt sohbeti maddesini ("Odanın kişi sayısı hiçbir yanıtta, Realtime yükünde ve ekranda görünmez (presence ve son yazanlar yok)", "Kişinin semti hiçbir kullanıcıya gitmez") ve `docs/SPEC_V4.md` §4.V'yi değiştirir; CLAUDE.md değişikliği o paketin PR'ında, proje sahibinin sohbetteki "onaylandı"sıyla. Sınırlar: anonim satır hesaba, nick'e ya da arkadaşlığa bağlanmaz ("Arkadaşın" etiketi yalnız profilli satırda); profil kimliği gitmez.

b. **Ortak arkadaş:** yalnız zaten arkadaş olunan kişinin profilinde, sayı ve adlarla. Arkadaş olmayanın profilinde (mekan ya da semt sohbetinden açılan) gösterilmez.

c. **Sohbet sabitleme ve arşiv:** sunucuda, hesaba bağlı; en çok 5 sabit. Arşivdeki sohbete yeni mesaj gelince sohbet arşivde kalır, okunmamış sayısı Arşivlenenler satırında görünür. Sunucu: DM yönetimi paketi (`docs/SPEC_V4.md` §4.X).

d. **Sohbeti sil:** yalnız silende; sunucuda "bu andan öncesi bana gizli" işareti. Karşı taraf görmez, arkadaşlık sürer, yeni mesaj sohbeti o mesajdan itibaren yeniden gösterir; şikayet kayıtları etkilenmez. Sunucu: DM yönetimi paketi (`docs/SPEC_V4.md` §4.X).

e. **DM düzenleme:** kendi metin mesajı, gönderildikten sonraki 15 dakika içinde; karşı tarafta "düzenlendi". Küfür filtresi yeniden uygulanır (kural 7); eski metin saklanmaz. Sunucu: DM yönetimi paketi (`docs/SPEC_V4.md` §4.X).

f. **Kapsül kaydı:** Süsle ve Tüm aksesuarlar tek taslağı paylaşır; Kaydet yalnız Süsle'de; sunucuda tek atomik yazma (`profile/save-look`).

## Tuvale sadık kalınır (17 Kasım gece, proje sahibinin kararı)

Proje sahibi sekme çubuğunun hiç aktarılmadığını gördü ("tuvalin birebir aktarılmasını istemiştim") ve pano–kod denetiminden (`docs/design/yeni-arayuz/pano-kod-denetimi.md`) çıkan altı açık soruda aynı cevabı verdi: **hepsinde tuvale sadık kalınır.** Yeni arayüz tuvalinin çizdiği ekranda ve ortak parçada pano ile uygulama ayrışıyorsa pano geçerlidir; 8 Kasım'ın "var olan ekrana yalnız istenen parça girer" kuralı bu tuvalin çizdiği yerde uygulanmaz. Aktarım planı ortak parçaları (sekme çubuğu, üst bar, boş ve hata hâli, avatar, zemin) saymadığı için atlanmışlardı; bundan sonra her paket kendi panolarındaki ortak parçayı da panoyla karşılaştırır.

1. **Zemin:** renk bulutları kalkar, panodaki düz zemin gelir.
2. **Arkasında özellik olmayan öğeler ve "(ÖNERİ)" panoları çizilir.** Özelliği olmayan öğe (DM yazma alanında emoji, dosya, kamera, ses; "Sohbette ara"; şikayette not alanı; etkinlikte tür ve düzenleyen; uzun basma menüsünde Sessize al, Profilini gör, Engelle; ÖNERİ panoları) çalışmayan düğme olarak bırakılmaz: her biri özelliğiyle birlikte gelir (sunucu gerekiyorsa ayrı paket, `mimar` ve `guvenlik`); ürün belgesine yazılır.
3. **Semt sohbetinin üst çubuğunda kişi sayısı** ("6 kişi burada") ve "yazıyor" satırı panodaki gibi yazılır. Değişmez kural 4'ün semt maddesini ("sayı ve liste başka hiçbir yanıtta ve Realtime yükünde görünmez; presence ve son yazanlar yok") ve kural 9'u değiştirir: PR'ı proje sahibinin açık "onaylandı"sıyla birleşir. **Geri alındı (18 Kasım, proje sahibi):** kişi sayısı da "yazıyor" da gerekmez; üst çubuk altyazısız kalır, kural 4 ve 9 değişmez (panodan bilerek ayrılır).
4. **Başkasının profilindeki rozet kartı kalkar** (panoda yok).
5. **Canlı noktanın nabız hareketi kalkar** (panolar durağan).
6. **Masa bitti'de "arkadaş oldunuz" bildirimi (64a)** panodaki gibi gösterilir. K-70 ("eşleşme yalnızca ilk basana bildirilir") ve kural 5'in masa sonu maddesiyle birlikte ele alınır: PR'ı proje sahibinin açık "onaylandı"sıyla birleşir.

Daha önce verilmiş ölçü kararları (çip 36, ana düğme 48/56, küçük düğme 36) için ayrıca sorulmadı; pano farklı çiziyorsa (Keşfet çipi 40, satır düğmesi 40) yeni oturum tek satırda sorar.

## 18 Kasım kararları (proje sahibi; tam denetimden sonra)

Tam denetim (`docs/design/yeni-arayuz/pano-kod-denetimi.md`, 203 pano) panoların bugünkü kurallarla çeliştiği yerleri çıkardı; proje sahibi her birine tek tek cevap verdi. Değişmez kural metnine dokunanların kural cümlesi kendi paketinin PR'ında değişir ve o PR proje sahibinin açık "onaylandı"sıyla birleşir; plan ve sıra `mimar`'dan (P1–P6).

Görünüş:

- **Boylar her yerde panodaki gibi:** çip 40, büyük düğme 56, sohbet yazma alanı ve gönder 52, Süsle süzgeç çipi 28, satır düğmeleri panonun o satırda çizdiği boyda (32, 34, 40). 2 ve 16 Kasım'ın "çip 36, küçük düğme 36" kararının yerini alır; CLAUDE.md "Ekran davranışı" ve `iskelet.md` 2.1 boy paketinin PR'ında güncellenir.
- **Alt sayfalarda kapat (X) düğmesi kalkar** (panoda yok); sayfa dışarı dokununca, kaydırınca ve geri tuşuyla kapanır.
- **Panoda olmayıp kodda duran, işlevi olan öğeler kalır:** Kibrit'te sohbet düğmesi ve "Bildir", Sprengja'da "Kelime kuralları", masa kartında "Lobiye aç / Lobiden çek", davette "Reddet", DM'de "Okunmamış mesajlar" çizgisi. Yalnız süs olanlar kalkar (Aktiviteler'de şehir satırı, masa kartında boş koltuk çizimi).

Kural değişmeyenler (panodan bilerek ayrılır):

- Mekan sohbetinde kişi sayısı, "Mekandakiler" ve "yazıyor" çizilmez (semt sohbeti gibi).
- İstekler satırında "Ortak arkadaş" ve masa adı çizilmez.
- Masa bitti bugünkü gibi kalır: yaş ve anonim kapsül gönderilmez, anonim kişi eklenebilir (K-75).

Kural değişenler:

- **P1 "Yeniden oyna" herkeste, öneri olarak** (kural 3 değişmez): katılımcının basışı sahibe öneridir, oyunu yine sahip başlatır. Masa bitti'de "arkadaş oldunuz" (64a) aynı pakette.
- **P2 Anonim oturma herkese açılır** (kural 4 ve 12): erkek ve belirtmeyen de masada anonim oturabilir; check-in'e kimlik adımı gelir (124). Kayıttaki cinsiyet sorusu kalır; cinsiyeti boş eski hesaba yeniden sorulmaz.
- **P2 Anonim nick öneki cinsiyete göre** (kural 12 ve 4): erkek `terra-xxxx`, kadın `luna-xxxx`, belirtmeyen `sol-xxxx`; `xxxx` bugünkü biçim. Proje sahibine nick'in cinsiyeti her okuyana söylediği ve rastgele önek seçeneği sunuldu; "cinsiyete göre" dedi. Kural 12'nin "cinsiyet hiçbir kullanıcıya gösterilmez" cümlesi ve gizlilik metinleri bu paketle değişir.
- **P3 Odadakiler panodaki gibi tam** (kural 4 ve 5): profilli satırda "Arkadaş ekle", anonim satırda kapsül ve satır menüsü. Sessize alma kimliğe bağlı kalır: anonim satırdan sessize almak yalnız o kişinin anonim mesajlarını gizler.
- **P4 Lobide yüzler ve masa sayısı** (kural 4, K-41): lobi satırında masadakilerin yüzleri (profilli fotoğrafıyla, anonim kapsülüyle; ad ve nick gitmez), yalnız o mekanda check-in'i olana; Keşfet ve haritada masa sayısı, yüz yok.
- **P5 Akış gönderisine masa kartı** (kural 4, §4.Y): yalnız masa sahibi ekler.
- **P6 Haritada konum noktası, "Konumuma git" ve uzaklık** (kural 6): konum cihazda kalır, sunucuya gitmez; KVKK metni ve mağaza beyanı güncellenir.

Diğer cevaplar (18 Kasım):

- **İbre, Harf Kapmaca ve Şarkıda Geçsin uygulamaya gelmeyecek.** "Yakında" kayıtları, Masa kur'daki üç oyun etiketi ve resimleri kaldırılır; Masa kur'un etiketleri panodaki altılı olur (Vampir Köylü, Signum, Kinshi, Krot, Sprengja, Kaupholl; sunucuda `rooms_game_tag_check` değişir); ürün belgesinden çıkar. Panoları (153–158) aktarılmaz.
- **"Sohbet kuralları"** kısa bir kurallar sayfası açar; metnin taslağı PR'dan önce proje sahibine gösterilir.
- **Lobide "Hazırım" ve sahibin kişi menüsü gelir** (takıma al, gözlemciye al, masadan at): sunucu paketi; oyunu yine yalnız sahip başlatır (kural 3).
- **Ayarlar'da üç yeni satır gelir:** "Mesajı bildirimde göster" (varsayılan kapalı; SPEC'in "önizleme yok" kararı değişir), "Verilerimin kopyasını iste" (KVKK; dökümde başkasının kimliği yok), "Hata kaydını gönder".
- **"Noktasız" check-in yok** (satır çizilmez; sunucu nokta ister). **Hediyede "Atla" yok** (8 Kasım kararı kalır).
- **Haritada konum izni** yalnız "Konumuma git"e basınca sorulur.
- **Nick değişikliğinde** var olan hesabın son eki korunur, yalnız önek değişir; cinsiyeti boş hesap `sol-` alır (oturumun varsayımı, proje sahibine yazıldı).

Kabul edilen yeni açıklıklar (proje sahibine söylendi): lobide kapsül görününce mekan sohbetinde aynı kapsülle yazan kişinin masası anlaşılır; Odadakiler'de anonim satır kapsülüyle görününce satır o kişinin mesajlarına ve geliş zamanına bağlanır; nick öneki anonim yazanın cinsiyetini söyler.

## Panolar depoda (17 Kasım, proje sahibinin kararı)

Canlı tuvalin bütün panoları (203 pano, `canvas.json`, üç css; sürüm 1794920928-8d77) `docs/design/yeni-arayuz/project/` altındadır; numara → dosya eşlemesi `docs/design/yeni-arayuz/ESLEME.md`, resimlerin (blob) hangi panoda kullanıldığı `BLOBLAR.md`. Yeni oturum panoları indirmez, buradan okur; `mobil` ajanına dosya yolu verilir. Resimler depoda değildir: gereken resim Artifact aracıyla tek tek indirilir. Tuval değişince proje sahibi söyler; o zaman değişen panolar yeniden indirilip bu klasör ve iki eşleme dosyası güncellenir.

## 17 Kasım kararları (proje sahibi)

Mekan akışı ayrı dosyada: `docs/decisions/mekan-akisi.md`. Aşağıdakiler henüz uygulanmadı; her biri sunucu paketi ve `guvenlik` denetimiyle gelir, değişmez kural metnine dokunan PR proje sahibinin "onaylandı"sıyla birleşir.

g. **DM'de mesaj silme (sunucusu uygulandı, `docs/SPEC_V4.md` §4.X):** kişi kendi mesajını siler; herkesten silinir, süre sınırı yok (düzenlemenin 15 dakikası silmeyi bağlamaz), karşı tarafta "Mesaj silindi" izi kalır; metin yalnız şikayet için 7 gün saklanır. Plan: `dm/delete { messageId }`, mesaja `deleted_at`, metin `dm_message_versions`'a son sürüm, tepkiler silinir; sayfa silineni metinsiz iz olarak döner (telefondaki DM önbelleği eski metni tutmasın); `dm:` konusunda veri içermeyen yayın; kilit sırası `dm_edit` gibi. `docs/SPEC_V4.md` §4.X'in "mesaj silme yoktur" cümlesi ve kural 10'un DM yönetimi cümlesi aynı PR'da değişir.

h. **İstekler'de "Gönderdiğin" bölümü (uygulandı, `docs/SPEC_V4.md` §4.W; 17 Kasım akşam: kabul edilen istek listeden düşer, "Geri çek" oyun geçmişindeki "İstek gönder"i sıfırlar; eylem `friends/withdraw { sentId }`, kimlik basışın kimliği):** eklenir. Reddedilen ve sessizce yutulan istek de "Kabul etmesi bekleniyor" görünür; bunun için yutulan istek yalnız gönderenin gördüğü bir satır bırakır (kural 5'in "satır oluşmaz" metni değişir). "Geri çek" bekleyen isteği kaldırır, reddedilmiş ya da yutulmuşta yalnız gönderenin listesinden gizler; kalıcı red silinmez; aynı çifte günde bir yeni istek, fazlası sessizce yutulur. Listede alıcının yalnız istek anında görülen adı gider; fotoğraf ve profil kimliği gitmez. Plan: `friends/sent`, `friends/withdraw { requestId }`, çift kilidinden başlar.

i. **Mekan sohbeti kartındaki yazma alanı** kalır (panoda yok, uygulamadaki hâl korunur).

j. **Bildirimler:** bekleyen arkadaşlık isteği satırında yalnız "Bak" (İstekler'e götürür); kabul ve red İstekler'de. Okundu işareti liste kapanınca ya da "Tümünü okundu say" ile yazılır (uygulandı, #692).

Ortak arkadaş (karar b; sunucusu uygulandı, `docs/SPEC_V4.md` §4.W): `friends/mutual { publicId }` → sayı ve arkadaşlar; yalnız ikisi arkadaşsa döner, değilse aynı boş yanıt; izleyenle ya da hedefle arasında engel olan listeye girmez; kural 4'e "arkadaşın profilinde ortak arkadaşlar görünür, başka hiçbir yerde görünmez" cümlesi eklenir. Panodaki, arkadaş olmayanın isteğinde çizili "Ortak arkadaş" satırı karar b ile çelişir, uygulanmaz.

## Proje sahibinin kararları (16 Kasım, ortak temel)

- **Onaylar:** her onay ortada dialogdur (geri alınamaz olanlar ve kaydetmeden çıkış dahil); alttan sayfa yalnız içerik, seçim ya da form içindir (pano `OrtakKurallar`, C1). iskelet.md 3.5'in "alttan onay sayfası" kuralı dialoga geçişin paketinde değişir.
- **Süsle:** altıncı sekme Ağız; Takımlar yalnız katalogda. Katalogda "Kapsülüne tak" taslağa uygular, kayıt yalnız Süsle'de.
- **Odadakiler:** listeden geri dönünce Seçenekler yeniden açılmaz. Profilli satır o kişinin profilini açar (17 Kasım gece, proje sahibinin isteği; kural 4'e cümle): satırın oturuma bağlı kendi anahtarıyla, engelde yalnız satırın gösterdiği alanlarla; anonim satır basılamaz kalır.
- **Boy:** ana düğme ve form alanı 48 (eski 52/56); CLAUDE.md "Ekran davranışı" ve iskelet.md 2.1 düğme paketinin PR'ında güncellenir.
- **Ayarlar tam sayfa:** alttan sayfa yerine geri düğmeli sayfa, sağdan iter (yığının varsayılan geçişi); Bildirim ayarları, Gizlilik, Hesap, Engellenenler ve Sessize alınanlar aynı yığında itilir (iskelet.md 5.9).
- **Atölye:** çizilmiş panolarda Atölye adımı yoktur, onaylı pano doğrudan aktarılır; Atölye (`.claude/skills/ui-workshop-workflow`) yalnız panonun çizmediği yerde.

Panoların kaynağı paketlerle birlikte `docs/design/yeni-arayuz/project/` altına girer (ilk paket: `Ayarlar`, `OrtakKurallar`, `HareketDegerler`, `HareketTablo`, `skall.css`, `ekran.css`, `koyu.css`).
