# Panoların çizmediği davranışlar

16 Kasım 2026. Yeni arayüz tuvalinin (`docs/decisions/yeni-tuval.md`) 114 panosunun başlıklarına ve kaynağı okunan 17 panoya dayanır; geri kalanlar ilgili pakette pano okunarak doğrulanır. Belgelerde panolar dosya adıyla anılır (numaralar çakışıyor, bkz. C).

## A. Hareket tarifi yok

Panolar statiktir; aşağıdakiler tasarımdan istendi (16 Kasım), tahmin edilmez:

- Uzun basma menüsü
- Merkez dialog
- Satır yer değiştirme
- DM düzenleme
- Süsle ve katalog geçişleri
- Odadakiler geçişi
- Hediye yırtma

## B. Kapsül pilotu

- Süsle yalnız "Baş" sekmesiyle çizili; Renk, Göz, Yüz, Gövde sekmeleri yok.
- Katalogdaki "Ağız" ve "Takımlar" Süsle sekmelerinde yok.
- Kaydet'in bekleme, hata ve değişiklik yok hâli yok.
- Tüm aksesuarlar: seçili parça, arama açık, sonuçsuz ve takım seçimi hâlleri yok.
- Kapsül biletinin hareketli hâli yok.

## C. Ortak

- Onaylar: kimi panoda merkez dialog (01e Sohbeti sil), `docs/design/iskelet.md` 3.5 ise geri alınamaz işlemde alt onay sayfası diyor; tek kural gerek.
- Örtü bulanıklığı uzun basma menüsünde var (panoda 6 px; uygulamada canlı cam kapalı, sabit kopya, `SCRIM_GLASS`), profil ⋮ menüsünde yok.
- Yükleniyor hâli hiçbir panoda yok.
- Hata ve bağlantı yok hâli yalnız Aktiviteler örneğinde (25, 25a).
- 320 dp ve en büyük yazı panosu yok.
- Pano numaraları çakışıyor (05a, 19, 21, 22, 25, 33–35); belgelerde pano dosya adıyla anılır.

## D. Kararların eksik ekranları

- Odadakiler: profilli hâl, uzun liste, satır menüsü, tek kişi.
- Semt sohbetinin dolu, süre bitti, kapalı ve dışarıda hâlleri.
- Ortak arkadaş listesi ekranı.
- 15 dakika sonrası DM menüsü.
- 5 sabit dolunca.
- Arşiv rozeti.

## E. Hiç çizilmemiş (bugünkü hâliyle kalır)

- On oyunun oyun içi ve sonuç ekranları; oyun seçimi ve oylama.
- Katılma isteği gelen ve bekleyen; "Bu masadayım"; davet alan; "Masadan çıkarıldın".
- Check-in kimlik ve nokta seçimi.
- Mesajlar, Bildirimler, Arkadaşlar, Keşfet ve DM boş hâlleri.
- Arama açık hâlleri.
- DM'de klavye, yanıt, fotoğraf, tepki çubuğu.
- Kayıtta hatalı kod, yeniden gönder, 18 yaş altı.

## F. Panoda olup sunucu sözleşmesi olmayanlar

- Odadakiler.
- Ortak arkadaş.
- DM sabitle, arşivle, sohbeti sil, düzenle.
- DM sohbetini sessize alma (bugün yalnız mekan ve semt sohbetinde, `venue_chat_mutes`): karar verilmedi, sorulacak.
- Mesajlar menüsünden "Profilini gör" (arkadaşlar arası, uygulanabilir).

"ÖNERİ" etiketli öğeler: Profilini gör, Sohbeti sil, Düzenle, mekan sohbetinden açılan profildeki ortak arkadaş kartı ve "Mekan sohbetinden · <üniversite>" satırı (yerleşke söylenmemeli, kural 4; `guvenlik` denetimi).

- Kayıt: panodaki "Onayla ve devam et" düğmesi ve "okuyup onaylaman" notu alınmadı; KVKK aydınlatma metni okunur, onaylanmaz (yasal neden): düğme "Devam et", not "İkisini de okuman gerekir."

- Masa (panolar `Masa`, `MasaSecenek`, `Masadakiler`, `MasaAt`, `MasaDavet`, 17 Kasım): ⋮ menüsündeki kişi sayısı ("12 kişi") ve "Sohbet kuralları" alınmadı (davranışı tanımsız); oyun kartındaki oynat rozeti alınmadı, kartın köşe etiketi (oy, "Aç", "Yakında", kişi sınırı) kalır; kartın 40'lık düğmeleri kitin küçük düğmesiyle (36); panonun "At / Masadan at" metni yerine K-88'in "Masadan çıkar"ı (satırda "Çıkar"; mekan kartının düğmeleri de 36); çıkarma onayı açılınca Masadakiler kapanır (tek açık kural, pano ikisini üst üste çiziyor); Masadakiler 320 dp ve en büyük yazıda tek sütun.
- Hediye paketi yırtma (pano `HediyeYirt`): pano "Atla" düğmesi çiziyor, 8 Kasım kararı "Atla yok"; uygulanmadı, proje sahibinin kararı bekleniyor.
- Semt ekranları (panolar `GecitSoru`, `GecitAcik`, `SemtKapandi`, `SemtDisarida`, `SemtKonum`, 17 Kasım): Geçit sorusundaki "Geçit nasıl çalışır" (i) düğmesi alınmadı (açtığı şey çizilmemiş); Geçit açıldı'daki hareket (kanat, ışık, kankiler) panoda yok, resim durağan; ışık ve kanat katmanları kullanılmıyor. Yanlış cevap sonrası `closed.tsx` (kapalı Geçit, geri sayım) ve semt sohbetindeki "süre bitti" dialogu (`SemtSureBitti`, `room.tsx` tarafı) bu pakette değişmedi. Bilet ve seçenek kenarındaki çentikler zemin renginde çizilir (renk bulutlarının üstünde hafif ton farkı olabilir).
