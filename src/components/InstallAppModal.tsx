import { motion, AnimatePresence } from 'framer-motion';
import './InstallAppModal.css';

interface InstallAppModalProps {
  open: boolean;
  isIos: boolean;
  onClose: () => void;
  onNativeInstall?: () => void;
}

export function InstallAppModal({ open, isIos, onClose, onNativeInstall }: InstallAppModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="install-modal__backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="install-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="install-modal-title"
            initial={{ scale: 0.9, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="install-modal__icon" aria-hidden>
              <img src="/icons/icon-192.png" alt="" width={72} height={72} />
            </div>

            <h2 id="install-modal-title" className="install-modal__title">
              Ana ekrana ekle
            </h2>
            <p className="install-modal__subtitle">
              RenkOrbit&apos;i uygulama gibi aç — tam ekran, hızlı erişim.
            </p>

            {isIos ? (
              <ol className="install-modal__steps">
                <li>
                  Alttaki <strong>Paylaş</strong> düğmesine dokun{' '}
                  <span aria-hidden>⬆️</span>
                </li>
                <li>
                  <strong>Ana Ekrana Ekle</strong> seçeneğini bul
                </li>
                <li>
                  <strong>Ekle</strong> de — ikon ana ekranda görünür
                </li>
              </ol>
            ) : (
              <ol className="install-modal__steps">
                <li>Tarayıcı menüsünden <strong>Uygulamayı yükle</strong> veya</li>
                <li>Adres çubuğundaki yükle simgesine dokun</li>
              </ol>
            )}

            <div className="install-modal__actions">
              <button type="button" className="install-modal__btn" onClick={onClose}>
                Kapat
              </button>
              {!isIos && onNativeInstall && (
                <button
                  type="button"
                  className="install-modal__btn install-modal__btn--primary"
                  onClick={onNativeInstall}
                >
                  Yükle
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
