# Kurulum raporu (11 Kasım 2026)

Kapsam proje sahibinin onayladığı küçük kurulumdur (`docs/decisions/skall-os.md`); inceleme `INSTALLATION_AUDIT.md`.

## Kurulanlar

| Tür              | Ne                                                                                                                                                                                         |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Departmanlar     | UI/UX Studio, Capsule Art Studio, Engineering Studio (Engineering var olan ana oturum ve dört ajandır)                                                                                     |
| Ajanlar (yeni)   | `.claude/agents/ui-ux-studio.md`, `.claude/agents/capsule-art-studio.md`                                                                                                                   |
| Skill'ler (yeni) | `.claude/skills/ui-screen-audit`, `ui-workshop-workflow`, `capsule-accessory-design`, `svg-asset-validation`                                                                               |
| Hafıza           | `docs/skall-os/README.md` (dizin ve yönlendirme), `departments/UI_UX.md`, `CAPSULE_ART.md`, `ENGINEERING.md`, `handoffs/README.md` (şablon), `assets/kapsul-aksesuarlari.md` (67 aksesuar) |
| Atölye           | `apps/mobile/src/features/design/workshop/` (`registry.tsx`, `WorkshopSet.tsx`, `drafts.ts`, `drafts.test.ts`); Bileşen önizlemede "Atölye" seti                                           |
| Test             | `scripts/skall-os.test.ts` (katalog ile aksesuar kaydı eşit), `workshop/drafts.test.ts`                                                                                                    |
| Kurallar         | `CLAUDE.md`: "Nerede ne var"a üç satır, ajan kuralı (dört mühendislik, iki tasarım ajanı), yazan ajan tek ve okuyanlar paralel, tasarım kapısı                                             |
| Karar            | `docs/decisions/skall-os.md`                                                                                                                                                               |

Açılmayanlar ve nedeni: `engineering-studio`, `qa-reviewer`, `codebase-mapper` ajanları (işleri var olan dört ajanda); `PRODUCT_BIBLE`, `TECHNICAL_ARCHITECTURE`, `DESIGN_SYSTEM`, `DECISION_LOG`, `OPEN_ISSUES` (kaynakları var, kopyalanmadı); `skall-task-intake`, `visual-redesign`, `engineering-change`, `regression-check`, `decision-record`, `department-handoff` skill'leri (karşılıkları `docs/skall-os/README.md` yönlendirme tablosu, `ui-workshop-workflow`, `pr-akisi`, `e2e`, `docs/decisions/`, teslim şablonu).

## Atölye: yapı ve çalıştırma

- Var olan Bileşen önizleme ekranının (`app/(app)/design-preview.tsx`) bir setidir; yeni bağımlılık ve native değişiklik yok.
- Telefonda: preview build → Ayarlar → Tasarım (test) → Bileşen önizlemesini aç → Atölye. Taslak seçilir, varyant seçilir; "Yan yana" seçili varyantla bir sonrakini iki sütunda gösterir.
- Geliştirmede: `pnpm --filter mobile start` ile aynı ekran.
- Görüntü: Atölye görsel kapının `galeri/workshop` durumudur (`ui-workshop-workflow` 4. adım).
- Üretimde yok: ekran `designPickerEnabled` kapalıyken ana sayfaya yönlenir (yalnız preview build, geliştirme ve E2E APK'sı).
- İçinde tek örnek taslak var (`buttonOrder`): aracın çalıştığını gösterir, ürün önerisi değildir.

## Doğrulamalar

| #   | Senaryo                                          | Sonuç                                                                                                                                                                                                                                                                                                      |
| --- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | UI talebi doğru departmana gidiyor mu            | Kısmen. Ekran denetimi talebi, `ui-ux-studio` tanımı rol olarak verilen genel bir ajanla denendi (Bildirim ayarları ekranı): hafızayı ve yordamı okudu, teslim formatında 6 bulgu ve telefonda bakılacaklar döndü, kayıtlı M15-47'yi yeniden yazmadı. Ajanın kendi adıyla çağrılması denenemedi (aşağıda). |
| 2   | Aksesuar talebi Capsule Art Studio'ya gidiyor mu | Kısmen, aynı yolla. "Nadir, Yüz, yuvarlak güneş gözlüğü" kuru denemesi: kaydı okudu, dört yakın aksesuarı kimliğiyle buldu, katalog girdisi olmadığı için çizime başlamadan durdu ve sorularını ana oturuma verdi.                                                                                         |
| 3   | Teknik hata Engineering'e gidiyor mu             | Ayrıca denenmedi; var olan düzen (ana oturum, `mobil`) bu kurulumda değişmedi ve aynı gün iki pakette kullanıldı (#574 ve Atölye'nin kodu `mobil` ile yazıldı).                                                                                                                                            |
| 4   | Ajanlar ortak hafızaya erişebiliyor mu           | Evet (iki denemede de ajan okuduğu hafıza dosyalarını ilk satırda saydı).                                                                                                                                                                                                                                  |
| 5   | Skill'ler çağrılabilir mi                        | Dört skill oturumun skill listesinde göründü (dosyalar yazıldıktan sonra). Uygulanabilirlik: ikisi yukarıdaki denemelerde adım adım uygulandı; `ui-workshop-workflow` ve `svg-asset-validation` baştan sona uygulanmadı.                                                                                   |
| 6   | Teslim belgesi doğru oluşuyor mu                 | Denenmedi: gerçek bir teslim yazılmadı, yalnız şablon var.                                                                                                                                                                                                                                                 |
| 7   | Onay gerektiren işlem duruyor mu                 | Kısmen. Aksesuar denemesinde ajan katalog ve kademe için durdu. Yasak komutları durduran hook ve testi (`scripts/claude-hooks.test.ts`) var olan düzendir, `pnpm test` içinde geçti. Tasarım kapısı bir kuraldır, onu zorlayan bir araç yok.                                                               |
| 8   | Atölye ana uygulamayı etkilemeden çalışıyor mu   | Koddan: Atölye'yi yalnız `previews.tsx` içe aktarır; ekran üretimde kapalıdır. `pnpm check` temiz. Telefonda ya da emülatörde çalıştırılmadı: görülmedi.                                                                                                                                                   |
| 9   | Bağımsız denetim yapılabiliyor mu                | Var olan düzen (`guvenlik`, `performans`, ana oturumun farkı kendisi okuması). Bu kurulumda ana oturum iki ajan dönüşünü de kendisi okudu ve Atölye kodunda iki düzeltme yaptı (sabit sayı yerine token, kayıt hatasının ekranda gösterimi).                                                               |

Ayrıca: skill'lerdeki çizim kuralları 67 çizime karşı sayıldı ve üç yerde düzeltildi (`none` rengi, ondalık kuralı, tek ad istisnası); kademe başına öğe sayıları yazıldı. İki deneme yordamlarda beş belirsizlik buldu; hepsi düzeltildi (ajanın kime soracağı, test listesi, katalog girdisinin sırası, M15 kalıp bulgularının okunması, ikincil yükleme hâli).

## Başarısız ya da yapılamayan doğrulamalar

- **Yeni ajanların kendi adlarıyla çağrılması:** bu oturumda `ui-ux-studio` ve `capsule-art-studio` "bulunamadı" döndü; ajan tanımları oturum başında yüklenir. Biçim, çalışan dört ajanın biçimiyle aynıdır, ama çağrılabildikleri yeni bir oturumda doğrulanmalıdır.
- **Atölye'nin ekranda görünüşü:** görülmedi (yan yana sütunların genişliği, 320 dp'de düğmelerin sarması).
- **Görsel kapıdan Atölye görüntüsü:** koşturulmadı.
- **Yazan ajan olarak tam bir iş** (taslak kuran `ui-ux-studio`, çizen `capsule-art-studio`): yapılmadı; denemeler salt okunurdu.

## Eksik kalanlar

- Aksesuar kaydının "Not" sütunu boş: 67 aksesuarın tasarım gerekçesi kayıtlı değildi, uydurulmadı.
- Tasarım performans prensipleri (öğe sayısı sınırı, izinli hareket listesi) karar değil; `svg-asset-validation` o güne kadar "aynı kademenin en ağırını geçme" ölçütünü kullanır.
- Ekran denetimi denemesinin Bildirim ayarları bulguları (ör. izin sorgusu gelmeden "Açık" kartının görünmesi, izin kapalıyken anahtarların basılabilmesi) bir yere işlenmedi; koddan çıkarılmış, telefonda bakılmamış adaylardır.

## Proje sahibinden beklenenler

1. Yeni bir oturumda iki ajanın adıyla çağrıldığını bir kez doğrulamak (ör. "ui-ux-studio ile şu ekranı denetle").
2. Preview build'de Atölye'yi açıp bakmak: örnek taslak, "Yan yana".
3. Bildirim ayarları bulgularına bakılsın mı.

## Kullanım

- **Yöneticiye görev:** her zamanki gibi sohbete yazılır. Yönetici talebi `README.md`'deki tabloya göre yönlendirir; ayrıca komut gerekmez.
- **Belirli departman:** "UI/UX Studio şu ekranı denetlesin", "Capsule Art Studio … çizsin" ya da doğrudan ajan adı (`ui-ux-studio`, `capsule-art-studio`, `mobil`, `mimar`, `guvenlik`, `performans`).
- **Tasarım revizyonu:** "Şu ekranın şu parçası için Atölye'de iki alternatif hazırla." Taslak dev'e OTA ile gelir; telefonda bakılır; "A onaylandı" ya da "reddedildi, çünkü …" yazılır. Onaydan önce ekran değişmez.
- **Kapsül aksesuarı:** kademe, yuva ve fikir söylenir ("Nadir, Yüz, yuvarlak güneş gözlüğü"). Yönetici önce katalog girdisini (ad, ağırlık) sorar; çizim telefonda görülmeden bitmiş sayılmaz.
- **Teknik sorun:** sorun ve varsa ekran kaydı yazılır; telefonda hata ekranı çıktıysa yönetici önce Sentry'ye bakar. Zamanlamaya duyarlı kodda önce ölçüm ya da kayıt istenir.
- **Atölye'yi açmak:** Ayarlar → Tasarım (test) → Bileşen önizlemesini aç → Atölye (preview build).
- **Hafızayı güncel tutmak:** karar verildiğinde "bunu karara yaz" demek yeter (`docs/decisions/`); taslak kararları `departments/UI_UX.md`'ye, aksesuar notları `assets/kapsul-aksesuarlari.md`'ye işi yapan oturum yazar. Katalogla kayıt ayrışırsa `pnpm test` düşer.
- **Onay ne zaman istenir:** tasarım taslağında (uygulamadan önce); aksesuarın kademe, ağırlık ve adında; değişmez kurala dokunan kararda, geri alınamaz silmede, ürün belgesinde olmayan ürün kararında, üretim yayınında ve para tutan kararda. Bunların dışında `ci` yeşil PR'ı yönetici birleştirir ve tek satırla bildirir.
