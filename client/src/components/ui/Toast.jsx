import useToastStore from '../../store/toastStore';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function Toast() {
  const { toasts, removeToast } = useToastStore();
  const navigate = useNavigate();

  const handleToastClick = (toast) => {
    if (toast.onClickPath) {
      navigate(toast.onClickPath);
    }
    removeToast(toast.id);
  };

  return (
    <div className="toast-container">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            className={`toast toast--${toast.type} ${toast.onClickPath ? 'clickable' : ''}`}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 60 }}
            onClick={() => handleToastClick(toast)}
            style={{ 
              cursor: toast.onClickPath ? 'pointer' : 'default',
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px' 
            }}
          >
            {toast.avatar && (
              <img 
                src={toast.avatar} 
                alt="avatar" 
                style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
              />
            )}
            <div style={{ flex: 1 }}>{toast.message}</div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
