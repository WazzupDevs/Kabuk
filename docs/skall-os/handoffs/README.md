# Teslimler

Bir departmandan ötekine geçen her iş yazılı teslimle geçer. Dosya adı `YYYY-AA-GG-<konu>.md`; aşağıdaki şablon kopyalanır, başlık silinmez. Boş kalan başlığa "yok" yazılır; belirsiz teslim kabul edilmez ve gönderene döner.

Küçük iş (var olan parçalarla menü satırı, metin düzeltmesi, tek dosyalık hata) teslim istemez. Aura tuvalinden gelen onaylı aktarım raporları (`docs/design/aura/aktarim-*.md`) kendi teslimleridir; ayrıca belge açılmaz.

## Şablon

```markdown
# Teslim: <konu>

- Tarih:
- Gönderen departman:
- Sonraki sorumlu departman:

## Görev

## Amaç

## Mevcut durum

Bugün ne var; görüldü mü, koddan mı (hangi dosya, hangi görüntü).

## Yapılan analiz

## Önerilen çözüm

## Kullanıcı onayı

Kim, ne zaman, neyi onayladı (sohbetteki cümle ya da Atölye taslağının anahtarı ve durumu). Onay yoksa "bekliyor": uygulama başlamaz.

## Etkilenen dosyalar

## Dokunulmaması gereken alanlar

## Teknik ve tasarımsal gereksinimler

Değerler token adıyla (renk, boşluk, boy, hareket). Tokenlarda olmayan değer açık sorudur.

## Kabul kriterleri

## Test gereksinimleri

## Riskler

## İtiraz

Alan departman teknik ya da tasarımsal itirazını gerekçesiyle buraya yazar; karar kimde, ne oldu.

## Sonuç

PR numarası, nasıl doğrulandı (test, görsel kapı, telefonda görüldü, doğrulanmadı).
```
