> 16 Kasım 2026. Bu bir hukuki görüş değildir; araştırma notudur. Kaynakların doğrulama durumu metinde işaretlidir. İlgili PR: #663.

# DM düzenleme sürümlerinin saklanması: KVKK değerlendirmesi

Tarih: 16 Kasım 2026. Repo: `WazzupDevs/Kabuk`, `origin/main` @ 97eee43. Repoda hiçbir dosya değiştirilmedi.

**Bu bir hukuki görüş değildir.** Aşağıda her iddia için (a) repodan doğrulanan, (b) kaynakla desteklenen, (c) öneri ve (d) avukat değerlendirmesi gereken ayrı işaretlendi.

**Kaynaklara erişim notu (ilk tur):** İlk turda `www.mevzuat.gov.tr` ve `www.kvkk.gov.tr` çözülemedi; B bölümündeki **[ikincil]** işaretli satırlar o turdan kalır. Hepsi ikinci turda aşağıdaki "Birincil kaynak doğrulaması" tablosuyla yeniden denetlendi. **Tablo B bölümünden önce gelir; çelişkide tablo geçerlidir.**

---

## 0. Birincil kaynak doğrulaması (ikinci tur, 16 Kasım 2026)

### Erişim durumu

Ağ izni sonrası denendi; ilk istek reddedilen her adres 30 sn sonra bir kez daha denendi.

| Adres                                                       | Sonuç                                                                                                                                                        |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `https://www.mevzuat.gov.tr/…`                              | İki denemede de `curl: (35) Recv failure: Connection reset by peer`; proxy kaydı `ws_closed_mid_exchange`                                                    |
| `https://www.kvkk.gov.tr/…`                                 | İki denemede de `curl: (35) Recv failure: Connection reset by peer`; proxy kaydı `ws_closed_mid_exchange`                                                    |
| `https://mevzuat.gov.tr/…` (www'siz)                        | Açıldı                                                                                                                                                       |
| `https://kvkk.gov.tr/…` (www'siz)                           | Açıldı. `kvkk.gov.tr/Icerik/8043` ilk denemede `(35) Connection reset`, 30 sn sonra açıldı; `kvkk.gov.tr/Icerik/2040` de aynı biçimde ikinci denemede açıldı |
| `https://resmigazete.gov.tr/eskiler/2018/03/20180310-5.htm` | `curl: (56) CONNECT tunnel failed, response 403`, yani ağ politikasının reddi. Kurala göre yeniden denenmedi                                                 |

İkinci turda **Yurt Dışına Aktarım Yönetmeliği'nin metni okunamadı** (kvkk.gov.tr yalnız Resmî Gazete'ye bağlanıyor). Üçüncü turda Resmî Gazete'den okundu; aşağıda "Üçüncü tur" bölümü (#32-39). Yönetmeliğin ilgili hükümleri Kurum'un kendi yayını olan *Kişisel Verilerin Yurt Dışına Aktarılması Rehberi*nden (KVKK Yayınları No: 48, Ocak 2025) doğrulandı; Rehber Yönetmeliğin maddelerini anıyor.

### Kullanılan birincil belgeler

- **6698 sayılı Kanun, güncel metin** (7499 değişiklikleri işlenmiş; PDF 3 Haziran 2024): https://mevzuat.gov.tr/mevzuatmetin/1.5.6698.pdf
- **5651 sayılı Kanun, güncel metin** (PDF 2 Kasım 2026; 7578 sayılı Kanun, 22.4.2026 ve 7590 sayılı Kanun, 24.7.2026 değişiklikleri işlenmiş): https://mevzuat.gov.tr/mevzuatmetin/1.5.5651.pdf
- **Silme, Yok Etme, Anonim Hale Getirme Yönetmeliği** (RG 28/10/2017, yürürlük 1/1/2018): https://kvkk.gov.tr/Icerik/5441/KISISEL-VERILERIN-SILINMESI-YOK-EDILMESI-VEYA-ANONIM-HALE-GETIRILMESI-HAKKINDA-YONETMELIK
- **Aydınlatma Tebliği** (RG 10/03/2018, 30356; değişiklik RG 28/4/2019, 30758): https://kvkk.gov.tr/Icerik/4132/aydinlatma-yukumlulugunun-yerine-getirilmesinde-uyulacak-usul-ve-esaslar-hakkinda-teblig
- **Kurul ilke kararı 2026/347**, Kurum duyurusu: https://kvkk.gov.tr/Icerik/8710/veri-sorumlulari-tarafindan-acik-riza-ve-aydinlatma-metinlerinin-ayri-ayri-duzenlenmesi-gerektigi-hakkinda-kisisel-verileri-koruma-kurulunun-18-02-2026-tarihli-ve-2026-347-sayili-ilke-kararina-iliskin-kamuoyu-duyurusu
- **VERBİS istisna kriteri, 2025/1572**, Kurum duyurusu: https://kvkk.gov.tr/Icerik/8388/KAMUOYU-DUYURUSU
- **Standart sözleşmeler, 2024/959**, Kurum duyurusu: https://kvkk.gov.tr/Icerik/7938/Standart-Sozlesmeler-ve-Baglayici-Sirket-Kurallarina-Iliskin-Dokumanlar-Hakkinda-Kamuoyu-Duyurusu
- **Bildirim modülü, 2024/1793**, Kurum duyurusu: https://kvkk.gov.tr/Icerik/8043/Standart-Sozlesme-Bildirim-Modulu-Hakkinda-Kamuoyu-Duyurusu
- **Yurt dışı aktarım sayfası**: https://kvkk.gov.tr/Icerik/2053/Yurtdisina-Aktarim
- **Yurt Dışına Aktarılması Rehberi**: https://kvkk.gov.tr/SharedFolderServer/CMSFiles/13711235-abb6-4b17-9a6b-0a68c1ad86c5.pdf
- **Özel Nitelikli Kişisel Verilerin İşlenmesine İlişkin Rehber** (Şubat 2025): https://kvkk.gov.tr/SharedFolderServer/CMSFiles/70f95c73-06a2-44dc-81e9-34201bdd7f5c.pdf
- **2026 idari para cezası tablosu**: https://kvkk.gov.tr/Icerik/8145/6698-sayili-kisisel-verilerin-korunmasi-kanunu-kapsaminda-idari-para-cezasi-tutarlari (PDF: https://kvkk.gov.tr/SharedFolderServer/CMSFiles/MTY5NTUyNTRkNDkxNGY.pdf)

### İddia iddia sonuç

| #   | Rapordaki iddia                                                                                                                                                                                                     | Sonuç                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | m.4/2 ilkeleri: hukuka ve dürüstlüğe uygunluk; belirli, açık, meşru amaç; bağlantılı, sınırlı ve ölçülü olma; mevzuattaki ya da amaç için gerekli süre kadar muhafaza                                               | **Birincil kaynakla doğrulandı** (6698 PDF, m.4/2-a…d)                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 2   | m.5/2-c, e, f'nin içeriği; f'de "temel hak ve özgürlüklere zarar vermemek kaydıyla" ve "zorunlu" şartı                                                                                                              | **Doğrulandı** (6698, m.5/2). c bendi "sözleşmenin kurulması veya ifasıyla doğrudan doğruya ilgili olması kaydıyla … gerekli olması" der; "doğrudan" vurgusu raporla aynı                                                                                                                                                                                                                                                                                                                                   |
| 3   | m.6, 7499 sonrası: kural yasak; istisnalar açık rıza, kanun, hayati, alenileştirme (iradeye uygun), hakkın tesisi, sağlık, istihdam, vakıf/dernek; Kurul'un yeterli önlemleri ayrıca şart; meşru menfaat m.6'da yok | **Doğrulandı** (6698, m.6/3-a…g ve m.6/4). Bent harfleri: alenileştirme **ç**, hakkın tesisi **d**. İkincil kaynaklardaki "d mi e mi" belirsizliği giderildi. Değişiklik tarihi 2/3/2024-7499/33                                                                                                                                                                                                                                                                                                            |
| 4   | Hakkın tesisi istisnasında her işlemde zorunluluk ayrıca tespit edilmeli; alternatif yöntem olmamalı                                                                                                                | **Doğrulandı**, Kurum'un Özel Nitelikli Veri Rehberi §2.5 (s. 42-43): "herhangi bir alternatif yöntemin bulunmaması". Kanun gerekçesindeki örnek: işverenin, açılması muhtemel davada savunma için eski işçinin sağlık verisini saklaması. B.2'deki "şikayetten önce genel saklama" sorusu için emsal niteliğinde, ama avukat sorusu olarak kalıyor                                                                                                                                                         |
| 5   | Yeterli önlemler Kurul 31.01.2018, 2018/10: gizlilik sözleşmesi, yetki kapsamı ve süresi, periyodik yetki kontrolü, işlem logu, uzaktan erişimde en az iki kademeli kimlik doğrulama                                | **Doğrulandı**, Özel Nitelikli Veri Rehberi s. 73-74 (2018/10'un aktarımı). Kararın kendisi ayrıca açılmadı                                                                                                                                                                                                                                                                                                                                                                                                 |
| 6   | m.7: işleme sebepleri kalkınca re'sen ya da talep üzerine silme                                                                                                                                                     | **Doğrulandı** (6698, m.7/1). Ek bilgi: m.17/2, silmeme hâlinde TCK m.138                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 7   | Periyodik imha aralığı en çok 6 ay; politikası olmayan 3 ay içinde siler; saklama ve imha politikası VERBİS'e kayıt yükümlüleri için zorunlu                                                                        | **Doğrulandı** (Yönetmelik m.5/1, m.5/3, m.11/2, m.11/3). İlk turdaki "28.10.2018" tarihi yanlıştı: RG **28/10/2017**                                                                                                                                                                                                                                                                                                                                                                                       |
| 8   | m.9 (7499 sonrası): yeterlilik kararı → uygun güvenceler (standart sözleşme dahil) → arızi hâller; standart sözleşme imzadan 5 iş günü içinde Kurum'a bildirilir                                                    | **Doğrulandı** (6698, m.9/1, /4-c, /5, /6). Ek şart: uygun güvencede ilgili kişinin aktarım ülkesinde de hak kullanma ve etkili kanun yolu imkânı bulunmalı (m.9/4). Yürürlük 01.06.2024 (Kurum, Icerik/2053)                                                                                                                                                                                                                                                                                               |
| 9   | Arızi aktarım: düzenli olmayan, tek ya da birkaç kez olan, süreklilik taşımayan, olağan faaliyet akışında olmayan; sürekli barındırma arızi değildir                                                                | **Doğrulandı**, Kurum Rehberi (Tanımlar, s. 9 civarı ve istisnai aktarım bölümü): "veri tabanına doğrudan erişim izni … düzenli ve süreklilik arz eden bir veri aktarımı"; "olağan faaliyet akışı içindeki aktarımlar istisnai aktarıma konu edilemez". Rehber ayrıca yurt dışındaki bulutta depolamayı ve üçüncü ülkeden destek amaçlı uzaktan erişimi de aktarım sayıyor. Üçüncü turda Yönetmelik m.16/1'in kendi metniyle de doğrulandı (#34)                                                            |
| 10  | Standart sözleşmeler Kurul ilanıyla dört tür; skall için VS→Vİ                                                                                                                                                      | **Doğrulandı**, 2024/959 (Icerik/7938): SS-1 VS→VS, SS-2 VS→Vİ, SS-3 Vİ→Vİ, SS-4 Vİ→VS. Rehber: sözleşme esasen Türkçe; yabancı dilde de yapılırsa Türkçe metin esas alınır                                                                                                                                                                                                                                                                                                                                 |
| 11  | Bildirim fiziki, KEP ya da modülle yapılır                                                                                                                                                                          | **Doğrulandı**, Kurul 17.10.2024, 2024/1793 (Icerik/8043; Yönetmelik m.14/5'e atıfla). Rehber'e göre bildirimi kimin yapacağı sözleşmede belirlenebilir, belirlenmezse veri aktaran bildirir                                                                                                                                                                                                                                                                                                                |
| 12  | Bildirim cezasının 2026 tutarı: 90.308–1.806.377 TL (ikincil)                                                                                                                                                       | **Birincil kaynak farklı diyor: 90.308 – 1.806.177 TL** (Kurum 2026 tablosu, m.18/1-d). Kanundaki taban tutar 50.000–1.000.000 TL (m.18/1-d, 7499/35)                                                                                                                                                                                                                                                                                                                                                       |
| 13  | m.10'un içeriği                                                                                                                                                                                                     | **Doğrulandı** (6698, m.10/1-a…d)                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 14  | Tebliğ: aydınlatma ile açık rıza ayrı; amaç belirli, açık, meşru; genel ve muğlak ifade yok; hukuki sebep açıkça yazılır                                                                                            | **Doğrulandı** (Tebliğ m.5/1-f, g, h). Rapora yeni etkisi olan bentler: **b** (amaç değişirse işleme başlamadan önce ayrıca aydınlatma), **e** (ispat veri sorumlusuna ait), **j** (eksik, yanıltıcı ve yanlış bilgi yasak)                                                                                                                                                                                                                                                                                 |
| 15  | 2026/347 ilke kararı var; başka işleme şartı varken açık rıza metni sunulmamalı; aydınlatma onaylatılmamalı                                                                                                         | **Doğrulandı** (Kurum duyurusu, Icerik/8710; tarih 18.02.2026). Kararın dediği: açık rıza dışındaki bir şarta dayanılıyorsa yalnız aydınlatma yapılır ve **ayrıca açık rıza metni sunulmaz**; ilgili kişiden yalnız okundu ve bilgi edinildi geri bildirimi alınır. Ek olarak: muğlak ifade yasağı ve örnek ("yurt dışına aktarım yapılmıyorken yapıldığı izlenimi uyandıran ifadeler"); m.11'in tamamını yazmak yerine kısa atıf önerisi; bu hususlar m.12/1 tedbiri sayılır ve aykırılıkta m.18 işletilir |
| 16  | `docs/decisions/yasal-metinler.md` kararı "hizmetin açık rızaya bağlanmasını geçersiz sayar ve başka şart varken açık rıza istenmesini yanıltıcı bulur" diye özetliyor                                              | **Birincil kaynak farklı diyor:** 2026/347 duyurusu açık rızanın hizmete bağlanmasından söz etmiyor ve rıza istemeyi "yanıltıcı" diye nitelemiyor. "Yanıltıcı" kelimesi aydınlatma metnindeki bilgiler için kullanılıyor. Ulaşılan sonuç (başka şart varken rıza metni sunulmaz) aynı; yalnız gerekçenin özeti düzeltilmeli                                                                                                                                                                                 |
| 17  | VERBİS eşikleri: 50 çalışan ve 100 milyon TL (ana faaliyeti özel nitelikli veri olmayan); 2025/1572 ile ana faaliyeti özel nitelikli veri olanlar için ayrı ölçüt                                                   | **Doğrulandı** (Kurum duyurusu, Icerik/8388): 2018/87 (50 çalışan, 25 milyon TL), 2023/1154 (bilanço 100 milyon TL), 04.09.2025 tarihli 2025/1572 (ana faaliyeti özel nitelikli veri olup **10'dan az çalışan ve 10 milyon TL'den az bilanço**). İkincil kaynaktaki "yalnız 10 çalışan" bilgisi eksikti; birincil metin iki ölçütü birlikte sayıyor                                                                                                                                                         |
| 18  | 2025/2393 (25.12.2025) uygulama esasları; 2026/1026 süre uzatımı                                                                                                                                                    | **Doğrulanamadı**: Kurum sayfası aranarak bulunamadı, yalnız ikincil kaynak var                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 19  | m.11 hakları ve m.13'teki 30 gün                                                                                                                                                                                    | **Doğrulandı** (6698, m.11/1-a…ğ; m.13/2)                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 20  | m.12 güvenlik yükümlülüğü                                                                                                                                                                                           | **Doğrulandı** (6698, m.12/1-a…c). Ek: m.12/2 veri işleyenle müşterek sorumluluk; m.12/4 öğrenilen veriyi açıklamama yükümlülüğü görevden ayrıldıktan sonra da sürer (gizlilik taahhüdünün dayanağı); m.12/5 ihlal "en kısa sürede" ilgiliye ve Kurul'a bildirilir                                                                                                                                                                                                                                          |
| 21  | İhlal bildiriminde 72 saat (Kurul 2019/10)                                                                                                                                                                          | **Doğrulanamadı** (karar açılmadı). Kanun metni yalnız "en kısa sürede" diyor                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 22  | m.28/2: bazı hâllerde m.10, m.11 (zarar giderimi hariç) ve m.16 uygulanmaz                                                                                                                                          | **Doğrulandı** (6698, m.28/2-a…ç). Şikayet incelemesi için ilgili olabilecek tek bent (a): "suç işlenmesinin önlenmesi veya suç soruşturması için gerekli olması". Sıradan kural ihlali moderasyonunun buna girip girmediği avukat sorusudur                                                                                                                                                                                                                                                                |
| 23  | 5651 m.5/3: yer sağlayıcı trafik bilgisini 1 yıldan az, 2 yıldan çok olmamak üzere yönetmelikte belirlenecek süre kadar saklar                                                                                      | **Doğrulandı** (5651, m.5/3, 6518/88). Yönetmeliğin RG 30.11.2007 ilk metni 6 ay diyor (#39); güncel metin doğrulanamadı                                                                                                                                                                                                                                                                                                                                                                                    |
| 24  | 5651'de içerik saklama zorunluluğu yok                                                                                                                                                                              | **Doğrulandı**, kanun metni düzeyinde: güncel 5651'de "sakla-" geçen iki yükümlülük var ve ikisi de trafik bilgisi içindir (m.5/3 yer sağlayıcı; m.6/1-b erişim sağlayıcı, 6 ay–2 yıl). m.5/1: yer sağlayıcı içeriği kontrol etmekle ve hukuka aykırılığı araştırmakla yükümlü değildir. Yönetmeliklerde içerik saklama hükmü olup olmadığı **doğrulanamadı**                                                                                                                                               |
| 25  | DM'nin 5651 anlamında "yayın" olup olmadığı avukat sorusu                                                                                                                                                           | **Birincil kaynak yönü gösteriyor:** 5651 m.2/1-ğ: "İnternet ortamında yapılan yayın: İnternet ortamında yer alan ve **içeriğine belirsiz sayıda kişilerin ulaşabileceği** verileri"; m.2/1-g "internet ortamı"nı haberleşme dışında kalan ve kamuya açık ortam olarak tanımlıyor. İki arkadaş arasındaki DM bu tanıma uymuyor görünüyor; kesin nitelendirme yine avukatta                                                                                                                                  |
| 26  | Sosyal ağ sağlayıcı yükümlülükleri 1 milyon günlük erişim eşiğine bağlı                                                                                                                                             | **Birincil kaynak kısmen farklı diyor:** ek m.4'ün 1, 3, 4, 6 ve 9. fıkraları eşiğe bağlı. Ama **ek m.4/7 (7578/22, 22.4.2026) eşiksizdir:** "Sosyal ağ sağlayıcı, onbeş yaşını doldurmamış çocuklara hizmet sunamaz ve … yaş doğrulama dâhil gerekli tedbirleri almakla yükümlüdür". skall sosyal ağ sağlayıcı tanımına (m.2/1-s) girerse bu hüküm uygulanabilir. skall zaten 18+                                                                                                                          |
| 27  | (Yeni bulgu) 5651'e 22.4.2026'da "oyun" (m.2/1-ş) ve "oyun platformu" (m.2/1-ü) tanımları ile ek m.5 eklendi                                                                                                        | **Birincil kaynakla doğrulandı** (5651, 7578/21, 23): oyun platformu derecelendirilmemiş oyun sunamaz (ya da en yüksek yaşa göre derecelendirir); ebeveyn kontrol araçları; günlük erişimi 100 binin üstündeki yurt dışı kaynaklı platforma temsilci; Kurum'a 15 gün içinde bilgi verme; idari para cezası 1–10 milyon TL, sonra 10–30 milyon TL. skall'ın "kullanıcılar arası etkileşimi sağlayan" bir oyun platformu sayılıp sayılmadığı → **avukat** (DM sürümleri konusunun dışında ama yeni ve önemli) |
| 28  | Meşru menfaat denge testi (Kurul Uygulama Rehberi)                                                                                                                                                                  | **Doğrulanamadı**: Kurum'un rehberi bu turda açılmadı. Kanun metni (m.5/2-f) "zarar vermemek kaydıyla" ve "zorunlu" şartlarını doğruluyor; üç aşamalı test yalnız ikincil kaynakta                                                                                                                                                                                                                                                                                                                          |
| 29  | Kişisel Veri Güvenliği Rehberi tedbirleri (gizlilik taahhüdü, yetki matrisi, log)                                                                                                                                   | **Rehberin kendisi doğrulanamadı.** Aynı tedbirler 2018/10 listesinde birincil kaynakla doğrulandı (#5); kanuni dayanak m.12/1 ve m.12/4                                                                                                                                                                                                                                                                                                                                                                    |
| 30  | Almanya ya da AB için yeterlilik kararı                                                                                                                                                                             | **Doğrulanamadı**: Kurum sayfalarında ve aramada yeterlilik kararı bulunamadı. "Yok" diye kesinleştirilemedi                                                                                                                                                                                                                                                                                                                                                                                                |
| 31  | İdari para cezası, 2026 (bağlam)                                                                                                                                                                                    | **Doğrulandı** (Kurum 2026 tablosu): aydınlatma (m.18/1-a) 85.437–1.709.200 TL; veri güvenliği (b) 256.357–17.092.242 TL; VERBİS (ç) 341.809–17.092.242 TL; standart sözleşme bildirimi (d) 90.308–1.806.177 TL                                                                                                                                                                                                                                                                                             |

### Üçüncü tur: Resmî Gazete (16 Kasım 2026)

**Erişim:**

- `https://www.resmigazete.gov.tr/eskiler/2024/07/20240710-2.htm`: ilk denemede `(35) Connection reset`, 30 sn sonra **açıldı** (RG 10 Temmuz 2024, Sayı 32598). www'siz adres iki denemede de `(35) Connection reset` verdi.
- 5651 yönetmeliği `https://www.resmigazete.gov.tr/eskiler/2007/11/20071130-6.htm`: ilk denemede reset, 30 sn sonra **açıldı** (RG 30 Kasım 2007, Sayı 26716).
- `https://www.resmigazete.gov.tr/eskiler/2007/10/20071024.htm`: `(35) Connection reset`; yeniden denenmedi, çünkü aradığım yönetmelik 30.11.2007 sayısında bulundu.

**Kişisel Verilerin Yurt Dışına Aktarılmasına İlişkin Usul ve Esaslar Hakkında Yönetmelik** (kendi metni) ile #8-11 iddiaları:

| #   | İddia                                                        | Sonuç                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| --- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 32  | Standart sözleşme Kurul metninden değiştirilmeden kullanılır | **Birincil kaynakla doğrulandı.** Yön. m.14/2: sözleşme Kurul tarafından belirlenip ilan edilir. m.14/3: "üzerinde herhangi bir değişiklik yapılmaksızın kullanılması zorunludur"; yabancı dilde de akdedilirse Türkçe metin esas alınır. m.14/7: metinde değişiklik yapılması ya da tarafların geçerli imzasının eksik olması hâlinde Kurul, Kanun m.15'e göre inceleme yapar                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 33  | İmza; 5 iş günü içinde bildirim; kim, nasıl                  | **Doğrulandı ve genişletildi.** m.14/4: sözleşme aktarımın tarafları arasında akdedilir ve taraflarca ya da temsile ve imzaya yetkili kişilerce imzalanması zorunludur. m.14/5: imzaların tamamlanmasından itibaren 5 iş günü içinde fiziki olarak, KEP ile ya da Kurul'un belirlediği diğer yöntemlerle (modül, 2024/1793) bildirim; taraflar bildirimi kimin yapacağını sözleşmede belirleyebilir, belirlemezlerse **veri aktaran** (skall) bildirir. **İlk raporda olmayan:** m.14/6: bildirime imzalayanların yetkili olduğunu tevsik eden belgeler ile **yabancı dildeki her belgenin noter onaylı çevirisi** eklenir. m.14/8: taraflarda ya da sözleşmedeki bilgilerde değişiklik olursa ya da sözleşme sona ererse aynı usulle yeniden bildirim yapılır                                                                                                                                             |
| 34  | Arızi aktarım şartları                                       | **Doğrulandı.** Yön. m.6/2 ve m.16/1: yalnız yeterlilik kararı yoksa **ve** m.10'daki uygun güvencelerden hiçbiri sağlanamıyorsa, arızi olmak kaydıyla ve yalnız m.16/2'deki hâllerde. Tanım (m.16/1): "Düzenli olmayan, tek veya birkaç sefer gerçekleşen, süreklilik arz etmeyen ve olağan faaliyet akışı içinde bulunmayan aktarımlar arızi niteliktedir". Hâller (m.16/2-a…f) Kanun m.9/6 ile aynı; (a) açık rıza için ilgili kişinin muhtemel riskler hakkında bilgilendirilmesi şart. Sonuç değişmedi: Supabase, Sentry, PostHog ve Expo'ya sürekli aktarım arızi sayılmaz                                                                                                                                                                                                                                                                                                                           |
| 35  | Veri işleyene ve alt işleyene aktarım                        | **Doğrulandı, kısmen birincil metin farklı.** m.4/1-e: "aktarım" yurt dışındaki bir veri sorumlusu **veya veri işleyene** iletmek ya da erişilebilir kılmaktır; yani yurt dışındaki işleyene aktarım da kapsamdadır. m.5/1: işleyen aktarırsa veri sorumlusunun talimatlarına da uymak zorundadır. m.5/2: hüküm **sonraki aktarımlar** için de uygulanır (yurt dışındaki işleyenin alt işleyenine aktarımı dahil). m.7/2: işleyenin aktarması veri sorumlusunun sorumluluğunu kaldırmaz; veri sorumlusu işleyenin teknik ve idari tedbirleri almasını sağlamakla yükümlüdür. m.7/3: bildirim yükümlüsü işleyense talimat beklemeden bildirir. Yönetmelikte "alt işleyen" diye ayrı bir başlık **yok**; alt işleyen zinciri m.5/2 (sonraki aktarım) ile Rehber'deki "Alt Veri İşleyen" tanımı ve SS-3 (Vİ→Vİ) üzerinden yürür. SS-2'nin alt işleyen hükümleri bu turda açılmadı (sözleşme dosyası okunmadı) |
| 36  | Yeterlilik kararı hükmü                                      | **Doğrulandı.** m.6/1-a, m.8, m.9: Kurul bir ülke, ülkedeki bir ya da daha fazla sektör ya da uluslararası kuruluş için karar verebilir; ölçütler m.8/1-a…e (karşılıklılık, mevzuat, bağımsız denetim kurumu, uluslararası sözleşmeler, üyelikler); kararlar Resmî Gazete'de ve Kurum sitesinde yayımlanır (m.8/4); en geç 4 yılda bir yeniden değerlendirilir (m.9/1)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 37  | Herhangi bir ülke için yeterlilik kararı yayımlanmış mı      | **Doğrulanamadı.** Resmî Gazete'de ve kvkk.gov.tr'de aranabilir bir liste bulunamadı (site araması yok). İkincil kaynak (EY, 2025): liste henüz yayımlanmamış. "Karar yok" diye kesinleştirilmedi; avukatta                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 38  | Uygun güvenceler listesi (m.10)                              | **Doğrulandı**: (a) kamu kurumları arası anlaşma ve Kurul izni, (b) bağlayıcı şirket kuralları ve Kurul onayı, (c) standart sözleşme, (ç) taahhütname ve Kurul izni. m.15/3: taahhütnamede aktarım ancak Kurul izninden sonra başlar                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 39  | 5651 yönetmeliğinde yer sağlayıcı trafik bilgisi süresi      | **Birincil metin kanundan farklı diyor.** İnternet Ortamında Yapılan Yayınların Düzenlenmesine Dair Usul ve Esaslar Hakkında Yönetmelik'in RG 30.11.2007'deki **ilk metni**: yer sağlayıcı trafik bilgisini "**altı ay** saklamakla" yükümlü (ilgili madde 1-c). Tanımı: kaynak ve hedef IP, bağlantı tarihi ve saati, istenen sayfa adresi, işlem bilgisi (GET, POST), sonuç bilgileri. Ama kanun m.5/3 (6518, 2014) yönetmelikle belirlenecek sürenin "bir yıldan az" olamayacağını söylüyor. Yönetmeliğin 2014 sonrasında değiştirilip değiştirilmediği ve güncel süre **doğrulanamadı**: yalnız ilk RG metni açıldı, mevzuat.gov.tr'deki güncel metin bulunamadı. Uygulanacak süre (kanunun 1-2 yıl alt sınırı mı, yönetmeliğin 6 ayı mı) avukatta. Metinlerdeki "giriş kayıtları en fazla 2 yıl" ifadesi kanunun üst sınırıyla uyumlu                                                                 |

**Proje sahibinin yapacağı aktarım işlemi (birincil kaynaklara göre):**

1. Her yurt dışı veri işleyen için türü seç: skall veri sorumlusu, sağlayıcı veri işleyen → **SS-2 (VS→Vİ)** (Kurul 2024/959, Icerik/7938).
2. Kurul metnini **hiç değiştirmeden** doldur; ekler: veri kategorileri, amaçlar, alıcılar, teknik ve idari tedbirler (Yön. m.14/1, m.14/3).
3. İki taraf ya da yetkili temsilcileri imzalasın; imza tarihleri metinde yazılı olsun (m.14/4; Rehber).
4. Son imzadan itibaren **5 iş günü içinde** Kurum'a bildir: Standart Sözleşme Bildirim Modülü, KEP ya da fiziki. Bildirime imza yetkisini tevsik eden belgeler ve yabancı dildeki her belgenin **noter onaylı çevirisi** eklenir. Sözleşmede başka bir belirleme yoksa bildirimi veri aktaran (skall) yapar (Kanun m.9/5; Yön. m.14/5-6).
5. Taraf, bilgi ya da sona erme değişikliğinde aynı usulle yeniden bildir (m.14/8).
6. Bildirmemenin 2026 cezası 90.308–1.806.177 TL (m.18/1-d; Kurum tablosu).
7. Sağlayıcı SS-2'yi imzalamazsa elde kalan yollar: taahhütname ve Kurul izni (m.15; izinden önce aktarım başlamaz) ya da sağlayıcı değişikliği. Arızi istisna sürekli barındırmayı karşılamaz (m.16/1) → avukat.

### Önerilerde değişiklik

- **İşleme şartı: değişmedi.** Ana şart m.5/2-f, şikayet kopyasında m.5/2-e. Kanun metni doğruladı.
- **Açık rıza: değişmedi, daha güçlü dayanakla.** 2026/347 birincil metinle açık: başka şart varken açık rıza metni sunulmaz. Rıza kutusu yok.
- **Süreler (7 gün sürüm, 30 gün şikayet ve yaptırımda karardan 30 gün): değişmedi.** Mevzuatta içerik için zorunlu süre bulunmadığı kanun metni düzeyinde doğrulandı. Silme Yönetmeliği'nin 6 ay ve 3 ay üst sınırlarının çok altında kalıyor.
- **Özel nitelikli veri: kanıt güçlendi, risk değişmedi.** m.6/3-d "zorunlu" ve "alternatif yöntem yok" ölçütüne bağlı. Şikayetten önceki genel saklama bu ölçütü karşılamayabilir. 7 günlük kısa süre ve erişim kısıtı riski azaltır; kesin değerlendirme avukatta.
- **Güvenlik tedbirleri (B.5): güçlendirildi.** 2018/10 listesindeki tedbirler moderasyon erişimi için asgari çıta olarak eklendi: gizlilik sözleşmesi, kullanıcı başına yetki kapsamı ve süresi, periyodik yetki kontrolü, işlem logu, secret key ile uzaktan erişimde en az iki kademeli kimlik doğrulama.
- **Aydınlatma zamanlaması (yeni):** Tebliğ m.5/1-b'ye göre yeni işleme amacı için aydınlatma, işleme başlamadan önce yapılmalı. Metin güncellemesi ve onay sürümü artışı özellikle aynı yayında, sürüm saklama açılmadan önce gitmeli.
- **Metin taslakları: değişmedi.** İki küçük öneri eklendi:
  1. Aydınlatma metni §6, m.11'in tamamını sayıyor (`kvkk-aydinlatma-metni.md:62-74`). 2026/347 kısa atıf öneriyor. Zorunlu değil, ilke kararı örneği.
  2. Aktarım cümlesi (`kvkk-aydinlatma-metni.md:40`, `gizlilik-politikasi.md:105`) standart sözleşme fiilen yapılmadıysa Tebliğ m.5/1-j ve 2026/347 anlamında "yanlış bilgi" riski taşır. Öncelik yükseldi: ya sözleşmeler imzalanıp bildirilir ya cümle düzeltilir.

Değerlendirilen değişiklik: DM mesajı gönderimden sonra 15 dk içinde en çok 5 kez düzenlenebilir; ilk hâli ve ara sürümleri yalnız şikayet incelemesi için istemciye kapalı bir sunucu tablosunda saklanır; şikayet edilirse sürümler `reports`'a kopyalanır; moderasyonu küçük bir ekip geliştirici kabuğundan `pnpm admin:*` ile yapar.

---

## A. Repodan doğrulananlar

### A.1 Yasal metinlerin kaynağı

- Kaynak dosyalar: `docs/legal/gizlilik-politikasi.md`, `docs/legal/kvkk-aydinlatma-metni.md`, `docs/legal/hesap-silme.md`, `docs/legal/kullanim-kosullari.md`, `docs/legal/topluluk-kurallari.md`, `docs/legal/cocuk-guvenligi.md`.
- Üretim: `pnpm site:build` bunları `site/`'e koyar (`docs/OPS.md:13`, `:38`). Uygulama aynı metinleri `scripts/site/legal-docs.ts` → `apps/mobile/src/i18n/legalDocs.generated.ts` ile okur. Metnin anlamı değişirse `consent.ts`'teki onay sürümü artar (`docs/OPS.md:38`).
- Yer tutucular (`{{APP_NAME}}`, `{{CONTROLLER_NAME}}`, `{{EFFECTIVE_DATE}}` …) `supabase/functions/_shared/pure/legalEntity.ts`'ten gelir. **`controllerName: ''`**: veri sorumlusunun adı boş, `kep` ve `postalAddress` de boş. Bu yüzden metinler bugün her yerde "taslak" notuyla görünür (`legalReady`). `effectiveDate: '12 Kasım 2026'`.
- Karar kaydı: `docs/decisions/yasal-metinler.md` (12 Kasım 2026).

### A.2 Metinler bugün ne söylüyor

**DM:**

- `gizlilik-politikasi.md:50`: "Arkadaşlar arası mesajlar, tepkileri ve son okunma zamanı | Mesajlaşma | Arkadaşlık bitene ya da hesap silinene kadar".
- `kvkk-aydinlatma-metni.md:24`: arkadaşlar arası mesajlar, "Sözleşmenin ifası (m. 5/2-c)".
- `kvkk-aydinlatma-metni.md:52`: "Arkadaşlar arası mesajlar arkadaşlık bittiğinde ya da hesap silindiğinde silinir."
- `gizlilik-politikasi.md:88`: her konuşmanın son 50 mesajı telefonda tutulur.
- Düzenleme ve "Sohbeti sil" hiçbir yasal metinde geçmiyor.

**Şikayet:**

- `gizlilik-politikasi.md:52`: "Şikayet kayıtları (sebep; şikayet anındaki son 50 mesajın, şikayet edilen fotoğrafın, profilin adı ve tanıtım yazısının, oyun geçmişi kaydının ya da oyunda yazılan sorunun kopyası) | Güvenlik ve moderasyon | 30 gün".
- `kvkk-aydinlatma-metni.md:25`: güvenlik kayıtları (şikayet ve ekli içerik kopyaları) için "Meşru menfaat (m. 5/2-f); bir hakkın tesisi, kullanılması ya da korunması (m. 5/2-e)".
- `kvkk-aydinlatma-metni.md:51`: "Şikayet kayıtları 30 gün sonra silinir."
- `hesap-silme.md:42`: şikayetler "oluşturulduktan sonra 30 gün saklanır, sonra silinir."
- `kullanim-kosullari.md:56`: "Şikayetleri en geç 24 saat içinde inceleriz." `:58`: hesapla ilgili karara e-postayla itiraz edilebilir (süre yazılmamış).
- `topluluk-kurallari.md:41`: "Şikayet ettiğiniz kişi sizin şikayet ettiğinizi öğrenmez."

**Saklama süreleri:** `kvkk-aydinlatma-metni.md:50-56`, `gizlilik-politikasi.md:28-57`. Yedekler: `kvkk-aydinlatma-metni.md:55` ve `hesap-silme.md:48`: "Veritabanı yedeklerindeki kopyalar 7 gün içinde kendiliğinden silinir."

**Aktarım ve veri işleyenler:**

- `gizlilik-politikasi.md:94-103`: Supabase (AWS; Almanya, Frankfurt), Netgsm (Türkiye), Expo, FCM ve APNs (ABD), PostHog (Almanya), Sentry (Almanya), OpenFreeMap, Cloudflare ve Google Fonts, Zoho (yurt dışı).
- `gizlilik-politikasi.md:105` ve `kvkk-aydinlatma-metni.md:40`: "Yurt dışına aktarım, KVKK'nın 9. maddesi uyarınca Kişisel Verileri Koruma Kurulu'nun ilan ettiği standart sözleşmeyle sağlanan uygun güvencelere dayanır."
- `kvkk-aydinlatma-metni.md:38` listesinde Cloudflare, Google Fonts ve Zoho **yok**; gizlilik politikasında var.

**Hukuki sebepler:** `kvkk-aydinlatma-metni.md:17-28`. `:30`: "Hiçbir işleme faaliyetimiz açık rızanıza dayanmaz; bu yüzden sizden açık rıza istemeyiz." Gerekçe `docs/decisions/yasal-metinler.md`'de: Kurul ilke kararı 2026/347 (18.02.2026). Bu karar ikincil kaynakla doğrulandı, aşağıda B.3'e bakın.

**Güvenlik:** `gizlilik-politikasi.md:118`: "Kendi sunucu kayıtlarımıza telefon numarası, konum ya da mesaj içeriği yazılmaz." `:61`: özel nitelikli veri istenmez, "profilinize ve mesajlarınıza bu tür bilgileri yazmamanızı öneririz".

### A.3 Kodda `reports`

- Tablo: `supabase/migrations/20260928090000_chat_and_safety.sql:86-98`. RLS açık, `anon` ve `authenticated`'tan bütün yetkiler alınmış. `reporter_id` ve `reported_user_id`, `auth.users`'a `on delete set null` ile bağlı.
- Silme: `private.delete_old_reports()` (`:279-291`): `delete from public.reports where created_at <= now() - interval '30 days'`. Saatlik pg_cron (`:298`). Fonksiyon sonradan yeniden tanımlanmamış (`git grep`).
- **Süre şikayetin oluşturulduğu andan (`created_at`) sayılıyor ve `status`'a bakılmıyor.** İncelenmemiş (`open`) şikayet de, yaptırıma yol açmış şikayet de 30. günde silinir.
- Fotoğraf ve kapak kopyaları satırın içinde `bytea` olarak durur (`photo_copy`, `cover_copy`), satırla birlikte silinir.
- DM şikayeti `private.dm_snapshot` ile son 50 mesajı kopyalar (`20261217090000_dm_manage.sql:290-313`): `from` (reporter/reported), `body`, `created_at`, `edited`, `edited_at`. Yorum: "the text is the one at the report; an earlier text is not kept".
- Bugünkü düzenleme: `public.dm_edit` (`20261217090000_dm_manage.sql:214-274`), 15 dk pencere, "the old text is not kept". `docs/SPEC_V4.md` §4.X "Düzenle": "Eski metin saklanmaz … Açık ürün riski: … bildirilmeden önce düzenlenen mesajın ilk metni şikayet kaydına giremez". Sınır kişi başına 60 sn'de 10 düzenleme (`DM_EDIT_RATE`); **mesaj başına 5 sınırı bugün yok**.
- Push metin taşımaz: `supabase/functions/_shared/pure/push.ts:40` → `dmPush()` "Yeni bir mesajın var". Yani mesajın ilk metni Expo'ya gitmez.
- **Metin ile kod örtüşüyor:** metinlerdeki 30 gün ile kod aynı ve iki yerde de "oluşturulduktan sonra" sayılıyor.

### A.4 Moderasyon erişimi

- `scripts/admin-reports.ts` ve `scripts/admin/reports.ts`: `SUPABASE_URL` ve `SUPABASE_SECRET_KEY` ile bütün veritabanına erişen bir istemci. `list [all]` ve `done <id>` var. `done` yalnız `status = 'reviewed'` yazar; **kim, ne zaman inceledi kaydı tutulmaz**, erişim günlüğü (okuma logu) yok. Yorum: "the list is read at least weekly". Bu, Kullanım Koşulları'ndaki "en geç 24 saat" taahhüdünden zayıf bir iç kural.
- Secret key tam yetkilidir; satır düzeyinde moderatör rolü ve "yalnız şikayeti görür" sınırı yok.

### A.5 Hesap silme

- Uygulama ve `pnpm admin:delete` aynı yolu izler (`scripts/admin/account.ts`): masayı bitirir, fotoğrafları siler, PostHog silmeyi kuyruğa alır, `auth.admin.deleteUser`. Hesaba bağlı satırlar cascade ile silinir.
- DM: `dm_messages.sender_user_id … on delete cascade`, `dm_threads` → `friendships` cascade (`20261005090000_friends_dm.sql:97-110`). Hesap silinince ya da arkadaşlık bitince (engel dahil) konuşma ve mesajlar silinir. Metinle örtüşüyor.
- Şikayetler: `on delete set null`. Kimlik bağı kopar, kopya (mesaj metinleri, profil adı ve tanıtım yazısı) 30 gün kalır. `hesap-silme.md:42` bunu söylüyor, yani örtüşüyor.
- Yedekler: 7 gün iddiası üretimin **Pro planda** olmasına bağlı (`docs/OPS.md:63`, `:71`). Üretim projesinin planı repodan doğrulanamadı.
- **Yeni tablo için:** sürüm satırları mesaja (`dm_messages`) `on delete cascade` ile bağlanırsa hesap silmede, arkadaşlığın bitmesinde ve engelde kendiliğinden gider. Şikayete kopyalanan sürümler 30 gün kalır.

### A.6 Kurumsal işlemlerin repodaki kanıtı

| İşlem                                                         | Repoda                                                                                                                                        | Durum                                                                     |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Supabase bölgesi Frankfurt `eu-central-1`                     | `docs/OPS.md:19`, `:71` (kurulum talimatı)                                                                                                    | Talimat var; üretim projesinin gerçekten orada açıldığı **doğrulanamadı** |
| PostHog AB                                                    | `docs/OPS.md`: `EXPO_PUBLIC_POSTHOG_HOST` varsayılanı AB                                                                                      | Proje bölgesi **doğrulanamadı**                                           |
| Sentry Frankfurt                                              | Kanıt yok                                                                                                                                     | **Doğrulanamadı**                                                         |
| Sağlayıcılarla DPA                                            | Kanıt yok                                                                                                                                     | **Doğrulanamadı**                                                         |
| KVKK standart sözleşmesi ve Kurum'a 5 iş günü içinde bildirim | `docs/decisions/yasal-metinler.md` → "Metinlerin doğru kalması için açık işler" madde 1: "imzalanır ve … bildirilir" (gelecek zaman, açık iş) | **Yapılmamış görünüyor**, metinler ise yapılmış gibi yazıyor              |
| VERBİS                                                        | Hiç geçmiyor                                                                                                                                  | **Doğrulanamadı**                                                         |
| Saklama ve imha politikası, kişisel veri envanteri            | Yok                                                                                                                                           | **Doğrulanamadı**                                                         |
| Moderatör gizlilik taahhüdü, yetki matrisi, erişim logu       | Yok                                                                                                                                           | **Doğrulanamadı**                                                         |
| Veri sorumlusunun adı, KEP ve adres                           | `legalEntity.ts`: boş                                                                                                                         | **Eksik**                                                                 |
| Giriş kayıtlarının 2 yılda silinmesi                          | `yasal-metinler.md` madde 3: "(silen iş yok)"; `auth.audit_log_entries` için iş yok                                                           | **Eksik**                                                                 |
| PostHog 1 yıl ve Sentry 90 gün saklama ayarı                  | `yasal-metinler.md` madde 3: panel ayarı                                                                                                      | **Doğrulanamadı**                                                         |
| Hukukçu kontrolü (5651 yer sağlayıcılık, trafik kaydı)        | `yasal-metinler.md` madde 5: açık iş                                                                                                          | **Yapılmamış**                                                            |

---

## B. Değerlendirme

### B.1 İşleme şartı (m.5) ve açık rıza

**Kaynakla desteklenen:**

- 6698 m.5/2: (c) bir sözleşmenin kurulması ya da ifasıyla doğrudan ilgili olması; (e) bir hakkın tesisi, kullanılması ya da korunması için zorunlu olması; (f) ilgili kişinin temel hak ve özgürlüklerine zarar vermemek kaydıyla, veri sorumlusunun meşru menfaati için zorunlu olması. Metin [ikincil, Lexpera kanun metni]: https://www.lexpera.com.tr/mevzuat/kanunlar/kisisel-verilerin-korunmasi-kanunu-6698
- Meşru menfaat dengesi: menfaat etkin, belirli ve hâlihazırda var olmalı; varsayımsal menfaat yetmez; zorunluluk ayrı bir şarttır; menfaat güçlü değilse ilgili kişinin hakları üstün gelir [ikincil, Cottgroup "Veri işlemede veri sorumlusunun meşru menfaati", Kurul yayınına atıfla]: https://cottgroup.com/tr/blog/kvkk-gdpr/item/veri-islemede-veri-sorumlusunun-mesru-menfaati . Kurul'un uygulama rehberindeki üç aşamalı test: https://ktun.edu.tr/… (Kurum'un "KVKK'ya İlişkin Uygulama Rehberi" kopyası) [ikincil kopya].
- Başka bir işleme şartı varken açık rıza istenmemeli; aydınlatma ile açık rıza ayrı olmalı. Kurul ilke kararı 18.02.2026, 2026/347 [ikincil]: https://www.lexpera.com.tr/mevzuat/kurul-kararlari/kisisel-verileri-koruma-kurulunun-18-02-2026-tarihli-ve-2026-347-sayili-karari-2026-347-1 ; https://www.alomaliye.com/2026/03/24/kvkkdan-yeni-ilke-karari-acik-riza-metni-ile-aydinlatma-metni-artik-ayri-duzenlenmeli/

**Değerlendirme (öneri):**

- **Ana şart: m.5/2-f (meşru menfaat).** Taciz ve tehdidin düzenlemeyle gizlenmesini önlemek ve şikayetleri doğru incelemek, kullanıcı güvenliğine yönelik somut ve hâlihazırda var olan bir menfaattir. Denge lehine: saklama süresi kısa; tablo istemciye kapalı; okuma yalnız şikayet olunca, yalnız ilgili 50 mesajlık pencere için; mesajın alıcısı ilk hâli zaten görmüş olabilir; düzenleyen kişi ilk hâlin saklandığından aydınlatılır. **Denge testinin yazılı tutulması** önerilir (Kurul incelemesinde ispat için).
- **Yardımcı şart: m.5/2-e.** Şikayet kaydına kopyalandıktan sonra, yaptırım ve itiraz süreci ile olası hukuki uyuşmazlıkta delil için. Mevcut aydınlatma metni de güvenlik kayıtlarını bu ikisine dayandırıyor (`kvkk-aydinlatma-metni.md:25`), yani yeni bir hukuki sebep gerekmiyor, yalnız kapsam genişliyor.
- **m.5/2-c (sözleşme) zayıf:** sürümleri saklamak mesajlaşma hizmetinin ifası için "doğrudan" gerekli değil. Ana şart olarak önerilmez.
- **Açık rıza gerekmez ve istenmemeli.** Saklama düzenleme özelliğinin koşulu olacağından rıza "özgür" sayılmaz; 2026/347'ye göre başka şart varken rıza istemek de yanıltıcıdır. Bilgilendirme yeterlidir. Bu, mevcut "Hiçbir işleme açık rızaya dayanmaz" çizgisiyle uyumlu.
- Alıcının (karşı tarafın) verisi: sürümler yalnız düzenleyenin metni, ama içerik üçüncü kişileri de (alıcı dahil) anabilir. Aynı meşru menfaat kapsamındadır.

### B.2 Özel nitelikli veri riski (m.6, 7499 sonrası)

**Kaynakla desteklenen:** 7499 sayılı Kanun (RG 12.03.2024, 32487) m.6'yı değiştirdi. Özel nitelikli verinin işlenmesi kural olarak yasaktır; istisnalar arasında açık rıza, kanunlarda açıkça öngörülme, fiilî imkânsızlıkta hayatın korunması, **ilgili kişinin kendisinin alenileştirmesi (alenileştirme iradesine uygun olarak)**, **bir hakkın tesisi, kullanılması ya da korunması için zorunluluk**, sağlık, istihdam ve vakıf/dernek hâlleri sayılır. Kurul'un belirlediği yeterli önlemler ayrıca aranır. Yürürlük tarihi (1 Haziran 2024) ikincil kaynaklarda geçiyor [ikincil]: https://www.erdem-erdem.av.tr/bilgi-bankasi/kisisel-verilerin-korunmasi-kanununda-degisiklik ; https://hukukcularevi.com/ozel-nitelikli-kisisel-veriler-kvkk-6/ ; Kurum rehberi: https://www.kvkk.gov.tr/Icerik/8184/Ozel-Nitelikli-Kisisel-Verilerin-Islenmesine-Iliskin-Rehber (açılamadı).

**Değerlendirme:**

- Meşru menfaat m.6'da **yoktur**. Kişi silinen ya da düzenlenen ilk metinde sağlığından, cinsel yaşamından ya da dininden söz ettiyse, sürümün saklanması m.5/2-f ile değil, m.6 istisnalarıyla açıklanmak zorundadır. Özel bir DM alenileştirme sayılmaz. Şikayetten sonraki kopya için "bir hakkın tesisi, kullanılması ya da korunması" (m.6) savunulabilir; şikayetten önceki, ileride şikayet gelebilir diye yapılan genel saklama için bu zorunluluğun kurulup kurulamayacağı belirsizdir → **avukat**.
- Riski azaltan tasarım (öneri): kısa süre; içeriğe otomatik tarama yok; sürüm tablosuna şikayet dışında kimse bakmaz (bunu teknik olarak da kapatın; bkz. B.4); bağımsız arama ve dışa aktarma yok.
- Metinlerdeki "Özel nitelikli kişisel veri … istemeyiz ve işlemeyiz" (`kvkk-aydinlatma-metni.md:30`) mutlak bir iddiadır; mesaj içeriğinde kendiliğinden geçebileceğinden "istemeyiz; yazdığınız mesajda geçerse …" diye yumuşatılması önerilir (C bölümü).

### B.3 Saklama süresi

**Kaynakla desteklenen:**

- m.4/2: hukuka ve dürüstlük kuralına uygunluk; belirli, açık ve meşru amaç; amaçla bağlantılı, sınırlı ve ölçülü olma; mevzuatta öngörülen ya da amacın gerektirdiği süre kadar muhafaza. m.7: işleme şartları ortadan kalkınca re'sen ya da talep üzerine silme [ikincil, Lexpera kanun metni, yukarıdaki URL].
- Kişisel Verilerin Silinmesi, Yok Edilmesi veya Anonim Hale Getirilmesi Hakkında Yönetmelik (RG 28/10/2017; **birincil kaynakla doğrulandı**, m.5, m.11; bkz. §0 #7): saklama ve imha politikası hazırlamakla yükümlü olanlar periyodik imhayı politikada belirler, aralık **6 ayı geçemez**; politikası olmayanlar imha yükümlülüğü doğduktan sonra **3 ay** içinde siler. Politika, VERBİS'e kayıt yükümlüsü veri sorumluları için zorunludur [ikincil]: https://www.kvkk.gov.tr/Icerik/5441/KISISEL-VERILERIN-SILINMESI-YOK-EDILMESI-VEYA-ANONIM-HALE-GETIRILMESI-HAKKINDA-YONETMELIK (açılamadı; özet arama sonucundan); https://www.harbiyehukuk.com/veri-saklama-ve-imha-politikasi/
- 5651 m.5/3: yer sağlayıcı, **trafik bilgisini** 1 yıldan az, 2 yıldan çok olmamak üzere saklar. 5651 m.5/1'e göre yer sağlayıcı barındırdığı içeriği kontrol etmekle ve hukuka aykırılığını araştırmakla yükümlü değildir [ikincil, kanun metni kopyaları]: https://aile.gov.tr/uploads/chgm/uploads/pages/kanunlar/5651-sayili-internet-ortaminda-yapilan-yayinlarin-duzenlenmesi-ve-bu-yayinlar-yoluyla-islenen-suclarla-mucadele-edilmesi-hakkinda-kanun.pdf ; https://www.lexpera.com.tr/mevzuat/yonetmelikler/internet-ortaminda-yapilan-yayinlarin-duzenlenmesine-dair-usul-ve-esaslar-hakkinda-yonetmelik (eski yönetmelik 6 ay diyor; kanundaki 1-2 yıl sonradan geldi, güncel metin doğrulanmalı).

**Değerlendirme:**

- 5651'deki saklama yükümlülüğü **trafik bilgisi** içindir (IP, zaman ve benzeri). **Birincil kaynakla doğrulandı** (güncel 5651 PDF): kanunda mesaj içeriğini saklatan bir hüküm yok; m.5/1 yer sağlayıcıya içerik kontrol yükümlülüğü de yüklemiyor (§0 #23-25). Yönetmelik düzeyi doğrulanamadı. Arkadaşlar arası özel mesajın 5651 anlamında "yayın" olup olmadığı ve skall'ın yer sağlayıcı sayılıp sayılmadığı → **avukat** (zaten `yasal-metinler.md` madde 5'te açık).
- Sosyal ağ sağlayıcı yükümlülüklerinin çoğu (5651 ek m.4) Türkiye'den günlük 1 milyonun üstünde erişim eşiğine bağlıdır. **Düzeltme (birincil kaynak):** ek m.4/7 (15 yaş altına hizmet yasağı, yaş doğrulama) eşiksizdir. Ayrıca 22.4.2026 tarihinde "oyun platformu" yükümlülükleri (ek m.5) eklendi (§0 #26-27). 2026 değişiklikleri (yaş doğrulama) ayrıca var (`yasal-metinler.md` madde 2) [ikincil]: https://oner.av.tr/yeni-sosyal-medya-uygulamalari/
- **Sonuç: 30 günü zorunlu kılan bir mevzuat bulunamadı.** Süre m.4'ün ölçülülük ilkesine göre amaçtan türetilmelidir.

**Öneri (hukuki zorunluluk değil, gerekçeli öneri):**

1. **Sürüm satırı: `{SURUM_GUN}` = 7 gün, sürümün yerini yenisinin aldığı (düzenleme) andan.** Pencere 15 dk olduğundan pratikte "gönderimden 7 gün" ile aynıdır.
   - Gerekçe: amaç yalnız "düzenlenmeden önce görülen metnin şikayette kaybolmaması". Taciz edilen kişi mesajı genelde aynı gün ya da birkaç gün içinde şikayet eder. 7 gün, veritabanı yedeklerinin 7 günlük ufkuyla da örtüşür, yani silinen sürüm yedekte de en geç 14. günde biter.
   - Daha uzun süre ancak şikayetlerin ne kadar geç geldiği ölçülürse savunulabilir. Ölçmek için `reports.created_at − mesaj.created_at` dağılımı izlenebilir (öneri).
   - Ek kurallar (öneri): mesaj, konuşma ya da hesap silinince sürümler de hemen silinir (cascade); sürüm tablosunu silen saatlik iş, mevcut `delete_old_reports` kalıbıyla yazılabilir.
   - Kabul edilen yan etki: 7. günden sonra gelen şikayette ilk hâl yoktur, bugünkü durumla aynıdır ve kayıt yine "düzenlendi" der.
2. **Şikayet kopyası: `{SIKAYET_GUN}` = 30 gün, şikayet anından (bugünkü süre, bugünkü başlangıç).** Ek kural önerisi: şikayet bir yaptırıma (kapatma, kısıtlama, içerik kaldırma) yol açtıysa kopya, **kararın kişiye bildirildiği andan itibaren 30 gün** (itiraz için) saklanır; itiraz ya da resmî talep varsa süreç bitene kadar.
   - Gerekçe: Kullanım Koşulları 24 saatte inceleme ve itiraz hakkı veriyor. Bugünkü kod `status`'a bakmadan 30. günde siliyor, yani 29. günde verilen bir kararın delili ertesi gün gider.
   - Bu ek kural için `kullanim-kosullari.md:58`'e bir **itiraz süresi** (ör. 30 gün) yazılmalı; yoksa "itiraz bitene kadar" belirsiz kalır.
   - Sürümlerin şikayet kopyasındaki süresi şikayetin süresine bağlıdır; ayrı süre gerekmez.
3. Periyodik imha: saatlik pg_cron işi Yönetmelik'in "en geç 6 ay" sınırının çok altındadır. Bu bir saklama ve imha politikasında yazılı hâle getirilmeli (B.6).

### B.4 Aydınlatma (m.10 ve Tebliğ)

**Kaynakla desteklenen:**

- m.10: veri sorumlusunun kimliği; işleme amacı; kimlere, hangi amaçla aktarılabileceği; toplama yöntemi ve hukuki sebep; m.11'deki haklar [ikincil, kanun metni].
- Aydınlatma Yükümlülüğünün Yerine Getirilmesinde Uyulacak Usul ve Esaslar Hakkında Tebliğ (RG 10.03.2018, 30356) m.5: açık rıza ile aydınlatma ayrı yapılır; amaç belirli, açık ve meşru olmalı; genel ve muğlak ifade kullanılmaz; hukuki sebep belirtilmeli; aydınlatma işleme anında ya da önce yapılmalı [ikincil]: https://resmigazete.gov.tr/eskiler/2018/03/20180310-5.htm (açılmadı, arama sonucu); https://www.lexpera.com.tr/mevzuat/tebligler/aydinlatma-yukumlulugunun-yerine-getirilmesinde-uyulacak-usul-ve-esaslar-hakkinda-teblig/madde-5 ; Kurul 2022/545: https://www.kvkk.gov.tr/Icerik/7565/2022-545

**Bu değişiklik için metne girmesi gereken asgari bilgi (öneri):**

1. Ne işleniyor: düzenlenen DM'nin ilk ve ara hâlleri, düzenleme zamanları.
2. Amaç: yalnız şikayet incelemesi ve güvenlik; başka amaçla (analitik, eğitim, profil çıkarma) kullanılmaz.
3. Hukuki sebep: m.5/2-f; şikayete kopyalandıktan sonra m.5/2-f ve m.5/2-e.
4. Kimler görür: karşı taraf ve diğer kullanıcılar görmez; yalnız şikayet olunca yetkili moderasyon ekibi görür.
5. Süre: sürüm `{SURUM_GUN}` gün; şikayetteki kopya `{SIKAYET_GUN}` gün; silme olayları (hesap silme, arkadaşlığın bitmesi).
6. Aktarım: Supabase'de (yurt dışı) tutulur; mevcut aktarım cümlesi kapsar.
7. Toplama yöntemi: otomatik, elektronik (mevcut §3 kapsar).
8. Hak ve başvuru: mevcut §6-7 kapsar.

Ek öneri (ürün): düzenleme ekranında kısa bir bilgi satırı ("İlk hâli şikayet incelemesi için {SURUM_GUN} gün saklanır"). Bu bir rıza düğmesi değil, işleme anında bilgilendirmedir. Tebliğ'in "işleme anında" şartına en yakın yoldur. Bu satır `tr.ts`'e girer.

### B.5 Erişim yetkileri ve güvenlik (m.12)

**Kaynakla desteklenen:** m.12/1: hukuka aykırı işlemeyi ve erişimi önlemek, verileri muhafaza etmek için uygun güvenlik düzeyini sağlayan teknik ve idari tedbirler. Kişisel Veri Güvenliği Rehberi (Teknik ve İdari Tedbirler, Ocak 2018) idari tedbirler: gizlilik taahhütnamesi, politika ve prosedürler, eğitim, yetki matrisi; teknik tedbirler: erişim logları, kullanıcı hesap yönetimi, yetkilendirme, "bilmesi gereken" prensibi [ikincil, Rehber kopyası]: https://www.turmob.org.tr/arsiv/mbs/resmigazete/-veri_guvenligi_rehberi.pdf ; https://mihci.av.tr/kvkk-teknik-ve-idari-tedbirler/ . Kurul'un güvenlik ihlali bildirimi için 72 saat kararı (2019/10) bilinir; birincil metinden doğrulanmadı.

**Küçük ekip için asgari tedbirler (öneri):**

1. **Yetki sınırlama:** secret key yalnız adı yazılı kişilerde; kişi başına ayrı hesap ve anahtar (paylaşılan tek anahtar değil). İdealde moderasyon için sürüm tablosunu doğrudan okumayan, yalnız `reports` satırını ve ona kopyalanmış sürümleri döndüren service-role RPC'si; ham sürüm tablosu `admin:*`'ta hiç gösterilmez.
2. **Kayıt (log):** her `admin:reports list/done` çağrısında kimin, ne zaman, hangi şikayeti açtığı yazılmalı (`reports` → `reviewed_by`, `reviewed_at` ya da ayrı bir denetim tablosu). Bugün yok.
3. **Gizlilik taahhüdü:** moderasyona erişen her kişiden yazılı gizlilik taahhüdü; erişim bitince anahtarın iptali.
4. **Yerel kopya yok:** terminal çıktısı dosyaya yazılmaz; ekran görüntüsü ve dışa aktarma yok (yazılı prosedür).
5. **Anahtar hijyeni:** secret key'in döndürülmesi, iki aşamalı doğrulama (Supabase hesabı).
6. **İhlal prosedürü:** Kurul'a ve ilgililere bildirim prosedürü yazılı olmalı; metin bunu vaat ediyor (`gizlilik-politikasi.md:120`).

### B.6 Yurt dışı aktarım (m.9; 7499; Yönetmelik)

**Kaynakla desteklenen:**

- 7499 ile m.9 yeniden yazıldı (yürürlük 1 Haziran 2024). Sıra şöyle:
  - **Yeterlilik kararı.**
  - Yoksa **uygun güvenceler**: kamu kurumları arası anlaşma, bağlayıcı şirket kuralları, **Kurul'un ilan ettiği standart sözleşme**, taahhütname.
  - Hiçbiri yoksa ancak **arızi** olmak kaydıyla m.9/6'daki hâller.
- Standart sözleşme imzadan sonra **5 iş günü içinde** Kurum'a bildirilir (fiziki, KEP ya da Standart Sözleşme Bildirim Modülü; modül 25.10.2024'ten beri açık). Süre kanundadır, idari yolla esnetilemez. Bildirmemenin idari para cezası vardır. **Birincil kaynaktaki 2026 tutarı: 90.308–1.806.177 TL** (Kurum 2026 tablosu, m.18/1-d; bkz. §0 #12). İlk turda ikincil kaynaktan alınan 1.806.377 TL yanlıştı. İlk turun kaynakları: https://www.kvkk.gov.tr/Icerik/8043/Standart-Sozlesme-Bildirim-Modulu-Hakkinda-Kamuoyu-Duyurusu (açılamadı) ; https://www.alomaliye.com/2024/10/30/kvkk-standart-sozlesme-bildirim-modulu/ ; https://cottgroup.com/tr/blog/kvkk-gdpr/item/standart-sozlesme-bildirim-yukumlulugu-ve-yaptirimlari
- Kişisel Verilerin Yurt Dışına Aktarılmasına İlişkin Usul ve Esaslar Hakkında Yönetmelik (RG 10.07.2024, 32598). Standart sözleşme metinleri Kurum duyurusuyla ilan edildi (dört tür: VS→VS, VS→Vİ, Vİ→Vİ, Vİ→VS) [ikincil]: https://www.kvkk.gov.tr/Icerik/7938/Standart-Sozlesmeler-ve-Baglayici-Sirket-Kurallarina-Iliskin-Dokumanlar-Hakkinda-Kamuoyu-Duyurusu ; https://www.lexpera.com.tr/resmi-gazete/metin/kisisel-verilerin-yurt-disina-aktarilmasina-iliskin-usul-ve-esaslar-hakkinda-yonetmelik-32598 ; Kurum'un Yurt Dışına Aktarım Rehberi (2 Ocak 2025) özeti: https://www.erdem-erdem.av.tr/bilgi-bankasi/kisisel-verilerin-yurt-disina-aktarilmasi-rehberi-yayimlandi
- **Arızi aktarım:** Yönetmelik m.16. Düzenli olmayan, bir ya da birkaç kez olan, süreklilik taşımayan ve olağan faaliyet akışında yer almayan aktarım. Rehber'e göre olağan faaliyet akışındaki aktarım arızi sayılmaz [ikincil, aynı kaynaklar].

**Değerlendirme:**

- Supabase'de sürekli barındırma, Sentry ve PostHog'a her olayda gönderim, Expo'ya her push **olağan faaliyet akışındadır, arızi değildir.** Arızi istisnası ve arızi açık rıza bu akışa dayanak olamaz.
- Almanya (AB) da Türkiye için yurt dışıdır. Bilinen bir yeterlilik kararı bulunamadı; 2026 itibarıyla doğrulanmalı → avukat.
- Gereken somut işlem: her yurt dışı veri işleyenle Kurul'un **VS→Vİ standart sözleşmesi** (metni değiştirmeden), imza tarihleri metin üzerinde; **imzadan 5 iş günü içinde Kurum'a bildirim.** Sağlayıcıların kendi DPA ve AB SCC'leri tek başına yetmez. Sağlayıcı Türk metnini imzalamazsa ne yapılacağı → **avukat**.
- Kapsam: Supabase, Sentry, PostHog, Expo, Zoho, Cloudflare ve OpenFreeMap (IP adresi kişisel veridir); FCM ve APNs için Google ve Apple ile ilişki ayrıca değerlendirilmeli.
- **Bu değişiklik yeni bir aktarım yaratmaz** (sürümler Supabase'de kalır). Ama aktarım dayanağı bugün eksikse mesaj içeriğinin hacmi büyür.

### B.7 VERBİS

**Kaynakla desteklenen [ikincil]:**

- Kurul 2018/87 ve 2023'teki değişiklik: yıllık çalışan sayısı 50'den az **ve** yıllık mali bilanço toplamı 100 milyon TL'den az olan, **ana faaliyeti özel nitelikli veri işleme olmayan** veri sorumluları kayıttan muaf.
- Kurul 04.09.2025, 2025/1572 (RG 01.10.2025): ana faaliyeti özel nitelikli veri işleme olanlar için ayrı ölçüt. 2025/2393 (25.12.2025) ile netleştirildi; bir kaynağa göre işletme hesabı esasındakiler için 10 çalışan ölçütü. 2026/1026 ile bazı kayıt süreleri 05.06.2026'ya uzatıldı.
- Yurt dışında yerleşik veri sorumluları muaf değildir.
- Kaynaklar: https://www.cottgroup.com/en/legislation/item/verbise-kayit-zorunlulugu-istisnalarinda-degisiklik ; https://www.alomaliye.com/2026/01/13/kisisel-verileri-koruma-kurulunun-2025-1572-sayili-kararinin-uygulama-esaslari/ ; https://www.aeo.org.tr/assets/files/2680_VERBIS_Degisikliklerine_Iliskin_12.01.2026_Tarihli_Kamuoyu_Duyurusu.pdf ; https://kvkk.gov.tr/Icerik/8388/KAMUOYU-DUYURUSU (açılamadı)

**Değerlendirme:** Veri sorumlusu gerçek kişidir (`yasal-metinler.md`) ve çalışanı yoksa, ana faaliyet özel nitelikli veri işleme olmadığı sürece muafiyet ölçütlerinin içinde görünür. Ancak cinsiyet beyanı özel nitelikli değildir; sağlık ya da cinsel yaşam ana faaliyet değildir. Muafiyetin gerçek kişiye ve yaygın tüketici uygulamasına uygulanması → **avukat**. Muaf olunsa bile m.4, m.10, m.12 yükümlülükleri sürer; VERBİS'e kayıt olmayan, saklama ve imha politikası hazırlamak zorunda değildir ama Yönetmelik'in 3 aylık genel imha süresi geçerlidir.

### B.8 İlgili kişi hakları (m.11)

**Kaynakla desteklenen:** m.11: bilgi isteme, düzeltme, silme (m.7 çerçevesinde) ve diğerleri; m.13: başvuru en geç 30 gün içinde ücretsiz sonuçlandırılır; m.28/2'de bazı hâllerde m.10 ve m.11 uygulanmaz (ör. suç soruşturması, kamu güvenliği, yargı) [ikincil, kanun metni].

**Değerlendirme:**

- **Şikayet edilen kişi kendi sürümlerine erişim isterse:** sürümler onun kendi kişisel verisidir; m.11/1-b kapsamında bilgi istenebilir. Ancak şikayet kaydı şikayet edenin kimliğini ve mesajlarını da içerir. Topluluk kuralları "şikayet ettiğiniz kişi öğrenmez" diyor (`topluluk-kurallari.md:41`). Öneri: kişiye yalnız kendi metin sürümleri verilir; şikayetin varlığı, şikayet eden ve onun mesajları verilmez. Şikayetin varlığını hiç söylememenin hukuken savunulabilir olup olmadığı → **avukat**.
- **Hesap silme ile süren şikayet çatışması:** m.7 silme talebi, işleme şartı (m.5/2-e, f) sürüyorsa reddedilebilir ya da ertelenebilir. Mevcut metin bu modeli izliyor (`hesap-silme.md:42`, `:49`). Öneri: hesabın silinmesi sürüm tablosundaki satırları hemen siler (cascade); şikayete kopyalanmış sürümler şikayet süresince kalır ve metinde açıkça yazılır. Şikayet edilen kişinin hesabını silerek delili yok etmesi engellenmiş olur.
- **Düzeltme talebi:** düzenleyen kişi ilk hâlin silinmesini isterse, sürüm `{SURUM_GUN}` boyunca meşru menfaat için kalır; m.11/1-e ve m.7 itirazı değerlendirilip gerekçeli cevap verilir.

---

## C. Metin taslakları

Üslup: mevcut metinler gibi "biz" dili, kısa cümle, rıza kutusu yok. Taslak, son metin değil.

### C.1 `docs/legal/gizlilik-politikasi.md`

**§3 tablo, `:50`'nin altına yeni satır:**

| Düzenlenen mesajların önceki hâlleri (arkadaşlar arası bir mesajı düzenlediğinizde ilk hâli ve ara hâlleri, düzenleme zamanları; karşı taraf ve diğer kullanıcılar görmez) | Mesaj şikayet edilirse düzenlemeden önce ne yazıldığının incelenebilmesi | Düzenlemeden {SURUM_GUN} gün sonra silinir; mesaj, konuşma ya da hesap silinince hemen |

**§3 tablo, `:52` şikayet satırının değişen hâli:**

| Şikayet kayıtları (sebep; şikayet anındaki son 50 mesajın ve bu mesajların saklanan önceki hâllerinin, şikayet edilen fotoğrafın, profilin adı ve tanıtım yazısının, oyun geçmişi kaydının ya da oyunda yazılan sorunun kopyası) | Güvenlik ve moderasyon | Şikayetten {SIKAYET_GUN} gün sonra silinir; şikayet bir yaptırıma yol açtıysa itiraz süresi bitene kadar |

**§5'e ("Diğer kullanıcılar neyi görür"), `:80`'den sonra yeni madde:**

- **Mesaj düzenleme:** Arkadaşınıza gönderdiğiniz bir mesajı gönderdikten sonraki 15 dakika içinde en çok 5 kez düzenleyebilirsiniz. Karşı taraf mesajın düzenlendiğini görür, önceki hâlini görmez. Önceki hâller yalnızca o mesaj şikayet edilirse incelenmek için {SURUM_GUN} gün saklanır; bu süre içinde şikayet gelmezse silinir. Şikayet edilirse şikayet kaydına kopyalanır ve yalnızca şikayetleri inceleyen yetkili ekibimiz görür.

**§3, `:61`'in değişen ikinci cümlesi:**

> Irk, din, sağlık, cinsel yaşam gibi özel nitelikli kişisel verileri istemeyiz; profilinize ve mesajlarınıza bu tür bilgileri yazmamanızı öneririz. Yine de bir mesajda yazarsanız, o mesaj ve düzenlenmeden önceki hâlleri yukarıdaki sürelerle saklanır ve yalnızca bu sayfada yazan amaçlar için kullanılır.

**§8'e ("Verilerinizi nasıl koruyoruz") yeni madde:**

- Şikayet kayıtlarını ve düzenlenen mesajların önceki hâllerini yalnızca şikayetleri inceleyen, gizlilik taahhüdü vermiş yetkili kişiler görebilir; her inceleme kaydedilir.

_(Bu madde ancak B.5'teki taahhüt ve log fiilen kurulursa yazılmalı. Kurulmadan yazılırsa fiilî davranışla örtüşmez.)_

### C.2 `docs/legal/kvkk-aydinlatma-metni.md`

**§2 tablo, `:25` güvenlik satırının değişen hâli:**

| Güvenlik kayıtları: şikayet kayıtları ve ekli içerik kopyaları, düzenlenen arkadaşlar arası mesajların önceki hâlleri, engelleme kayıtları, kapatılan hesabın telefon numarasının geri döndürülemez özeti, Kullanım Koşulları kabul kaydı ve bu metnin gösterildiğine dair kayıt | Kullanıcıların ve hizmetin güvenliği, şikayet edilen mesajın düzenlenmeden önceki hâlinin incelenmesi, kural ihlallerinin incelenmesi, uyuşmazlıklarda ispat | Meşru menfaat (m. 5/2-f); bir hakkın tesisi, kullanılması ya da korunması (m. 5/2-e) |

**§2, `:30`'un değişen ilk cümlesi:**

> Özel nitelikli kişisel veri (ırk, din, sağlık, cinsel yaşam, biyometrik veri ve benzerleri) istemeyiz ve bu verileri ayrıca toplamayız; yazdığınız bir mesajda geçerse o mesaj diğer mesajlarla aynı kurallarla saklanır ve silinir.

**§5 saklama süreleri, `:52`'den sonra yeni madde ve `:51`'in değişen hâli:**

- Düzenlenen arkadaşlar arası mesajların önceki hâlleri, düzenlemeden {SURUM_GUN} gün sonra silinir. Yalnızca mesaj şikayet edilirse incelenir; karşı taraf ve diğer kullanıcılar görmez.
- Şikayet kayıtları (ekli mesaj kopyaları ve mesajların önceki hâlleri dahil) şikayetten {SIKAYET_GUN} gün sonra, şikayet bir yaptırıma yol açtıysa itiraz süresi bittikten sonra silinir.

**§4 hizmet sağlayıcılar, `:38`:** listeye Cloudflare, Google Fonts (site) ve Zoho (e-posta) eklenmeli; gizlilik politikasıyla aynı olmalı. Bu, yeni değişiklikten bağımsız bir tutarsızlık.

### C.3 `docs/legal/hesap-silme.md`

**"Silinen veriler", `:32`'nin değişen hâli:**

- Oyun geçmişiniz, arkadaşlık istekleri, arkadaşlıklar, arkadaşlar arası mesajlar ve düzenlediğiniz mesajların saklanan önceki hâlleri, masa davetleri

**"Bir süre kalan veriler", `:42`'nin değişen hâli:**

- **Şikayet kayıtları:** sizin yaptığınız ya da hakkınızda yapılan şikayetler (ekli mesaj kopyaları ve bu mesajların şikayet anında saklanan önceki hâlleri dahil) güvenlik ve moderasyon için şikayetten sonra {SIKAYET_GUN} gün saklanır; şikayet bir yaptırıma yol açtıysa itiraz süresi bitene kadar saklanır, sonra silinir. Hesabınızı silmeniz süren bir şikayetin kaydını silmez.

### C.4 Diğer dosyalar (öneri; metin dışı)

- `docs/legal/kullanim-kosullari.md:58`: itiraz süresi (ör. "kararın size bildirildiği tarihten itibaren 30 gün içinde"). Ek saklama kuralı buna dayanır.
- `docs/SPEC_V4.md` §4.X "Düzenle": "Eski metin saklanmaz …" ve "Açık ürün riski" cümleleri; mesaj başına 5 düzenleme sınırı.
- `supabase/migrations/20261217090000_dm_manage.sql` yorumları yeni migration'da düzeltilmeli (eski migration değişmez).
- `scripts/admin/reports.ts:8` yorumu.
- `legalEntity.ts` → `effectiveDate`; `consent.ts` onay sürümü (OPS: anlam değişince artar); `apps/mobile/src/i18n/legalDocs.generated.ts` yeniden üretim.

### C.5 Fiilî davranışla örtüşmeyen mevcut cümleler

1. `gizlilik-politikasi.md:105` ve `kvkk-aydinlatma-metni.md:40`: aktarımın standart sözleşmeye "dayandığı" yazıyor. `docs/decisions/yasal-metinler.md` → açık iş 1 bunu yapılacak iş olarak listeliyor; repoda imza ve bildirim kanıtı yok. **Metin, yapılmamış bir işlemi yapılmış gibi anlatıyor olabilir.**
2. `gizlilik-politikasi.md:55` ve `kvkk-aydinlatma-metni.md:53`: giriş kayıtları "en fazla 2 yıl". Silen iş yok (`yasal-metinler.md` madde 3; `auth.audit_log_entries` için cron yok).
3. `kvkk-aydinlatma-metni.md:55` ve `hesap-silme.md:48`: yedeklerin 7 günde silinmesi üretimin Pro planda olmasına bağlı; plan doğrulanamadı.
4. `kullanim-kosullari.md:56` ("en geç 24 saat içinde inceleriz") ile `scripts/admin/reports.ts:8` ("read at least weekly") çelişiyor.
5. Kod `status`'a bakmadan 30 günde siliyor (`delete_old_reports`). İtiraz hakkı (`kullanim-kosullari.md:58`) süresiz; geç itirazda delil kalmayabilir.
6. `kvkk-aydinlatma-metni.md:38` veri işleyen listesi gizlilik politikasından eksik (Cloudflare, Google Fonts, Zoho).
7. "Sohbeti sil" (`dm/clear`) mesaj satırlarını silmez (SPEC §4.X); yasal metinler bunu anlatmıyor. "Sil" adı kullanıcıya verinin silindiğini düşündürebilir. Metne "Sohbeti sil yalnız sizin görünümünüzden gizler; mesajlar arkadaşlık sürdükçe saklanır" gibi bir cümle önerilir.
8. `gizlilik-politikasi.md:23` ("verileriniz o anda silinir") mutlak; kalan veriler yalnız `hesap-silme.md`'de. "Bir süre kalanlar dışında" diye daraltılması önerilir.
9. `legalEntity.ts` → `controllerName` boş: m.10/1-a (veri sorumlusunun kimliği) bugün karşılanmıyor; metinler taslak.
10. `gizlilik-politikasi.md:96-100`: Supabase, PostHog ve Sentry için "Almanya (Frankfurt)" yazıyor; üretim projelerinin bölgesi repodan doğrulanamadı.
11. (Birincil kaynakla) `docs/decisions/yasal-metinler.md` 2026/347'yi "hizmetin açık rızaya bağlanmasını geçersiz sayar … yanıltıcı bulur" diye özetliyor. Karar duyurusu bunu demiyor; "başka şart varken ayrıca açık rıza metni sunulmaz" diyor. Sonuç aynı, özet düzeltilmeli (§0 #16).
12. (Birincil kaynakla) `kvkk-aydinlatma-metni.md:62-74` m.11'in bütün bentlerini sayıyor. 2026/347 kısa atıf öneriyor; aykırılık değil, iyileştirme.

---

## D. Proje sahibinin tamamlaması gereken işlemler (repoda kanıtı yok)

1. Veri sorumlusunun adı, KEP ya da posta adresi (`legalEntity.ts`).
2. Her yurt dışı veri işleyenle (Supabase, Sentry, PostHog, Expo, Zoho, Cloudflare; FCM ve APNs ile OpenFreeMap'in durumu ayrıca) Kurul'un standart sözleşmesi (VS→Vİ), metin değiştirilmeden, imza tarihleri metin üzerinde; **imzadan sonra 5 iş günü içinde Kurum'a bildirim** (modül, KEP ya da fiziki).
3. Sağlayıcıların DPA'larının kabul edildiğinin kaydı ve alt işleyen listeleri.
4. Üretim Supabase projesinin bölgesinin (eu-central-1) ve Pro planının (7 günlük yedek) doğrulanması; Sentry ve PostHog veri bölgeleri; PostHog 1 yıl ve Sentry 90 gün saklama ayarı.
5. VERBİS muafiyetinin değerlendirilmesi ve sonucun yazılı kaydı.
6. Kişisel veri envanteri ve saklama ve imha politikası. VERBİS'e kayıt gerekmiyorsa zorunlu olmayabilir, ama süreleri tek yerde belgeler.
7. Meşru menfaat denge testinin yazılı kaydı (sürüm saklama için).
8. Moderatörler için yetki listesi, kişisel anahtar, gizlilik taahhüdü, inceleme logu (`reviewed_by`, `reviewed_at`), anahtar iptal prosedürü. Kurul'un 2018/10 listesine göre ayrıca: yetkinin süresi, periyodik yetki kontrolü, uzaktan erişimde en az iki kademeli kimlik doğrulama (birincil kaynak, §0 #5). Dayanak 6698 m.12/1 ve m.12/4.
9. Veri ihlali bildirim prosedürü (Kurul'a ve ilgililere).
10. m.11 başvuru prosedürü: kimlik doğrulama, 30 gün, şikayet edenin kimliğinin gizlenmesi.
11. Giriş kayıtlarının 2 yılda silinmesi (ya da metnin değişmesi).
12. Kullanım Koşulları'na itiraz süresi.

## E. Avukat değerlendirmesi gerektirenler

1. Şikayetten önce, ileride şikayet gelebilir diye yapılan sürüm saklamada, ilk metinde geçebilecek özel nitelikli veri için m.6'daki "hakkın tesisi, kullanılması veya korunması için zorunluluk" istisnasının kurulup kurulamayacağı; Kurul'un yeterli önlemlerinin bu uygulamaya etkisi.
2. Arkadaşlar arası özel mesajın 5651 anlamında "yayın" sayılıp sayılmadığı; skall'ın yer sağlayıcı olup olmadığı; trafik bilgisi saklama yükümlülüğü ve süresi (güncel yönetmelik: 6 ay mı, 1-2 yıl mı); içerik saklama zorunluluğunun bulunmadığının teyidi.
3. Haberleşmenin gizliliği (Anayasa m.22, TCK m.132-133): moderatörün, şikayet edenin hiç görmediği ilk metni (alıcı açmadan düzenlenmiş mesaj) okuması. Öneri: yalnız alıcıya teslim edilmiş ya da alıcının okuduğu sürümleri kopyalamak bu riski azaltabilir; hukuken gerekli olup olmadığı belirsiz.
4. Yurt dışı sağlayıcılar Türk standart sözleşmesini imzalamazsa alternatif mekanizma; Almanya için yeterlilik kararının 2026 itibarıyla varlığı; sağlayıcının kendi DPA'sının ve SCC'sinin yeterliliği.
5. VERBİS muafiyetinin gerçek kişi veri sorumlusuna ve tüketici uygulamasına uygulanması; 2025/1572 ve 2025/2393'ün kapsamı.
6. Şikayet edilen kişinin m.11 başvurusunda şikayetin varlığının ve içeriğinin ne ölçüde gizlenebileceği (m.28/2 istisnalarının uygulanabilirliği; üçüncü kişi verisi).
7. Yaptırım sonrası delil süresi: itiraz süresinin ötesinde (ör. hakaret ve tehdit suçlarının şikayet ve zamanaşımı süreleri için) saklamanın m.5/2-e ile savunulup savunulamayacağı.
8. ~~Standart sözleşme bildirim cezasının güncel tutarı~~: birincil kaynakla çözüldü, 2026'da 90.308–1.806.177 TL (§0 #12). Avukat listesinden çıktı.
9. (Yeni, birincil kaynaktan) skall'ın 5651 m.2/1-ü anlamında "oyun platformu" (7578, 22.4.2026; ek m.5: derecelendirme, ebeveyn kontrolü, temsilci) ve m.2/1-s anlamında "sosyal ağ sağlayıcı" sayılıp sayılmadığı. Sayılırsa eşiksiz ek m.4/7 (15 yaş, yaş doğrulama) uygulanır.
10. (Yeni) m.28/2-a'nın ("suç işlenmesinin önlenmesi veya suç soruşturması için gerekli") şikayet edilen kişinin erişim talebinde şikayetçinin kimliğini gizlemeye dayanak olup olamayacağı.
11. Yeterlilik kararı olup olmadığı birincil kaynakla doğrulanamadı; avukattan teyit.
12. `yasal-metinler.md`'de zaten açık olan: masadaki anonimliğin cinsiyete bağlı olması (6701), kapatılan hesabın numara özetinin süresi.

---

## Kaynaklar

Birincil siteler bu oturumda açılamadı. Aşağıdakilerin çoğu ikincil kaynaktır ya da yalnız arama sonucunda görüldü.

- 6698 sayılı Kanun (güncel metin) — Lexpera: https://www.lexpera.com.tr/mevzuat/kanunlar/kisisel-verilerin-korunmasi-kanunu-6698 ; Alomaliye 01.06.2024 metni: https://www.alomaliye.com/wp-content/uploads/2016/04/6698-sk-01-06-2024.doc
- 7499 değişikliği — Erdem & Erdem: https://www.erdem-erdem.av.tr/bilgi-bankasi/kisisel-verilerin-korunmasi-kanununda-degisiklik ; Hukukçular Evi m.6: https://hukukcularevi.com/ozel-nitelikli-kisisel-veriler-kvkk-6/
- Özel Nitelikli Kişisel Verilerin İşlenmesine İlişkin Rehber (Kurum): https://www.kvkk.gov.tr/Icerik/8184/Ozel-Nitelikli-Kisisel-Verilerin-Islenmesine-Iliskin-Rehber
- Kurul ilke kararı 2026/347 — Lexpera: https://www.lexpera.com.tr/mevzuat/kurul-kararlari/kisisel-verileri-koruma-kurulunun-18-02-2026-tarihli-ve-2026-347-sayili-karari-2026-347-1 ; Alomaliye: https://www.alomaliye.com/2026/03/24/kvkkdan-yeni-ilke-karari-acik-riza-metni-ile-aydinlatma-metni-artik-ayri-duzenlenmeli/
- Aydınlatma Tebliği — RG 10.03.2018: https://resmigazete.gov.tr/eskiler/2018/03/20180310-5.htm ; Lexpera m.5: https://www.lexpera.com.tr/mevzuat/tebligler/aydinlatma-yukumlulugunun-yerine-getirilmesinde-uyulacak-usul-ve-esaslar-hakkinda-teblig/madde-5 ; Kurul 2022/545: https://www.kvkk.gov.tr/Icerik/7565/2022-545
- Meşru menfaat — Cottgroup: https://cottgroup.com/tr/blog/kvkk-gdpr/item/veri-islemede-veri-sorumlusunun-mesru-menfaati
- Silme, Yok Etme, Anonimleştirme Yönetmeliği (Kurum): https://www.kvkk.gov.tr/Icerik/5441/KISISEL-VERILERIN-SILINMESI-YOK-EDILMESI-VEYA-ANONIM-HALE-GETIRILMESI-HAKKINDA-YONETMELIK ; Kurum'un kendi saklama ve imha politikası örneği: https://www.kvkk.gov.tr/Icerik/5386/KVKK-KISISEL-VERI-SAKLAMA-ve-IMHA-POLITIKASI
- Kişisel Veri Güvenliği Rehberi (kopya): https://www.turmob.org.tr/arsiv/mbs/resmigazete/-veri_guvenligi_rehberi.pdf ; özet: https://mihci.av.tr/kvkk-teknik-ve-idari-tedbirler/
- Yurt dışı aktarım — Yönetmelik (RG 32598), Lexpera: https://www.lexpera.com.tr/resmi-gazete/metin/kisisel-verilerin-yurt-disina-aktarilmasina-iliskin-usul-ve-esaslar-hakkinda-yonetmelik-32598 ; standart sözleşmeler duyurusu: https://www.kvkk.gov.tr/Icerik/7938/Standart-Sozlesmeler-ve-Baglayici-Sirket-Kurallarina-Iliskin-Dokumanlar-Hakkinda-Kamuoyu-Duyurusu ; bildirim modülü: https://www.kvkk.gov.tr/Icerik/8043/Standart-Sozlesme-Bildirim-Modulu-Hakkinda-Kamuoyu-Duyurusu ; Alomaliye: https://www.alomaliye.com/2024/10/30/kvkk-standart-sozlesme-bildirim-modulu/ ; Cottgroup (yaptırım): https://cottgroup.com/tr/blog/kvkk-gdpr/item/standart-sozlesme-bildirim-yukumlulugu-ve-yaptirimlari ; Rehber özeti: https://www.erdem-erdem.av.tr/bilgi-bankasi/kisisel-verilerin-yurt-disina-aktarilmasi-rehberi-yayimlandi
- VERBİS — Cottgroup: https://www.cottgroup.com/en/legislation/item/verbise-kayit-zorunlulugu-istisnalarinda-degisiklik ; Alomaliye 2025/1572: https://www.alomaliye.com/2026/01/13/kisisel-verileri-koruma-kurulunun-2025-1572-sayili-kararinin-uygulama-esaslari/ ; AEO duyurusu: https://www.aeo.org.tr/assets/files/2680_VERBIS_Degisikliklerine_Iliskin_12.01.2026_Tarihli_Kamuoyu_Duyurusu.pdf ; Kurum duyurusu: https://kvkk.gov.tr/Icerik/8388/KAMUOYU-DUYURUSU ; süre uzatımı: https://www.alomaliye.com/2026/05/14/verbise-kayit-ve-bildirim-suresi-hakkinda-onemli-duyuru/
- 5651 — kanun metni kopyası: https://aile.gov.tr/uploads/chgm/uploads/pages/kanunlar/5651-sayili-internet-ortaminda-yapilan-yayinlarin-duzenlenmesi-ve-bu-yayinlar-yoluyla-islenen-suclarla-mucadele-edilmesi-hakkinda-kanun.pdf ; usul ve esaslar yönetmeliği: https://www.lexpera.com.tr/mevzuat/yonetmelikler/internet-ortaminda-yapilan-yayinlarin-duzenlenmesine-dair-usul-ve-esaslar-hakkinda-yonetmelik ; 2026 değişiklikleri: https://oner.av.tr/yeni-sosyal-medya-uygulamalari/
