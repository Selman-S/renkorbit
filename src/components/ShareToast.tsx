import { AnimatePresence, motion } from 'framer-motion';
import './ShareToast.css';

interface ShareToastProps {
  message: string | null;
}

export function ShareToast({ message }: ShareToastProps) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          className="share-toast"
          role="status"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ type: 'spring', stiffness: 420, damping: 28 }}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
