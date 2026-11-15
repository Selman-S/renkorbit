import { useCallback, useEffect, useRef, useState } from 'react';
import { GameBoard } from './components/GameBoard';
import { GameControls } from './components/GameControls';
import { HUD } from './components/HUD';
import { LevelSelect } from './components/LevelSelect';
import { Scoreboard } from './components/Scoreboard';
import { UsernamePrompt } from './components/UsernamePrompt';
import { TutorialOverlay } from './components/TutorialOverlay';
import { TimeUpModal } from './components/TimeUpModal';
import { ComboBurstLayer, type ComboBurstItem } from './components/ComboBurst';
import { ShareToast } from './components/ShareToast';
import { RankUpModal } from './components/RankUpModal';
import { WinModal } from './components/WinModal';
import { DEFAULT_SETTINGS } from './game/levelConfig';
import { checkAchievements, getAchievementById } from './game/achievements';
import { addCoins, calculateReplayCoins, calculateWinCoins } from './game/coins';
import { runStorageMigrations } from './game/migrations';
import {
  getJourneySeed,
  getJourneySettings,
  hasNextStep,
  saveJourneyWin,
} from './game/progressionMap';
import { loadInventory } from './game/shop';
import { addScoreHistoryEntry } from './game/scoreHistory';
import { recordWinStats } from './game/statistics';
import {
  addToTotalScore,
  calculateScore,
  loadBestScore,
  loadTotalScore,
  saveBestScore,
} from './game/scoring';
import {
  buildShareUrl,
  getShareMessage,
  parseShareFromUrl,
  sharePuzzleLink,
  type SharedPuzzlePayload,
} from './game/sharePuzzle';
import { registerLeaderboardPlayer, syncLeaderboardScore } from './game/leaderboardApi';
import { hasUsername, isTutorialDone, markTutorialDone } from './game/storage';
import {
  calculateStars,
  loadBestStars,
  saveBestStars,
  type StarCount,
} from './game/stars';
import { canUndo } from './game/gameReducer';
import { useGame } from './hooks/useGame';
import { useSound } from './hooks/useSound';
import { checkRankPromotion, migratePlayerRank, type PlayerRank } from './game/ranks';
import './styles/global.css';
import './App.css';

type Screen = 'menu' | 'game';

function App() {
  // Runs once, before any render-time storage reads below
  const [migration] = useState(runStorageMigrations);
  const [usernameReady, setUsernameReady] = useState(hasUsername);
  const [screen, setScreen] = useState<Screen>('menu');
  const [activeSettings, setActiveSettings] = useState(DEFAULT_SETTINGS);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [isNewStars, setIsNewStars] = useState(false);
  const [earnedStars, setEarnedStars] = useState<StarCount>(0);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [cosmeticsTick, setCosmeticsTick] = useState(0);
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [earnedTotalCredit, setEarnedTotalCredit] = useState(0);
  const [journeyRefreshKey, setJourneyRefreshKey] = useState(0);
  const [showProfile, setShowProfile] = useState(false);
  const [profileRefreshKey, setProfileRefreshKey] = useState(0);
  const [newAchievements, setNewAchievements] = useState<string[]>([]);
  const [scoreRefreshKey, setScoreRefreshKey] = useState(0);
  const [comboBursts, setComboBursts] = useState<ComboBurstItem[]>([]);
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [promotedRank, setPromotedRank] = useState<PlayerRank | null>(null);

  // Freeze the clock whenever the board isn't the thing on screen
  const gamePaused =
    screen !== 'game' || showTutorial || showScoreboard || showShop || showProfile || showStatistics;

  const { state, moveBalls, canDrop, undo, newGame, setGame, clearComboPops, clearComboBreaks } =
    useGame(activeSettings, { paused: gamePaused });
  const { play, muted, toggleMute, unlock } = useSound();

  const prevInvalidShake = useRef<number | null>(null);
  const winHandled = useRef(false);
  const [winRevealed, setWinRevealed] = useState(false);
  const burstIdRef = useRef(0);
  const comboPopTimers = useRef<number[]>([]);
  const shareLaunched = useRef(false);
  const shareToastTimer = useRef<number | null>(null);

  useEffect(() => {
    if (state.status !== 'won') {
      winHandled.current = false;
      return;
    }
    if (winHandled.current) return;
    winHandled.current = true;

    const score = calculateScore(
      state.comboScore,
      state.moves,
      state.elapsedSec,
      state.config,
      state.columns,
      state.journeyStep,
    );
    const stars = calculateStars(state.moves, state.settings, state.journeyStep);

    // Read records before writing — replays only pay for the improvement
    const prevBest = loadBestScore(state.gameKey);
    const prevBestStars = loadBestStars(state.gameKey);
    const isFirstClear = prevBest === null;

    const newRecord = saveBestScore(state.gameKey, {
      score,
      time: state.elapsedSec,
      moves: state.moves,
    });
    const totalCredit = isFirstClear ? score : Math.max(0, score - prevBest.score);
    const newTotal = addToTotalScore(totalCredit);
    void syncLeaderboardScore(newTotal);
    setEarnedTotalCredit(totalCredit);

    setEarnedStars(stars);
    setIsNewRecord(newRecord);
    setIsNewStars(saveBestStars(state.gameKey, stars));
    const winCoins = isFirstClear
      ? calculateWinCoins(stars, score, state.maxCombo, newRecord)
      : calculateReplayCoins(newRecord, stars - prevBestStars);
    addCoins(winCoins);
    setEarnedCoins(winCoins);
    setCosmeticsTick((n) => n + 1);

    if (state.isJourney && state.journeyStep !== null) {
      saveJourneyWin(state.journeyStep, stars);
      setJourneyRefreshKey((n) => n + 1);
      const newRank = checkRankPromotion();
      if (newRank) setPromotedRank(newRank);
    }

    addScoreHistoryEntry({
      gameKey: state.gameKey,
      label: state.config.label,
      score,
      time: state.elapsedSec,
      moves: state.moves,
      stars,
    });

    recordWinStats({
      gameKey: state.gameKey,
      label: state.config.label,
      score,
      moves: state.moves,
      stars,
      maxCombo: state.maxCombo,
    });

    const unlocked = checkAchievements({
      stars,
      maxCombo: state.maxCombo,
    });
    if (unlocked.length > 0) {
      setNewAchievements(unlocked);
      setProfileRefreshKey((n) => n + 1);
    }
    setScoreRefreshKey((n) => n + 1);
  }, [
    state.status,
    state.columns,
    state.comboScore,
    state.elapsedSec,
    state.moves,
    state.config,
    state.gameKey,
    state.settings,
    state.isJourney,
    state.journeyStep,
    state.maxCombo,
  ]);

  useEffect(() => {
    if (state.invalidShake !== null && state.invalidShake !== prevInvalidShake.current) {
      play('invalid');
    }
    prevInvalidShake.current = state.invalidShake;
  }, [state.invalidShake, play]);

  // Let the final tube's chime and glow land before the modal takes over.
  // winRevealed is reset by whoever starts a new board (see resetRoundUi).
  useEffect(() => {
    if (state.status !== 'won') return;
    const timer = window.setTimeout(() => {
      play('win');
      setWinRevealed(true);
    }, 850);
    return () => window.clearTimeout(timer);
  }, [state.status, play]);

  useEffect(() => {
    if (state.status === 'lost') play('invalid');
  }, [state.status, play]);

  useEffect(() => {
    if (state.comboPops.length === 0) return;

    const pops = [...state.comboPops];
    clearComboPops();

    pops.forEach((combo, index) => {
      const timer = window.setTimeout(() => {
        if (combo >= 2) {
          play('combo', combo);
          const id = burstIdRef.current++;
          setComboBursts((prev) => [...prev, { id, kind: 'gain', combo }]);
        } else {
          // First tube of a streak — the tube itself is the celebration
          play('tubeComplete');
        }
      }, index * 180);
      comboPopTimers.current.push(timer);
    });
  }, [state.comboPops, clearComboPops, play]);

  useEffect(() => {
    if (state.comboBreaks.length === 0) return;

    const breaks = [...state.comboBreaks];
    clearComboBreaks();

    breaks.forEach(({ combo, reason }, index) => {
      const timer = window.setTimeout(() => {
        play(reason === 'broken' ? 'comboBreak' : 'comboExpire', combo);
        const id = burstIdRef.current++;
        setComboBursts((prev) => [
          ...prev,
          { id, kind: reason === 'broken' ? 'break' : 'expire', combo },
        ]);
      }, index * 120);
      comboPopTimers.current.push(timer);
    });
  }, [state.comboBreaks, clearComboBreaks, play]);

  useEffect(() => {
    return () => {
      comboPopTimers.current.forEach((timer) => window.clearTimeout(timer));
      comboPopTimers.current = [];
    };
  }, []);

  const removeComboBurst = useCallback((id: number) => {
    setComboBursts((prev) => prev.filter((burst) => burst.id !== id));
  }, []);

  const showShareToast = useCallback((text: string) => {
    if (shareToastTimer.current !== null) window.clearTimeout(shareToastTimer.current);
    setShareToast(text);
    shareToastTimer.current = window.setTimeout(() => {
      setShareToast(null);
      shareToastTimer.current = null;
    }, 2200);
  }, []);

  const handleSharePuzzle = useCallback(async () => {
    if (screen !== 'game') return;
    try {
      const url = buildShareUrl(state);
      const result = await sharePuzzleLink(url, getShareMessage(state));
      showShareToast(result === 'shared' ? 'Paylaşıldı!' : 'Link kopyalandı!');
    } catch {
      /* user cancelled native share */
    }
  }, [screen, state, showShareToast]);

  /** Clear per-round win UI before a new board appears */
  const resetRoundUi = useCallback(() => {
    setIsNewRecord(false);
    setIsNewStars(false);
    setEarnedStars(0);
    setEarnedCoins(0);
    setEarnedTotalCredit(0);
    setNewAchievements([]);
    setComboBursts([]);
    setWinRevealed(false);
  }, []);

  const startSharedPuzzle = useCallback(
    (payload: SharedPuzzlePayload) => {
      unlock();
      setActiveSettings(payload.settings);
      setGame(payload.settings, payload.seed);
      setScreen('game');
      resetRoundUi();
      setShowTutorial(false);
      if (payload.sourceLabel) {
        showShareToast(`${payload.sourceLabel} — paylaşılan bulmaca`);
      }
    },
    [setGame, unlock, showShareToast, resetRoundUi],
  );

  const restartBoard = useCallback(() => {
    resetRoundUi();
    newGame();
  }, [newGame, resetRoundUi]);

  useEffect(() => {
    if (!usernameReady) return;
    migratePlayerRank();
    if (!migration.scoringReset) return;
    void syncLeaderboardScore(0);
    const timer = window.setTimeout(
      () => showShareToast('Puanlama yenilendi — puanlar sıfırlandı, yolculuk ilerlemen korundu'),
      400,
    );
    return () => window.clearTimeout(timer);
  }, [usernameReady, migration.scoringReset, showShareToast]);

  useEffect(() => {
    if (!usernameReady || shareLaunched.current) return;
    const payload = parseShareFromUrl(window.location.search);
    if (!payload) return;
    shareLaunched.current = true;
    window.history.replaceState(null, '', window.location.pathname);
    startSharedPuzzle(payload);
  }, [usernameReady, startSharedPuzzle]);

  useEffect(() => {
    return () => {
      if (shareToastTimer.current !== null) window.clearTimeout(shareToastTimer.current);
    };
  }, []);

  const startJourneyStep = useCallback(
    (stepIndex: number) => {
      const settings = getJourneySettings(stepIndex);
      const seed = getJourneySeed(stepIndex);
      unlock();
      setActiveSettings(settings);
      setGame(settings, seed, stepIndex);
      setScreen('game');
      resetRoundUi();
      setShowTutorial(stepIndex === 1 && !isTutorialDone());
    },
    [setGame, unlock, resetRoundUi],
  );

  const completeTutorial = useCallback(() => {
    markTutorialDone();
    setShowTutorial(false);
  }, []);

  const goMenu = useCallback(() => setScreen('menu'), []);

  const handleUndo = useCallback(() => {
    undo();
    play('undo');
  }, [undo, play]);

  const startNextJourneyStep = useCallback(() => {
    if (state.journeyStep === null) return;
    const next = state.journeyStep + 1;
    if (hasNextStep(state.journeyStep)) startJourneyStep(next);
  }, [state.journeyStep, startJourneyStep]);

  const bestScore = loadBestScore(state.gameKey);
  const bestStars = loadBestStars(state.gameKey);
  const totalScore = loadTotalScore();
  const inventory = loadInventory();
  void cosmeticsTick;
  void scoreRefreshKey;

  const showNextStep =
    state.isJourney &&
    state.journeyStep !== null &&
    state.status === 'won' &&
    hasNextStep(state.journeyStep);

  if (!usernameReady) {
    return (
      <div className="app">
        <UsernamePrompt
          onComplete={() => {
            setUsernameReady(true);
            void registerLeaderboardPlayer();
          }}
        />
      </div>
    );
  }

  return (
    <div className={`app theme-${inventory.equippedTheme}`}>
      {screen === 'menu' ? (
        <LevelSelect
          onStartStep={startJourneyStep}
          onOpenLeaderboard={() => setShowScoreboard(true)}
          showScoreboard={showScoreboard}
          onCloseScoreboard={() => setShowScoreboard(false)}
          scoreRefreshKey={scoreRefreshKey}
          journeyRefreshKey={journeyRefreshKey}
          profileRefreshKey={profileRefreshKey}
          showProfile={showProfile}
          onCloseProfile={() => setShowProfile(false)}
          onOpenProfile={() => {
            checkAchievements();
            setProfileRefreshKey((n) => n + 1);
            setShowProfile(true);
          }}
          onUsernameChange={() => {
            setScoreRefreshKey((n) => n + 1);
            setProfileRefreshKey((n) => n + 1);
          }}
          showShop={showShop}
          onCloseShop={() => setShowShop(false)}
          onOpenShop={() => setShowShop(true)}
          onShopUpdate={() => {
            setCosmeticsTick((n) => n + 1);
            const unlocked = checkAchievements();
            if (unlocked.length > 0) setProfileRefreshKey((n) => n + 1);
          }}
          showStatistics={showStatistics}
          onCloseStatistics={() => setShowStatistics(false)}
          onOpenStatistics={() => setShowStatistics(true)}
          onShareToast={showShareToast}
        />
      ) : (
        <div className="app__game">
          <HUD
            state={state}
            totalScore={totalScore}
            onOpenScoreboard={() => setShowScoreboard(true)}
          />
          <main className="app__board">
            <GameBoard
              columns={state.columns}
              config={state.config}
              invalidShake={state.invalidShake}
              disabled={state.status !== 'playing' || showTutorial}
              canDrop={canDrop}
              ballSkin={inventory.equippedBallSkin}
              tubeScores={state.tubeScores}
              celebrate={state.status === 'won'}
              onBallMove={moveBalls}
              onPick={(h) => play('pick', h)}
              onDrop={(h) => play('drop', h)}
            />
            <WinModal
              state={state}
              open={state.status === 'won' && winRevealed}
              onStarReveal={(i) => play('star', i)}
              isNewRecord={isNewRecord}
              isNewStars={isNewStars}
              earnedStars={earnedStars}
              bestStars={bestStars}
              bestScore={bestScore}
              earnedCoins={earnedCoins}
              earnedTotalCredit={earnedTotalCredit}
              showNextStep={showNextStep}
              onNextStep={startNextJourneyStep}
              newAchievements={newAchievements.map(
                (id) => getAchievementById(id)?.title ?? id,
              )}
              onPlayAgain={restartBoard}
              onMenu={goMenu}
              onShare={handleSharePuzzle}
            />
            <TimeUpModal state={state} onRetry={restartBoard} onMenu={goMenu} />
            <TutorialOverlay open={showTutorial} onComplete={completeTutorial} />
            <ComboBurstLayer bursts={comboBursts} onDone={removeComboBurst} />
          </main>
          <GameControls
            canUndo={canUndo(state)}
            undoLeft={
              state.undoLimit !== null ? Math.max(0, state.undoLimit - state.undosUsed) : null
            }
            soundMuted={muted}
            onUndo={handleUndo}
            onRestart={restartBoard}
            onMenu={goMenu}
            onToggleSound={toggleMute}
            onShare={handleSharePuzzle}
          />
          <Scoreboard
            open={showScoreboard}
            onClose={() => setShowScoreboard(false)}
            refreshKey={scoreRefreshKey}
            overlay="transparent"
            anchor="contained"
          />
        </div>
      )}
      <ShareToast message={shareToast} />
      <RankUpModal rank={promotedRank} onClose={() => setPromotedRank(null)} />
    </div>
  );
}

export default App;
