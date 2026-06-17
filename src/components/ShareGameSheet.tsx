import { motion, AnimatePresence } from 'framer-motion';
import {
  copyGameLink,
  getWhatsAppShareUrl,
  getXShareUrl,
  openShareWindow,
  shareGameNative,
} from '../game/shareGame';
import './ShareGameSheet.css';

interface ShareGameSheetProps {
  open: boolean;
  onClose: () => void;
  onFeedback?: (message: string) => void;
}

export function ShareGameSheet({ open, onClose, onFeedback }: ShareGameSheetProps) {
  const notify = (message: string) => {
    onFeedback?.(message);
    onClose();
  };

  const handleCopy = async () => {
    try {
      await copyGameLink();
      notify('Link kopyalandı!');
    } catch {
      notify('Link kopyalanamadı');
    }
  };

  const handleWhatsApp = () => {
    openShareWindow(getWhatsAppShareUrl());
    onClose();
  };

  const handleX = () => {
    openShareWindow(getXShareUrl());
    onClose();
  };

  const handleNative = async () => {
    try {
      const result = await shareGameNative();
      if (result === 'shared') notify('Paylaşıldı!');
      else if (result === 'copied') notify('Link kopyalandı!');
      else onClose();
    } catch {
      notify('Paylaşılamadı');
    }
  };

  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="share-game__backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="share-game__sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-game-title"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="share-game__handle" aria-hidden />
            <h2 id="share-game-title" className="share-game__title">
              Arkadaşlarınla paylaş
            </h2>
            <p className="share-game__sub">RenkOrbit linkini gönder, birlikte oynayın!</p>

            <ul className="share-game__options">
              <li>
                <button type="button" className="share-game__option" onClick={handleCopy}>
                  <span className="share-game__icon" aria-hidden>
                    📋
                  </span>
                  <span className="share-game__label">Oyun linkini kopyala</span>
                </button>
              </li>
              <li>
                <button type="button" className="share-game__option" onClick={handleWhatsApp}>
                  <span className="share-game__icon" aria-hidden>
                    💬
                  </span>
                  <span className="share-game__label">WhatsApp&apos;ta paylaş</span>
                </button>
              </li>
              <li>
                <button type="button" className="share-game__option" onClick={handleX}>
                  <span className="share-game__icon share-game__icon--x" aria-hidden>
                    𝕏
                  </span>
                  <span className="share-game__label">X&apos;te paylaş</span>
                </button>
              </li>
              {canNativeShare && (
                <li>
                  <button type="button" className="share-game__option" onClick={handleNative}>
                    <span className="share-game__icon" aria-hidden>
                      📤
                    </span>
                    <span className="share-game__label">Diğer uygulamalar…</span>
                  </button>
                </li>
              )}
            </ul>

            <button type="button" className="share-game__cancel" onClick={onClose}>
              İptal
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
