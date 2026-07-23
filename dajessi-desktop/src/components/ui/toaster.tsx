import * as React from "react";
import { CheckCircle2, AlertCircle, XCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "info";
interface Toast {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (t: Omit<Toast, "id">) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const toast = React.useCallback((t: Omit<Toast, "id">) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 no-print">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "flex w-80 items-start gap-3 rounded-lg border p-3 shadow-lg bg-white animate-in slide-in-from-bottom-2",
              t.variant === "success" && "border-brand-light",
              t.variant === "error" && "border-red-300",
              t.variant === "info" && "border-gold"
            )}
          >
            {t.variant === "success" && <CheckCircle2 className="h-5 w-5 text-brand-light shrink-0" />}
            {t.variant === "error" && <XCircle className="h-5 w-5 text-red-500 shrink-0" />}
            {t.variant === "info" && <AlertCircle className="h-5 w-5 text-gold shrink-0" />}
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">{t.title}</p>
              {t.description && <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>}
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
