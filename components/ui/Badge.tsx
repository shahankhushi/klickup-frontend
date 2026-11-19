import { priorityMeta, statusMeta } from "@/lib/labels";
import type { BadgeTone, Priority, TaskStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  shape?: "rounded" | "pill";
  className?: string;
}

const tones: Record<BadgeTone, { color: string; background: string; borderColor: string }> = {
  neutral: {
    color: "var(--foreground)",
    background: "var(--muted)",
    borderColor: "var(--border)",
  },
  info: {
    color: "var(--info)",
    background: "color-mix(in oklab, var(--info) 14%, var(--card))",
    borderColor: "color-mix(in oklab, var(--info) 32%, transparent)",
  },
  success: {
    color: "var(--success)",
    background: "color-mix(in oklab, var(--success) 14%, var(--card))",
    borderColor: "color-mix(in oklab, var(--success) 32%, transparent)",
  },
  warning: {
    color: "var(--warning)",
    background: "color-mix(in oklab, var(--warning) 16%, var(--card))",
    borderColor: "color-mix(in oklab, var(--warning) 34%, transparent)",
  },
  danger: {
    color: "var(--danger)",
    background: "color-mix(in oklab, var(--danger) 14%, var(--card))",
    borderColor: "color-mix(in oklab, var(--danger) 32%, transparent)",
  },
  primary: {
    color: "var(--primary)",
    background: "color-mix(in oklab, var(--primary) 14%, var(--card))",
    borderColor: "color-mix(in oklab, var(--primary) 32%, transparent)",
  },
};

export function Badge({ children, tone = "neutral", shape = "rounded", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap border px-2 py-0.5 text-xs font-medium",
        shape === "pill" ? "rounded-full" : "rounded-md",
        className,
      )}
      style={tones[tone]}
    >
      {children}
    </span>
  );
}

export function Tag(props: BadgeProps) {
  return <Badge {...props} />;
}

export function Chip(props: Omit<BadgeProps, "shape">) {
  return <Badge shape="pill" {...props} />;
}

export function StatusBadge({ status }: { status: TaskStatus | string }) {
  const meta = statusMeta[status as TaskStatus];
  if (!meta) return <Badge>{status || "Unknown"}</Badge>;
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

export function PriorityBadge({ priority }: { priority: Priority | string }) {
  const meta = priorityMeta[priority as Priority];
  if (!meta) return <Badge>{priority || "Normal"}</Badge>;
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}
