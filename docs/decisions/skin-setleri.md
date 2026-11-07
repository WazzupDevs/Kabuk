# Elf ve Ninja: paket değil skin seti (7 Kasım 2026)

Karar (proje sahibi): Elf ve Ninja ayrı hediye paketi değil, skin setidir. Parçaları Efsanevi'dir ve dört paketten (Bronz, Gümüş, Altın, Elmas) öteki Efsanevi parçalarla aynı ağırlıkta çıkar. Paketler ekranında Elf ve Ninja paketi yoktur. Sonra gelecek skin setleri de böyle gelir.

Önceki hâl (#512): Elf ve Ninja kilitli "Yakında" temalı paketlerdi; yalnız kendi parçalarını verirlerdi, tam set parçaları yarı ağırlıktaydı.

Uygulama: `content/gift-packs.json` → `sets` ve parçada `set`; `gift_accessories.pack` kolonu parçanın setini tutar (adı değişmedi). `private.gifts_in_pool` her tier paketine her parçayı verir. Dev projesinde açılmış Elf ve Ninja parçaları sahibinde kalır, kaynakları Elmas yazılır (`20261207090000_gift_sets.sql`). Tam set balonu sürer.
