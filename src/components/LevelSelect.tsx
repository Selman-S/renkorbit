import { getUnlockedCount, ACHIEVEMENTS } from '../game/achievements';
import { loadCoins } from '../game/coins';
import { loadTotalScore } from '../game/scoring';
import {
  getCompletedCount,
  getCurrentStepIndex,
  getStepProgress,
  isStepUnlocked,
  PROGRESSION_STEPS,
} from '../game/progressionMap';
import { Profile } from './Profile';
import { Shop } from './Shop';
import { Statistics } from './Statistics';
import { StarRow } from './StarRow';
import './LevelSelect.css';

interface LevelSelectProps {
  onStartStep: (stepIndex: number) => void;
  onOpenLeaderboard?: () => void;
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
}

export function LevelSelect({
  onStartStep,
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
}: LevelSelectProps) {
  void journeyRefreshKey;
  void profileRefreshKey;
  void scoreRefreshKey;
  const coins = loadCoins();
  const totalScore = loadTotalScore();
  const badges = getUnlockedCount();
  const currentStep = getCurrentStepIndex();
  const completed = getCompletedCount();

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

      <div className="level-select__scroll">
        <div className="level-select__scroll-inner">
          <p className="level-select__section-title">Galaksi yolu</p>

          <ol className="journey-path">
            {PROGRESSION_STEPS.map((step) => {
              const unlocked = isStepUnlocked(step.index);
              const progress = getStepProgress(step.index);
              const isCurrent = step.index === currentStep && !progress.completed;

              return (
                <li key={step.index} className="journey-path__item">
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
        </div>
      </footer>

      {onCloseProfile && (
        <Profile
          open={showProfile}
          onClose={onCloseProfile}
          refreshKey={profileRefreshKey}
        />
      )}
      {onCloseShop && (
        <Shop open={showShop} onClose={onCloseShop} onUpdate={onShopUpdate} />
      )}
      {onCloseStatistics && (
        <Statistics open={showStatistics} onClose={onCloseStatistics} />
      )}
    </div>
  );
}
