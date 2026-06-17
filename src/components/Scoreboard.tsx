import { useEffect, useRef, useState } from 'react';
import { buildLocalLeagueBoard } from '../game/leaderboard';
import type { LeagueBoardResult } from '../game/leaderboard';
import { fetchLeagueBoard, fetchPlayerLeagueBoard, isOnlineLeaderboard } from '../game/leaderboardApi';
import { getGlobalRankRange, getLeagueMeta, LEAGUE_SIZE } from '../game/leagues';
import { getPlayerRank } from '../game/ranks';
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
  const [board, setBoard] = useState<LeagueBoardResult | null>(null);
  const [viewLeagueIndex, setViewLeagueIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [offline, setOffline] = useState(!isOnlineLeaderboard());
  const tabPicked = useRef(false);
  const playerRank = getPlayerRank();
  void refreshKey;

  useEffect(() => {
    if (!open) {
      tabPicked.current = false;
      return;
    }

    const playerName = loadUsername() ?? 'Sen';
    const localScore = loadTotalScore();

    if (!isOnlineLeaderboard()) {
      setOffline(true);
      setBoard(buildLocalLeagueBoard(playerName, localScore));
      setViewLeagueIndex(0);
      return;
    }

    setOffline(false);
    setLoading(true);
    tabPicked.current = false;

    void fetchPlayerLeagueBoard()
      .then((result) => {
        setBoard(result);
        setViewLeagueIndex(result.leagueIndex);
      })
      .catch(() => {
        setOffline(true);
        setBoard(buildLocalLeagueBoard(playerName, localScore));
        setViewLeagueIndex(0);
      })
      .finally(() => setLoading(false));
  }, [open, refreshKey]);

  useEffect(() => {
    if (!open || offline || !tabPicked.current) return;

    setLoading(true);
    void fetchLeagueBoard(viewLeagueIndex)
      .then(setBoard)
      .catch(() => setBoard(null))
      .finally(() => setLoading(false));
  }, [viewLeagueIndex, open, offline]);

  const handleLeagueTab = (index: number) => {
    tabPicked.current = true;
    setViewLeagueIndex(index);
  };

  const leagueTabs = board
    ? Array.from({ length: board.totalLeagues }, (_, i) => getLeagueMeta(i))
    : [];

  const range = board ? getGlobalRankRange(board.leagueIndex) : null;

  return (
    <ModalCard
      open={open}
      onClose={onClose}
      titleId="scoreboard-title"
      title="Liderlik Tablosu"
      className="modal-card--tall"
      overlay={overlay}
      anchor={anchor}
      subtitle={
        board && board.totalPlayers > 0 ? (
          <p className="scoreboard__subtitle">
            {board.totalPlayers} oyuncu · {board.totalLeagues} lig · {LEAGUE_SIZE}&apos;şer grup
          </p>
        ) : undefined
      }
    >
      {offline && (
        <p className="scoreboard__hint">Çevrimdışı mod — yalnızca senin skorun gösteriliyor.</p>
      )}

      {board && board.globalRank > 0 && (
        <div className="scoreboard__player-card">
          <span className="scoreboard__player-card-emoji" aria-hidden>
            {getLeagueMeta(board.playerLeagueIndex).emoji}
          </span>
          <div className="scoreboard__player-card-text">
            <strong>
              Genel #{board.globalRank} · {getLeagueMeta(board.playerLeagueIndex).name} #{board.leagueRank}
            </strong>
            <span>
              {playerRank.emoji} {playerRank.title}
            </span>
          </div>
        </div>
      )}

      {board && board.promotionHint && (
        <p className="scoreboard__promo">{board.promotionHint}</p>
      )}

      {board && leagueTabs.length > 1 && (
        <div className="scoreboard__tabs" role="tablist" aria-label="Lig seç">
          {leagueTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={viewLeagueIndex === tab.index}
              className={[
                'scoreboard__tab',
                `scoreboard__tab--${tab.slug}`,
                viewLeagueIndex === tab.index && 'scoreboard__tab--active',
                board.playerLeagueIndex === tab.index && 'scoreboard__tab--yours',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => handleLeagueTab(tab.index)}
            >
              <span aria-hidden>{tab.emoji}</span>
              <span className="scoreboard__tab-label">{tab.name.replace(' Lig', '')}</span>
            </button>
          ))}
        </div>
      )}

      {board && range && (
        <p className="scoreboard__range">
          {board.leagueMeta.emoji} {board.leagueMeta.name} · genel #{range.from}
          {range.to > range.from ? `–${range.to}` : ''}
          {board.isPlayerInView && ' · Sen buradasın'}
        </p>
      )}

      {loading ? (
        <p className="modal-card__empty">Yükleniyor…</p>
      ) : !board || board.entries.length === 0 ? (
        <p className="modal-card__empty">Henüz skor yok. İlk galibiyetini kazan!</p>
      ) : (
        <ul className="scoreboard__list">
          {board.entries.map((entry) => {
            const badge = entry.isPlayer ? playerRank : null;
            return (
              <li
                key={`${entry.globalRank ?? entry.rank}-${entry.name}`}
                className={[
                  'scoreboard__row',
                  entry.isPlayer && 'scoreboard__row--player',
                  entry.rank <= 3 && 'scoreboard__row--top',
                  board.leagueMeta.slug !== 'default' && `scoreboard__row--league-${board.leagueMeta.slug}`,
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <span className="scoreboard__rank">{entry.rank}</span>
                <div className="scoreboard__row-main">
                  <span className="scoreboard__name">
                    {entry.name}
                    {entry.isPlayer && badge && (
                      <span className="scoreboard__you">
                        {' '}
                        · {badge.emoji} {badge.title}
                      </span>
                    )}
                  </span>
                  {entry.globalRank !== undefined && (
                    <span className="scoreboard__global">Genel #{entry.globalRank}</span>
                  )}
                </div>
                <span className="scoreboard__score">{entry.score}</span>
              </li>
            );
          })}
        </ul>
      )}
    </ModalCard>
  );
}
