# Çalışma düzeni: gören oturum, tuvalden koda değişiklik akışı (18 Kasım 2026 gece, proje sahibinin kararı)

Dalga 8'in ilk gününde iki aile (profil, Keşfet) ajanlarca görülmeden yazıldı; her bakış GitHub'da yaklaşık 25 dakikalık bir çekim turuydu ve Keşfet beş tura gitti. Gün sonunda dört altyapı PR'ı birleşti, ekran PR'ı birleşmedi. Proje sahibi "yazan görmeli, ben de görüp anında müdahale edebilmeliyim" dedi ve aşağıdaki düzeni onayladı ("onaylıyorum", sohbette).

## Neden

- Arayüzü yazan hiç kimse arayüzü görmüyordu: bulut oturumunda Android emülatörü çalışmaz (KVM yok), bilgisayar klasörünü bulut oturumuna bağlama özelliği proje sahibinin hesabında kullanılamadı (klasör listede, `not_available`).
- Deponun belgelenmiş yolu (geliştirme sürümü + Metro, `docs/OPS.md` → mobil cihaz; `eas.json` → `development`) hiç kullanılmıyordu: kod değişince emülatördeki ekran derleme ve yayın olmadan yenilenir.

## Karar

1. **İki oturum.** Yerel oturum (proje sahibinin bilgisayarında, `C:\dev\Kabuk`, emülatör ve Metro ile): ekran işleri, görerek düzeltme, proje sahibinin anlık müdahalesi. Bulut oturumu: sunucu, testler, belgeler, gece koşusunun takibi ve görmeyi gerektirmeyen işler. İkisi aynı depoda, PR'larla çalışır; `ci` ve kanıt kuralları değişmez.
2. **Tuval değişikliği kendiliğinden iş olur.** Her panonun parmak izi kapsam kaydında tutulur; tuvalin son hâli depoya alınınca parmak izi değişen pano, doğrulanmış olsa da "yeniden aktarılacak" durumuna düşer. Değişen her pano ayrı küçük iştir.
3. **Tuvalde üç kural (proje sahibi):** değer parçada değiştirilir, ekranda değil; pano "taslak" ya da "hazır"dır, yalnız "hazır" aktarılır; aktarılmakta olan panodaki değişiklik sıraya girer.
4. **Bir kerelik eşleme.** Tuvalin parçaları ve değerleri kodun kiti ve token'larıyla eşitlenir (ortak parça farkları: form alanı boyu, sayfa başlığı, üst bant, menü satırı ve ikon tonu); ekran paketleri aynı farka yeniden takılmasın.
5. **Durum tablosu.** `kapsam.json` proje sahibinin okuyacağı tek sayfalık tabloya çevrilir (eski, yazıldı, görüntüyle doğrulandı, telefonda onaylandı).
6. **"Bitti":** emülatörde panoyla karşılaştırıldı, iki temada bakıldı, otomatik görüntüsü kaydedildi, proje sahibi telefonda onayladı.
7. **Dondurma** tuval tamamen aktarıldıktan sonra; ardından pilot kapsamı konuşulur.

## Sıra

1. Eldeki iki aile kapanır (#745 Keşfet, #747 profil).
2. Yerel düzen kurulur (yönerge sohbette verildi; durma kuralı: bir adım iki denemede çözülmezse bırakılır). Yedeği: görsel kapı ekranlarını bulut ortamında tarayıcıda çizen ön izleme denemesi (`claude/web-onizleme`; Android çekimi son kanıt kalır).
3. Bir kerelik eşleme (madde 4). 4. Pano parmak izi (madde 2). 5. Durum tablosu (madde 5).
4. Kalan aileler yeni döngüyle. 7. Dondurma ve pilot.

Yerel düzen çalışmadan 6. adıma geçilmez.

## Aynı gün verilen öteki cevaplar

- Kaydırma: üst bölümle birlikte bütün düğmeler de gizlenir (`docs/decisions/kaydirma.md`).
- Şikayet sayfasında ilk sebep ("Taciz") panodaki gibi seçili gelir; proje sahibine yanlışlıkla gönderme riski yazıldı, yanıt gelmedi (tuvale sadık bırakıldı).
