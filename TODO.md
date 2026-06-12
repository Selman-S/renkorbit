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

### Puanlama (güncel)
- [x] Oyun sırasında brüt combo puanı
- [x] Süre gizli sayılır; bitişte hamle + süre cezası (adım çarpanı)
- [x] Kazanma ekranında puan kırılımı (brüt / cezalar / toplam)
- [x] Tamamlanan sütun bozulunca puan geri düşer

---

## Kalan (bilinen)

### Polish
- [ ] Cross-tube top animasyonu (ball ID)

### v2 — Sosyal
- [x] Puzzle paylaşım URL (seed + ayarlar)
- [x] Tüm zamanlar liderlik (Supabase)

---

## Sprint Dosyaları

- [todos/MVP.md](./todos/MVP.md)
- [todos/V1.md](./todos/V1.md)
- [todos/V2.md](./todos/V2.md)
