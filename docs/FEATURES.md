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

30 adımlık doğrusal ilerleme — menüde tek ana akış. 3 renkten 12 renge, her renk sayısında 3 adım:

| Adım türü | `variant` | Açıklama |
|-----------|-----------|----------|
| **Yörünge** | `rows` | Sıralı başlangıç |
| **Karışık** | `mixed` | Tam karışık |
| **Usta** | `usta` | Karışık + **3 geri alma** sınırı, daha sıkı bonus hedefleri |

- Hepsi rahat mod (süre limiti yok; süre arka planda sayılır, bitişte bonus)
- Adım tamamlanınca sonraki açılır (`renkorbit_journey`)
- Her adım için yıldız kaydı; açık adımın kartında 3★ hedefi görünür
- Kazanma sonrası **Sonraki adım** butonu

### 2.1 Günün Bulmacası

- Her gün herkes için **aynı** tahta (tarih seed'li), cihazın yerel gününe göre
- Zorluk haftanın gününe göre: Pzt-Sal 5, Çar-Per 6, Cum-Cmt 7, Paz 8 renk (karışık)
- İlk yolculuk adımı tamamlanınca açılır; menüde yolun üstünde kart
- **Seri 🔥:** ardışık günlerde +1, bir gün kaçarsa sıfırlanır
- Coin: normal kazanç + `min(seri, 10) × 5`; 3/7/14/30. günde ek ödül (50/150/300/600)
- **Günlük tablo:** sadece günün ilk bitirişi sayılır (puan ↓, hamle ↑, süre ↑)
- Tekrar oynanabilir ama seri, coin ve tablo değişmez
- **Sonuç paylaşımı:** `RenkOrbit Günlük #N · ★★☆ · 40 hamle · 🔥 5` + `?daily=1` linki

---

## 3. Kontroller & UI

### 3.1 Ana Menü
- **Sol üst 👑** — kümülatif toplam puan
- **Sağ üst 🏆** — liderlik tablosu
- **Galaksi yolu** — kaydırılabilir adım listesi
- **Footer** — Profil, Mağaza, İstatistik (şeffaf popup, menü arkada görünür)

### 3.2 Oyun İçi HUD
- Sol: toplam puan (👑)
- Orta: anlık brüt puan (sayaçla artar) + combo şeridi: `×N COMBO` ve kalan hamle pipleri
- Sağ: liderlik tablosu
- Alt meta: seviye etiketi, hamle sayısı (**süre gösterilmez**)

### 3.3 Sürükle & Bırak
- `DragFloatingBall`, geçerli hedefte camgöbeği (cyan) glow
- Geçersiz bırakma: top kaynağa geri uçar, hedef tüp sallanır, ses + titreşim
- Tüp tamamlanınca kendi renginde glow + "+puan" + çan sesi
- Undo (Usta'da sınırlı), yeniden başlat, menü, ses aç/kapa
- Haptik: pick/drop/geçersiz/tüp tamam/combo/kazanma (`navigator.vibrate`, ses kapalıyken de çalışır)

### 3.4 İlk Açılış
- Oyuncu adı istenir (`renkorbit_username`)
- Liderlik tablosunda kullanılır

---

## 4. Puanlama

### 4.1 Oyun Sırasında
- Ekrandaki puan = **brüt combo puanı** (tamamlanan sütunlardan)
- Tüp puanı = `kapasite × 20 × round(N/2)`
- **Combo zinciri:** tüp tamamlayınca combo +1, o tüp `tubeValue × min(combo, 8)` kazandırır
- **Hamle penceresi:** `clamp(ceil(N/2)+1, 3, 7)` hamle içinde yeni tüp bitirmezsen zincir biter → "ZİNCİR BİTTİ" (puan düşmez)
- Tamamlanan sütun bozulursa o sütunun puanı düşer, zincir kırılır → "KIRILDI!"
- ×2 ve üstü combo'da ortada patlama animasyonu + ses; ×8 "MAX COMBO"

### 4.2 Oyun Bitişi
```
Brüt puan     = comboScore (tüp puanları toplamı)
Hamle bonusu  = brüt × 0.125 × (hedefe yakınlık, 0…1)
Süre bonusu   = brüt × 0.125 × (hedefe yakınlık, 0…1)
Toplam puan   = brüt + hamle bonusu + süre bonusu   (en fazla brüt × 1.25)
```

Hedefler adım başına `journeyBonusTargets.ts` playtest eğrisinden gelir.

### 4.3 Toplam Puan
- **İlk bitirişte** puanın tamamı toplama eklenir (`renkorbit_total_score`)
- **Tekrar oyunda** sadece rekoru aştığın kadarı eklenir; rekor kırılmazsa +0
- Menü ve HUD sol üstte gösterilir; liderlik tablosunda oyuncu skoru budur

### 4.4 Yıldızlar
- Sadece **hamle sayısına** göre (1★ / 2★ / 3★); süre etkilemez
- Eşikler playtest optimumundan: **3★ ≤ optimum × 1.15**, **2★ ≤ optimum × 1.6**
- Kazanma ekranı bir sonraki yıldız için hedef hamleyi gösterir

### 4.5 Coin
- İlk bitiriş: `10 + 15×yıldız + puan/100 + (maxCombo≥3 ? 3×maxCombo) + (rekor ? 25)`
- Tekrar oyun: rekor kırılırsa `25 + 15 × kazanılan yeni yıldız`, aksi halde 0

---

## 5. Bulmaca Paylaşımı

- **Galaksi adımı:** `?step=3` (aynı yolculuk bulmacası)
- **Özel seed:** `?p=8-m-T-1234567` (renk-düzen-mod-seed)
- Oyun içi 🔗 ve kazanma ekranı **Paylaş** butonu
- Mobilde native paylaşım; masaüstünde panoya kopyalama
- Link açılınca bulmaca otomatik başlar (yolculuk ilerlemesini etkilemez)

---

## 6. Liderlik Tablosu (Supabase)

- **Tüm zamanlar** — `total_score` sıralaması, 20'şer kişilik liglere bölünmüş
- Her cihaz: `player_id` (UUID) + `username`
- Kazanınca skor Supabase'e sync edilir
- `.env` yoksa çevrimdışı mod (yalnızca yerel skor)
- Kurulum: [SUPABASE.md](./SUPABASE.md)

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
| Galaksi yolu (30 adım) | ✅ |
| Combo hamle penceresi + ×8 tavan | ✅ |
| Yıldız eşikleri playtest tabanlı | ✅ |
| Anti-farm (tekrar oyunda sadece rekor farkı) | ✅ |
| Usta: 3 geri alma | ✅ |
| Haptik + yeni ses motoru | ✅ |
| Günün bulmacası + seri + günlük tablo | ✅ |
| Sürükle-bırak + animasyon | ✅ |
| Combo + patlama FX | ✅ |
| Gizli süre + bitiş bonusu | ✅ |
| Toplam puan + liderlik | ✅ |
| Mağaza + coin + temalar | ✅ |
| 12 başarım | ✅ |
| Kullanıcı adı | ✅ |
| Şeffaf menü popup'ları | ✅ |
| Puzzle paylaşım URL | ✅ |
| Supabase liderlik (tüm zamanlar) | ✅ |
| Gerçek cihaz testi | ⬜ |
