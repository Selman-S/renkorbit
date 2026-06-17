import type { PlayerRank } from '../game/ranks';
import './RankBadge.css';

interface RankBadgeProps {
  rank: PlayerRank;
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export function RankBadge({ rank, size = 'md', showTagline = false }: RankBadgeProps) {
  return (
    <div
      className={`rank-badge rank-badge--tier-${rank.tier} rank-badge--${size}`}
      title={rank.tagline}
    >
      <span className="rank-badge__emoji" aria-hidden>
        {rank.emoji}
      </span>
      <div className="rank-badge__text">
        <span className="rank-badge__title">{rank.title}</span>
        {showTagline && <span className="rank-badge__tagline">{rank.tagline}</span>}
      </div>
    </div>
  );
}
