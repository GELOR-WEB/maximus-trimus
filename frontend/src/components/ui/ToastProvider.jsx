import React, { useCallback, useEffect, useRef, useState } from "react";
import ToastContext from "./useToast";

const ICONS = {
  success: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="15" height="15">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true" width="15" height="15">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="15" height="15">
      <line x1="12" y1="11" x2="12" y2="17" />
      <circle cx="12" cy="7.5" r="0.6" fill="currentColor" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  ),
};

const DEFAULT_DURATION = 5200;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());
  const counter = useRef(0);

  const dismiss = useCallback((id) => {
    const timer = timers.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (input) => {
      const toast = typeof input === "string" ? { message: input } : input || {};
      if (!toast.message && !toast.title) return null;

      const id = ++counter.current;
      const duration = toast.duration ?? DEFAULT_DURATION;
      const item = {
        id,
        type: toast.type || "info",
        title: toast.title || (toast.type === "error" ? "Something went wrong" : toast.type === "success" ? "All set" : "Notice"),
        message: toast.message,
        duration,
      };

      setToasts((current) => [...current.slice(-2), item]);

      if (duration > 0) {
        timers.current.set(
          id,
          window.setTimeout(() => dismiss(id), duration)
        );
      }

      return id;
    },
    [dismiss]
  );

  useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach((timer) => window.clearTimeout(timer));
      map.clear();
    };
  }, []);

  const value = { push, dismiss };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="ui-toast-viewport" role="region" aria-label="Notifications">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`ui-toast ui-toast--${toast.type}`}
            role={toast.type === "error" ? "alert" : "status"}
            style={{ "--toast-duration": `${toast.duration}ms` }}
          >
            <span className="ui-toast__icon" aria-hidden="true">
              {ICONS[toast.type] || ICONS.info}
            </span>
            <div className="ui-toast__body">
              <p className="ui-toast__title">{toast.title}</p>
              {toast.message && <p className="ui-toast__message">{toast.message}</p>}
            </div>
            <button
              type="button"
              className="ui-toast__close"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss notification"
            >
              ×
            </button>
            {toast.duration > 0 && <span className="ui-toast__progress" aria-hidden="true" />}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
