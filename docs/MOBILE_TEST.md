# RenkOrbit — Mobil Test Rehberi

## Sunucuyu başlat

```bash
cd renkorbit
npm run dev:mobile
```

Terminalde `Network:` satırındaki adresi telefonda aç (ör. `http://192.168.1.42:5173`).

**Gereksinimler:** Telefon ve bilgisayar aynı Wi‑Fi ağında.

---

## Test cihazları (önerilen)

| Cihaz tipi | Viewport | Öncelik |
|------------|----------|---------|
| iPhone SE / küçük Android | 375×667 | Yüksek |
| iPhone 14 / orta Android | 390×844 | Yüksek |
| iPad / tablet | 768×1024 | Orta |
| Yatay mod | landscape | Orta |

---

## Kontrol listesi

**Durum:** Manuel mobil test tamamlandı ✅

### Menü
- [x] Oyuncu adı ekranı (ilk açılış) klavye ile çakışmıyor
- [ ] Galaksi yolu kaydırılabiliyor
- [ ] Profil / Mağaza / İstatistik popup ortada, arka plan görünür
- [ ] Footer butonları ortalı, dokunması kolay
- [ ] Liderlik tablosu açılıyor

### Oyun (4 / 8 / 12 renk adımları)
- [ ] Tüm sütunlar ekrana sığıyor (yatay scroll yok)
- [ ] Top sürükleme parmakla takip ediyor
- [ ] Geçerli hedefte yeşil glow
- [ ] Geçersiz bırakmada top geri dönüyor
- [ ] Combo patlaması ortada görünüyor
- [ ] Ses çalışıyor (ilk dokunuştan sonra)
- [ ] Undo / Yeniden / Menü butonları erişilebilir

### Dönüş & güvenli alan
- [ ] Portrait ↔ landscape geçişinde tahta yeniden ölçekleniyor
- [ ] Notch / home indicator alt içerik kesmiyor

### PWA (isteğe bağlı)
- [ ] Safari → Ana Ekrana Ekle
- [ ] Tam ekran açılış

---

## Simüle edilen layout (otomatik)

`npm run test:layout` komutu yaygın viewport’larda top boyutunu hesaplar.

| Viewport | 5 sütun (4 renk) | 9 sütun (8 renk) | 13 sütun (12 renk) |
|----------|------------------|------------------|---------------------|
| 375×667 | ~21px | ~19px | ~19px |
| 390×844 | ~22px | ~20px | ~20px |
| 768×1024 | ~48px | ~44px | ~44px |

Minimum top boyutu: 14px. 12 renkte parmakla oynama zor olabilir — beklenen.

---

## Bilinen sınırlamalar

- Cross-tube uçuş animasyonu yok (top anında hedefe düşer)
- 12 renk küçük ekranda sıkışık olabilir
