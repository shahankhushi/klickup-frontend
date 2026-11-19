import type { ApprovalType, BadgeTone, Priority, TaskStatus, WorkspaceRole } from "@/lib/types";

export const statusMeta: Record<
  TaskStatus,
  {
    label: string;
    tone: BadgeTone;
    color: string;
    bg: string;
    border: string;
    columnBg: string;
    badgeBg: string;
  }
> = {
  todo: {
    label: "TO DO",
    tone: "neutral",
    color: "#64748b",
    bg: "#f1f5f9",
    border: "#cbd5e1",
    columnBg: "#f8fafc",
    badgeBg: "#64748b",
  },
  in_progress: {
    label: "IN PROGRESS",
    tone: "info",
    color: "#0284c7",
    bg: "#e0f2fe",
    border: "#7dd3fc",
    columnBg: "#f0f9ff",
    badgeBg: "#0284c7",
  },
  in_review: {
    label: "IN REVIEW",
    tone: "warning",
    color: "#d97706",
    bg: "#fef3c7",
    border: "#fcd34d",
    columnBg: "#fffbeb",
    badgeBg: "#d97706",
  },
  done: {
    label: "COMPLETED",
    tone: "success",
    color: "#10b981",
    bg: "#d1fae5",
    border: "#6ee7b7",
    columnBg: "#f0fdf4",
    badgeBg: "#10b981",
  },
};

export const priorityMeta: Record<
  Priority,
  { label: string; tone: BadgeTone; color: string; flagColor: string }
> = {
  urgent: { label: "Urgent", tone: "danger", color: "#dc2626", flagColor: "#dc2626" },
  high: { label: "High", tone: "warning", color: "#d97706", flagColor: "#f59e0b" },
  medium: { label: "Normal", tone: "info", color: "#2563eb", flagColor: "#3b82f6" },
  low: { label: "Low", tone: "neutral", color: "#94a3b8", flagColor: "#94a3b8" },
};

export const STATUS_OPTIONS = (Object.keys(statusMeta) as TaskStatus[]).map((value) => ({
  value,
  label: statusMeta[value].label,
}));

export const PRIORITY_OPTIONS = (Object.keys(priorityMeta) as Priority[]).map((value) => ({
  value,
  label: priorityMeta[value].label,
}));

export const approvalTypeMeta: Record<ApprovalType, { label: string; tone: BadgeTone }> = {
  task: { label: "Task", tone: "info" },
  document: { label: "Document", tone: "primary" },
  request: { label: "Request", tone: "warning" },
};

export const ROLE_OPTIONS: { value: WorkspaceRole; label: string }[] = [
  { value: "Super Admin", label: "Super Admin (Full Access)" },
  { value: "Admin", label: "Admin" },
  { value: "Manager", label: "Manager" },
  { value: "Member", label: "Member (Employee)" },
  { value: "Guest", label: "Guest (Read Only)" },
];
