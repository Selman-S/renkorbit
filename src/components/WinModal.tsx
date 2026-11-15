import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateScoreBreakdown, formatTime, type BestScore } from '../game/scoring';
import { getStarThresholds, type StarCount } from '../game/stars';
import type { GameState } from '../game/types';
import { useCountUp } from '../hooks/useCountUp';
import { StarRow } from './StarRow';
import './WinModal.css';

/** Stage clear inside an endless run */
export interface EndlessStageInfo {
  stage: number;
  stageScore: number;
  multiplier: number;
  runScore: number;
  nextMoveLimit: number;
  nextColors: number;
}

/** Extra win context when the board was the daily puzzle */
export interface DailyWinInfo {
  firstClear: boolean;
  streak: number;
  milestoneDays: number | null;
  milestoneCoins: number;
}

interface WinModalProps {
  state: GameState;
  /** Parent delays this past the win so the last tube FX can play */
  open: boolean;
  isNewRecord: boolean;
  isNewStars: boolean;
  earnedStars: StarCount;
  bestStars: StarCount;
  bestScore: BestScore | null;
  earnedCoins?: number;
  /** Points added to the all-time total (0 on a replay that didn't beat the record) */
  earnedTotalCredit?: number;
  newAchievements?: string[];
  showNextStep?: boolean;
  onNextStep?: () => void;
  onPlayAgain: () => void;
  onMenu: () => void;
  onShare?: () => void;
  onStarReveal?: (index: number) => void;
  dailyInfo?: DailyWinInfo | null;
  onOpenDailyBoard?: () => void;
  endlessInfo?: EndlessStageInfo | null;
  onNextStage?: () => void;
}

/** 0 title · 1 stars · 2 score rows · 3 badges + actions */
type Stage = 0 | 1 | 2 | 3;

const STAR_STAGGER_MS = 220;

const rowMotion = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
};

export function WinModal({
  state,
  open,
  isNewRecord,
  isNewStars,
  earnedStars,
  bestStars,
  bestScore,
  earnedCoins = 0,
  earnedTotalCredit = 0,
  newAchievements = [],
  showNextStep = false,
  onNextStep,
  onPlayAgain,
  onMenu,
  onShare,
  onStarReveal,
  dailyInfo = null,
  onOpenDailyBoard,
  endlessInfo = null,
  onNextStage,
}: WinModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="win-modal__backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <WinCard
            state={state}
            isNewRecord={isNewRecord}
            isNewStars={isNewStars}
            earnedStars={earnedStars}
            bestStars={bestStars}
            bestScore={bestScore}
            earnedCoins={earnedCoins}
            earnedTotalCredit={earnedTotalCredit}
            newAchievements={newAchievements}
            showNextStep={showNextStep}
            onNextStep={onNextStep}
            onPlayAgain={onPlayAgain}
            onMenu={onMenu}
            onShare={onShare}
            onStarReveal={onStarReveal}
            dailyInfo={dailyInfo}
            onOpenDailyBoard={onOpenDailyBoard}
            endlessInfo={endlessInfo}
            onNextStage={onNextStage}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

type WinCardProps = Omit<WinModalProps, 'open'>;

/** Mounted only while open, so the reveal stage starts fresh every win */
function WinCard({
  state,
  isNewRecord,
  isNewStars,
  earnedStars,
  bestStars,
  bestScore,
  earnedCoins = 0,
  earnedTotalCredit = 0,
  newAchievements = [],
  showNextStep = false,
  onNextStep,
  onPlayAgain,
  onMenu,
  onShare,
  onStarReveal,
  dailyInfo = null,
  onOpenDailyBoard,
  endlessInfo = null,
  onNextStage,
}: WinCardProps) {
  const breakdown = calculateScoreBreakdown(
    state.comboScore,
    state.moves,
    state.elapsedSec,
    state.config,
    state.columns,
    state.journeyStep,
  );
  const thresholds = getStarThresholds(state.settings, state.journeyStep);

  const [stage, setStage] = useState<Stage>(0);

  useEffect(() => {
    const starsDone = 250 + earnedStars * STAR_STAGGER_MS + 300;
    const timers = [
      window.setTimeout(() => setStage(1), 250),
      window.setTimeout(() => setStage(2), starsDone),
      window.setTimeout(() => setStage(3), starsDone + 450),
    ];
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [earnedStars]);

  const shownTotal = useCountUp(stage >= 2 ? breakdown.finalScore : 0, 700);

  const isEndless = endlessInfo !== null;
  const replayNoGain = earnedTotalCredit === 0 && earnedCoins === 0 && !isEndless;
  const isDaily = dailyInfo !== null;

  return (
          <motion.div
            className="win-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="win-modal-title"
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 12 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
          >
            <div className="win-modal__confetti" aria-hidden />
            <h2 id="win-modal-title" className="win-modal__title">
              {isEndless ? `Aşama ${endlessInfo.stage}!` : 'Tebrikler!'}
            </h2>
            <p className="win-modal__subtitle">{state.config.label} tamamlandı</p>

            <div className="win-modal__stars-wrap">
              {stage >= 1 ? (
                <StarRow
                  count={earnedStars}
                  size="lg"
                  animate
                  staggerMs={STAR_STAGGER_MS}
                  onStarShown={onStarReveal}
                />
              ) : (
                <StarRow count={0} size="lg" />
              )}
              <AnimatePresence>
                {stage >= 2 && (
                  <motion.span
                    key="star-hint"
                    className={`win-modal__star-target${earnedStars === 3 ? ' win-modal__star-target--perfect' : ''}`}
                    {...rowMotion}
                    transition={{ duration: 0.25 }}
                  >
                    {earnedStars === 3
                      ? `Mükemmel! Hedef ≤${thresholds.three.maxMoves} hamle`
                      : earnedStars === 2
                        ? `3★ için ≤${thresholds.three.maxMoves} hamle`
                        : `2★ için ≤${thresholds.two.maxMoves} · 3★ için ≤${thresholds.three.maxMoves} hamle`}
                  </motion.span>
                )}
                {stage >= 2 && isNewStars && earnedStars > 0 && (
                  <motion.span
                    key="star-badge"
                    className="win-modal__stars-badge"
                    {...rowMotion}
                    transition={{ duration: 0.25, delay: 0.1 }}
                  >
                    Yeni yıldız rekoru!
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            <AnimatePresence>
              {stage >= 3 && dailyInfo?.firstClear && (
                <motion.div
                  key="streak"
                  className="win-modal__streak"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: [0.6, 1.12, 1] }}
                  transition={{ duration: 0.45, ease: 'easeOut' }}
                >
                  <span className="win-modal__streak-flame" aria-hidden>
                    🔥
                  </span>
                  <span>
                    <strong>{dailyInfo.streak}</strong> günlük seri
                  </span>
                </motion.div>
              )}
              {stage >= 3 && dailyInfo?.milestoneDays && (
                <motion.div
                  key="milestone"
                  className="win-modal__badge"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 24, delay: 0.12 }}
                >
                  🎉 {dailyInfo.milestoneDays} gün ödülü +{dailyInfo.milestoneCoins} 🪙
                </motion.div>
              )}
              {stage >= 3 && isNewRecord && !isDaily && (
                <motion.div
                  key="record"
                  className="win-modal__badge"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 24 }}
                >
                  Yeni puan rekoru!
                </motion.div>
              )}
              {stage >= 3 && newAchievements.length > 0 && (
                <motion.div
                  key="achievements"
                  className="win-modal__badge win-modal__badge--achievements"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 24, delay: 0.08 }}
                >
                  🏅 Yeni rozet: {newAchievements.join(', ')}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="win-modal__scores">
              <AnimatePresence>
                {stage >= 2 && (
                  <>
                    <motion.div
                      key="gross"
                      className="win-modal__row"
                      {...rowMotion}
                      transition={{ duration: 0.25 }}
                    >
                      <span>Brüt puan</span>
                      <strong>{breakdown.grossScore}</strong>
                    </motion.div>
                    {breakdown.moveBonus > 0 && (
                      <motion.div
                        key="move"
                        className="win-modal__row win-modal__row--bonus"
                        {...rowMotion}
                        transition={{ duration: 0.25, delay: 0.09 }}
                      >
                        <span>
                          Hamle bonusu ({breakdown.moves} / ≤{breakdown.targets.minMoves})
                        </span>
                        <strong>+{breakdown.moveBonus}</strong>
                      </motion.div>
                    )}
                    {breakdown.timeBonus > 0 && (
                      <motion.div
                        key="time"
                        className="win-modal__row win-modal__row--bonus"
                        {...rowMotion}
                        transition={{ duration: 0.25, delay: 0.18 }}
                      >
                        <span>
                          Süre bonusu ({formatTime(breakdown.elapsedSec)} / ≤
                          {formatTime(breakdown.targets.minTimeSec)})
                        </span>
                        <strong>+{breakdown.timeBonus}</strong>
                      </motion.div>
                    )}
                    <motion.div
                      key="total"
                      className="win-modal__row win-modal__row--total"
                      {...rowMotion}
                      transition={{ duration: 0.25, delay: 0.27 }}
                    >
                      <span>{isEndless ? 'Tahta puanı' : 'Toplam puan'}</span>
                      <strong>{shownTotal}</strong>
                    </motion.div>
                  </>
                )}
                {stage >= 3 && isEndless && (
                  <>
                    <motion.div
                      key="stage-score"
                      className="win-modal__row win-modal__row--credit"
                      {...rowMotion}
                      transition={{ duration: 0.25 }}
                    >
                      <span>Aşama çarpanı ×{endlessInfo.multiplier.toFixed(1)}</span>
                      <strong>+{endlessInfo.stageScore}</strong>
                    </motion.div>
                    <motion.div
                      key="run-score"
                      className="win-modal__row win-modal__row--total"
                      {...rowMotion}
                      transition={{ duration: 0.25, delay: 0.09 }}
                    >
                      <span>Koşu puanı</span>
                      <strong>{endlessInfo.runScore}</strong>
                    </motion.div>
                    <motion.div
                      key="next-stage"
                      className="win-modal__row win-modal__row--hint"
                      {...rowMotion}
                      transition={{ duration: 0.25, delay: 0.18 }}
                    >
                      <span>
                        Sıradaki: {endlessInfo.nextColors}×{endlessInfo.nextColors} · en fazla{' '}
                        {endlessInfo.nextMoveLimit} hamle
                      </span>
                    </motion.div>
                  </>
                )}
                {stage >= 3 && !isEndless && (
                  <>
                    {earnedTotalCredit > 0 && (
                      <motion.div
                        key="credit"
                        className="win-modal__row win-modal__row--credit"
                        {...rowMotion}
                        transition={{ duration: 0.25 }}
                      >
                        <span>Toplam puana</span>
                        <strong>+{earnedTotalCredit} 👑</strong>
                      </motion.div>
                    )}
                    {earnedCoins > 0 && (
                      <motion.div
                        key="coins"
                        className="win-modal__row win-modal__row--coins"
                        {...rowMotion}
                        transition={{ duration: 0.25, delay: 0.09 }}
                      >
                        <span>Orbit Coin</span>
                        <strong>+{earnedCoins} 🪙</strong>
                      </motion.div>
                    )}
                    {isDaily && !dailyInfo?.firstClear ? (
                      <motion.div
                        key="daily-replay"
                        className="win-modal__row win-modal__row--hint"
                        {...rowMotion}
                        transition={{ duration: 0.25 }}
                      >
                        <span>Günlük tabloda ilk bitirişin sayılır</span>
                      </motion.div>
                    ) : (
                      replayNoGain && (
                        <motion.div
                          key="nogain"
                          className="win-modal__row win-modal__row--hint"
                          {...rowMotion}
                          transition={{ duration: 0.25 }}
                        >
                          <span>Rekoru geçersen puan ve coin kazanırsın</span>
                        </motion.div>
                      )
                    )}
                    {state.maxCombo >= 2 && (
                      <motion.div
                        key="combo"
                        className="win-modal__row win-modal__row--muted"
                        {...rowMotion}
                        transition={{ duration: 0.25, delay: 0.18 }}
                      >
                        <span>En yüksek combo</span>
                        <strong>×{state.maxCombo}</strong>
                      </motion.div>
                    )}
                    {bestScore && !isNewRecord && (
                      <motion.div
                        key="best"
                        className="win-modal__row win-modal__row--muted"
                        {...rowMotion}
                        transition={{ duration: 0.25, delay: 0.22 }}
                      >
                        <span>En iyi puan</span>
                        <strong>{bestScore.score}</strong>
                      </motion.div>
                    )}
                    {bestStars > 0 && !isNewStars && (
                      <motion.div
                        key="beststars"
                        className="win-modal__row win-modal__row--muted"
                        {...rowMotion}
                        transition={{ duration: 0.25, delay: 0.26 }}
                      >
                        <span>En iyi yıldız</span>
                        <StarRow count={bestStars} size="sm" />
                      </motion.div>
                    )}
                  </>
                )}
              </AnimatePresence>
            </div>

            <motion.div
              className="win-modal__actions"
              initial={{ opacity: 0 }}
              animate={{ opacity: stage >= 3 ? 1 : 0.35 }}
              transition={{ duration: 0.3 }}
            >
              {onShare && (
                <button type="button" className="win-modal__btn win-modal__btn--share" onClick={onShare}>
                  {isDaily ? 'Sonucu paylaş' : 'Paylaş'}
                </button>
              )}
              <button type="button" className="win-modal__btn" onClick={onMenu}>
                Menü
              </button>
              {isEndless && onNextStage ? (
                <button type="button" className="win-modal__btn win-modal__btn--primary" onClick={onNextStage}>
                  Sonraki aşama
                </button>
              ) : isDaily && onOpenDailyBoard ? (
                <button type="button" className="win-modal__btn win-modal__btn--primary" onClick={onOpenDailyBoard}>
                  Sıralama
                </button>
              ) : showNextStep && onNextStep ? (
                <button type="button" className="win-modal__btn win-modal__btn--primary" onClick={onNextStep}>
                  Sonraki adım
                </button>
              ) : (
                <button type="button" className="win-modal__btn win-modal__btn--primary" onClick={onPlayAgain}>
                  Tekrar
                </button>
              )}
            </motion.div>
          </motion.div>
  );
}
