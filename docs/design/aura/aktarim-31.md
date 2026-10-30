# skall aktarım raporu: güncel ekran eşitlemesi

31 Ekim 2026 · aura tuvali sürüm 31 · onaylayan: Gökay

Bu raporu uygulamayı kuran oturum okur. Hareket değerleri tuvaldeki hareket panosundan (hareket.json) gelir; yeni hareket türü yoktur.

## 1. Değişen ve yeni panolar

**Değişen (10):** Keşfet, Mekan sayfası, Check-in, Mekan ve lobi, Masa kur, Masa, Mesajlar, DM, Profil, Kapsülün.

**Yeni (6):** Keşfet: boş; Aktiviteler: geçmiş; Aktiviteler: etkinlik yok; Mesajlar: istekler boş; Profili düzenle; Profil fotoğrafı.

Pano başına özet:

- **Keşfet:** üst çubuk (konum ve zil) kalktı, başlık en üstte. Arama ve liste/harita anahtarı, Tümü / Kampüs / Kafe ve mekan çipleri, "Sakarya · Tüm semtler" bölümü, düz liste satırı (mekan simgesi, ad, tür · semt, sağda yoğunluk) ve OpenStreetMap atfı. Mekan kartı ve etkinlikler şeridi kalktı.
- **Keşfet: boş:** filtre sonucu 0 iken cam kart "Bu semtte mekan yok".
- **Mekan sayfası:** üstte tam genişlik mekan sahnesi, Kampüs ve Sessiz etiketleri, başlık, semt, konum açıklaması ve "Buraya giriş yap". Nokta seçimi ve etkinlik listesi kalktı, alt menü görünür.
- **Check-in:** mekan sayfası perdenin arkasında, kapsül kankiler sayfanın kenarından bakıyor. Sayfada mekan adı, konum açıklaması, "Konumumu kullan" ve "Vazgeç". Nokta seçimi ve rıza kutusu kalktı.
- **Mekan ve lobi:** sol üstte ska + kapsül yazı markası, sağda seçenekler düğmesi; mekan adı iki satır ve "Mekandasın"; "Henüz masan yok" sahnesi; Mekan sohbeti kartı (şu an aktif, rozet, önizleme); Açık masalar ve boş hâli.
- **Masa kur:** sayfa üstte 96 dp'den başlar; masa simgesi sahnesi ve ad etiketi, 5 simgelik seçim satırı, "Simgeyi değiştir", "Lobide görünsün" anahtarı (kapalı), "Masada \[ad\] olarak görünürsün" ve "Masayı kur". Niyet ve oyun çipleri kalktı.
- **Masa:** üst sahne kalktı. Üst çubukta geri, masa sohbeti, davet, masadakiler ve Bitir; ortalanmış masa kartı (sen, masa adı, kişi sayısı · lobi durumu); "Masada yalnızca sensin" kartı; 2 sütun oyun kartları (5+ kişi / Yakında etiketleri). Test botları kartı çizilmedi, geliştirme ortamına ait.
- **Mesajlar:** istek sahnesi kalktı; Sohbetler / İstekler anahtarı, düz liste (avatar, ad, okundu işareti ve zaman, önizleme), sağ altta yeni sohbet düğmesi.
- **Mesajlar: istekler boş:** "Bekleyen istek yok" boş hâli.
- **DM:** ayrı geri düğmesi, avatar ve adlı cam başlık, üç renkli seçenekler düğmesi; mavi-lila duvar kağıdı; karşı taraf mavi balon, sen beyaz balon; zaman balonun içinde, tepki çipi balonun içinde; tarih kapsülü.
- **Profil:** başlık büyük "Profil"; Rozetler kalktı; anonim ad satırında "27 gün sonra yenileyebilirsin." ve pasif Yenile.
- **Profil fotoğrafı:** koyu perde üstünde beyaz köşeli büyük fotoğraf kartı.
- **Profili düzenle:** geri, başlık, fotoğraf kartı (kamera rozeti, "Fotoğrafı değiştir"), Görünen ad ve Tanıtım alanları, doğum tarihi notu.
- **Kapsülün:** sahnede sarı disk üstünde kapsül; Renk / Göz / Baş / Yüz / Ağız / Boy çipleri; seçili parça karosu; paket kartı (Paketi tak); altta Hepsini çıkar ve pasif Kaydet; alt menü görünür.
- **Aktiviteler: geçmiş / etkinlik yok:** büyük başlık, Etkinlikler / Geçmiş anahtarı, gün gruplu geçmiş listesi ya da "Bugün etkinlik yok".

## 2. Yeni ya da değişen bileşenler

- **Boş hâl simgesi (yeni):** dolu mor kapsül ve arkasında kesikli pembe kapsül çizgisi; altında başlık ve açıklama. Açık masa yok, Bekleyen istek yok, Bugün etkinlik yok ekranlarında.
- **Okundu işareti (yeni):** çift tik, #4A5CE6. Mesajlar listesi ve DM'de.
- **Aktiviteler sekmesi açık hâli (yeni):** mor takvim gövdesi, pembe halkalar, amber kare.
- **Yazı markası (yeni):** "ska" yazısı + iki kapsül işareti. Mekan ve lobi üstünde.
- **DM balonları (değişti):** karşı taraf #307CF6 beyaz yazı, sen beyaz cam koyu yazı; zaman ve okundu balonun içinde.
- **DM duvar kağıdı (yeni):** #E3EEFE → #E2DAFE dikey geçiş üstünde dağınık soluk kapsüller. Duran desen, yeni efekt değil.
- **Liste satırı (değişti):** Keşfet, Mesajlar ve Aktiviteler'de cam kart yerine düz satır ve ince ayırıcı.
- **Yeni sohbet düğmesi (yeni):** 70 dp birincil yuvarlak, artı simgesi.
- **Anahtar (yeni):** 56 × 34 dp, kapalı hâl lila iz ve beyaz topuz. Masa kur'da.
- **Oyun kartı (değişti):** oyunun görseli kartı doldurur, sol üstte koyu cam etiket.
- **Uygulamadan alınan görseller:** mekan sahnesi, kampüs simgesi, at nalı sahnesi, 5 masa simgesi, 4 oyun kartı. Tuvaldekiler ekran görüntüsünden kırpılmış düşük çözünürlüklü kopyalardır; uygulamada özgün dosyalar kullanılmalı.

Galeri panosu tuvalde yok, bu bileşenler oraya eklenemedi (açık sorular).

## 3. Hareketler, geçişler ve tetikleyen dokunuşlar

Ortak kurallar bütün ekranlarda geçerli: her düğme basılınca 0,94'e iner ve press yayıyla (500/22) döner. Ekran parçaları bulanıklıktan gelir (12 px bulanık, 12 px yükselme, 0,97'den, 450 ms, arrive eğrisi) ve 70 ms arayla sıralanır; liste satırları 60 ms arayla. Sekme geçişinde eski ekran 200 ms'de çıkar, yenisi 70 ms sonra girer, seçili sekme simgesi 0,5'ten pop yayıyla büyür ve sekme diski tabLead/tabTrail yaylarıyla esneyerek kayar. Hareket azaltılınca hiçbir şey hareket etmez, parçalar hemen görünür. Bulanıklık Android 12 altında sade solmaya döner.

| Ekran | Giriş | Dokunuş → hareket |
| --- | --- | --- |
| Keşfet / Keşfet: boş | Sekme geçişi; başlık, arama, çipler, bölüm, satır 70 ms arayla. | Çip: basış, seçili renk swap eğrisiyle yer değiştirir; liste bulanıklıktan yeniden gelir. Mekan satırı: morph yayıyla Mekan sayfasına büyür. |
| Mekan sayfası | Keşfet satırından morph; sahne görseli 16 px bulanıktan 320 ms sonra 500 ms'de netleşir. | Geri: morphBack ile satıra küçülür. Buraya giriş yap: Check-in açılır. |
| Check-in | Kart açılışı: arkadaki sayfa 0,94'e küçülür ve 14 px bulanır, içerik 300 ms sonra; kankiler pop yayıyla 70 ms arayla çıkar, sonra 4 px süzülür ve göz kırpar. | Vazgeç: açılışın tersi. Konumumu kullan: basış; sonraki ekran bu raporun dışında. |
| Mekan ve lobi | Sekme geçişi; sahnedeki kankiler pop, sonra süzülür ve göz kırpar; sohbet rozeti pop. | Masa kur: Masa kur sayfası kart açılışıyla gelir. Mekan sohbeti kartı: morph ile Mekan sohbetine büyür. |
| Masa kur | Kart açılışı; masa sahnesi bulanıktan netleşir. | Simge karosu: basış, seçim halkası swap eğrisiyle geçer, sahne görseli bulanıklık üzerinden değişir (çıkış 220, giriş 450 ms). Anahtar: topuz press yayıyla kayar. Masayı kur: sayfa kapanır, Masa ekranı morph ile büyür. |
| Masa | Masa kur'dan morph; avatar pop; oyun kartları bulanık camdan 320 ms sonra 500 ms'de netleşir, 70 ms arayla. | Üst çubuk düğmeleri ve Bitir: basış; açtıkları ekranlar bu raporun dışında. |
| Mesajlar / İstekler boş | Sekme geçişi; satırlar 60 ms arayla; yeni sohbet düğmesi pop. | Sohbetler/İstekler: beyaz disk swap eğrisiyle kayar, liste ya da boş hâl bulanıklıktan gelir. Satır: morph ile DM'ye büyür. |
| DM | Satırdan morph; balonlar 60 ms arayla. | Gelen ya da giden yeni balon pop yayıyla. Gönder: basış. Geri: morphBack. |
| Aktiviteler (iki hâl) | Sekme geçişi; satırlar 60 ms arayla. | Etkinlikler/Geçmiş: disk swap eğrisiyle kayar. Satır dokunuşu tanımsız (açık sorular). |
| Profil | Sekme geçişi; iki kart pop, 70 ms arayla; kapsül göz kırpar. | Profil fotoğrafı kartı: Profil fotoğrafı kart açılışıyla. Profili düzenle ve Kapsülünü süsle: düğmeden morph. |
| Profil fotoğrafı | Kart açılışı: arkadaki 0,94 ve 14 px bulanık, üstüne koyu perde; fotoğraf 300 ms sonra pop. | Kapatma eylemi çizilmedi (P2-8, sıradaki revize). |
| Profili düzenle | Düğmeden morph; kartlar 70 ms arayla. | Geri: morphBack. |
| Kapsülün | Düğmeden morph; kapsül pop, sonra süzülür ve göz kırpar. | Çip ve karo: basış ve swap eğrisi. Parça değişince kapsül pop. Zar: basış, kapsül pop. Kaydet pasiften aktife swap eğrisiyle. |

Uygulamadan alınan sahne görselleri tek parça resim olduğu için içlerindeki kankiler süzülemez ve göz kırpamaz; bu, özgün katmanlı dosyalar kullanılırsa mümkün olur.

**Titreşim anları:** hareket panosunda titreşim tanımı yok, bu ekranlarda titreşim anı belirlenmedi. Davranış kararı olduğu için açık sorulara yazıldı.

## 4. Sınır dışı istekler

Bu eşitlemede sınır dışı çizim yok: yeni bulanıklık katmanı, karışım modu ya da canlı arka plan kullanılmadı. Revize listesindeki sınır dışı maddeler (kod incelemesi, dosya yolları, cihaz testi, kullanıcı araştırması) revize planında gerekçeleriyle yazılı.

## 5. Açık sorular

1. Çözüldü (Gökay, 31 Eki): Check-in'deki ayrı açık rıza kutusu kalkmış hâliyle kalır. Kayıttaki onay yerinde duruyor.
2. Bu ekranlarda titreşim olacak mı, olacaksa hangi anlarda?
3. Mekan sohbeti kartı uygulamadaki gibi çelişkili hâliyle çizildi (şu an aktif + 1 rozet + henüz kimse yazmadı); düzeltmesi P1-1 revizesinde.
4. Mekan ve lobi'de alt menünün altında kalan ikinci masa bölümünün başlığı okunamıyor, bu yüzden çizilmedi. Başlığı nedir?
5. Profili düzenle'de Kaydet düğmesi görüntüde yok. Nerede duruyor?
6. Aktiviteler geçmiş satırına dokununca ne açılıyor?
7. Kurallar her ekran için koyu tema, yükleniyor ve hata hâlini istiyor; bu eşitlemede yalnızca görüntüdeki açık tema hâlleri çizildi.
8. Galeri panosu tuvalde yok; yeni bileşenlerin ekleneceği galeri ayrı bir istek olarak açılsın mı?
9. Aktiviteler sekmesinin açık hâl simgesi görüntüden yaklaşık çizildi; uygulamadaki çizimle birebir mi kontrol edilmeli?
