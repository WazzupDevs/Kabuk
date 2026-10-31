# Mekân sohbeti balonları (Grup 3, P4)

31 Ekim 2026, proje sahibinin onayladığı Aura v46 (MekanSohbeti, MekanSohbetiKoyu panoları).

- Mekân sohbetinde kendi balonu mor (`KIT.primary`), yazısı beyaz, saati %90 beyaz; karşı balon ekranın camı (`c.glass`, `c.glassEdge`). DM ve Masa sohbetinin balonları değişmez.
- 29 Ekim'deki "balonlar asla saydam değil" kararı yalnızca Mekân sohbetinde bu panolarla değişti. Cam balon gerçek bulanıklık değildir: kaydırılan listede her balon için cam modülü (`LiquidGlassView`) pahalıdır ve balonlar camın örneklediği katmanın içindedir. Panodaki `.glass` dolgusu ve kenarı çizilir, bulanıklaştırma yapılmaz.
- Cam balonda kuyruk yok (panoda yazara bakan alt köşe 8); mor balonda kuyruk kalır.
- Gönderenin adı balonun içinden üstüne çıkar, gönderenin renginde (`nameInk`), yumuşak bir hapın içinde (açıkta beyaz %56, koyuda #0D0B1E %64). Masa sohbetinde ad balonun içinde kalır (28 Ekim kararı).
