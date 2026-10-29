# DM, Telegram Android'in sohbeti gibi (proje sahibinin kararı, 29 Ekim)

Teknik referans Telegram Android (CLAUDE.md → Çalışma şekli). Yalnızca teknik alındı, kod
kopyalanmadı.

| Konu                   | Önce                                                                | Şimdi                                                                                                          |
| ---------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Gönderilen mesaj       | Bekleyen balon silinir, sunucunun kopyası yeni balon olarak gelirdi | Aynı satır kalır, yalnızca saat simgesi tike döner (`sentKeys`, `DmRow`)                                       |
| Yeni mesaj, tik, tepki | Yüklenen bütün sayfalar yeniden okunurdu                            | Yalnızca o sayfa okunur ve yerine konur; değişmeyen satır aynı nesne kalır (`@shared/dmPages.ts`, `refreshDm`) |
| Açılış kayması         | Kayarken gelen değişiklik hemen çizilirdi                           | Kayma bitene kadar açılıştaki hâl tutulur                                                                      |
| Eski mesajlar          | "Daha eski mesajlar" düğmesi                                        | Yukarı yaklaşınca kendiliğinden yüklenir                                                                       |
| Yeniden açma           | Sunucu okunana kadar yükleniyor                                     | Son sayfa telefonda (`dmCache.ts`, hesaba bağlı, çıkışta silinir), hemen görünür                               |
| Liste                  | Bütün mesajlar tek kaydırmada çizilirdi                             | Alttan yukarı, yalnızca ekrandakiler çizilir (`ChatList`, ters `FlatList`)                                     |

- Telefonda tutulan: her konuşmanın son 50 mesajı (metin, saat, tik, alıntı, tepkiler), yalnızca
  oturum açık hesabın. Çıkışta, hesap değişince ya da oturum düşünce silinir.
- Mekan ve masa sohbeti eski akışla kalır.
