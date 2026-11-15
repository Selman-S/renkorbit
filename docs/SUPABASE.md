# Supabase — Liderlik Tablosu Kurulumu

Tüm zamanlar skor tablosu (ücretsiz tier yeterli).

## 1. Proje oluştur

1. [supabase.com](https://supabase.com) → New project
2. **SQL Editor** → `supabase/schema.sql` içeriğini yapıştır → Run

3. **Günlük bulmaca tablosu:** SQL Editor → `supabase/daily_scores.sql` içeriğini yapıştır → Run. Tablo yoksa oyun çalışır, sadece "Bugün" sekmesi çevrimdışı görünür.
4. **Yazma güvenliği (sırayla):**
   1. Authentication → Sign In / Providers → **Anonymous sign-ins** aç.
   2. `signInAnonymously` kullanan istemciyi yayınla.
   3. SQL Editor → `supabase/secure-rls.sql` → Run.

   Bundan sonra her oyuncu sadece kendi satırını yazabilir (`player_id = auth.uid()`), istemciden silme yok, `total_score` ≤ 50.000.000. Script, eski cihaz UUID'siyle kalmış (sahipsiz) satırları siler; oyuncular bir sonraki açılışta yerel toplamlarıyla yeniden kaydolur. Kontrol: `node scripts/test-supabase.mjs` ("foreign write rejected" görmelisin).

## 2. Ortam değişkenleri

Project Settings → API:

```bash
cp .env.example .env
```

`.env` dosyasına ekle:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
```

## 3. Çalıştır

```bash
npm run dev
```

Oyuncu adı gir → galibiyet kazan → liderlik tablosunda görün.

## Tablo

| Sütun | Açıklama |
|-------|----------|
| `player_id` | Supabase anonim kullanıcı id'si (`auth.uid()`); anonim giriş kapalıysa cihaz UUID'si |
| `username` | Oyuncu adı (2–16 karakter) |
| `total_score` | Tüm zamanlar toplam puan |
| `updated_at` | Son güncelleme |

## Günlük tablo (`daily_scores`)

| Sütun | Açıklama |
|-------|----------|
| `day` | Oyuncunun yerel tarihi (YYYY-MM-DD) |
| `player_id` | Cihaz UUID'si — `(day, player_id)` birincil anahtar |
| `username` | Oyuncu adı |
| `score`, `moves`, `time_sec` | İlk bitirişin sonucu |

- **Sadece insert:** update/delete politikası yok, günün ilk bitirişi kesindir. Tekrar gönderim `23505` (duplicate) döner, istemci bunu yok sayar.
- Insert yalnızca `current_date ± 1` günü için kabul edilir (saat dilimi payı; geriye dönük doldurma yok).
- Sıralama: puan ↓, hamle ↑, süre ↑.

## Notlar

- **Puanlama v2 (Kasım 2026):** combo ve yıldız formülü değişti, istemci tarafı puanlar bir kez sıfırlanır. İstemci her açılışta kendi satırını yerel toplamla günceller.
- **Tabloyu sıfırlamak:** `secure-rls.sql` sonrası anon anahtar silemez; `supabase/reset-leaderboard.sql`'i SQL Editor'de çalıştır (ya da `.env`'e `SUPABASE_SERVICE_ROLE_KEY` koyup `npm run reset:leaderboard`; bu anahtarı asla `VITE_` önekiyle tanımlama).
- `.env` commit edilmez
- Supabase yoksa tablo yerel skorla çalışır (çevrimdışı mod)
- 20–30 oyuncu için free tier fazlasıyla yeterli
