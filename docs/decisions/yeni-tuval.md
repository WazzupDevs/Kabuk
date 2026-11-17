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
3. **Semt sohbetinin üst çubuğunda kişi sayısı** ("6 kişi burada") ve "yazıyor" satırı panodaki gibi yazılır. Değişmez kural 4'ün semt maddesini ("sayı ve liste başka hiçbir yanıtta ve Realtime yükünde görünmez; presence ve son yazanlar yok") ve kural 9'u değiştirir: PR'ı proje sahibinin açık "onaylandı"sıyla birleşir.
4. **Başkasının profilindeki rozet kartı kalkar** (panoda yok).
5. **Canlı noktanın nabız hareketi kalkar** (panolar durağan).
6. **Masa bitti'de "arkadaş oldunuz" bildirimi (64a)** panodaki gibi gösterilir. K-70 ("eşleşme yalnızca ilk basana bildirilir") ve kural 5'in masa sonu maddesiyle birlikte ele alınır: PR'ı proje sahibinin açık "onaylandı"sıyla birleşir.

Daha önce verilmiş ölçü kararları (çip 36, ana düğme 48/56, küçük düğme 36) için ayrıca sorulmadı; pano farklı çiziyorsa (Keşfet çipi 40, satır düğmesi 40) yeni oturum tek satırda sorar.

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
- **Odadakiler:** listeden geri dönünce Seçenekler yeniden açılmaz.
- **Boy:** ana düğme ve form alanı 48 (eski 52/56); CLAUDE.md "Ekran davranışı" ve iskelet.md 2.1 düğme paketinin PR'ında güncellenir.
- **Ayarlar tam sayfa:** alttan sayfa yerine geri düğmeli sayfa, sağdan iter (yığının varsayılan geçişi); Bildirim ayarları, Gizlilik, Hesap, Engellenenler ve Sessize alınanlar aynı yığında itilir (iskelet.md 5.9).
- **Atölye:** çizilmiş panolarda Atölye adımı yoktur, onaylı pano doğrudan aktarılır; Atölye (`.claude/skills/ui-workshop-workflow`) yalnız panonun çizmediği yerde.

Panoların kaynağı paketlerle birlikte `docs/design/yeni-arayuz/project/` altına girer (ilk paket: `Ayarlar`, `OrtakKurallar`, `HareketDegerler`, `HareketTablo`, `skall.css`, `ekran.css`, `koyu.css`).
