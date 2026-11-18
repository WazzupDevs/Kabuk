# Kaydırma davranışı: gizlenip geri gelen üst bölüm (18 Kasım 2026, proje sahibinin kararı)

Proje sahibi önce "başlık küçülür, çubuk sabitlenir, hiçbir öğe çift görünmez" davranışını denedi; sonra X ve Instagram'ın ana akışındaki davranışı sordu, Mekân → Akış'ta etkileşimli önizlemesini gördü ve beğendi. Karar galeride ekran ekran verilir (https://claude.ai/artifact/X1xS4vGkXAj1HwQhFfsjqn; ilk dört ekran: Mekân → Akış, Mesajlar, Keşfet, Arkadaşlar). Hiçbir ekranın kodu galeride onaylanmadan değişmez.

## Karar

- **Gizlenip geri gelen** (Keşfet dışındaki kaydırılan ekranlar; ilk onaylananlar Mekân → Akış, Mesajlar, Arkadaşlar): aşağı kaydırınca ekranın üst bölümü (başlık satırı, düğmeler, arama, sekme ya da seçici çubuğu) kaydırma farkı kadar yukarı gider; yukarı azıcık kaydırınca, listenin neresinde olunursa olunsun, hemen döner; parmak bırakılınca yarıda kalmaz, son kaydırma yönüne göre tam açık ya da tam kapalıya oturur (önizlemede 180 ms). Liste başındayken hep açıktır.
- **Keşfet tuvaldeki gibi kalır** (küçülüp sabitlenen, pano 10c): başlık gider; arama, harita düğmesi, çipler ve Semte Git'in küçük şeridi tepeye yapışır.
- **Alt sekme çubuğu** bu ekranlarda aşağı kaydırınca tamamen gizlenir, yukarı kaydırınca döner (bugünkü "küçülür" davranışının yerine).

Bu karar şunları değiştirir; metinleri uygulamanın PR'ında güncellenir: CLAUDE.md "Ekran davranışı"nın "Üst düğmeler hiçbir ekranda içerikle kaymaz" (2 Kasım) ve "Sekme çubuğu aşağı kaydırınca küçülür" maddeleri, `docs/design/iskelet.md` 3.1–3.3, ve bu ekranların tuvaldeki kaydırılmış panoları (01b, 06b, 23, 28: panodan bilerek ayrılır).

## Açık kalanlar (proje sahibine soruldu, yanıt bekliyor)

- Gezinme ve bildirim düğmeleri (geri, ⋮, bildirim, kimlik seçici) de gizlensin mi? Önizlemede hepsi gizleniyor ve proje sahibi önizlemeyi onayladı; oturumun önerisi bu düğmelerin kalmasıydı. Uygulamadan önce tek soruyla netleştirilir.
- Sıradaki ekranlar galeriye eklenecek: Aktiviteler (Etkinlikler, Geçmiş), Mekân → Masalar, Arşiv, Profilim, başkasının profili, mekan detayı, Hesap, Profili düzenle, yasal metin, kapsül galerisi, Tüm aksesuarlar, masada oyun seç.
- Tuvalin hareket kuralı ("kaydırmaya bağlı hareketler doğrusaldır ve azaltta durur") gizlenip geri gelen davranışın oturma geçişiyle birlikte yeniden yazılmalı; "hareketi azalt" açıkken oturma anında olur.

## Bugünkü durumun dökümü

Kaydırılan 52 ekran ve hâlin koddan dökümü `docs/design/yeni-arayuz/kaydirma-dokumu.md`'de (yalnız kod okunarak; cihazda görülmedi). Özeti: ortak parçalar (`src/motion/ScrollScreen.tsx`, `StickyField.tsx`, `TopBar.tsx`, `Cover.tsx`, `CollapsingCard.tsx`) kaydırmaya doğrusal bağlı çalışıyor; "hareketi azalt" hiçbirinde okunmuyor; başlık geçişi iki ayrı öğeyle yapıldığı için Hesap, Profili düzenle, yasal metin, kapsül galerisi, Mekân, mekan detayı ve başkasının profilinde ad ya da başlık bir aralıkta çift görünüyor. Uygulama yolu: ortak parçaya "üst bölüm kaydırma farkıyla gizlenir ve oturur" davranışı bir kez eklenir (teknik için önce Telegram Android ve Bluesky'ın aynı işi nasıl yaptığına bakılır; yalnız yöntem), sonra ekranlar tek tek bağlanır.
