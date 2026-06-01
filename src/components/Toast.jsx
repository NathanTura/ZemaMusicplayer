import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import usePlayerStore from '../store/usePlayerStore';
import './Toast.css';

const Toast = () => {
  const { toasts, removeToast } = usePlayerStore();

  return (
    <div className="toast-container">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 50, scale: 0.3 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
            className={`toast toast-${toast.type}`}
            onClick={() => removeToast(toast.id)}
          >
            {toast.type === 'info' && <span className="material-symbols-rounded">info</span>}
            {toast.type === 'success' && <span className="material-symbols-rounded">check_circle</span>}
            {toast.type === 'error' && <span className="material-symbols-rounded">error</span>}
            {toast.type === 'loading' && <span className="material-symbols-rounded spin">progress_activity</span>}
            <span className="toast-message">{toast.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default Toast;
