# Grup 6: Profil sistemi (aura v50)

Onay: proje sahibi, 31 Ekim. Kaynak: aura tuvali v50, panolar ProfilDuzenle, Kapsul, ProfilKoyu, ProfilDar, ProfilDuzenleKlavye, ProfilBaskasi, GaleriProfil, not motionProfil.

- P5 (#318): profil ekranlarında hata `warn`, bağlantı `link` (Grup 4 token'ları; yeni token yok).
- P1 (#319): `Screen` isteğe bağlı `footer` alır: klavye kapalıyken sekme çubuğunun, açıkken klavyenin 12 dp üstünde. Alan `Screen`'in `KeyboardAvoidingView`'ının içinde, klavye ofsetini o verir (ikinci ofset yok); taşınca 24 dp zemin solması. Profili düzenle'de Kaydet ve hata orada.
- P4 (#320): Kapsülün'de Kaydet etiketi değişmez; "Kapsülün kaydedildi." onay ikonlu ayrı satır.
- P2 (#321): Profil düğmeleri 360 dp altında ya da `fontScale > 1.15`'te alt alta, 58 dp. Profil alt boşluğu `Screen`'in sekme payıyla zaten karşılanıyor (son satır çubuğun 26 dp üstünde), kod değişmedi.
- P3: kişi profili ve mekân sohbeti profili ortak `ProfileTopBar` (`Round` 48: geri, Seçenekler), `Btn` 50, `T`; "Arkadaşsınız" 50 dp yeşil hap (`KIT.light/dark` → `friendPill`, `friendPillInk`, yeni iki değer). Menüler CapIcon (`MenuItem` → isteğe bağlı `cap`), yeni `gallery` ikonu. `PhotoSheet` ikonları Check-in kimlik sayfasında ve kayıttaki `extras`'ta da değişir; davranış aynı. `Loader` uygulamanın ortak yükleme göstergesi olarak kaldı; menü ve onay sayfalarının içi (Vazgeç, metin) eski bileşenlerde. `guvenlik` denetimi: bulgu yok.
