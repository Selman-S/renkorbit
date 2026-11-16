import { useEffect, useState } from 'react';
import { isOnlineLeaderboard } from '../game/leaderboardApi';
import {
  formatWeekCountdown,
  getWeeklyReward,
  getWeeklyScore,
  msUntilWeekEnd,
} from '../game/weekly';
import { fetchWeeklyRank } from '../game/weeklyApi';
import './DailyCard.css';

interface WeeklyCardProps {
  onOpenBoard: () => void;
}

/** Re-renders once a minute so the countdown and week rollover stay live */
function useMinuteNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

/** Menu summary of the weekly league — remount with a new key after wins */
export function WeeklyCard({ onOpenBoard }: WeeklyCardProps) {
  const now = useMinuteNow();
  const { week, score } = getWeeklyScore(now);
  const [rank, setRank] = useState<{ week: string; score: number; value: number | null } | null>(null);

  useEffect(() => {
    if (score <= 0 || !isOnlineLeaderboard()) return;
    let alive = true;
    void fetchWeeklyRank(week, score).then((value) => {
      if (alive) setRank({ week, score, value });
    });
    return () => {
      alive = false;
    };
  }, [week, score]);

  // Ignore a rank fetched for an older score or week
  const currentRank = rank && rank.week === week && rank.score === score ? rank.value : null;
  const endsIn = formatWeekCountdown(msUntilWeekEnd(now));
  const medal = currentRank !== null && currentRank <= 3 ? ['🥇', '🥈', '🥉'][currentRank - 1] : '🏆';

  return (
    <section className="daily-card daily-card--weekly" aria-label="Haftalık lig">
      <span className="daily-card__icon" aria-hidden>
        {medal}
      </span>
      <div className="daily-card__body">
        <span className="daily-card__title">
          Haftalık Lig
          {currentRank !== null && <span className="daily-card__rank">#{currentRank}</span>}
        </span>
        {score > 0 ? (
          <span className="daily-card__sub daily-card__sub--result">
            {score} puan · ödül +{getWeeklyReward(currentRank)} 🪙
          </span>
        ) : (
          <span className="daily-card__sub">Bu hafta puan kazan, lige gir. 1. olana 500 🪙</span>
        )}
        <span className="daily-card__countdown">Bitişe {endsIn}</span>
      </div>
      <div className="daily-card__actions">
        <button type="button" className="daily-card__btn daily-card__btn--primary" onClick={onOpenBoard}>
          Sıralama
        </button>
      </div>
    </section>
  );
}
