# skall OS: departmanlar, iki tasarım ajanı, Atölye (11 Kasım 2026)

Karar (proje sahibi, sohbette, 11 Kasım): geliştirme üç departman olarak adlandırılır (UI/UX Studio, Capsule Art Studio, Engineering Studio); iki tasarım ajanı (`ui-ux-studio`, `capsule-art-studio`), dört yordam (`ui-screen-audit`, `ui-workshop-workflow`, `capsule-accessory-design`, `svg-asset-validation`), bir hafıza dizini (`docs/skall-os/`) ve Atölye (UI Workshop) eklenir.

İstek daha genişti (beş yeni ajan, on skill, sekiz hafıza dosyası, her push ve birleştirme için onay). Kurulum öncesi inceleme (`docs/skall-os/INSTALLATION_AUDIT.md`) bunun var olan düzenle çakıştığını gösterdi; proje sahibi küçük hâlini onayladı:

- **Ajanlar:** "yalnızca dört ajan" (30 Ekim) kuralı "dört mühendislik ajanı ve iki tasarım ajanı" oldu. İstenen `engineering-studio`, `qa-reviewer` ve `codebase-mapper` açılmadı: işlerini `mobil` ve ana oturum, `guvenlik` ve `performans`, `mimar` yapıyor.
- **Eşzamanlılık:** "aynı anda en çok bir ajan" kuralı "en çok bir yazan ajan; yalnız okuyanlar paralel" oldu.
- **Onay:** hızlı yol (27 Ekim) değişmedi: `ci` yeşil PR'ı Claude birleştirir. Tek ek kapı tasarımdadır: Atölye'deki taslak proje sahibinin sohbetteki onayı olmadan üretim ekranına girmez.
- **Tasarım kaynağı:** değişmedi (`tuval-kaynak.md`): yeni görünüşün kaynağı aura tuvali, var olan ekranın kaynağı uygulama. Atölye tuvalin yerine geçmez; önerinin gerçek bileşenlerle, telefondaki hâlini gösterir. Figma ve ücretli araç kullanılmaz.
- **Hafıza:** ürün belgesi, kararlar, açık işler ve denetim bulguları kopyalanmadı; `docs/skall-os/README.md` yerlerini gösterir. Yeni içerik yalnız departman notları, teslim şablonu ve aksesuar kaydıdır.
- **Atölye'nin yeri:** var olan Bileşen önizleme ekranında yeni bir set (`features/design/workshop/`). Storybook yeni bağımlılık, ayrı Expo uygulaması yerel modüller yüzünden ikinci build isterdi. Bedeli: araç uygulamanın paketindedir (üretimde `designPickerEnabled` ile kapalı), tam ayrı bir araç değildir.
- **M15:** istek "henüz başlatılmayacak" diyordu; M15 10 Kasım'da yapılmıştı (`docs/denetim/uctan-uca-2026-11.md`). Hafızaya olduğu gibi girdi: yapıldı, bulguları açık.
