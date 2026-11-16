import { useCallback, useEffect, useRef, useState } from 'react';
import { GameBoard } from './components/GameBoard';
import { GameControls } from './components/GameControls';
import { HUD } from './components/HUD';
import { LevelSelect } from './components/LevelSelect';
import { Scoreboard, type ScoreboardTab } from './components/Scoreboard';
import { UsernamePrompt } from './components/UsernamePrompt';
import { TutorialOverlay } from './components/TutorialOverlay';
import { TimeUpModal } from './components/TimeUpModal';
import { ComboBurstLayer, type ComboBurstItem } from './components/ComboBurst';
import { ShareToast } from './components/ShareToast';
import { RankUpModal } from './components/RankUpModal';
import { WinModal, type DailyWinInfo, type EndlessStageInfo } from './components/WinModal';
import { RunOverModal } from './components/RunOverModal';
import {
  finishEndlessRun,
  getEndlessMoveLimit,
  getEndlessMultiplier,
  getEndlessSeed,
  getEndlessShareText,
  getEndlessStageSettings,
  isEndlessUnlocked,
  newEndlessRun,
  type EndlessRun,
  type EndlessRunResult,
} from './game/endless';
import { DEFAULT_SETTINGS } from './game/levelConfig';
import {
  buildDailyShareUrl,
  getDailyInviteText,
  getDailyResult,
  getDailySeed,
  getDailySettings,
  getDailyShareText,
  getDailyStatus,
  parseDailyFromUrl,
  recordDailyWin,
} from './game/daily';
import { submitDailyScore } from './game/dailyApi';
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
import {
  addWeeklyPoints,
  getPendingWeeklyClaim,
  getWeeklyReward,
  getWeeklyScore,
  markWeeklyClaimed,
} from './game/weekly';
import { fetchWeeklyRank, submitWeeklyScore } from './game/weeklyApi';
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

/** Weekly league points: total-score credit and endless run scores */
function creditWeekly(points: number) {
  if (points <= 0) return;
  const { week, score } = addWeeklyPoints(points);
  void submitWeeklyScore(week, score);
}

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
  const [dailyWinInfo, setDailyWinInfo] = useState<DailyWinInfo | null>(null);
  const [scoreboardTab, setScoreboardTab] = useState<ScoreboardTab>('all');
  const [endlessRun, setEndlessRun] = useState<EndlessRun | null>(null);
  const [endlessStageInfo, setEndlessStageInfo] = useState<EndlessStageInfo | null>(null);
  const [runResult, setRunResult] = useState<EndlessRunResult | null>(null);
  const [runEndReason, setRunEndReason] = useState<'moves' | 'quit'>('moves');
  const [confirmQuitRun, setConfirmQuitRun] = useState(false);

  // Freeze the clock whenever the board isn't the thing on screen
  const gamePaused =
    screen !== 'game' ||
    showTutorial ||
    showScoreboard ||
    showShop ||
    showProfile ||
    showStatistics ||
    confirmQuitRun;

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
    setEarnedStars(stars);

    // Endless: the board feeds the run; records, total score and coins wait for the run's end
    if (state.endlessStage !== null) {
      const stage = state.endlessStage;
      const multiplier = getEndlessMultiplier(stage);
      const stageScore = Math.round(score * multiplier);
      const run = endlessRun ?? { ...newEndlessRun(), stage };
      const nextRun: EndlessRun = {
        ...run,
        runScore: run.runScore + stageScore,
        stagesCleared: run.stagesCleared + 1,
      };
      const next = getEndlessStageSettings(stage + 1);
      setEndlessRun(nextRun);
      setEndlessStageInfo({
        stage,
        stageScore,
        multiplier,
        runScore: nextRun.runScore,
        nextMoveLimit: getEndlessMoveLimit(stage + 1),
        nextColors: next.colors,
      });
      recordWinStats({
        gameKey: 'endless',
        label: '♾️ Sonsuz mod',
        score: stageScore,
        moves: state.moves,
        stars,
        maxCombo: state.maxCombo,
      });
      const unlocked = checkAchievements({ stars, maxCombo: state.maxCombo });
      if (unlocked.length > 0) {
        setNewAchievements(unlocked);
        setProfileRefreshKey((n) => n + 1);
      }
      return;
    }

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
    creditWeekly(totalCredit);
    setEarnedTotalCredit(totalCredit);

    setIsNewRecord(newRecord);
    setIsNewStars(saveBestStars(state.gameKey, stars));
    const winCoins = isFirstClear
      ? calculateWinCoins(stars, score, state.maxCombo, newRecord)
      : calculateReplayCoins(newRecord, stars - prevBestStars);

    // Daily: first finish of the day extends the streak and goes to the daily board
    let dailyBonus = 0;
    if (state.dailyDate) {
      const result = { score, moves: state.moves, time: state.elapsedSec, stars };
      const outcome = recordDailyWin(state.dailyDate, result);
      dailyBonus = outcome.bonusCoins;
      setDailyWinInfo({
        firstClear: outcome.firstClear,
        streak: outcome.streak,
        milestoneDays: outcome.milestoneDays,
        milestoneCoins: outcome.milestoneCoins,
      });
      if (outcome.firstClear) {
        void submitDailyScore(state.dailyDate, result).then(() =>
          setScoreRefreshKey((n) => n + 1),
        );
      }
    }

    const totalCoins = winCoins + dailyBonus;
    addCoins(totalCoins);
    setEarnedCoins(totalCoins);
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

    // Dailies share one stats row instead of one per date
    recordWinStats({
      gameKey: state.dailyDate ? 'daily' : state.gameKey,
      label: state.dailyDate ? '📅 Günlük bulmaca' : state.config.label,
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
    state.dailyDate,
    state.endlessStage,
    state.maxCombo,
    endlessRun,
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

  /** Close the run once: store best, award coins, show the summary */
  const endRun = useCallback(
    (run: EndlessRun, reason: 'moves' | 'quit') => {
      const result = finishEndlessRun(run);
      creditWeekly(result.runScore);
      if (result.coins > 0) {
        addCoins(result.coins);
        setCosmeticsTick((n) => n + 1);
      }
      const unlocked = checkAchievements();
      if (unlocked.length > 0) setProfileRefreshKey((n) => n + 1);
      setEndlessRun(null);
      setRunEndReason(reason);
      return result;
    },
    [],
  );

  // Out of moves in endless — the run is over
  const runLostHandled = useRef(false);
  useEffect(() => {
    if (state.status !== 'lost' || state.endlessStage === null) {
      runLostHandled.current = false;
      return;
    }
    if (runLostHandled.current || !endlessRun) return;
    runLostHandled.current = true;
    setRunResult(endRun(endlessRun, 'moves'));
  }, [state.status, state.endlessStage, endlessRun, endRun]);

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
      if (state.dailyDate) {
        // Daily: share the result (Wordle-style) once finished, else an invite
        const url = buildDailyShareUrl();
        const done = getDailyResult(state.dailyDate);
        const text = done
          ? getDailyShareText(state.dailyDate, done, getDailyStatus().streak)
          : getDailyInviteText(state.dailyDate);
        const result = await sharePuzzleLink(url, text, `${text}\n${url}`);
        showShareToast(result === 'shared' ? 'Paylaşıldı!' : 'Sonuç kopyalandı!');
        return;
      }
      const url = buildShareUrl(state);
      const result = await sharePuzzleLink(url, getShareMessage(state));
      showShareToast(result === 'shared' ? 'Paylaşıldı!' : 'Link kopyalandı!');
    } catch {
      /* user cancelled native share */
    }
  }, [screen, state, showShareToast]);

  const openScoreboard = useCallback((tab: ScoreboardTab) => {
    setScoreboardTab(tab);
    setShowScoreboard(true);
  }, []);

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
    setDailyWinInfo(null);
    setEndlessStageInfo(null);
    setRunResult(null);
    setConfirmQuitRun(false);
  }, []);

  const startEndlessBoard = useCallback(
    (run: EndlessRun) => {
      const settings = getEndlessStageSettings(run.stage);
      unlock();
      setActiveSettings(settings);
      setGame(settings, getEndlessSeed(run), { endlessStage: run.stage });
      setScreen('game');
      resetRoundUi();
      setShowTutorial(false);
    },
    [setGame, unlock, resetRoundUi],
  );

  const startEndless = useCallback(() => {
    if (!isEndlessUnlocked()) return;
    const run = newEndlessRun();
    setEndlessRun(run);
    startEndlessBoard(run);
  }, [startEndlessBoard]);

  const startNextEndlessStage = useCallback(() => {
    if (!endlessRun) return;
    const next = { ...endlessRun, stage: endlessRun.stage + 1 };
    setEndlessRun(next);
    startEndlessBoard(next);
  }, [endlessRun, startEndlessBoard]);

  const shareRunResult = useCallback(async () => {
    if (!runResult) return;
    const url = `${window.location.origin}${window.location.pathname}`;
    const text = getEndlessShareText(runResult);
    try {
      const result = await sharePuzzleLink(url, text, `${text}\n${url}`);
      showShareToast(result === 'shared' ? 'Paylaşıldı!' : 'Sonuç kopyalandı!');
    } catch {
      /* user cancelled native share */
    }
  }, [runResult, showShareToast]);

  const startDaily = useCallback(() => {
    const status = getDailyStatus();
    if (!status.unlocked) {
      showShareToast('Günün bulmacası ilk adımı tamamlayınca açılır');
      return;
    }
    const settings = getDailySettings(status.today);
    unlock();
    setActiveSettings(settings);
    setGame(settings, getDailySeed(status.today), { dailyDate: status.today });
    setScreen('game');
    resetRoundUi();
    setShowTutorial(false);
  }, [setGame, unlock, resetRoundUi, showShareToast]);

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
    // Re-register every session: keeps the online row on the anonymous auth
    // id (RLS owner) and restores rows wiped by supabase/secure-rls.sql
    void syncLeaderboardScore(loadTotalScore());

    const notices: string[] = [];
    if (migration.scoringReset) {
      notices.push('Puanlama yenilendi — puanlar sıfırlandı, yolculuk ilerlemen korundu');
    }
    if (migration.backfillCoins > 0) {
      notices.push(`Kazandığın rozet ve rütbeler için +${migration.backfillCoins} 🪙`);
    }
    if (notices.length === 0) return;

    const timers = notices.map((text, i) =>
      window.setTimeout(() => showShareToast(text), 400 + i * 2600),
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [usernameReady, migration.scoringReset, migration.backfillCoins, showShareToast]);

  // Weekly league: re-sync this week's row, pay out last week's rank once
  useEffect(() => {
    if (!usernameReady) return;
    const weekly = getWeeklyScore();
    if (weekly.score > 0) void submitWeeklyScore(weekly.week, weekly.score);

    const pending = getPendingWeeklyClaim();
    if (!pending) return;
    // Mark before the await so a re-run of this effect can't pay twice
    markWeeklyClaimed(pending.week);
    let timer = 0;
    void submitWeeklyScore(pending.week, pending.score)
      .then(() => fetchWeeklyRank(pending.week, pending.score))
      .catch(() => null)
      .then((rank) => {
        const coins = getWeeklyReward(rank);
        addCoins(coins);
        setCosmeticsTick((n) => n + 1);
        const place = rank !== null ? `${rank}. oldun` : 'ligde yer aldın';
        timer = window.setTimeout(
          () => showShareToast(`🏆 Geçen hafta ${place} · +${coins} 🪙`),
          3200,
        );
      });
    return () => window.clearTimeout(timer);
  }, [usernameReady, showShareToast]);

  useEffect(() => {
    if (!usernameReady || shareLaunched.current) return;
    const search = window.location.search;

    if (parseDailyFromUrl(search)) {
      shareLaunched.current = true;
      window.history.replaceState(null, '', window.location.pathname);
      startDaily();
      return;
    }

    const payload = parseShareFromUrl(search);
    if (!payload) return;
    shareLaunched.current = true;
    window.history.replaceState(null, '', window.location.pathname);
    startSharedPuzzle(payload);
  }, [usernameReady, startSharedPuzzle, startDaily]);

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
      setGame(settings, seed, { journeyStep: stepIndex });
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

  // Endless: leaving mid-run asks first; between stages it just closes the run
  const handleMenu = useCallback(() => {
    if (!endlessRun || state.endlessStage === null) {
      goMenu();
      return;
    }
    if (state.status === 'playing') {
      setConfirmQuitRun(true);
      return;
    }
    const result = endRun(endlessRun, 'quit');
    goMenu();
    if (result.stagesCleared > 0) {
      showShareToast(`Koşu bitti: ${result.stagesCleared} aşama · ${result.runScore} puan`);
    }
  }, [endlessRun, state.endlessStage, state.status, goMenu, endRun, showShareToast]);

  const confirmQuit = useCallback(() => {
    setConfirmQuitRun(false);
    if (!endlessRun) {
      goMenu();
      return;
    }
    setRunResult(endRun(endlessRun, 'quit'));
  }, [endlessRun, endRun, goMenu]);

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
          onStartDaily={startDaily}
          onStartEndless={startEndless}
          onOpenLeaderboard={() => openScoreboard('all')}
          onOpenDailyBoard={() => openScoreboard('daily')}
          onOpenWeeklyBoard={() => openScoreboard('week')}
          scoreboardTab={scoreboardTab}
          onScoreboardTabChange={setScoreboardTab}
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
            onOpenScoreboard={() => openScoreboard(state.dailyDate ? 'daily' : 'all')}
          />
          <main className="app__board">
            <GameBoard
              columns={state.columns}
              config={state.config}
              invalidShake={state.invalidShake}
              disabled={state.status !== 'playing' || showTutorial}
              canDrop={canDrop}
              ballSkin={inventory.equippedBallSkin}
              tubeSkin={inventory.equippedTubeSkin}
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
              newAchievements={newAchievements.map((id) => {
                const badge = getAchievementById(id);
                return badge ? `${badge.title} (+${badge.reward} 🪙)` : id;
              })}
              onPlayAgain={restartBoard}
              onMenu={handleMenu}
              onShare={state.endlessStage === null ? handleSharePuzzle : undefined}
              dailyInfo={dailyWinInfo}
              onOpenDailyBoard={() => openScoreboard('daily')}
              endlessInfo={endlessStageInfo}
              onNextStage={startNextEndlessStage}
            />
            {state.endlessStage === null ? (
              <TimeUpModal state={state} onRetry={restartBoard} onMenu={goMenu} />
            ) : (
              <RunOverModal
                confirmQuit={confirmQuitRun ? endlessRun : null}
                result={runResult}
                reason={runEndReason}
                onCancelQuit={() => setConfirmQuitRun(false)}
                onConfirmQuit={confirmQuit}
                onNewRun={startEndless}
                onMenu={goMenu}
                onShare={shareRunResult}
              />
            )}
            <TutorialOverlay open={showTutorial} onComplete={completeTutorial} />
            <ComboBurstLayer bursts={comboBursts} onDone={removeComboBurst} />
          </main>
          <GameControls
            canUndo={canUndo(state)}
            undoLeft={
              state.undoLimit !== null ? Math.max(0, state.undoLimit - state.undosUsed) : null
            }
            canRestart={state.endlessStage === null}
            soundMuted={muted}
            onUndo={handleUndo}
            onRestart={restartBoard}
            onMenu={handleMenu}
            onToggleSound={toggleMute}
            onShare={handleSharePuzzle}
          />
          <Scoreboard
            open={showScoreboard}
            onClose={() => setShowScoreboard(false)}
            refreshKey={scoreRefreshKey}
            overlay={state.status === 'won' ? 'dimmed' : 'transparent'}
            anchor="contained"
            tab={scoreboardTab}
            onTabChange={setScoreboardTab}
          />
        </div>
      )}
      <ShareToast message={shareToast} />
      <RankUpModal rank={promotedRank} onClose={() => setPromotedRank(null)} />
    </div>
  );
}

export default App;
