# Ortak tasarım ve hareket dili: iskelet (12 Kasım 2026)

Karar (proje sahibi, 12 Kasım 2026, sohbette verilen iş paketi): uygulamanın arayüzü tek bir ortak dile ve iOS akıcılığına taşınır. Kurallar `docs/design/iskelet.md`'dedir (iş paketinin 2 ile 6 arasındaki bölümleri); görsel kaynak https://claude.ai/artifact/WJmhCyXCHejJcnaFk8ZfcR. Veri, sunucu, mantık ve navigasyon yapısı aynı kalır.

## Değiştirdiği önceki kararlar

- **Riso düğmeler (8 Kasım, `riso-dugme.md`): geçersiz.** Düğmelerin hepsi cam (prominent, clear, danger); riso çizimlerde ve kankilerde kalır.
- **Canlı cam kapalı (6 Kasım, `cam-kapali.md`): daraltıldı.** Canlı bulanıklık yalnız üst bar bandında, sekme çubuğunda, alt sayfalarda, menülerde ve sabitlenen şeritlerde geri gelir (buzlu cam modülü; Liquid Glass merceği değil). Düğmelerde ve kartlarda canlı bulanıklık yine yok. Bulanıklık kaydırmada yeniden hesaplanmaz: katman bir kez çizilir, yalnız opaklığı değişir. 6 Kasım'ın gerekçesi (her karede yeniden hesaplanan cam) bu koşulla karşılanır.
- **Tasarım kapısı (11 Kasım):** bu paketin ekranları proje sahibinin onayıyla gelir; Atölye'de ayrıca taslak istenmez.
- **Süreç:** paket hızlı yolla yürür (adım başına PR, `ci` yeşil olunca birleşir, OTA).

## Teslim sırası

1. `iskelet.md`, `MOTION` eklemeleri, hareket kiti (`src/motion`: Tap, Rise, PopIn, Sheet, Menu, TopBar, ScrollScreen, StickyField, TabBar), cam `Btn`, styleGuard yasakları.
2. Ekranlar 5.1'den 5.11'e.
3. Bölüm 6'daki hatalar.
4. 6.5 (iPhone'da 120 Hz) bir sonraki native build'e.

## İki sorunun sonucu (12 Kasım)

Proje sahibi gece yürütmesinden önce her şeyi önceden onayladı; iki soruda oturumun önerisi uygulandı:

- **5.6 "Birlikte oynanan oyunlar":** yalnız iki tarafın da masada profilli oturduğu kayıtlar gösterilecek (kural 4 ve K-75 değişmez). Sunucu sorgusu henüz yazılmadı.
- **5.10 kapsül düzenleyici:** en son yazıldı ve OTA ile gitti (#589); proje sahibinden ekran kaydı istenir. Seçim kuralı saf modülde ve testli (`src/lib/snapPick.ts`).

## Uygulama (12 Kasım gecesi)

| Adım      | PR   | Not                                                                                         |
| --------- | ---- | ------------------------------------------------------------------------------------------- |
| Belge     | #577 | `docs/design/iskelet.md`                                                                    |
| 1a        | #579 | Cam düğmeler, `MOTION` eklemeleri, basma gecikmesi, saydamlığı azalt                        |
| 1b        | #580 | `src/motion` kiti (Tap, Rise, PopIn, Sheet, Menu), ortak alt sayfa ve menü, hareket cırcırı |
| 1c        | #582 | Üst bar türleri, yapışan alan, etiketli ve küçülen sekme çubuğu, `ios_from_right`           |
| 5.1       | #583 | Keşfet                                                                                      |
| 5.2, 5.3  | #584 | Mekan detayı, Aktiviteler                                                                   |
| 5.4, 5.5  | #585 | Mesajlar, DM                                                                                |
| 5.6–5.8   | #586 | Profiller, Profili düzenle, Arkadaşlar                                                      |
| 5.9, 5.11 | #588 | Ayarlar, Mekan                                                                              |
| 5.10, 6.3 | #589 | Kapsül düzenleyici                                                                          |
| 6.1, 6.2  | #578 | Kinshi ve Krot; dolu masa lobiye açılamaz                                                   |

Belgeden sapmalar (ayrıntı PR açıklamalarında):

- **Canlı cam:** yalnız alt sayfalarda ve menülerde açık (`SHEET_GLASS`). Üst bar bandı, sekme çubuğu, alt kenar ve sabit şeritler sahte camla çizildi: içerik kayarken camın yeniden hesaplanması önlenemedi ve bugünkü anahtar bütün clear düğmeleri de buzlardı.
- **Kenardan geri kaydırma:** Android'de yok (native-stack yalnız iOS'ta sunuyor).
- **Kural 4:** başkasının profilinde kapsül ve geçmiş satırında "Anonim" yazılmadı; "İstek gitti" yerine bugünkü "Eklendi" ve "Gönderildi" kaldı.
- **Sohbet:** `ChatList`'in kaydırma mantığına dokunulmadı; yeni mesajda öteki satırların yumuşak kayması ve alttaki bant yapılmadı.
- **Kontrast:** beyaz yazı yeşil ve kırmızı geçişin açık ucunda AA'nın altında (2,99 ve 3,9); renkler belgedeki gibi.
- **Kabul ölçütü "doğrudan import yok":** cırcır kuruldu, izinli liste küçüldü ama sıfıra inmedi (oyun sahneleri ve dokunulmayan özellikler).
- **Göz kırpma (5.10):** büyük kapsülün çizim yoluna girilmediği için yok.

## Panolarla fark kapatma (12 Kasım, öğleden sonra)

Gece yürütmesi ekranları yalnız `iskelet.md` metninden yazdı; tuval panoları açılmadı ve proje sahibi sonucu "referansın birebir aynısı olmamış" diye bildirdi. Panolar (`project/*.dc.html`) indirildi, her ekranın ölçüsü (sıra, boşluk, köşe, yazı, renk, görsel ve kanki yeri) öğe öğe eşitlendi. `iskelet.md`'nin açıkça yazdığı değer kaldı; yazmadığı her şey panodan alındı. Yeni özellik eklenmedi.

| Ekranlar                               | PR   |
| -------------------------------------- | ---- |
| Keşfet, Harita, sekme çubuğu           | #592 |
| Mekan detayı, Aktiviteler, oyun detayı | #594 |
| Mesajlar, bildirimler, DM, menü, onay  | #595 |
| Profiller, Profili düzenle, Arkadaşlar | #596 |
| Ayarlar, Mekan                         | #597 |
| Kapsül düzenleyici (durağan yerleşim)  | #598 |

Ders: onaylı tasarım aktarımında panonun kendisi okunur (`.claude/skills/tuval-aktarim`); metin belge panonun yerini tutmaz.

## Belgeye yazarken düzeltilen atıflar

İş paketindeki üç iç atıf numarası başka bölümü gösteriyordu; `iskelet.md`'de anlamına göre düzeltildi: kapak türü "5.7, 5.6 ve 5.2", Mesajlar'daki arama "5.4", menünün yayı "4.3 → `springs.menu`".
