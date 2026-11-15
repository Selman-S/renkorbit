import { useEffect, useState } from 'react';
import { isOnlineLeaderboard } from '../game/leaderboardApi';
import {
  formatWeekCountdown,
  getWeeklyReward,
  getWeeklyScore,
  msUntilWeekEnd,
  WEEKLY_REWARDS,
} from '../game/weekly';
import { fetchWeeklyBoard, type WeeklyBoardResult } from '../game/weeklyApi';

/** This week's league — mount with a fresh key to refetch */
export function WeeklyBoard() {
  // Snapshot once per mount; the parent remounts on open/refresh
  const [local] = useState(() => getWeeklyScore());
  const [endsIn] = useState(() => msUntilWeekEnd());
  const online = isOnlineLeaderboard();
  const [board, setBoard] = useState<WeeklyBoardResult | null>(null);
  const [loading, setLoading] = useState(online);

  useEffect(() => {
    if (!online) return;
    let alive = true;
    void fetchWeeklyBoard(local.week, local.score)
      .then((result) => {
        if (alive) setBoard(result);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [online, local.week, local.score]);

  const unavailable = !online || (board !== null && !board.available);
  const rank = board?.available && board.playerRank > 0 ? board.playerRank : null;

  return (
    <div className="weekly-board">
      <p className="scoreboard__range">
        🏆 Haftalık lig · bitişe {formatWeekCountdown(endsIn)}
      </p>

      {local.score > 0 ? (
        <div className="scoreboard__player-card">
          <span className="scoreboard__player-card-emoji" aria-hidden>
            {rank !== null && rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : '🏆'}
          </span>
          <div className="scoreboard__player-card-text">
            <strong>
              {rank !== null ? `Bu hafta #${rank}` : 'Bu hafta'}
              {board?.available && board.totalPlayers > 0 && ` / ${board.totalPlayers}`}
            </strong>
            <span>
              {local.score} puan · şu an ödül +{getWeeklyReward(rank)} 🪙
            </span>
          </div>
        </div>
      ) : (
        <p className="scoreboard__promo">
          Bu hafta kazandığın her puan (ilk bitiriş, rekor, günlük, sonsuz koşu) lige yazılır.
        </p>
      )}

      <p className="weekly-board__rewards">
        {WEEKLY_REWARDS.map((t) => `${t.label} ${t.coins}🪙`).join(' · ')}
      </p>

      {unavailable && (
        <p className="scoreboard__hint">
          Haftalık tablo şu an çevrimdışı — puanın cihazında birikiyor, katılım ödülü yine verilir.
        </p>
      )}

      {loading ? (
        <p className="modal-card__empty">Yükleniyor…</p>
      ) : board?.available && board.entries.length > 0 ? (
        <ul className="scoreboard__list">
          {board.entries.map((entry) => (
            <li
              key={`${entry.rank}-${entry.name}`}
              className={[
                'scoreboard__row',
                entry.isPlayer && 'scoreboard__row--player',
                entry.rank <= 3 && 'scoreboard__row--top',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span className="scoreboard__rank">{entry.rank}</span>
              <div className="scoreboard__row-main">
                <span className="scoreboard__name">
                  {entry.name}
                  {entry.isPlayer && <span className="scoreboard__you"> · Sen</span>}
                </span>
              </div>
              <span className="scoreboard__score">{entry.score}</span>
            </li>
          ))}
        </ul>
      ) : (
        !unavailable && <p className="modal-card__empty">Bu hafta henüz puan yok. İlk sen ol!</p>
      )}
    </div>
  );
}
