import {
  ACHIEVEMENTS,
  getUnlockedCount,
  isAchievementUnlocked,
} from '../game/achievements';
import { getCompletedCount, PROGRESSION_STEPS } from '../game/progressionMap';
import { loadCoins } from '../game/coins';
import { ModalCard } from './ModalCard';
import './Profile.css';

interface ProfileProps {
  open: boolean;
  onClose: () => void;
  refreshKey?: number;
}

export function Profile({ open, onClose, refreshKey = 0 }: ProfileProps) {
  void refreshKey;
  const unlocked = getUnlockedCount();
  const total = ACHIEVEMENTS.length;
  const coins = loadCoins();
  const stepsDone = getCompletedCount();

  return (
    <ModalCard
      open={open}
      onClose={onClose}
      titleId="profile-title"
      title="Profil"
      className="modal-card--tall"
      overlay="transparent"
      anchor="contained"
      subtitle={
        <p className="modal-card__subtitle">
          🏅 {unlocked}/{total} rozet · {stepsDone}/{PROGRESSION_STEPS.length} adım · 🪙 {coins}
        </p>
      }
    >
      <ul className="profile__grid">
        {ACHIEVEMENTS.map((badge) => {
          const earned = isAchievementUnlocked(badge.id);
          return (
            <li
              key={badge.id}
              className={`profile__badge ${earned ? 'profile__badge--earned' : 'profile__badge--locked'}`}
            >
              <span className="profile__emoji" aria-hidden>
                {badge.emoji}
              </span>
              <span className="profile__name">{badge.title}</span>
              <span className="profile__desc">{badge.description}</span>
            </li>
          );
        })}
      </ul>
    </ModalCard>
  );
}
