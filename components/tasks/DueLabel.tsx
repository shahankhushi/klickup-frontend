import { cn, dueTone, formatDate } from "@/lib/utils";
import type { TaskStatus } from "@/lib/types";

export function DueLabel({ date, status }: { date: string; status: TaskStatus | string }) {
  const tone = dueTone(date, status);
  return (
    <span
      suppressHydrationWarning
      className={cn(
        "text-sm",
        tone === "overdue" && "font-medium text-danger",
        tone === "today" && "font-medium text-warning",
        (tone === "later" || tone === "done") && "text-muted-foreground",
      )}
    >
      {tone === "today" ? "Today" : formatDate(date)}
      {tone === "overdue" ? " · Overdue" : ""}
    </span>
  );
}
