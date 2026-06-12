import './GameControls.css';

interface GameControlsProps {
  canUndo: boolean;
  soundMuted: boolean;
  onUndo: () => void;
  onRestart: () => void;
  onMenu: () => void;
  onToggleSound: () => void;
  onShare?: () => void;
}

export function GameControls({
  canUndo,
  soundMuted,
  onUndo,
  onRestart,
  onMenu,
  onToggleSound,
  onShare,
}: GameControlsProps) {
  return (
    <footer className="game-controls">
      <button type="button" className="game-controls__btn" onClick={onMenu}>
        Menü
      </button>
      {onShare && (
        <button
          type="button"
          className="game-controls__btn game-controls__btn--icon"
          onClick={onShare}
          aria-label="Bulmacayı paylaş"
          title="Bulmacayı paylaş"
        >
          🔗
        </button>
      )}
      <button
        type="button"
        className="game-controls__btn game-controls__btn--icon"
        onClick={onToggleSound}
        aria-label={soundMuted ? 'Sesi aç' : 'Sesi kapat'}
        title={soundMuted ? 'Sesi aç' : 'Sesi kapat'}
      >
        {soundMuted ? '🔇' : '🔊'}
      </button>
      <button
        type="button"
        className="game-controls__btn"
        onClick={onUndo}
        disabled={!canUndo}
      >
        Geri Al
      </button>
      <button type="button" className="game-controls__btn game-controls__btn--primary" onClick={onRestart}>
        Yeniden
      </button>
    </footer>
  );
}
