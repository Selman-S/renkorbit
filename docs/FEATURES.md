# RenkOrbit — Oyun Özellikleri

> **RenkOrbit** — Renkli küreleri tüplerde düzene sok, galaksi yolunda ilerle, koleksiyonunu büyüt.

Mobil ve tablet odaklı web tabanlı renk sıralama bulmacası.

---

## 1. Temel Oyun Mekaniği

### 1.1 Renk Sayısı & Sütunlar

| Renk (N) | Sütun (N+1) | Kapasite | Toplam top |
|----------|-------------|----------|------------|
| 4 | 5 | 4 | 16 |
| 8 | 9 | 8 | 64 |
| 12 | 13 | 12 | 144 |

- Formül: **N renk × N top** → **N dolu tüp + 1 boş**
- Kazanma: tüm dolu tüpler tek renk + 1 boş sütun

### 1.2 Başlangıç Düzeni

| Düzen | Kod | Açıklama |
|-------|-----|----------|
| **Sıralı** | `rows` | Her sırada tek renk |
| **Karışık** | `mixed` | Tam shuffle |

### 1.3 Taşıma Kuralları
- Sadece en üstteki top alınır
- Her hamlede tek top
- Hedefte boş yer varsa her renk konulabilir
- Geçersiz hamlede tüp sallanır

### 1.4 Puzzle Üretimi
- Seed tabanlı, tekrarlanabilir
- Galaksi yolu adımları sabit seed kullanır

---

## 2. Galaksi Yolu (Ana Ekran)

9 adımlık doğrusal ilerleme — menüde tek ana akış:

| Adım | Ayar |
|------|------|
| 1–3 | 4 renk |
| 4–6 | 8 renk |
| 7–9 | 12 renk |

Her tier: **Sıralı Rahat** → **Karışık Rahat** → **Karışık Süreli**

- Adım tamamlanınca sonraki açılır (`renkorbit_journey`)
- Her adım için yıldız kaydı
- Kazanma sonrası **Sonraki adım** butonu

---

## 3. Kontroller & UI

### 3.1 Ana Menü
- **Sol üst 👑** — kümülatif toplam puan
- **Sağ üst 🏆** — liderlik tablosu
- **Galaksi yolu** — kaydırılabilir adım listesi
- **Footer** — Profil, Mağaza, İstatistik (şeffaf popup, menü arkada görünür)

### 3.2 Oyun İçi HUD
- Sol: toplam puan (👑)
- Orta: anlık brüt puan + combo etiketi
- Sağ: liderlik tablosu
- Alt meta: seviye etiketi, hamle sayısı (**süre gösterilmez**)

### 3.3 Sürükle & Bırak
- `DragFloatingBall`, geçerli hedefte yeşil glow
- Undo, yeniden başlat, menü, ses aç/kapa

### 3.4 İlk Açılış
- Oyuncu adı istenir (`renkorbit_username`)
- Liderlik tablosunda kullanılır

---

## 4. Puanlama

### 4.1 Oyun Sırasında
- Ekrandaki puan = **brüt combo puanı** (tamamlanan sütunlardan)
- Combo: ardışık hamlelerde sütun tamamlama → ×1…×5 çarpan
- Tamamlanan sütun bozulursa o sütunun puanı düşer, combo sıfırlanır
- Combo kazanımında ortada patlama animasyonu + ses

### 4.2 Oyun Bitişi
```
Brüt puan     = comboScore (tüp puanları toplamı)
Hamle cezası  = hamle × (3 × seviye çarpanı)
Süre cezası   = saniye × (1 × seviye çarpanı)
Toplam puan   = max(0, brüt − hamle − süre)
```

Seviye çarpanı: 4 renk → 1, 8 renk → 2, 12 renk → 3

### 4.3 Toplam Puan
- Her galibiyet sonrası **toplam puan**a eklenir (`renkorbit_total_score`)
- Menü ve HUD sol üstte gösterilir
- Liderlik tablosunda oyuncu skoru budur

### 4.4 Yıldızlar
- Sadece **hamle sayısına** göre (1★ / 2★ / 3★)
- Süre yıldızı etkilemez

---

## 5. Bulmaca Paylaşımı

- **Galaksi adımı:** `?step=3` (aynı yolculuk bulmacası)
- **Özel seed:** `?p=8-m-T-1234567` (renk-düzen-mod-seed)
- Oyun içi 🔗 ve kazanma ekranı **Paylaş** butonu
- Mobilde native paylaşım; masaüstünde panoya kopyalama
- Link açılınca bulmaca otomatik başlar (yolculuk ilerlemesini etkilemez)

---

## 6. Liderlik Tablosu

- Mock rakip isimleri (sabit skorlar)
- Oyuncu satırı: gerçek kullanıcı adı + toplam puan
- İleride çevrimiçi liderlik planlanıyor

---

## 7. Ekonomi & Koleksiyon

### Orbit Coin
- Kazanma, yıldız, combo, rekor bonusları
- Mağazada harcanır

### Mağaza
- Top skinleri, arka plan temaları
- Equip / satın al

### Başarımlar (12 rozet)
- Yolculuk ilerlemesi, yıldız, combo, süreli kazanma, coin, mağaza vb.
- Profil ekranında grid

### İstatistikler
- Kombinasyon bazlı galibiyet, en iyi skor, combo

---

## 8. Modlar

| Mod | Açıklama |
|-----|----------|
| **Rahat** | Süre limiti yok; süre yine sayılır (ceza için) |
| **Süreli** | Gizli süre sayacı; limit dolunca kayıp |

Süreli adımlarda geri sayım HUD'da gösterilmez.

---

## 9. Teknik

| Alan | Seçim |
|------|-------|
| Framework | React 18 + TypeScript |
| Build | Vite |
| Animasyon | Framer Motion |
| State | `useReducer` (`useGame`) |
| Depolama | localStorage |
| PWA | manifest + service worker |

### localStorage anahtarları (özet)

| Anahtar | İçerik |
|---------|--------|
| `renkorbit_journey` | Adım tamamlama + yıldız |
| `renkorbit_total_score` | Kümülatif toplam puan |
| `renkorbit_username` | Oyuncu adı |
| `renkorbit_best_*` | Adım bazlı en iyi skor |
| `renkorbit_stars_*` | Adım bazlı en iyi yıldız |
| `renkorbit_coins` | Orbit Coin |
| `renkorbit_achievements` | Açılan rozetler |
| `renkorbit_stats` | İstatistik özeti |

### Dosya Yapısı (özet)

```
src/
  game/       progressionMap, combo, scoring, achievements, coins, shop, …
  hooks/      useGame, useSound, useBoardLayout
  components/ LevelSelect, GameBoard, ComboBurst, Profile, Shop, …
```

---

## Özellik Özet Tablosu

| Kategori | Durum |
|----------|-------|
| Galaksi yolu (9 adım) | ✅ |
| Sürükle-bırak + animasyon | ✅ |
| Combo + patlama FX | ✅ |
| Gizli süre + bitiş cezası | ✅ |
| Toplam puan + liderlik | ✅ |
| Mağaza + coin + temalar | ✅ |
| 12 başarım | ✅ |
| Kullanıcı adı | ✅ |
| Şeffaf menü popup'ları | ✅ |
| Puzzle paylaşım URL | ✅ |
| Günlük liderlik | ⬜ |
| Gerçek cihaz testi | ⬜ |
