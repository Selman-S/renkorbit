import {
  formatStatsDate,
  getGlobalSummary,
  loadStatsList,
  type GameStats,
} from '../game/statistics';
import { ModalCard } from './ModalCard';
import { StarRow } from './StarRow';
import './Statistics.css';

interface StatisticsProps {
  open: boolean;
  onClose: () => void;
}

export function Statistics({ open, onClose }: StatisticsProps) {
  const stats = loadStatsList();
  const summary = getGlobalSummary(stats);

  return (
    <ModalCard
      open={open}
      onClose={onClose}
      titleId="stats-title"
      title="İstatistikler"
      className="modal-card--tall"
      overlay="transparent"
      anchor="contained"
    >
      {stats.length === 0 ? (
        <p className="modal-card__empty">
          Henüz kayıtlı galibiyet yok. Bir adımı tamamla, istatistikler burada görünsün!
        </p>
      ) : (
        <>
          <div className="stats__summary">
            <div className="stats__summary-item">
              <span className="stats__summary-value">{summary.totalWins}</span>
              <span className="stats__summary-label">Galibiyet</span>
            </div>
            <div className="stats__summary-item">
              <span className="stats__summary-value">{summary.combinationsPlayed}</span>
              <span className="stats__summary-label">Kombinasyon</span>
            </div>
          </div>

          <ul className="stats__list">
            {stats.map((entry) => (
              <StatsRow key={entry.gameKey} entry={entry} />
            ))}
          </ul>
        </>
      )}
    </ModalCard>
  );
}

function StatsRow({ entry }: { entry: GameStats }) {
  const avgMoves = Math.round(entry.totalMoves / entry.wins);

  return (
    <li className="stats__row">
      <div className="stats__row-top">
        <span className="stats__label">{entry.label}</span>
        {entry.bestStars > 0 && <StarRow count={entry.bestStars} size="sm" />}
      </div>
      <div className="stats__row-grid">
        <div className="stats__cell">
          <span className="stats__cell-value">{entry.wins}</span>
          <span className="stats__cell-label">Galibiyet</span>
        </div>
        <div className="stats__cell">
          <span className="stats__cell-value">{entry.bestScore}</span>
          <span className="stats__cell-label">En iyi puan</span>
        </div>
        <div className="stats__cell">
          <span className="stats__cell-value">{entry.bestMoves ?? '—'}</span>
          <span className="stats__cell-label">En az hamle</span>
        </div>
        <div className="stats__cell">
          <span className="stats__cell-value">
            {entry.bestCombo >= 2 ? `×${entry.bestCombo}` : '—'}
          </span>
          <span className="stats__cell-label">En iyi combo</span>
        </div>
      </div>
      <p className="stats__row-meta">
        Ort. {avgMoves} hamle · Son: {formatStatsDate(entry.lastPlayed)}
      </p>
    </li>
  );
}
