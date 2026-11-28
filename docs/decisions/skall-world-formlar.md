# skall.world: kampüs oylaması ve mekan başvurusu (28 Kasım 2026)

Proje sahibinin kararları (28 Kasım, sohbet):

- **Kampüs oylaması gerçek olur.** Ana sayfadaki gizli "Kampüsünü çağır" bölümü açılır; oylar ve okul başvuruları sitenin kendi Cloudflare Worker'ında ve D1 veritabanında tutulur (site zaten aynı Worker'dan yayınlanıyor, `wrangler.jsonc`). Supabase'e ve uygulamaya dokunulmaz.
- **Kimlik yok:** e-posta ya da telefon istenmez. Cihaz başına tek oy (tarayıcının ürettiği rastgele cihaz anahtarı; sunucu yalnız özetini tutar), IP başına günlük sınır (IP'nin kendisi değil, sırla özetlenmiş hâli ve en geç üç gün), her gönderimde Cloudflare Turnstile.
- **Okul listesi ve yeni okul başvurularının onayı yönetici işidir.** Başvurulan okul onaylanana kadar listede görünmez; başvuranın oyu ona sayılır. Onay D1 konsolundan tek SQL satırıyla (`docs/OPS.md` → "skall.world formları").
- **Yeni sayfa `skall.world/mekanlar`** ("Mekan sahibi misin?"): skall'ın mekana ne kattığı, gerçek ekran görüntüleriyle dört adımlık öğretici, bugünkü durum (kampüsler, Skall Üniversitesi, semt sohbeti), "yakında" diye ayrılmış ve vaat etmeyen fikirler, sonunda pilot mekan teklifi ve başvuru formu (mekan adı, ilçe, yetkili, telefon, e-posta, aydınlatma metnini okudum kutusu). Başvuru D1'e yazılır ve `support@skall.world`'e e-posta gider (Resend; anahtar Worker sırrıdır).
- **Ana sayfa ve menüden** "Mekan sahibi misin?" bağlantısı.

Oturumun verdiği kararlar:

- Sınırlar (IP başına, gün başına): oy 20 (kampüs ağında çok kişi aynı IP'den çıkar), okul başvurusu 5, mekan başvurusu 5. `scripts/site/forms.ts` → `DAILY_LIMITS`.
- Mekan başvuruları en geç 1 yıl, IP sayaçları en geç 3 gün saklanır; Worker'ın günlük zamanlanmış işi siler. Oylar kişisel veri taşımaz (cihaz anahtarının özeti ve okul).
- Güvenlik denetimiyle: bildirim e-postası yalnız mekan adını, ilçeyi ve satırın id'sini taşır (yetkilinin bilgileri Resend'e ve gelen kutusuna gitmez); IPv6'da sınır /64 önekine göre; Turnstile yanıtının alan adı denetlenir; Workers çağrı günlükleri kapalı (IP ve konum tutmasınlar); onaylanmamış okulun adı yanıta girmez.
- Kutu "okudum" der, "onaylıyorum" demez: aydınlatma onaylanmaz (`yasal-metinler.md`). Kayıt, gösterilen bölümün sürümünü (`VENUE_NOTICE_VERSION`) tutar.
- **Uygulamadaki onay sürümü artmaz.** Eklenen maddeler yalnız site ziyaretçisinin form verisini anlatır; uygulama kullanıcısının verisinin işlenişi değişmez ve onay sürümü sunucuyla paylaşılan dosyadadır (`_shared/pure/consent.ts`; bu iş Supabase'e dokunmaz). Uygulama içi metin yine `scripts/site/legal-docs.ts` ile yeniden üretilir; yeni bölümler kendi geçerlilik tarihini yazar.
- Sırlar (Turnstile gizli anahtarı, IP özet tuzu, Resend anahtarı) Cloudflare'de Worker sırrıdır, repoya girmez. Turnstile site anahtarı gizli değildir; panelde düz değişkendir ve sayfaya `/api/ayar`'dan gelir (`keep_vars`). Yapılandırma eksikse formlar kapalı kalır, sayfa yine açılır.
- Worker yalnız `/api/*`'de çalışır; geri kalan her istek doğrudan statik dosyalardır (`run_worker_first`).
- **Bütün üniversiteler listede** (proje sahibi, 28 Kasım): YÖK'ün devlet ve vakıf üniversiteleri listesinin tamamı (28 Kasım 2026: 128 + 74), skall'ın zaten olduğu Sakarya Üniversitesi ve İstanbul Gelişim Üniversitesi dışında (`scripts/site/d1/0003_tum_universiteler.sql`). Askerî akademiler, vakıf meslek yüksekokulları ve KKTC üniversiteleri listede yok; başvuruyla gelebilir.
