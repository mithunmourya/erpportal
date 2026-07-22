import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, title, message) => {
    const id = Math.random().toString(36).substr(2, 9);
    
    // Duration mappings
    let duration = 3800; // default
    if (type === 'error') duration = 5200;
    else if (type === 'warning') duration = 4500;
    else if (type === 'success') duration = 3800;

    const newToast = { id, type, title, message, duration };
    setToasts(prev => [newToast, ...prev]);

    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    
    // Wait for exit animation to finish before removing from DOM
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 280);
  }, []);

  const toast = {
    success: (title, message) => addToast('success', title, message),
    error: (title, message) => addToast('error', title, message),
    warning: (title, message) => addToast('warning', title, message)
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type} ${t.exiting ? 'toast-exiting' : ''}`}>
            <div className="toast-content">
              <div className="toast-icon">
                {t.type === 'success' && '✓'}
                {t.type === 'error' && '✕'}
                {t.type === 'warning' && '!'}
              </div>
              <div className="toast-text">
                <div className="toast-title">{t.title}</div>
                {t.message && <div className="toast-desc">{t.message}</div>}
              </div>
              <button className="toast-close" onClick={() => removeToast(t.id)}>&times;</button>
            </div>
            {!t.exiting && (
              <div 
                className="toast-progress" 
                style={{ animationDuration: `${t.duration}ms` }}
              ></div>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
