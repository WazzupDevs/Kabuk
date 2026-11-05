# Sprengja harf grubu havuzu v3 (5 Kasım 2026)

Proje sahibinin onayı (K-85 O-11, O-12). İçerik `content/sprengja-letter-groups.json`, seed `pnpm seed` (`scripts/seed/content.ts` → `parseSprengjaLetterGroups`, test `scripts/seed/sprengja.test.ts`).

- Grup kelimenin içinde aynı sırayla ve bitişik geçer; gerçek hece aranmaz. Görselde `upperTr` (SI ile Sİ ayrı).
- Pilot havuzu önceki 96 grup, değişmeden; kademeler bitişik dizi sıklığına göre yeniden dağıtıldı.
- Yöntem: mevcut içeriğin 2 270 kelimesinde (tabu, sahtekar, şarkı) her grubun kaç ayrı kelimede bitişik geçtiği, -mak/-mek mastar eki hariç sayıldı. Kolay 46–201, orta 28–45, zor 1–26 kelime.
- Kolay (40): an, ka, ar, al, ak, ma, er, ya, ra, ta, en, sa, ba, ek, at, ik, as, el, ha, et, ke, ay, si, ku, ir, se, il, na, ri, ne, ur, pa, on, ko, va, or, kı, ti, ap, ye.
- Orta (36): be, ol, is, un, im, ge, mi, ca, iz, ul, ça, ab, ni, ok, uz, za, sı, tı, to, az, kar, mu, ve, yu, bu, do, ro, ad, bi, ev, ga, it, ot, ör, so, ün.
- Zor (20, yalnızca 6+ oyuncuda): us, man, ter, lem, tan, bal, bak, lam, kum, tel, kır, top, sel, gün, ses, kes, kom, dur, yol, tut.
- Havuz: 3–5 oyuncu kolay + orta (76), 6–8 oyuncu 96; bir oyunda grup tekrar etmez. 8 turda ortalama ~1,7 zor grup.
- Seed denetimi: hiçbir grup küfür listesinde değil, üç harfli hiçbir grup listedeki bir kelimenin başı değil (v1'de "kal" bu yüzden çıktı); kolay + orta 5 turluk, bütün havuz 8 turluk oyunu doldurur.
- Saha testinde `yol` ve `tut`'un atış süresi ayrıca izlenir. Değişiklik yalnızca saha verisiyle ve proje sahibinin onayıyla (O-15).
