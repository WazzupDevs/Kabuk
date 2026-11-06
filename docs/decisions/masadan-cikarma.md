# Masadan çıkar (K-88)

Proje sahibinin kararı, 6 Kasım 2026 (Masadakiler ekran görüntüsü, R-2): masa sahibinin kişileri atma düğmesi olmalı.

- Bugüne kadar sahip birini ancak Engelle ile çıkarabiliyordu (K-13); bu kalıcı bir engeldi.
- Seçilen yol (önerilen seçenek): sahibin kişi seçeneklerinde Engelle'nin üstünde "Masadan çıkar". Engel yazılmaz.
- Çıkarılan "Masadan çıkarıldın" görür. Masa sürdükçe o masaya isteği, "Bu masadayım"ı ve daveti engeldeki gibi sessizce reddedilir (`private.room_blocked_for` genişledi: `room_members.removed_at`); masa lobisinde görünmez; bekleyen isteği düşer.
- Engel değişmedi: sahibin engellediği Masa bitti görür, "Masadan çıkarıldın" görmez. Böylece engellenen hiçbir şey görmez (kural 5); çıkarılanın notu engeli ele vermez.
- Seçilmeyenler: çıkarılanın hemen yeniden istek gönderebilmesi; yeni eylem yerine yalnız Engelle'yi belirginleştirmek.
