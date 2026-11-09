# Yasal sayfalar skall.world'de (9 Kasım 2026)

Proje sahibinin kararı: repo gizliye çevrilecek; GitHub Pages ücretsiz planda gizli repodan yayın yapmaz ve Play'e girilen gizlilik ve hesap silme bağlantıları kırılırdı. Sayfalar uygulamanın alan adına (`https://skall.world/`) taşındı.
Elle zip'le yüklenen web sitesi de repoya (`web/`) alındı: site ve yasal sayfalar tek Cloudflare projesinden, `main`'den kendiliğinden yayınlanır (`wrangler.jsonc`); gizli repoya ücretsiz bağlanır, workflow ve sır gerektirmez. Yasal sayfaların listesi `index.html` yerine `yasal.html` oldu (ana sayfa sitenin; sitenin altbilgisi zaten `yasal.html`'e bağlanıyordu, altbilgideki bağlantılar sayfalara çevrildi).
