# MVP Sprint — RenkOrbit

**Durum:** Çekirdek tamamlandı ✅ — polish ve cihaz testi bekliyor

---

## 1. Proje Kurulumu

- [x] Vite + React + TypeScript
- [x] framer-motion
- [x] Klasör yapısı
- [x] Mobil viewport + CSS reset

---

## 2. Oyun Motoru

- [x] `types.ts`
- [x] `constants.ts` — 12 renk paleti
- [x] `levelConfig.ts` — `GameSettings`, `buildConfig()`, `getGameKey()`
- [x] `gameLogic.ts` — tek top, renk kısıtı yok
- [x] `puzzleGenerator.ts` — `createRowLayout`, `createShuffledDeal`
- [x] `scoring.ts`
- [x] `gameReducer.ts`

---

## 3. Hook & UI

- [x] `useGame.ts`
- [x] `useBoardLayout.ts` — responsive tüp/top boyutu
- [x] `LevelSelect.tsx` — menü (güncel: galaksi yolu)
- [x] `Ball.tsx`, `Tube.tsx`, `GameBoard.tsx`, `DragFloatingBall.tsx`
- [x] `HUD.tsx`, `GameControls.tsx`, `WinModal.tsx`
- [x] `App.tsx`

---

## 4. Mobil & Skor

- [x] Sürükle-bırak, touch targets, safe area
- [x] Responsive layout — yatay scroll yok (`useBoardLayout`)
- [x] localStorage: `renkorbit_best_{colors}_{layoutMode}`
- [x] `TutorialOverlay` — ilk oyunda 3 adımlık rehber
- [x] `useSound` — taşıma, geçersiz, kazanma, geri al sesleri
- [ ] Gerçek cihaz testi (4/8/12, Sıralı/Karışık)

---

## MVP Done Kriterleri

- [x] Menüden renk + düzen seçilebiliyor
- [x] Her kombinasyonda oynanabilir puzzle
- [x] Sürükle-bırak + düşüş animasyonu
- [x] Kombinasyon bazlı skor kaydı
- [x] Production build başarılı
- [ ] Telefonda sorunsuz oynanış doğrulandı
