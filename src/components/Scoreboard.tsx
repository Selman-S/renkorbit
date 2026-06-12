import { useEffect, useState } from 'react';
import { buildLocalLeaderboard } from '../game/leaderboard';
import { fetchLeaderboard, isOnlineLeaderboard } from '../game/leaderboardApi';
import type { LeaderboardEntry } from '../game/leaderboard';
import { loadTotalScore } from '../game/scoring';
import { loadUsername } from '../game/storage';
import { ModalCard } from './ModalCard';
import './Scoreboard.css';

interface ScoreboardProps {
  open: boolean;
  onClose: () => void;
  refreshKey?: number;
  overlay?: 'dimmed' | 'transparent';
  anchor?: 'fixed' | 'contained';
}

export function Scoreboard({
  open,
  onClose,
  refreshKey = 0,
  overlay = 'dimmed',
  anchor = 'fixed',
}: ScoreboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [offline, setOffline] = useState(!isOnlineLeaderboard());

  useEffect(() => {
    if (!open) return;

    const playerName = loadUsername() ?? 'Sen';
    const localScore = loadTotalScore();

    if (!isOnlineLeaderboard()) {
      setOffline(true);
      setEntries(buildLocalLeaderboard(playerName, localScore));
      return;
    }

    setOffline(false);
    setLoading(true);

    void fetchLeaderboard()
      .then((rows) => {
        if (rows.length > 0) {
          setEntries(rows);
          return;
        }
        setEntries(buildLocalLeaderboard(playerName, localScore));
      })
      .catch(() => {
        setOffline(true);
        setEntries(buildLocalLeaderboard(playerName, localScore));
      })
      .finally(() => setLoading(false));
  }, [open, refreshKey]);

  return (
    <ModalCard
      open={open}
      onClose={onClose}
      titleId="scoreboard-title"
      title="Liderlik Tablosu"
      className="modal-card--tall"
      overlay={overlay}
      anchor={anchor}
    >
      {offline && (
        <p className="scoreboard__hint">Çevrimdışı mod — yalnızca senin skorun gösteriliyor.</p>
      )}
      {loading ? (
        <p className="modal-card__empty">Yükleniyor…</p>
      ) : entries.length === 0 ? (
        <p className="modal-card__empty">Henüz skor yok. İlk galibiyetini kazan!</p>
      ) : (
        <ul className="scoreboard__list">
          {entries.map((entry) => (
            <li
              key={`${entry.rank}-${entry.name}-${entry.score}`}
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
      )}
    </ModalCard>
  );
}
