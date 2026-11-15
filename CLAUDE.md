# CLAUDE.md

RenkOrbit: mobil ve tablet odaklı, web tabanlı renk sıralama bulmacası. Oyuncu renkli topları tüplere dizer ve 30 adımlık "Galaksi yolu"nda ilerler. Arayüz metinleri **Türkçe**.

## Komutlar

```bash
npm install
npm run dev            # Vite dev sunucusu
npm run dev:mobile     # vite --host, aynı ağdaki telefondan test için
npm run build          # tsc -b && vite build
npm run lint           # eslint .
npm run preview
npm run test:layout    # useBoardLayout boyut simülasyonu (scripts/test-layout.mjs)
npm run report:bonus   # bonus eğrisi raporu
npm run generate:icons # PWA ikonları (sh gerekir)
npm run reset:leaderboard
```

Unit test framework'ü yok. Doğrulama için `npm run build` (tip kontrolü) ve `npm run lint` çalıştır. Lint'te önceden kalan birkaç `react-hooks/set-state-in-effect` hatası var (Profile, Scoreboard, TutorialOverlay, usePwaInstall, App kazanma efekti); yeni hata ekleme, bunları fırsat bulunca temizle.

## Teknoloji

React 19, TypeScript 6, Vite 8, framer-motion. Online liderlik tablosu için Supabase (isteğe bağlı). PWA: `public/manifest.webmanifest` ve `public/sw.js`. Sesler harici dosya olmadan Web Audio ile üretilir (`src/hooks/useSound.ts`).

## Yapı

- `src/App.tsx`: ana kontrolcü. Ekranlar, modallar, ilerleme ve rütbe akışı burada birleşir.
- `src/components/`: her bileşenin yanında kendi `.css` dosyası var (`Bileşen.tsx` + `Bileşen.css`). Yeni bileşende bu düzeni koru.
- `src/game/`: saf oyun mantığı ve veri. UI'a bağımlı olmamalı.
  - `gameLogic.ts`: taşıma kuralları (`canMove`, `moveBalls`)
  - `gameReducer.ts`: oyun durumu (`SET_GAME`, `NEW_GAME`, `TICK`, `MOVE`, `UNDO`, ...)
  - `puzzleGenerator.ts`: seed tabanlı puzzle üretimi
  - `levelConfig.ts`: renk sayısı → sütun/kapasite
  - `progressionMap.ts`: 30 adımlık yol
  - `scoring.ts`, `combo.ts`, `stars.ts`, `journeyBonusTargets.ts`: puan, combo, yıldız ve bonus hedefleri
  - `ranks.ts`, `leagues.ts`, `leaderboard.ts`, `leaderboardApi.ts`: rütbe, lig ve liderlik
  - `coins.ts`, `shop.ts`, `achievements.ts`, `statistics.ts`, `scoreHistory.ts`: ekonomi ve meta sistemler
  - `shareGame.ts`, `sharePuzzle.ts`: paylaşım
  - `storage.ts`: kullanıcı adı, player id, tutorial ve ses ayarı
- `src/hooks/`: `useGame`, `useBoardLayout`, `useSound`, `usePwaInstall`
- `src/lib/supabase.ts`: Supabase istemcisi. Env yoksa `null` döner.
- `supabase/`: `schema.sql`, `daily_scores.sql`, `secure-rls.sql`, `reset-leaderboard.sql`
- `docs/`: FEATURES, ROADMAP, SUPABASE, MOBILE_TEST, PWA_INSTALL. `TODO.md` ve `todos/` görev takibi.

## Oyun kuralları (değiştirirken dikkat)

- N renk → N+1 sütun (N dolu, 1 boş), kapasite N, her renkten N top. Renk sayısı 3–12.
- Her hamlede **tek top** taşınır (en üstteki). Hedefte yer varsa renk önemli değil, sadece kapasite sınırı geçerli.
- Kazanma: her dolu tüp tek renk ve bir tüp boş.
- Sütun dizisinde index 0 alt, son eleman üsttür.
- Yerleşim modları: `rows` (sıralı) ve `mixed` (karışık).
- Galaksi yolu: her renk sayısı için 3 adım (Yörünge/sıralı, Karışık, Usta), toplam 30 adım. `ProgressionStep.variant` ('rows'|'mixed'|'usta') adım türünü belirler; başlık metnine göre karar verme. Usta adımlarında `USTA_UNDO_LIMIT` (3) geri alma sınırı var. Adımlar sabit seed kullanır, bu yüzden aynı adım her zaman aynı bulmacayı verir. Seed üretimini bozma.
- Yolculukta süreli mod yok. Süre arka planda sayılır ve bitişte hamle + süre **bonusu** verilir (ceza değil). `PlayMode: 'timed'` ve `TIME_LIMIT_SEC` eski koddur.
- **Combo** (`combo.ts`): tüp tamamlayınca combo +1, çarpan `min(combo, 8)`. Zincir, `getComboWindow(config)` = `clamp(ceil(N/2)+1, 3, 7)` hamle içinde yeni tüp bitmezse biter (`reason: 'expired'`, puan düşmez). Tamamlanmış tüpü bozmak puanı düşürür ve zinciri kırar (`reason: 'broken'`). Undo `comboWindow`'u da geri yükler.
- **Yıldızlar** (`stars.ts`): eşikler tahta boyutundan değil `journeyBonusTargets` playtest optimumundan türetilir (3★ ≤ ×1.15, 2★ ≤ ×1.6). `calculateStars` ve `getStarThresholds`'a `journeyStep` geçmeyi unutma.
- **Anti-farm** (`App.tsx` kazanma efekti): tekrar oyunda toplam puana sadece rekor farkı yazılır; coin yalnızca rekor kırınca (`calculateReplayCoins`). Rekorlar `saveBestScore`'dan **önce** okunur.
- Kazanma modalı 850 ms gecikmeli açılır (`winRevealed`), yeni tahta başlatan her yol `resetRoundUi()` çağırır.
- **Günlük bulmaca** (`daily.ts`): `GameState.dailyDate` (YYYY-MM-DD, cihazın yerel günü) doluysa oyun günlük moddadır; seed `hashString('renkorbit-daily-v1-' + tarih)`, `gameKey = daily_<tarih>`. `hashString`'i ve seed formatını değiştirme — herkesin aynı tahtayı görmesi buna bağlı. Seri/coin/tablo yalnızca günün **ilk** bitirişinde (`recordDailyWin().firstClear`). Günlük istatistikler tek `daily` satırında toplanır.
- **Sonsuz mod** (`endless.ts`): `GameState.endlessStage` doluysa endless; `moveLimit` dolunca reducer `status: 'lost'` yapar (kazanan son hamle yine kazanır). Koşu (`EndlessRun`) reducer'da değil App state'inde tutulur; her aşama yeni bir `SET_GAME`. Aşama kazancı en iyi skor/toplam puan/coin akışına girmez, hepsi koşu sonunda `finishEndlessRun` ile. Endless'te "Yeniden" gizli, Menü onay ister.
- Mod seçimi `setGame(settings, seed, { journeyStep | dailyDate | endlessStage })` ile; hiçbiri yoksa serbest (paylaşılan) tahta.
- **Ödüller:** `checkAchievements()` yeni açılan rozetlerin coin'ini kendisi öder; `checkRankPromotion()` / `migratePlayerRank()` atlanan rütbelerin ödülünü de öder. Çağıran tarafta tekrar `addCoins` yapma.
- **Mağaza** (`shop.ts`): tipler `ballSkin | tubeSkin | theme`, ürün id'si `skin-* / tube-* / theme-*`. Tüp skinleri `.game-board--tube-<id>` sınıfıyla uygulanır ve yalnızca renk/glow değiştirir — boyut değiştirmek `useBoardLayout`'u bozar. Temalar `App.css`'te `.app.theme-<id>`. Yeni arka plan görseli eklerken lisansını doğrula (önceki `cosmic1.jpg` filigranlı stok görsel olduğu için silindi).
- Oyun içi `contained` modallar (`ModalCard`) `z-index: 60` — kazanma/süre modallarının (50) ve tutorial'ın (55) üstünde olmalı.
- Günlük tablo `dailyApi.ts` → Supabase `daily_scores` (insert-only). Tablo yoksa `fetchDailyBoard` `available: false` döner; HEAD/count sorguları eksik tabloda hata vermeden `null` döndüğü için varlık kontrolünü normal `select` ile yap.

## Kalıcılık

- İlerleme `localStorage` üzerinde tutulur. Anahtarlar `renkorbit_` ile başlar: `journey`, `total_score`, `best_*`, `stars_*`, `coins`, `inventory`, `achievements`, `stats`, `score_history`, `rank_tier`, `username`, `player_id`, `tutorial_done`, `sound_muted`, `scoring_version`, `daily` (`{lastDate, streak, bestStreak, results}`, son 60 gün), `endless_best`, `rewards_backfill_v1`.
- `src/game/migrations.ts` tek seferlik migrasyonları tutar (`runStorageMigrations`, App'te lazy `useState` ile ilk render'dan önce çalışır). Puan formülünü değiştirirsen `SCORING_VERSION`'ı artır.
- Ses `useSound.play(event, level)` ile; `level` olaya göre yığın yüksekliği / combo seviyesi / yıldız indeksi. Haptik `src/lib/haptics.ts`, mute'tan bağımsız.
- `localStorage` erişimi her zaman `try/catch` içindedir (gizli mod, kota). Yeni okuma/yazma kodunda aynısını yap.
- Liderlik tablosu anonim `player_id` (UUID) kullanır, kullanıcıya görünen giriş sistemi yok. Tablo adı `leaderboard`, kolonlar `player_id`, `username`, `total_score`. Online yazmalar `resolveOnlinePlayerId()` (`onlineIdentity.ts`) ile Supabase anonim oturumunun `auth.uid()`'ini kullanır ve bunu `renkorbit_player_id`'ye yazar; `supabase/secure-rls.sql` sadece `player_id = auth.uid()` yazmaya izin verir. Anonim giriş kapalıysa eski cihaz UUID'sine düşer. Yazma yapan yeni kodda `loadPlayerId()` değil `resolveOnlinePlayerId()` kullan. İstemciye silme politikası ekleme.
- Supabase için `.env` içinde `VITE_SUPABASE_URL` ve `VITE_SUPABASE_ANON_KEY` gerekir (`.env.example`'a bak). Tanımlı değilse oyun yerel modda çalışır, `isSupabaseConfigured()` ile kontrol edilir. `.env` dosyasını commit etme.

## Tutarlılık notları

- `README.md` ve `docs/FEATURES.md` hâlâ **9 adımlı** yolu anlatıyor, kod ve `TODO.md` ise **30 adım**. Doğru kaynak kod. Yol ile ilgili bir değişiklik yaparsan dokümanları da güncelle.
- Kullanıcıya görünen tüm metinler Türkçe. Yeni metinleri de Türkçe yaz.
- Mobil öncelikli: tahta boyutu `useBoardLayout` ile hesaplanır. 12 sütunlu tahtada yatay kaydırma olmamalı. Layout'a dokunursan `npm run test:layout` çalıştır.
- Cihaz üzerinde 30 adımlı yol ve 12 sütunlu tahta doğrulaması hâlâ açık (bkz. `docs/MOBILE_TEST.md`).

## Git

Commit mesajları İngilizce, açıklayıcı ve tek cümlelik özet şeklinde yazılmış (örnek: "Add rank management features ...").
