import { ENDLESS_UNLOCK_STEPS, isEndlessUnlocked, loadEndlessBest } from '../game/endless';
import './DailyCard.css';

interface EndlessCardProps {
  onPlay: () => void;
}

/** Menu entry for endless mode — shares the daily card's look */
export function EndlessCard({ onPlay }: EndlessCardProps) {
  if (!isEndlessUnlocked()) {
    return (
      <section className="daily-card daily-card--locked" aria-label="Sonsuz mod">
        <span className="daily-card__icon" aria-hidden>
          ♾️
        </span>
        <div className="daily-card__body">
          <span className="daily-card__title">Sonsuz Mod</span>
          <span className="daily-card__sub">{ENDLESS_UNLOCK_STEPS} adım tamamlayınca açılır</span>
        </div>
        <span className="daily-card__lock" aria-hidden>
          🔒
        </span>
      </section>
    );
  }

  const best = loadEndlessBest();

  return (
    <section className="daily-card daily-card--endless" aria-label="Sonsuz mod">
      <span className="daily-card__icon" aria-hidden>
        ♾️
      </span>
      <div className="daily-card__body">
        <span className="daily-card__title">Sonsuz Mod</span>
        <span className="daily-card__sub">
          {best
            ? `En iyi: ${best.stagesCleared} aşama · ${best.runScore} puan`
            : 'Tahtalar büyür, hamle limiti daralır. Ne kadar gidebilirsin?'}
        </span>
      </div>
      <div className="daily-card__actions">
        <button type="button" className="daily-card__btn daily-card__btn--primary" onClick={onPlay}>
          Başla
        </button>
      </div>
    </section>
  );
}
