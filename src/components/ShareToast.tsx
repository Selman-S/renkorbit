import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import './ShareToast.css';

interface ShareToastProps {
  message: string | null;
}

export function ShareToast({ message }: ShareToastProps) {
  // Portal: .app > * would override position: fixed (see RankUpModal)
  return createPortal(
    <AnimatePresence>
      {message && (
        <motion.div
          className="share-toast"
          role="status"
          initial={{ opacity: 0, x: '-50%', y: 24 }}
          animate={{ opacity: 1, x: '-50%', y: 0 }}
          exit={{ opacity: 0, x: '-50%', y: 12 }}
          transition={{ type: 'spring', stiffness: 420, damping: 28 }}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
