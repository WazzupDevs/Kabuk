# Engineering Studio: departman notları

Engineering ayrı bir ajan değildir: ana oturum ve bugünkü dört ajan (`CLAUDE.md` → Ajanlar). Bu dosya yalnız eşlemeyi ve tasarım departmanlarıyla sınırı tutar; teknik kurallar `CLAUDE.md`'de, işletim `docs/OPS.md` ve `.claude/skills/` altındadır.

| İş                                               | Kim                            |
| ------------------------------------------------ | ------------------------------ |
| Sunucu, migration, Edge Function, paylaşılan kod | ana oturum                     |
| Ekran işi, ana oturumdan ayrılabilen istemci işi | `mobil` (kendi worktree'sinde) |
| Büyük işten önce plan, kod haritası              | `mimar` (yalnız okur)          |
| Bağımsız denetim: güvenlik, gizlilik, kurallar   | `guvenlik` (yalnız okur)       |
| Bağımsız denetim: çizim, bellek, sunucu maliyeti | `performans` (yalnız okur)     |
| Uçtan uca ve görsel kapı                         | `.claude/skills/e2e`           |
| PR, `ci`, birleştirme                            | `.claude/skills/pr-akisi`      |

## Tasarım departmanlarıyla sınır

- Engineering onaylı tasarımı kendi başına değiştirmez. Teknik engel görürse (maliyet, kural, mimari) uygulamadan önce gerekçeli itirazı teslim belgesinin "İtiraz" bölümüne yazar; karar tasarım departmanına ve gerekirse proje sahibine döner.
- Onaylı teslim `tuval-aktarim` yordamıyla uygulanır (zorunlu). Teslimde olmayan değer tahmin edilmez.
- Yazan, kendi işini tek başına onaylamaz: `supabase/`, Realtime, gizlilik ya da değişmez kurala dokunan PR `guvenlik`'ten, büyük ekran ve sunucu işi `performans`'tan geçer; ana oturum ajanın dönüşünü kanıt saymaz, farkı kendisi okur ve kontrolleri kendisi koşar.
- Zamanlamaya duyarlı kod (kaydırma, boşta çağrı, geçiş) telefonda ölçülmeden ya da ekran kaydı görülmeden değiştirilmez (`docs/PROGRESS.md` → Skia build'i devir notu, 11 Kasım).

## Cihaz

Bulut oturumu telefonu ve emülatörü görmez. Telefon ölçümü proje sahibinin yerel oturumuyla alınır (`docs/denetim/olcum-protokolu.md`); ekran görüntüsü CI'daki görsel kapıdan ya da proje sahibinin telefonundan gelir.
