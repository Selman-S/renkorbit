import { useEffect, useState } from 'react';
import { getDailyStatus } from '../game/daily';
import { fetchDailyBoard, type DailyBoardResult } from '../game/dailyApi';
import { isOnlineLeaderboard } from '../game/leaderboardApi';

function formatClock(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Today's daily ranking — mount with a fresh key to refetch */
export function DailyBoard() {
  // Snapshot once per mount; the parent remounts on open/refresh
  const [status] = useState(() => getDailyStatus());
  const online = isOnlineLeaderboard();
  const [board, setBoard] = useState<DailyBoardResult | null>(null);
  const [loading, setLoading] = useState(online);

  useEffect(() => {
    if (!online) return;
    let alive = true;
    void fetchDailyBoard(status.today, status.result)
      .then((result) => {
        if (alive) setBoard(result);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [online, status.today, status.result]);

  const { colors } = status.settings;
  const unavailable = !online || (board !== null && !board.available);

  return (
    <div className="daily-board">
      <p className="scoreboard__range">
        📅 Günlük #{status.number} · {colors}×{colors} Karışık
        {status.streak > 0 && ` · 🔥 ${status.streak} gün`}
      </p>

      {status.result && board?.available && board.playerRank > 0 && (
        <div className="scoreboard__player-card">
          <span className="scoreboard__player-card-emoji" aria-hidden>
            {board.playerRank <= 3 ? ['🥇', '🥈', '🥉'][board.playerRank - 1] : '📅'}
          </span>
          <div className="scoreboard__player-card-text">
            <strong>
              Bugün #{board.playerRank} / {board.totalPlayers}
            </strong>
            <span>
              {status.result.score} puan · {status.result.moves} hamle
            </span>
          </div>
        </div>
      )}

      {!status.result && (
        <p className="scoreboard__promo">Bugünün bulmacasını bitir, sıralamaya gir! İlk bitirişin sayılır.</p>
      )}

      {unavailable && (
        <p className="scoreboard__hint">
          Günlük tablo şu an çevrimdışı
          {status.result ? ` — senin sonucun: ${status.result.score} puan, ${status.result.moves} hamle.` : '.'}
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
                <span className="scoreboard__global">
                  {entry.moves} hamle · {formatClock(entry.timeSec)}
                </span>
              </div>
              <span className="scoreboard__score">{entry.score}</span>
            </li>
          ))}
        </ul>
      ) : (
        !unavailable && <p className="modal-card__empty">Bugün henüz kimse bitirmedi. İlk sen ol!</p>
      )}
    </div>
  );
}
