# Yasal metinler: üretim metinleri (12 Kasım 2026)

Proje sahibinin isteği: taslak ve uygulamada üç cümlelik yer tutucu olan yasal metinler Türkiye için tam metne çevrilir ve uygulamaya girer. Kararlar proje sahibinin (12 Kasım, sohbet):

- **Konumun hukuki sebebi sözleşmenin ifası** (KVKK m. 5/2-c), açık rıza değil. Gerekçe: check-in konumsuz yapılamaz; Kurul hizmetin açık rızaya bağlanmasını geçersiz sayar ve başka işleme şartı varken açık rıza istenmesini yanıltıcı bulur (ilke kararı 2026/347, RG 24 Mart 2026). "Konumumu kullan"ın üstündeki metin rıza değil bilgilendirmedir (`tr.checkin.locationBody`). Sunucu, gösterilen metnin sürümünü kaydetmeyi sürdürür; `draft-1` değeri kurulu uygulamalar bozulmasın diye değişmedi (`aura-31.md`'deki "rızayı düğme verir" kararının yerine).
- **Kullanım istatistiği meşru menfaat** (m. 5/2-f), varsayılan açık; Ayarlar → Gizlilik'te "Kullanım istatistiği" anahtarıyla kapatılır. Tercih telefonda durur (`skall.analytics.off`); okunana kadar hiçbir olay gitmez (`src/lib/analytics.ts`).
- **Hiçbir işleme açık rızaya dayanmaz**; ayrı açık rıza metni yoktur. Onay ekranında koşullar "okudum ve kabul ediyorum", aydınlatma metni "okudum ve anladım" (aydınlatma onaylanmaz), düğme "Devam et".
- **Veri sorumlusu gerçek kişidir** (mağaza hesapları bireysel). Ad soyad, KEP ve posta adresi tek yerde: `supabase/functions/_shared/pure/legalEntity.ts`. Ad boşken site ve uygulama her metnin üstünde taslak notunu gösterir; ad yazılınca not kendiliğinden kalkar. Ev adresi yazılmaz; yazılı başvuru için KEP adresi önerildi.

Yapılanlar:

- `docs/legal/`: gizlilik politikası, KVKK aydınlatma metni, kullanım koşulları (App Store ek hükümleriyle), hesap silme yeniden yazıldı; topluluk kuralları ve çocuk güvenliği standartları (Google Play Child Safety Standards) eklendi. Semte Git, kapak, hediye paketleri ve yeni oyunların verisi metinlere girdi (denetim F2, F5).
- Uygulama metinleri aynı dosyalardan okur: `scripts/site/legal-docs.ts` → `apps/mobile/src/i18n/legalDocs.generated.ts` (test eşitliği denetler), `LegalText` yerel çizer (`_shared/pure/legalMarkdown.ts`). `EXPO_PUBLIC_PRIVACY_URL` kullanılmıyor.
- Onay sürümleri `2026-11` (`consent.ts`): herkes yeni metinleri bir kez görür.
- Hesap → İletişim satırı her zaman görünür (adres `legalEntity.ts`'ten).

Metinlerin doğru kalması için açık işler (proje sahibi ve sonraki paketler):

1. Yurt dışındaki sağlayıcılarla (Supabase, Expo, PostHog, Sentry) Kurul'un standart sözleşmesi imzalanır ve 5 iş günü içinde Kurul'a bildirilir; metinler aktarımı buna dayandırıyor.
2. Yaş doğrulama: 5651 ek m. 4 ve 10 Ekim 2026 tarihli yönetmelik (1 Kasım 2026) sosyal ağ sağlayıcıdan hesap açılışında e-Devlet yaş belirteci istiyor; teknik kılavuz çıkınca kayıt akışına eklenir. Koşullar buna yer açtı (m. 2).
3. Metinlerin söylediği süreler: giriş kayıtları (`auth.audit_log_entries`) en fazla 2 yıl (silen iş yok), PostHog saklama süresi en fazla 1 yıl (panel ayarı), Sentry en fazla 90 gün (panel ayarı).
4. Şikayetler 24 saatte incelenir (App Store 1.2); çocuk güvenliği iletişim noktası Play Console'a girilir.
5. Hukukçu kontrolü: 5651 yer sağlayıcılık bildirimi ve trafik kaydı, masadaki anonimliğin cinsiyete bağlı olması (6701 sayılı Kanun), kapatılan hesabın numara özetinin süresi.
