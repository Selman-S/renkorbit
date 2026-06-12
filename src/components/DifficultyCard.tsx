import type { ColorCount } from '../game/levelConfig';
import { StarRow } from './StarRow';
import './DifficultyCard.css';

export interface DifficultyMeta {
  colors: ColorCount;
  emoji: string;
  title: string;
  subtitle: string;
  badge: string;
}

export const DIFFICULTY_META: Record<ColorCount, DifficultyMeta> = {
  4: {
    colors: 4,
    emoji: '🪐',
    title: 'Mini Yörünge',
    subtitle: '4 renk · 5 boru',
    badge: 'Başlangıç',
  },
  8: {
    colors: 8,
    emoji: '🌟',
    title: 'Süper Yörünge',
    subtitle: '8 renk · 9 boru',
    badge: 'Macera',
  },
  12: {
    colors: 12,
    emoji: '🚀',
    title: 'Mega Galaksi',
    subtitle: '12 renk · 13 boru',
    badge: 'Usta',
  },
};

interface DifficultyCardProps {
  meta: DifficultyMeta;
  selected: boolean;
  bestStars: number;
  onSelect: () => void;
}

export function DifficultyCard({ meta, selected, bestStars, onSelect }: DifficultyCardProps) {
  return (
    <button
      type="button"
      className={`difficulty-card ${selected ? 'difficulty-card--selected' : ''}`}
      onClick={onSelect}
      aria-pressed={selected}
    >
      <span className="difficulty-card__emoji" aria-hidden>
        {meta.emoji}
      </span>
      <div className="difficulty-card__body">
        <div className="difficulty-card__row">
          <span className="difficulty-card__badge">{meta.badge}</span>
          {bestStars > 0 && <StarRow count={bestStars} size="sm" />}
        </div>
        <span className="difficulty-card__title">{meta.title}</span>
        <span className="difficulty-card__subtitle">{meta.subtitle}</span>
      </div>
      <span className="difficulty-card__check" aria-hidden>
        {selected ? '✓' : ''}
      </span>
    </button>
  );
}
