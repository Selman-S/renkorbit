import { useEffect, useRef, useState } from 'react';
import { getUnlockedCount, ACHIEVEMENTS } from '../game/achievements';
import { loadCoins } from '../game/coins';
import { loadTotalScore } from '../game/scoring';
import {
  getCompletedCount,
  getCurrentStepIndex,
  getJourneyStep,
  getStepProgress,
  isStepUnlocked,
  PROGRESSION_STEPS,
} from '../game/progressionMap';
import { usePwaInstall } from '../hooks/usePwaInstall';
import { InstallAppModal } from './InstallAppModal';
import { Profile } from './Profile';
import { Scoreboard } from './Scoreboard';
import { Shop } from './Shop';
import { Statistics } from './Statistics';
import { ShareGameSheet } from './ShareGameSheet';
import { StarRow } from './StarRow';
import './LevelSelect.css';

interface LevelSelectProps {
  onStartStep: (stepIndex: number) => void;
  onOpenLeaderboard?: () => void;
  showScoreboard?: boolean;
  onCloseScoreboard?: () => void;
  journeyRefreshKey?: number;
  profileRefreshKey?: number;
  scoreRefreshKey?: number;
  showProfile?: boolean;
  onCloseProfile?: () => void;
  showShop?: boolean;
  onCloseShop?: () => void;
  onShopUpdate?: () => void;
  showStatistics?: boolean;
  onCloseStatistics?: () => void;
  onOpenProfile?: () => void;
  onOpenShop?: () => void;
  onOpenStatistics?: () => void;
  onUsernameChange?: (name: string) => void;
  onShareToast?: (message: string) => void;
}

export function LevelSelect({
  onStartStep,
  showScoreboard = false,
  onCloseScoreboard,
  onOpenLeaderboard,
  journeyRefreshKey = 0,
  profileRefreshKey = 0,
  scoreRefreshKey = 0,
  showProfile = false,
  onCloseProfile,
  showShop = false,
  onCloseShop,
  onShopUpdate,
  showStatistics = false,
  onCloseStatistics,
  onOpenProfile,
  onOpenShop,
  onOpenStatistics,
  onUsernameChange,
  onShareToast,
}: LevelSelectProps) {
  void journeyRefreshKey;
  void profileRefreshKey;
  void scoreRefreshKey;

  const [showInstall, setShowInstall] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showContinueCta, setShowContinueCta] = useState(false);
  const currentStepRef = useRef<HTMLLIElement | null>(null);
  const { canInstall, isIos, hasNativePrompt, promptInstall } = usePwaInstall();

  const coins = loadCoins();
  const totalScore = loadTotalScore();
  const badges = getUnlockedCount();
  const currentStep = getCurrentStepIndex();
  const completed = getCompletedCount();
  const currentProgress = getStepProgress(currentStep);
  const currentStepMeta = getJourneyStep(currentStep);
  const continueLabel = currentProgress.completed ? 'Oyna' : 'Devam et';
  const continueStepTitle = currentStepMeta
    ? `${currentStep}. ${currentStepMeta.title}`
    : `Adım ${currentStep}`;

  // Sticky CTA when the current step is below the fold
  useEffect(() => {
    const node = currentStepRef.current;
    if (!node) {
      setShowContinueCta(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setShowContinueCta(!entry.isIntersecting),
      { root: null, threshold: 0.35 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [currentStep, journeyRefreshKey]);

  return (
    <div className="level-select">
      <div className="level-select__topbar">
        <div className="level-select__record" title="Toplam puan">
          <span className="level-select__crown" aria-hidden>
            👑
          </span>
          <span className="level-select__record-value">{totalScore}</span>
        </div>

        {onOpenLeaderboard && (
          <button
            type="button"
            className="level-select__board-btn"
            onClick={onOpenLeaderboard}
            aria-label="Liderlik tablosu"
            title="Liderlik tablosu"
          >
            🏆
          </button>
        )}
      </div>

      <header className="level-select__header">
        <div className="level-select__logo" aria-hidden>
          <span className="level-select__orbit" />
          <span className="level-select__planet">🪐</span>
        </div>
        <h1 className="level-select__title">RenkOrbit</h1>
        <p className="level-select__tagline">Galaksi yolculuğuna devam et</p>
        <p className="level-select__coins">
          <span aria-hidden>🪙</span> {coins} · 🏅 {badges}/{ACHIEVEMENTS.length} · {completed}/
          {PROGRESSION_STEPS.length} adım
        </p>
      </header>

      {showContinueCta && (
        <div className="level-select__continue-bar">
          <button
            type="button"
            className="level-select__continue-btn"
            onClick={() => onStartStep(currentStep)}
          >
            <span className="level-select__continue-bolt" aria-hidden>
              <svg viewBox="0 0 32 52" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M16 0L9 19h5L7 52l18-28h-6l9-24H16z"
                  fill="currentColor"
                />
              </svg>
            </span>
            <span className="level-select__continue-text">
              {continueLabel}
              <span className="level-select__continue-sep" aria-hidden>
                {' '}
                ·{' '}
              </span>
              {continueStepTitle}
            </span>
          </button>
        </div>
      )}

      <div className="level-select__scroll">
        <div className="level-select__scroll-inner">
          <p className="level-select__section-title">Galaksi yolu</p>

          <ol className="journey-path">
            {PROGRESSION_STEPS.map((step) => {
              const unlocked = isStepUnlocked(step.index);
              const progress = getStepProgress(step.index);
              const isCurrent = step.index === currentStep && !progress.completed;

              return (
                <li
                  key={step.index}
                  className="journey-path__item"
                  ref={isCurrent ? currentStepRef : undefined}
                >
                  <button
                    type="button"
                    className={[
                      'journey-node',
                      !unlocked && 'journey-node--locked',
                      progress.completed && 'journey-node--done',
                      isCurrent && 'journey-node--current',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    disabled={!unlocked}
                    onClick={() => onStartStep(step.index)}
                  >
                    <span className="journey-node__emoji" aria-hidden>
                      {step.emoji}
                    </span>
                    <span className="journey-node__body">
                      <span className="journey-node__title">
                        {step.index}. {step.title}
                      </span>
                      <span className="journey-node__sub">{step.subtitle}</span>
                    </span>
                    <span className="journey-node__side">
                      {progress.completed && progress.stars > 0 ? (
                        <StarRow count={progress.stars} size="sm" />
                      ) : isCurrent ? (
                        <span className="journey-node__play">Oyna</span>
                      ) : (
                        <span className="journey-node__num">{step.index}</span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      <footer className="level-select__footer level-select__footer--compact">
        <div className="level-select__actions">
          {canInstall && (
            <button
              type="button"
              className="level-select__scores-btn"
              onClick={() => {
                if (hasNativePrompt) void promptInstall();
                else setShowInstall(true);
              }}
            >
              📲 Yükle
            </button>
          )}
          {onOpenProfile && (
            <button type="button" className="level-select__scores-btn" onClick={onOpenProfile}>
              🏅 Profil
            </button>
          )}
          {onOpenShop && (
            <button type="button" className="level-select__scores-btn" onClick={onOpenShop}>
              🛒 Mağaza
            </button>
          )}
          {onOpenStatistics && (
            <button type="button" className="level-select__scores-btn" onClick={onOpenStatistics}>
              📈 İstatistik
            </button>
          )}
          <button
            type="button"
            className="level-select__scores-btn"
            onClick={() => setShowShare(true)}
          >
            🔗 Paylaş
          </button>
        </div>
      </footer>

      <ShareGameSheet
        open={showShare}
        onClose={() => setShowShare(false)}
        onFeedback={onShareToast}
      />

      {onCloseProfile && (
        <Profile
          open={showProfile}
          onClose={onCloseProfile}
          refreshKey={profileRefreshKey}
          onUsernameChange={onUsernameChange}
        />
      )}
      {onCloseShop && (
        <Shop open={showShop} onClose={onCloseShop} onUpdate={onShopUpdate} />
      )}
      {onCloseStatistics && (
        <Statistics open={showStatistics} onClose={onCloseStatistics} />
      )}
      {onCloseScoreboard && (
        <Scoreboard
          open={showScoreboard}
          onClose={onCloseScoreboard}
          refreshKey={scoreRefreshKey}
          overlay="transparent"
          anchor="contained"
        />
      )}

      <InstallAppModal
        open={showInstall}
        isIos={isIos}
        onClose={() => setShowInstall(false)}
        onNativeInstall={
          hasNativePrompt
            ? () => {
                void promptInstall().then(() => setShowInstall(false));
              }
            : undefined
        }
      />
    </div>
  );
}
