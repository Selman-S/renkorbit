import { buildLeaderboard } from '../game/leaderboard';
import { loadTotalScore } from '../game/scoring';
import { loadUsername } from '../game/storage';
import { ModalCard } from './ModalCard';
import './Scoreboard.css';

interface ScoreboardProps {
  open: boolean;
  onClose: () => void;
  refreshKey?: number;
}

export function Scoreboard({ open, onClose, refreshKey = 0 }: ScoreboardProps) {
  void refreshKey;
  const playerName = loadUsername() ?? 'Sen';
  const entries = buildLeaderboard(playerName, loadTotalScore());

  return (
    <ModalCard open={open} onClose={onClose} titleId="scoreboard-title" title="Liderlik Tablosu">
      <ul className="scoreboard__list">
        {entries.map((entry) => (
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
    </ModalCard>
  );
}
