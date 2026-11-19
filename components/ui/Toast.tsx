"use client";

import { cn, focusRing, uid } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type ToastTone = "success" | "error" | "info" | "warning";

interface ToastItem {
  id: string;
  tone: ToastTone;
  title: string;
  description?: string;
}

interface ToastApi {
  push: (tone: ToastTone, title: string, description?: string) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const tones: Record<ToastTone, string> = {
  success: "text-success",
  error: "text-danger",
  info: "text-info",
  warning: "text-warning",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const api = useMemo<ToastApi>(() => {
    function push(tone: ToastTone, title: string, description?: string) {
      const id = uid("toast");
      setToasts((current) => [...current, { id, tone, title, description }]);
      window.setTimeout(() => dismiss(id), 4200);
    }
    return {
      push,
      success: (title, description) => push("success", title, description),
      error: (title, description) => push("error", title, description),
      info: (title, description) => push("info", title, description),
      warning: (title, description) => push("warning", title, description),
    };
  }, [dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[70] flex w-[min(100%-2rem,22rem)] flex-col gap-2">
        {toasts.map((toast) => {
          const Icon = icons[toast.tone];
          return (
            <div
              key={toast.id}
              role="status"
              className="pointer-events-auto flex items-start gap-3 rounded-xl border border-border bg-popover p-3 text-popover-foreground shadow-popover"
            >
              <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", tones[toast.tone])} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{toast.title}</p>
                {toast.description && <p className="mt-0.5 text-xs text-muted-foreground">{toast.description}</p>}
              </div>
              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => dismiss(toast.id)}
                className={cn("rounded-md p-1 text-muted-foreground hover:bg-muted", focusRing)}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}

const bannerTones: Record<ToastTone, string> = {
  success: "border-success/30 bg-success/10 text-foreground",
  error: "border-danger/30 bg-danger/10 text-foreground",
  info: "border-info/30 bg-info/10 text-foreground",
  warning: "border-warning/30 bg-warning/10 text-foreground",
};

export function Banner({
  tone = "info",
  title,
  children,
  onDismiss,
}: {
  tone?: ToastTone;
  title: string;
  children?: ReactNode;
  onDismiss?: () => void;
}) {
  const Icon = icons[tone];
  return (
    <div className={cn("flex items-start gap-3 rounded-xl border px-4 py-3", bannerTones[tone])} role="status">
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", tones[tone])} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{title}</p>
        {children && <div className="mt-0.5 text-sm text-muted-foreground">{children}</div>}
      </div>
      {onDismiss && (
        <button type="button" aria-label="Dismiss" onClick={onDismiss} className={cn("rounded-md p-1", focusRing)}>
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
