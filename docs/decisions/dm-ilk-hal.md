# Düzenlenen DM'in ilk hâli şikayet için saklanır (16 Kasım 2026)

Proje sahibinin kararı: "evet, ilk hâl saklansın" (`docs/SPEC_V4.md` §4.X).

- **Karar:** bir DM ilk kez düzenlenince değiştirdiği ilk metin `private.dm_message_originals`'a yazılır (mesaj başına bir satır, sonraki düzenleme üzerine yazmaz). Yalnız şikayet kopyası okur: `private.dm_snapshot` düzenlenmiş mesaja `original_body` ekler (DM şikayeti, "çıkar + bildir", arkadaşı engelle); kopya `reports.messages_snapshot`'ta kalır.
- **Gerekçe:** düzenleme 15 dakika açık olduğundan, kötü niyetli metin bildirilmeden önce düzeltilip şikayetten kaçırılabiliyordu; kayıt yalnız "düzenlendi" gösteriyordu.
- **Diğer uygulamalarda yaygın kalıp:** mesajda "düzenlendi" etiketi, eski metin kullanıcıya gösterilmez. Burada da öyle: hiçbir yanıt, sayfa (`dm_messages_page`), push ve Realtime yükü ilk metni taşımaz; tablo istemciye kapalı şemadadır, RLS açık ve politikasızdır (kural 1, 2).
- **Saklama:** 30 gün, şikayetin ömrüyle aynı (`delete_old_reports`); saatlik `private.delete_old_dm_originals` 1000'lik dilimle, `skip locked` ile siler. Arkadaşlık bitince ve hesap silinince mesajla birlikte gider (cascade); "çıkar + bildir" ve engel kopyayı aynı işlemde, konuşma silinmeden önce alır.
- **Kilit sırası (kural 10):** `dm_messages` → `dm_message_originals`; düzenleme ilk metni konuşma ve mesaj kilitlendikten sonra yazar.
- **Bilinen sınırlar:** yalnız ilk hâl saklanır (aradaki düzenlemeler saklanmaz); şikayet son 50 mesajı kopyalar, daha eski bir mesajın ilk hâli kopyaya girmez.
