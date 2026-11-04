# İstanbul Gelişim Üniversitesi: yerleşke doğrulama raporu (3 Kasım 2026)

Durum (4 Kasım): **Gelişim Tower eklendi** (`igu-tower`, Avcılar, etkin). Sınırı proje sahibinin elle çizdiği alan (9 köşe, yaklaşık 2,8 hektar, merkezi 40.99377, 28.69992); resmî yerleşke adı olmadığı için Keşfet'te "İstanbul Gelişim Üniversitesi" adıyla görünür. Saha denemesi (içeriden ve 60 m dışından check-in) dev projesinde yapılacak. Aşağıdaki diğer adaylar doğrulanmadı.

## Bu oturumda ne denendi

- `gelisim.edu.tr` ve alt alanları (adres, yerleşke haritası, iletişim sayfaları): bu ortamın ağından DNS düzeyinde açılmadı.
- OpenStreetMap (Overpass, Nominatim): bağlantı reddedildi. Sınır için OSM kullanılacaksa veri ODbL'dir; `© OpenStreetMap contributors, ODbL` atfı içerik notuna ve uygulamanın lisans sayfasına yazılır.
- Yalnızca arama motoru özetleri okunabildi. Aşağıdakiler bu özetlerden gelir; **birincil kaynakta doğrulanmadı**.

## Aday bilgiler (doğrulanmadı)

| Aday                             | Adres (özetlerden)                                          | İlçe     | Not                                                                                                                                                        |
| -------------------------------- | ----------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rektörlük / Cihangir (ana adres) | Cihangir Mah. Şehit Jandarma Komando Er Hakan Öner Sk. No:1 | Avcılar  | Birçok resmî sayfada ve YÖKAK kurum içi değerlendirme raporlarında (2018, 2019) ana adres. A Blok "Rektörlük Binası" olarak geçiyor; bir sayfa No:3 diyor. |
| Gelişim Tower                    | Cihangir Mah. Petrol Ofisi Cad. No:3-5                      | Avcılar  | Bazı fakülteler burada listeleniyor; ayrı adres.                                                                                                           |
| Meslek Yüksekokulu               | Petrol Ofisi Cad. No:7 (bir sayfada No:3)                   | Avcılar  | Sayfalar çelişiyor.                                                                                                                                        |
| Yabancı Diller Yüksekokulu       | Oğul Sk. No:3                                               | Avcılar  | E Blok ile ilişkilendiriliyor (çelişkili).                                                                                                                 |
| Lisansüstü Eğitim Enstitüsü      | Duygu Sk. No:2                                              | Avcılar  |                                                                                                                                                            |
| TEKMER                           | Oğul Sk. No:6 İç Kapı No:15                                 | Avcılar  | Teknoloji merkezi; sosyal alan adayı değil.                                                                                                                |
| "Ambarlı" yerleşkesi             | —                                                           | Avcılar? | Bazı birim sayfalarında G ve J blokları "Ambarlı yerleşkesi" diye geçiyor; adres bulunamadı.                                                               |

Blok eşlemesi (özetlerden, çelişkili): A Rektörlük; B Sağlık Bilimleri ("Ambarlı Kavşağı Sağlık yerleşkesi"); C Rektörlük yerleşkesinde Sağlık Hizmetleri MYO; D-E Güzel Sanatlar ya da Yabancı Diller; G MYO (Ambarlı); J Mühendislik-Mimarlık, İİSBF, Güzel Sanatlar (Ambarlı); H için bilgi bulunamadı. Bir merkez "K Blok"a taşındığını duyuruyor. Sayfaların bir kısmı yıllar önce yazılmış.

Kaynaklar (arama özetleri): gelisim.edu.tr/icerik/adres, mmf.gelisim.edu.tr (İGÜ Yerleşke Haritası), oidb.gelisim.edu.tr iletişim, gvba.gelisim.edu.tr dahili numaralar, mis.yokak.gov.tr kidr-1104-2018/2019.

## Yerleşke eklemeden önce gerekenler

1. Üniversiteden (ya da güncel resmî yerleşke haritasından) yerleşke listesi: hangi adresler ayrı yerleşke, hangi bloklar hangi yerleşkede. Petrol Ofisi Caddesi ve Cihangir adresleri yürüme mesafesindeyse aynı sosyal çevre için tek yerleşke + noktalar (bloklar) tercih edilir; ayrı arsalar tek poligonda birleştirilmez.
2. Her yerleşke için sınır: OSM'deki `amenity=university` alanı (ODbL atfıyla) ya da sahada çizilmiş poligon; saat yönünün tersine, kapalı halka; `location` sınırın içinde.
3. Sahada kontrol: her yerleşkenin içinden ve 60 m dışından check-in denemesi (dev projesinde); bitişik yerleşkeler varsa çakışma bölgesi.
4. İçerik: `venues-campus.json`'a `university: "istanbul-gelisim-universitesi"` ile, önce `isActive: false`; doğrulanınca `true`. Kalıcı `ref`'ler (ör. `igu-cihangir`) bir kez seçilir, değişmez. Ardından `pnpm seed`.
