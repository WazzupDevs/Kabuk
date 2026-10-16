# Oda yükü ölçümü (Faz 2, adım 22.6)

`docs/SPEC_V3.md` §22.I'deki ölçümün nasıl yapılacağı. Faz 2 odanın Realtime yolunu değiştirmez: her `rooms` değişikliği Postgres Changes ile her aboneye ayrı yetki kontrolüyle gider ve her telefon oda durumunu 4 sn'de bir yoklar. 8 telefonlu odada abone ve yetki kontrolü 2 telefonun 4 katıdır. Bu sayfa o yükün eşikleri aşıp aşmadığını ölçmek içindir; aşarsa sonraki adım ayrı bir PR'dır (§22.I "Eşik ve sonraki adım").

Ölçüm iki parçadır: botlarla gecikme (istediğin zaman, dev projesinde) ve saha testi günü panel sayıları.

## 1. Gecikme: `pnpm latency` oda adımı

Bir oyun eyleminin (Sohbet'te sonraki kart) yanıtından `rooms` değişikliğinin odadaki her telefona varışına kadar geçen süre; 2, 4 ve 8 telefonla. Telefonlar tek süreçteki test hesaplarıdır, saat ortaktır. Her boyut için hesaplar mekana takım yetenekli check-in yapar, oda kurulur, misafir "Katıl" ile, kalanlar "Bu masadayım" ile iki tarafa sırayla girer, liderler Sohbet kartlarını başlatır, her turda bir telefon sonraki kartı açar. Bitince herkes mekandan ayrılır (oda biter).

**Hazırlık (bir kez):** dev projesinde panel → Authentication → Sign In / Providers → Phone → Test Phone Numbers and OTPs'e 8 numara (ör. `905550000001` … `905550000008`). Kodlar panelde ve parola yöneticisinde durur, hiçbir dosyaya yazılmaz.

**Çalıştırma (Windows cmd, repo kökünde):**

```
set SUPABASE_URL=https://<ref>.supabase.co
set SUPABASE_PUBLISHABLE_KEY=<publishable key>
set VENUE=<Keşfet'teki mekan adı>
set PHONE_A=+905550000001
set OTP_A=<kod>
set PHONE_B=+905550000002
set OTP_B=<kod>
set ROOM_PHONES=+905550000003=<kod>,+905550000004=<kod>,+905550000005=<kod>,+905550000006=<kod>,+905550000007=<kod>,+905550000008=<kod>
set STEPS=room
pnpm latency
```

- `STEPS=room` yalnızca oda adımını koşar; `chat,room` (varsayılan) DM ve mekan sohbeti adımlarını da. `ROUNDS` boyut başına tur sayısıdır (varsayılan 10; her tur Sohbet'in 5 sn aralığını bekler, 8 telefon yaklaşık 1 dakika).
- `ROOM_PHONES` eksikse yalnızca hesap yeten boyutlar ölçülür (A ve B ile yalnızca 2 telefon).
- Bu hesaplar o sırada başka yerde (bot, telefon) kullanılmamalı: her hesap yeniden check-in yapar ve sonunda mekandan ayrılır. Oda kısa süre mekanın lobisinde görünür; dev projesinde, mekanda gerçek kullanıcı yokken çalıştır.
- Yerelde (`pnpm supabase start`, `functions serve`) değişkensiz `STEPS=room pnpm latency` sekiz yerel test numarasıyla koşar.

**Okunacak satır:** `Oda, 8 telefon: yanıttan her telefona varış` → **p90**. Ayrıca `yanıttan en geç telefon` (her turda son telefona varış) ve 2 ve 4 telefonla aynı satırlar karşılaştırma içindir.

## 2. Saha testi günü: panel

**Testten hemen önce:** panel → Database → Query Performance → **Reset** (ya da SQL Editor'da `select extensions.pg_stat_statements_reset();`). Saati not et.

**Testten sonra:**

1. **Realtime → Reports:** o günün mesaj sayısı (Realtime messages) ve aynı anda bağlantı zirvesi (Peak connections).
2. **Database → SQL Editor:** `scripts/latency/room-load.sql`'i yapıştır ve çalıştır (yalnızca okur). Gruplar:
   - **1 Postgres Changes (wal, RLS)** ve **2 Kanal yetkisi ve yayın (realtime.messages)**: `private.is_room_member` ve `private.realtime_topic_allowed` bu sorguların içinde, politikalarda çalışır; Query Performance'ta kendi satırları yoktur. İkisinin payı bu iki grubun `yuzde`'sidir (üst sınır olarak okunur: grup, fonksiyonların dışındaki işi de içerir).
   - **3 Oda okuması** ve **4 Öneri okuması**: 4 saniyelik yoklama ve kanal olaylarından sonraki yeniden okumalar; `cagri` sayıları yoklamanın yüküdür.
   - **5 Diğer**: geri kalan her şey.

## Kayıt

Sonucu 22.6'nın PR'ına (ve sonra `docs/FIELD_TEST.md`'ye) bu tabloyla yaz:

| Ölçü                                          | Değer | Eşik                                      | Durum |
| --------------------------------------------- | ----- | ----------------------------------------- | ----- |
| 8 telefon, yanıttan her telefona varış, p90   | … ms  | 1000 ms                                   |       |
| 4 telefon, aynı satır, p90                    | … ms  | —                                         |       |
| 2 telefon, aynı satır, p90                    | … ms  | —                                         |       |
| Realtime mesajı, saha testi günü              | …     | —                                         |       |
| Aylık mesaj tahmini (günlük × 30)             | …     | 2,5 milyon (Pro kotası 5 milyonun yarısı) |       |
| Aynı anda bağlantı zirvesi                    | …     | —                                         |       |
| Grup 1 + 2, toplam veritabanı süresindeki pay | … %   | %20                                       |       |
| Grup 3 + 4 çağrı sayısı (yoklama)             | …     | —                                         |       |

**Eşik aşılırsa** (§22.I): oda kanalı veri içermeyen sunucu yayınına geçer (mekan sohbetindeki `venue_chat` kalıbı: `room_changed` yayını, telefon satırı okur) ve yoklama aralığı uzatılır. Bu ayrı bir PR'dır ve Faz 2'yi beklemez.
