# Var olan ekranın kaynağı uygulama, tuval yeni tasarım için (8 Kasım 2026)

**Karar (proje sahibi, 8 Kasım):** uygulamada var olan ekranın görünüşünün kaynağı uygulamanın kendisidir (proje sahibinin telefonundaki hâl). Aura tuvali yeni ekranın ve yeni parçanın tasarım kaynağıdır.

**Neden:** tuvale işlenen şeyler proje sahibinin telefonunda hatalı görünüyordu. İki sebep:

1. Tuval geride kaldı: revize turlarında (cam kapalı, 2× hızlı geçişler, kenar solmaları yok, Süsle, masa çekmecesi…) birçok düzeltme doğrudan koda girdi, tuvale geri işlenmedi. Tuvalden bütün ekran aktarmak bu düzeltmeleri geri alır.
2. Tuval bir web sayfasıdır: bulanıklık, `mix-blend`, maske, conic gradyan ve web fontu telefonda yok ya da farklı çizilir.

**Uygulama:**

- Var olan ekrana tuvalden yalnızca istenen parça alınır; ekranın geri kalanı telefondaki hâliyle kalır (`.claude/skills/tuval-aktarim` → adım 0).
- Var olan parçalarla yapılan küçük ekleme (menü satırı, onay sayfası) tuvale çizilmeden yapılır.
- Tuvalde yeni tasarım yapılacaksa önce o ekranın telefondaki bugünkü görüntüsü tuvale konur; tuval yalnız dokunulan ekranlarda güncellenir, toptan senkron yapılmaz.
- Görsel önizleme gerektiğinde gerçek uygulamanın görsel kapı görüntüsü gönderilir (`e2e.yml` → `visual`, `masa:///gorsel` durumları; bir koşu yaklaşık 20–40 dk). Küçük metin ve düzen işinde HTML taslağı yeterlidir.
