import { useEffect, useState } from 'react';
import {
  DAILY_UNLOCK_STEPS,
  formatCountdown,
  getDailyStatus,
  msUntilNextDaily,
} from '../game/daily';
import { StarRow } from './StarRow';
import './DailyCard.css';

interface DailyCardProps {
  onPlay: () => void;
  onOpenBoard: () => void;
}

/** Ticks once a second so the countdown and day rollover stay live */
function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

export function DailyCard({ onPlay, onOpenBoard }: DailyCardProps) {
  const now = useNow();
  const status = getDailyStatus(now);
  const { colors } = status.settings;

  if (!status.unlocked) {
    return (
      <section className="daily-card daily-card--locked" aria-label="Günün bulmacası">
        <span className="daily-card__icon" aria-hidden>
          📅
        </span>
        <div className="daily-card__body">
          <span className="daily-card__title">Günün Bulmacası</span>
          <span className="daily-card__sub">
            {DAILY_UNLOCK_STEPS === 1
              ? 'İlk adımı tamamlayınca açılır'
              : `${DAILY_UNLOCK_STEPS} adım tamamlayınca açılır`}
          </span>
        </div>
        <span className="daily-card__lock" aria-hidden>
          🔒
        </span>
      </section>
    );
  }

  if (status.completedToday && status.result) {
    return (
      <section className="daily-card daily-card--done" aria-label="Günün bulmacası tamamlandı">
        <span className="daily-card__icon" aria-hidden>
          ✅
        </span>
        <div className="daily-card__body">
          <span className="daily-card__title">
            Günlük #{status.number}
            {status.streak > 0 && <span className="daily-card__streak">🔥 {status.streak}</span>}
          </span>
          <span className="daily-card__sub daily-card__sub--result">
            {status.result.score} puan · {status.result.moves} hamle
            <StarRow count={status.result.stars} size="sm" />
          </span>
          <span className="daily-card__countdown">
            Yeni bulmaca {formatCountdown(msUntilNextDaily(now))} sonra
          </span>
        </div>
        <div className="daily-card__actions">
          <button type="button" className="daily-card__btn daily-card__btn--primary" onClick={onOpenBoard}>
            Sıralama
          </button>
          <button type="button" className="daily-card__btn" onClick={onPlay}>
            Tekrar
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="daily-card daily-card--open" aria-label="Günün bulmacası">
      <span className="daily-card__icon" aria-hidden>
        📅
      </span>
      <div className="daily-card__body">
        <span className="daily-card__title">
          Günün Bulmacası #{status.number}
          {status.streak > 0 && <span className="daily-card__streak">🔥 {status.streak}</span>}
        </span>
        <span className="daily-card__sub">
          {colors}×{colors} Karışık · herkes aynı bulmacayı çözüyor
        </span>
        {status.streak > 0 && (
          <span className="daily-card__warn">Serini korumak için bugün çöz!</span>
        )}
      </div>
      <div className="daily-card__actions">
        <button type="button" className="daily-card__btn daily-card__btn--primary" onClick={onPlay}>
          Oyna
        </button>
      </div>
    </section>
  );
}
