export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export function initialsFrom(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function parseISODate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

export function toISODate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

export function startOfWeek(date = new Date()) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  const day = (copy.getDay() + 6) % 7;
  copy.setDate(copy.getDate() - day);
  return copy;
}

export function formatDate(value: string) {
  const date = value.length <= 10 ? parseISODate(value) : new Date(value);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatRelative(value: string) {
  const then = new Date(value).getTime();
  const minutes = Math.round((Date.now() - then) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return formatDate(value);
}

export function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export function isThisWeek(value: string) {
  const date = new Date(value);
  const start = startOfWeek();
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return date >= start && date < end;
}

export function dueTone(dueDate: string, status: string) {
  if (status === "done") return "done" as const;
  const today = startOfToday();
  const due = parseISODate(dueDate);
  if (due < today) return "overdue" as const;
  if (due.getTime() === today.getTime()) return "today" as const;
  return "later" as const;
}

export function nameFromEmail(email: string) {
  const local = email.split("@")[0] ?? "New teammate";
  const name = local
    .split(/[.\-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
  return name || "New teammate";
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function formatDueDateDisplay(dateStr: string, status: string): { text: string; colorClass: string } {
  if (status === "done") {
    const d = parseISODate(dateStr);
    return {
      text: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      colorClass: "text-muted-foreground",
    };
  }
  const tone = dueTone(dateStr, status);
  if (tone === "today") {
    return { text: "Today", colorClass: "text-amber-700 dark:text-amber-400 font-medium" };
  }
  if (tone === "overdue") {
    const d = parseISODate(dateStr);
    return {
      text: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      colorClass: "text-red-600 dark:text-red-400 font-medium",
    };
  }
  const d = parseISODate(dateStr);
  return {
    text: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    colorClass: "text-foreground/80",
  };
}
