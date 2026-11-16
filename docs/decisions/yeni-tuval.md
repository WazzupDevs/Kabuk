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

a. **Odadakiler (semt sohbeti):** panodaki gibi tam liste: kişi sayısı, profilli ve anonim herkes (yazmayanlar dahil), geliş zamanı. Bu, değişmez kural 4'ün semt sohbeti maddesini ("Odanın kişi sayısı hiçbir yanıtta, Realtime yükünde ve ekranda görünmez (presence ve son yazanlar yok)", "Kişinin semti hiçbir kullanıcıya gitmez") ve `docs/SPEC_V4.md` §4.V'yi değiştirir; CLAUDE.md değişikliği o paketin PR'ında, proje sahibinin sohbetteki "onaylandı"sıyla. Sınırlar: anonim satır hesaba, nick'e ya da arkadaşlığa bağlanmaz ("Arkadaşın" etiketi yalnız profilli satırda); profil kimliği gitmez.

b. **Ortak arkadaş:** yalnız zaten arkadaş olunan kişinin profilinde, sayı ve adlarla. Arkadaş olmayanın profilinde (mekan ya da semt sohbetinden açılan) gösterilmez.

c. **Sohbet sabitleme ve arşiv:** sunucuda, hesaba bağlı; en çok 5 sabit. Arşivdeki sohbete yeni mesaj gelince sohbet arşivde kalır, okunmamış sayısı Arşivlenenler satırında görünür.

d. **Sohbeti sil:** yalnız silende; sunucuda "bu andan öncesi bana gizli" işareti. Karşı taraf görmez, arkadaşlık sürer, yeni mesaj sohbeti o mesajdan itibaren yeniden gösterir; şikayet kayıtları etkilenmez.

e. **DM düzenleme:** kendi metin mesajı, gönderildikten sonraki 15 dakika içinde; karşı tarafta "düzenlendi". Küfür filtresi yeniden uygulanır (kural 7); eski metin saklanmaz.

f. **Kapsül kaydı:** Süsle ve Tüm aksesuarlar tek taslağı paylaşır; Kaydet yalnız Süsle'de; sunucuda tek atomik yazma (`profile/save-look`).
