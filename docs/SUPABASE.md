# Supabase — Liderlik Tablosu Kurulumu

Tüm zamanlar skor tablosu (ücretsiz tier yeterli).

## 1. Proje oluştur

1. [supabase.com](https://supabase.com) → New project
2. **SQL Editor** → `supabase/schema.sql` içeriğini yapıştır → Run

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
| `player_id` | Cihazda üretilen UUID |
| `username` | Oyuncu adı (2–16 karakter) |
| `total_score` | Tüm zamanlar toplam puan |
| `updated_at` | Son güncelleme |

## Notlar

- `.env` commit edilmez
- Supabase yoksa tablo yerel skorla çalışır (çevrimdışı mod)
- 20–30 oyuncu için free tier fazlasıyla yeterli
