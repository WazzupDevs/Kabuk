# Riso açılış doku seti (Aura v64 AcilisRiso, rapor bölüm 14)

3x (1170x2532 = 390x844 dp), tam ekran. Her dosya tek mürekkep rengi + alfa (RGBA); zemin-lif opak.
WebP kayıpsız (uygulamaya giren), aynı dosyaların PNG kopyası png/ altında.

| Dosya                 | İçerik                                                                                         | Renk    |
| --------------------- | ---------------------------------------------------------------------------------------------- | ------- |
| zemin-lif.webp        | #14112B zemin + kağıt lifi %6, opak                                                            | —       |
| parilti-yarimton-1..3 | parıltı yarım tonu, elips 240x270 dp merkezde, yoğunluk 0,8, tram 75°, hücre 3 dp              | #3B2B92 |
| mor-doku-1..3         | kapsül A dokusu, yoğunluk %86, tram 15°, hücre 2,6 dp; kapsül View'i ile kırpılır, ölçeklenmez | #7B5CFF |
| pembe-doku-1..3       | kapsül B dokusu, yoğunluk %86, tram 45°, hücre 2,6 dp                                          | #FF4F8B |
| beyaz-doku-1..3       | kesişim dokusu (A kırpması içinde B şekli), tram 0°, hücre 2,3 dp                              | #FFFFFF |
| harf-s/k/a-1..3       | harfler, kelime işaretinin son (R0) konumunda tam ekran; lettersClip ile kırpılır              | #FFFFFF |

- 1..3 = kaynama varyantları: gren ve benek farklı, kağıt lifi ve mürekkep lekeleri (starve) aynı. 125 ms'de bir döner (8 fps), görünürlük 0/1.
- Sabit hizasızlık ve ±0,5 dp ek kayma görsele basılı değildir; uygulama translate ile verir (rapor 14.2 madde 2–3).
- Üretici: uretici-doku.py (onaylı demodaki 28-riso-acilis/kaynak/render.py değerleri, 3x'e ölçeklenmiş). Harf maskeleri 28-riso-acilis/kaynak/L_*.png.
