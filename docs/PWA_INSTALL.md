# RenkOrbit — Telefona / Tablete Kurulum (PWA)

RenkOrbit bir **PWA** (Progressive Web App). Tarayıcıdan açılır ama ana ekrana eklendiğinde **uygulama gibi** çalışır: kendi ikonu, tam ekran, adres çubuğu yok.

## Gereksinimler

- Site **HTTPS** üzerinde yayında olmalı (localhost geliştirmede de çalışır)
- `manifest.webmanifest` + `sw.js` + PNG ikonlar (`public/icons/`)

## Kullanıcı — Nasıl kurulur?

### iPhone / iPad (Safari)

1. Safari’de oyun adresini aç
2. Alttaki **Paylaş** düğmesine dokun (kare + ok)
3. **Ana Ekrana Ekle** seç
4. **Ekle** — RenkOrbit ana ekranda ikonla görünür

> Chrome/Firefox iOS’ta “yükle” desteği sınırlıdır; Safari önerilir.

### Android (Chrome)

1. Oyun adresini Chrome’da aç
2. Menüden **Uygulamayı yükle** / **Ana ekrana ekle**  
   veya adres çubuğundaki yükle simgesine dokun
3. Onayla — uygulama çekmecede / ana ekranda görünür

Menüde **📲 Yükle** butonu da kurulumu başlatır veya adımları gösterir.

### Masaüstü (Chrome / Edge)

Adres çubuğunda **Yükle** simgesi çıkabilir; tıklayınca uygulama penceresi açılır.

---

## Geliştirici — Yayınlama

```bash
npm run build
```

`dist/` klasörünü HTTPS sunucuya yükle (Vercel, Netlify, kendi sunucun vb.).

Mobil test için aynı Wi‑Fi’da:

```bash
npm run dev:mobile
```

Telefonda `http://BILGISAYAR-IP:5173` adresini aç.

### İkonları yeniden üretmek (macOS)

```bash
chmod +x scripts/generate-pwa-icons.sh
./scripts/generate-pwa-icons.sh
```

---

## Teknik dosyalar

| Dosya | Görev |
|-------|--------|
| `public/manifest.webmanifest` | Uygulama adı, ikon, `standalone` mod |
| `public/sw.js` | Offline kabuk + önbellek |
| `public/icons/icon-*.png` | Android / iOS ana ekran ikonları |
| `index.html` | `apple-touch-icon`, `theme-color` |
| `src/hooks/usePwaInstall.ts` | Kurulum istemi (Chrome) |
| `src/components/InstallAppModal.tsx` | iOS adım adım rehber |
