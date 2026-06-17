import { useEffect, useState, type FormEvent } from 'react';
import {
  ACHIEVEMENTS,
  getUnlockedCount,
  isAchievementUnlocked,
} from '../game/achievements';
import { getCompletedCount, PROGRESSION_STEPS } from '../game/progressionMap';
import { getNextRank, getPlayerRank, PLAYER_RANKS } from '../game/ranks';
import { loadCoins } from '../game/coins';
import { syncLeaderboardScore } from '../game/leaderboardApi';
import { loadTotalScore } from '../game/scoring';
import {
  loadUsername,
  MAX_USERNAME_LEN,
  saveUsername,
  validateUsername,
} from '../game/storage';
import { ModalCard } from './ModalCard';
import { RankBadge } from './RankBadge';
import './Profile.css';

interface ProfileProps {
  open: boolean;
  onClose: () => void;
  refreshKey?: number;
  onUsernameChange?: (name: string) => void;
}

export function Profile({
  open,
  onClose,
  refreshKey = 0,
  onUsernameChange,
}: ProfileProps) {
  const [username, setUsername] = useState(() => loadUsername() ?? '');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const unlocked = getUnlockedCount();
  const total = ACHIEVEMENTS.length;
  const coins = loadCoins();
  const stepsDone = getCompletedCount();
  const rank = getPlayerRank();
  const nextRank = getNextRank(rank);

  // Reload display name when profile opens or parent refreshes
  useEffect(() => {
    if (!open) {
      setEditing(false);
      setError('');
      return;
    }
    const current = loadUsername() ?? '';
    setUsername(current);
    setDraft(current);
    setEditing(false);
    setError('');
  }, [open, refreshKey]);

  const handleSaveUsername = async (e: FormEvent) => {
    e.preventDefault();
    const validationError = validateUsername(draft);
    if (validationError) {
      setError(validationError);
      return;
    }

    const trimmed = draft.trim();
    if (trimmed === username) {
      setEditing(false);
      setError('');
      return;
    }

    setSaving(true);
    const saved = saveUsername(trimmed);
    await syncLeaderboardScore(loadTotalScore());
    setUsername(saved);
    setDraft(saved);
    setEditing(false);
    setError('');
    setSaving(false);
    onUsernameChange?.(saved);
  };

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
      <section className="profile__username" aria-label="Oyuncu adı">
        {!editing ? (
          <div className="profile__username-row">
            <div className="profile__username-meta">
              <span className="profile__username-label">Oyuncu adı</span>
              <span className="profile__username-value">{username || '—'}</span>
            </div>
            <button
              type="button"
              className="profile__username-edit"
              onClick={() => {
                setDraft(username);
                setError('');
                setEditing(true);
              }}
            >
              Düzenle
            </button>
          </div>
        ) : (
          <form className="profile__username-form" onSubmit={handleSaveUsername}>
            <label className="profile__username-label" htmlFor="profile-username-input">
              Oyuncu adı
            </label>
            <input
              id="profile-username-input"
              type="text"
              className="profile__username-input"
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                setError('');
              }}
              placeholder="Oyuncu adı"
              maxLength={MAX_USERNAME_LEN}
              autoComplete="nickname"
              autoFocus
              disabled={saving}
            />
            {error && <p className="profile__username-error">{error}</p>}
            <div className="profile__username-actions">
              <button
                type="button"
                className="profile__username-cancel"
                onClick={() => {
                  setDraft(username);
                  setError('');
                  setEditing(false);
                }}
                disabled={saving}
              >
                İptal
              </button>
              <button type="submit" className="profile__username-save" disabled={saving}>
                {saving ? 'Kaydediliyor…' : 'Kaydet'}
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="profile__rank" aria-label="Rütbe">
        <RankBadge rank={rank} size="lg" showTagline />
        {nextRank && (
          <p className="profile__rank-next">
            Sonraki: {nextRank.emoji} {nextRank.title} — {nextRank.minSteps} adım
          </p>
        )}
        <ul className="profile__rank-ladder" aria-label="Rütbe basamakları">
          {PLAYER_RANKS.map((step) => {
            const earned = stepsDone >= step.minSteps;
            return (
              <li
                key={step.id}
                className={`profile__rank-step ${earned ? 'profile__rank-step--earned' : ''}`}
              >
                <span aria-hidden>{step.emoji}</span>
                <span>{step.title}</span>
              </li>
            );
          })}
        </ul>
      </section>

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
