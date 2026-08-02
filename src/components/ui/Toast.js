import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

let idCounter = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const toast = useCallback(
    ({ type = 'success', title, message, duration = 4000 }) => {
      const id = ++idCounter;
      setToasts((t) => [...t, { id, type, title, message }]);
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="toast-container" role="status" aria-live="polite">
        {toasts.map((t) => (
          <button key={t.id} className={`toast toast-${t.type}`} onClick={() => dismiss(t.id)} type="button">
            <strong>{t.title}</strong>
            {t.message && <div className="toast-message">{t.message}</div>}
          </button>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
