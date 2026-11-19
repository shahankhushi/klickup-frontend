import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  label?: string;
  showValue?: boolean;
  tone?: "primary" | "success" | "warning" | "danger" | "info";
  className?: string;
}

const tones = {
  primary: "var(--primary)",
  success: "var(--success)",
  warning: "var(--warning)",
  danger: "var(--danger)",
  info: "var(--info)",
};

export function ProgressBar({ value, label, showValue = false, tone = "primary", className }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("w-full", className)}>
      {(label || showValue) && (
        <div className="mb-1.5 flex items-center justify-between gap-3 text-xs text-muted-foreground">
          {label && <span>{label}</span>}
          {showValue && <span className="tabular-nums">{Math.round(clamped)}%</span>}
        </div>
      )}
      <div
        className="h-2 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div className="h-full rounded-full" style={{ width: `${clamped}%`, background: tones[tone] }} />
      </div>
    </div>
  );
}
