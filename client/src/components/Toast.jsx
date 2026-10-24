import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

const ToastContext = createContext(null);

let nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message, tone = "success") => {
      const id = nextId++;
      setToasts((current) => [...current, { id, message, tone }]);
      setTimeout(() => dismiss(id), 3500);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2"
        aria-live="polite"
      >
        {toasts.map((toast) => {
          const Icon = toast.tone === "error" ? XCircle : CheckCircle2;
          const toneClass = toast.tone === "error" ? "text-danger" : "text-success";
          return (
            <div
              key={toast.id}
              className="pointer-events-auto flex items-center gap-2 rounded-lg border border-border bg-raised px-4 py-3 text-sm text-ink shadow-lg"
            >
              <Icon size={16} className={toneClass} aria-hidden="true" />
              {toast.message}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
