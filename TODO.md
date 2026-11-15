# RenkOrbit — Ana Görev Listesi

**Son güncelleme:** Haziran 2026

---

## Durum Özeti

| Faz | Durum |
|-----|-------|
| Faz 0 — Hazırlık | ✅ Tamamlandı |
| Faz 1 — MVP | ✅ Tamamlandı |
| Faz 2 — v1 | ✅ Tamamlandı |
| Faz 3 — v2 | ✅ Tamamlandı |
| Faz 4 — Mobil & yol genişletme | 🟡 Uygulandı, cihaz testi bekliyor |

---

## Kullanıcı geri bildirimi (Haziran 2026)

- [x] Galaksi yolu 9 → **30 adım** (3×3 … 12×12, her renkte 3 adım)
- [x] Süreli mod kaldırıldı — yolculukta sadece **rahat mod**
- [x] Süre arka planda sayılır; bitişte **hamle + süre cezası** (adım çarpanı ile artar)
- [x] Mobilde top tutulunca **parmağın üstünde** görünür
- [x] Mobilde sütunlar arası **boşluk artırıldı** (yatay kaydırma yok)
- [x] Düşme animasyonu bitmeden **yeni top tutulabilir** (hızlı oyun)
- [ ] Cihazda 30 adımlı yol + 12 sütunlu tahta doğrulaması

---

## Tamamlananlar (özet)

### Çekirdek
- [x] Oyun motoru, puzzle üretici, sürükle-bırak, undo
- [x] Responsive board (`useBoardLayout`)
- [x] Tutorial, ses efektleri, PWA
- [x] Yıldız sistemi (hamle bazlı, dinamik eşikler)
- [x] Combo çarpanı + patlama animasyonu + ses

### Menü & İlerleme
- [x] Galaksi yolu (30 adım, 3→12 renk, doğrusal kilitleme)
- [x] Oyuncu adı (ilk açılış)
- [x] Toplam puan (👑) — her galibiyet sonrası birikir
- [x] Liderlik tablosu (Supabase — tüm zamanlar)
- [x] Profil / Mağaza / İstatistik — şeffaf popup (menü arkada kalır)

### Ekonomi & Koleksiyon
- [x] Orbit Coin + mağaza (top skin, tema)
- [x] 12 başarım rozeti

### Puanlama v2 (Kasım 2026)
- [x] Oyun sırasında brüt combo puanı
- [x] **Combo hamle penceresi:** tüp tamamlayınca `ceil(N/2)+1` (3–7) hamle içinde yeni tüp bitirmezsen zincir biter ("ZİNCİR BİTTİ", puan düşmez). Tamamlanmış tüpü bozmak hâlâ puan düşürür ("KIRILDI!")
- [x] Combo çarpanı **×8'de tavan**; ×1 için patlama yok
- [x] HUD'da kalan hamle pipleri + sayaçlı puan
- [x] Süre gizli sayılır; bitişte hamle + süre **bonusu** (her biri brütün %12.5'ine kadar)
- [x] Kazanma ekranı kademeli: yıldızlar (tık sesi) → puan sayacı → coin/rozet; yıldız hedefi gösterilir
- [x] **Yıldız eşikleri** playtest optimumundan: 3★ ≤ ×1.15, 2★ ≤ ×1.6
- [x] **Anti-farm:** tekrar oyunda toplam puana sadece rekor farkı, coin sadece rekorda (25 + 15×yeni yıldız)
- [x] **Usta adımları:** 3 geri alma sınırı
- [x] Puanlama v2 migrasyonu (`renkorbit_scoring_version`): best/total/history sıfırlanır, yolculuk + yıldızlar korunur

### His (Kasım 2026)
- [x] Geçersiz bırakma: top kaynağa geri uçar, tüp sallanır, ses + titreşim
- [x] Tüp tamamlanınca renkli glow + "+puan" + çan sesi
- [x] Haptik (navigator.vibrate) pick/drop/invalid/complete/combo/win
- [x] Ses motoru: attack zarfı, master kompresör, yığın yüksekliğine göre pitch, combo pitch ×8'de durur
- [x] Zamanlayıcı menü/overlay açıkken durur

---

### Günlük bulmaca + seri (Faz 2, Kasım 2026)
- [x] Tarih seed'li günlük bulmaca (`daily.ts`) — herkes aynı tahta; Pzt-Sal 5, Çar-Per 6, Cum-Cmt 7, Paz 8 renk karışık
- [x] İlk adım tamamlanınca açılır; menüde günlük kart (geri sayım, seri, "serini koru" uyarısı)
- [x] Seri: ardışık gün +1, gün kaçarsa 1'e döner; coin `min(seri,10)×5` + 3/7/14/30. gün ödülü (50/150/300/600)
- [x] Günlük tablo: Supabase `daily_scores` (insert-only RLS), liderlik tablosunda "📅 Bugün" sekmesi
- [x] Wordle tarzı sonuç paylaşımı + `?daily=1` linki
- [x] Rozetler: Günün Gezgini, Haftalık Yörünge (7 gün)
- [ ] **Supabase'de `supabase/daily_scores.sql` çalıştırılmalı** (tablo henüz yok)

---

## Kalan (bilinen)

### Faz 3–4
- [ ] Sonsuz mod (rastgele seed, kademeli zorluk, koşu puanı)
- [ ] Başarımlara coin ödülü, tüp skin / arka plan, günlük giriş
- [ ] Supabase RLS sıkılaştırma (`signInAnonymously` + `auth.uid()`)

### Polish
- [ ] Cross-tube top animasyonu (ball ID)
- [ ] Lint: önceden kalan `react-hooks/set-state-in-effect` uyarıları (Profile, Scoreboard, TutorialOverlay, usePwaInstall, App kazanma efekti)

### v2 — Sosyal
- [x] Puzzle paylaşım URL (seed + ayarlar)
- [x] Tüm zamanlar liderlik (Supabase)

---

## Sprint Dosyaları

- [todos/MVP.md](./todos/MVP.md)
- [todos/V1.md](./todos/V1.md)
- [todos/V2.md](./todos/V2.md)
