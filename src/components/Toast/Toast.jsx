import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import styles from './Toast.module.css';

const ToastContext = createContext(null);

/**
 * useToast — call `toast.success('Saved')` from anywhere below <ToastProvider>.
 */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

const ICONS = {
  success: <CheckCircle2 size={18} />,
  warning: <AlertTriangle size={18} />,
  error: <XCircle size={18} />,
  info: <Info size={18} />,
};

/**
 * ToastProvider — wrap the app at the root.
 * Renders the toast stack via portal to document.body.
 */
export function ToastProvider({ children, defaultDuration = 4000 }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const remove = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (type, message, options = {}) => {
      const id = ++idRef.current;
      const duration = options.duration ?? defaultDuration;
      setToasts((current) => [...current, { id, type, message, duration }]);
      if (duration > 0) {
        setTimeout(() => remove(id), duration);
      }
      return id;
    },
    [defaultDuration, remove]
  );

  const api = useMemo(
    () => ({
      success: (msg, opts) => show('success', msg, opts),
      warning: (msg, opts) => show('warning', msg, opts),
      error: (msg, opts) => show('error', msg, opts),
      info: (msg, opts) => show('info', msg, opts),
      dismiss: remove,
    }),
    [show, remove]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <div className={styles.stack} role="region" aria-label="Notifications">
            {toasts.map((t) => (
              <ToastItem key={t.id} toast={t} onDismiss={() => remove(t.id)} />
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }) {
  const [leaving, setLeaving] = useState(false);

  // Trigger leave animation just before it's actually removed. Cosmetic.
  useEffect(() => {
    if (toast.duration <= 0) return;
    const t = setTimeout(() => setLeaving(true), toast.duration - 180);
    return () => clearTimeout(t);
  }, [toast.duration]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        styles.toast,
        styles[`type-${toast.type}`],
        leaving ? styles.leaving : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className={styles.icon} aria-hidden="true">
        {ICONS[toast.type]}
      </span>
      <span className={styles.message}>{toast.message}</span>
      <button
        type="button"
        className={styles.close}
        onClick={onDismiss}
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>
    </div>
  );
}
