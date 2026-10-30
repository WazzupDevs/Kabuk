# KVKK Aydınlatma Metni (TASLAK)

> **HUKUKİ KONTROL GEREKLİ.** 6698 sayılı Kişisel Verilerin Korunması Kanunu m. 10 uyarınca, uygulamanın bugün işlediği verilere göre hazırlanmış taslaktır; hukuki görüş alınmadan yayımlanmamalıdır. Köşeli parantezli alanlar doldurulmalı, "[hukuki görüşle belirlenecek]" yazan yerler avukatla kararlaştırılmalıdır. Uygulamanın onay ekranı bu metni henüz göstermiyor (yer tutucu metin); pilottan önce onay ekranı yayımlanan sayfaya bağlanır ve onay sürümü o zaman artırılır.

## 1. Veri sorumlusu

[Unvan, adres, iletişim]

## 2. İşlenen kişisel veriler, amaçlar ve hukuki sebepler

| Veri kategorisi                                                                                                                                                                                                                                                                                                               | Amaç                                                                                                                                          | Hukuki sebep (KVKK m. 5)                                                |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Kimlik ve iletişim: telefon numarası, görünen ad, doğum tarihi (hiçbir kullanıcıya gösterilmez; yalnızca yaş görünür)                                                                                                                                                                                                         | Üyelik, SMS ile giriş, 18 yaş sınırı, profilde ad ve yaş                                                                                      | Sözleşmenin kurulması ve ifası (m. 5/2-c)                               |
| Cinsiyet (Kadın, Erkek, Belirtmek istemiyorum; hiçbir kullanıcıya gösterilmez, kullanım istatistiğine gitmez; masaya anonim oturmak yalnızca kadın beyanıyla mümkün olduğundan anonim görünmek cinsiyet hakkında dolaylı bilgi verir)                                                                                         | Masadaki anonimlik kuralının uygulanması                                                                                                      | Sözleşmenin kurulması ve ifası (m. 5/2-c) [hukuki görüşle belirlenecek] |
| Profil: profil fotoğrafı (ek bilgileri telefonda silinir), kısa biyografi, rozetler; kapsül adı ve görünüşü                                                                                                                                                                                                                   | Profilli ya da anonim görünmek; arkadaşlara profil gösterilmesi                                                                               | Sözleşmenin ifası (m. 5/2-c)                                            |
| Konum: check-in anında bir kez alınan konum (**saklanmaz**) ve telefonun bildirdiği doğruluk yarıçapı (metre)                                                                                                                                                                                                                 | Yalnızca check-in anında mekanda bulunduğunuzun doğrulanması; doğruluk yarıçapı mesafe eşiğini ayarlar. Harita ve Keşfet konumunuzu kullanmaz | Açık rıza (m. 5/1)                                                      |
| Kullanıcı işlemleri: check-in (mekan, kampüs noktası, zaman, anonim ya da profilli kimlik ve bir kez yapılabilen değişikliği), masa (adı, simgesi, etiketleri, katılma istekleri, masadaki kimlik), masa ve mekan sohbeti mesajları ve tepkileri, oyun verileri (oyun oyları, roller, hamleler, skor), sessize alma kayıtları | Hizmetin sunulması                                                                                                                            | Sözleşmenin ifası (m. 5/2-c)                                            |
| Arkadaşlık ve mesajlaşma: oyun geçmişi (tarih, oyun ve masada en az 3 dakika birlikte bulunulan her kişinin o masadaki adı), arkadaşlık istekleri ve "Arkadaş ekle" basışları, arkadaşlıklar, arkadaşlar arası mesajlar, tepkileri ve okunma zamanı, masa davetleri, bildirim anahtarı ve tercihleri                          | Masada karşılaşılan kişilerle arkadaş olunması ve mesajlaşma; bildirimler                                                                     | Sözleşmenin ifası (m. 5/2-c)                                            |
| İşlem güvenliği: onay kayıtları, şikayet kayıtları (sebep; son 50 mesajın, fotoğrafın, profilin adı ve biyografisinin ya da oyun geçmişi kaydının kopyası), engelleme kayıtları, banlanan telefon numarasının geri döndürülemez özeti (HMAC)                                                                                  | Hizmet ve kullanıcı güvenliği, uyuşmazlıkların önlenmesi                                                                                      | Meşru menfaat (m. 5/2-f), hakkın tesisi ve korunması (m. 5/2-e)         |
| Hata raporları: teknik hata kaydı ve kullanıcı kimliği (telefon, konum, yazılan metin ve istek içeriği telefondan çıkmadan silinir)                                                                                                                                                                                           | Hataların giderilmesi                                                                                                                         | Meşru menfaat (m. 5/2-f) [hukuki görüşle belirlenecek]                  |
| Pazarlama dışı kullanım istatistikleri (kullanıcı kimliği ve olay adı)                                                                                                                                                                                                                                                        | Ürün geliştirme                                                                                                                               | Meşru menfaat (m. 5/2-f) [hukuki görüşle belirlenecek]                  |

## 3. Kimlere aktarılır

Veriler hizmetin sunulması için şu sağlayıcılara aktarılır: Supabase (Almanya), [SMS sağlayıcısı: Netgsm (Türkiye) ya da Twilio (ABD)], Expo (bildirim ve uygulama güncellemeleri) ve Google Firebase (ABD), OpenFreeMap (Keşfet haritası; IP adresi ve bakılan bölge), PostHog (AB), Sentry ([bölge]). Yurt dışına aktarımın dayanağı: [hukuki görüşle belirlenecek, KVKK m. 9].

Diğer kullanıcılara yalnızca şunlar gösterilir:

- Lobide masanız için masa adı, masa simgesi, telefon sayısı ve seçtiyseniz niyet ve oyun etiketi.
- Masada oturduğunuz kimliğin adı; profilinizle oturduysanız profiliniz (görünen ad, yaş, fotoğraf, biyografi, rozetler), masa sürerken yalnızca o masadakilere. Profilinizle katılma isteği gönderdiğinizde, istek beklerken masa sahibine görünen adınız, yaşınız ve fotoğrafınız.
- Anonimken kapsül görünüşünüz ve kapsül adınız; ad ile hesabınız arasındaki bağ gösterilmez. Anonim oturduğunuz masanın sonunda arkadaş olduğunuz kişi o masadaki anonim adın siz olduğunu öğrenir.
- Mekan sohbetinde profilinizle yazdığınızda, o an mekanda check-in'i olanlara profiliniz; mekan sohbetinden arkadaşlık isteği gönderdiğiniz kişiye görünen adınız, yaşınız ve fotoğrafınız.
- Arkadaşlarınıza profiliniz. Anonim oturduğunuz masanın sonunda arkadaş olduğunuz kişi kapsül adınızı öğrenir ve adı yenileyene kadar sizi anonimken de tanıyabilir.
- Mekan sohbetinden gönderdiğiniz arkadaşlık isteğinde alıcıya mekanın adı, adınız ve yaşınız.
- Masa sahibinin aynı mekandaki arkadaşına gönderdiği davette masanın adı ve telefon sayısı (mekan adı yazılmaz; 2 dakika geçerli).

Telefon numaranız, doğum tarihiniz, cinsiyetiniz ve konumunuz hiçbir kullanıcıya gösterilmez; bulunduğunuz mekan ve aktif masanız yalnızca yukarıdaki iki durumda (masa daveti, mekan sohbetinden arkadaşlık isteği) karşı tarafa söylenir.

## 4. Toplama yöntemi

Uygulama üzerinden, elektronik ortamda; konum yalnızca açık rızanızla ve check-in anında. Profil fotoğrafı telefonunuzda yeniden kodlanır; konum dahil bütün ek bilgiler (EXIF vb.) yüklenmeden önce silinir.

## 5. Saklama süreleri

- Masa sohbeti mesajları masa kapandıktan 24 saat sonra, mekan sohbeti mesajları 24 saat sonra silinir. Şikayet edilen sohbetin son 50 mesajının kopyası şikayet kaydında 30 gün kalır.
- Şikayet kayıtları 30 gün, hata raporları 30 gün sonra silinir.
- Arkadaşlar arası mesajlar arkadaşlık sürdükçe saklanır; arkadaşlık bittiğinde ya da hesap silindiğinde silinir. Her konuşmanın son 50 mesajı ve oturum bilgisi telefonunuzda da tutulur; telefon yedeğine alınmaz, arkadaşlık bittiğinde, çıkışta ya da hesap silindiğinde telefondan silinir.
- Değiştirilen ya da kaldırılan profil fotoğrafı hemen silinir.
- Diğer veriler hesap silinene kadar saklanır ve hesap silindiğinde hemen silinir. Karşılaştığınız kişilerin oyun geçmişindeki kaydı (tarih, oyun, o masadaki adınız) onlar kendi hesaplarını silene kadar kalır. Banlanan hesabın telefon özeti güvenlik amacıyla süresiz saklanır.
- Hesap silindikten sonra yasal ya da güvenlik amaçlı ek saklama ve 5651 sayılı Kanun kapsamında trafik bilgisi saklama yükümlülüğü: [hukuki görüşle belirlenecek].
- 18 yaşından küçüklerin verisi işlenmez: kayıtta beyan edilen doğum tarihi 18 yaşın altındaysa hesap o anda silinir ve hiçbir veri saklanmaz.

## 6. Haklarınız (KVKK m. 11)

Kişisel verilerinizin işlenip işlenmediğini öğrenme, bilgi talep etme, amacını öğrenme, aktarıldığı kişileri bilme, düzeltme, silme, itiraz ve zararın giderilmesini isteme haklarına sahipsiniz. Başvuru: [e-posta / adres]. Hesabınızı uygulama içinden silebilirsiniz.
