"use client";

import { useToast } from "@/components/ui/Toast";
import { priorityMeta, statusMeta } from "@/lib/labels";
import type { Project, Task, User } from "@/lib/types";
import { cn, dueTone, focusRing, toISODate } from "@/lib/utils";
import { ImageDown } from "lucide-react";
import { useState } from "react";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.length > 0 ? lines.slice(0, 2) : [""];
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

export function TodayCardButton({
  user,
  tasks,
  projects,
}: {
  user: User;
  tasks: Task[];
  projects: Project[];
}) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  function download() {
    setBusy(true);
    try {
      const now = new Date();
      const today = toISODate(now);
      const day = now.getDate();
      const month = MONTHS[now.getMonth()];
      const year = now.getFullYear();
      const dateLabel = `${day} ${month} ${year}`;
      const projectName = new Map(projects.map((project) => [project.id, project.name]));
      const mine = tasks.filter((task) => task.assigneeId === user.id);
      const done = mine.filter(
        (task) => task.status === "done" && task.completedAt && toISODate(new Date(task.completedAt)) === today,
      );
      const open = mine.filter((task) => {
        if (task.status === "done") return false;
        const tone = dueTone(task.dueDate, task.status);
        return task.dueDate === today || tone === "today" || tone === "overdue";
      });

      const width = 880;
      const pad = 36;
      const inner = width - pad * 2;
      const scale = 2;
      const measure = document.createElement("canvas").getContext("2d");
      if (!measure) return;
      measure.font = "600 22px Segoe UI, sans-serif";

      const openRows = open.map((task) => wrapLines(measure, task.title, inner - 150));
      const doneRows = done.map((task) => wrapLines(measure, task.title, inner - 150));
      const rowHeight = (lines: string[]) => 18 + lines.length * 26 + 22;
      const section = (count: number, rows: string[][]) =>
        44 + (count === 0 ? 36 : rows.reduce((sum, lines) => sum + rowHeight(lines), 0));
      const height = 168 + section(open.length, openRows) + 18 + section(done.length, doneRows) + 56;

      const canvas = document.createElement("canvas");
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const paint = ctx;
      paint.scale(scale, scale);

      paint.fillStyle = "#f4f1fb";
      paint.fillRect(0, 0, width, height);
      paint.fillStyle = "#6d28d9";
      paint.fillRect(0, 0, width, 132);

      paint.fillStyle = "#ffffff";
      paint.font = "600 13px Segoe UI, sans-serif";
      paint.fillText("KlickUp  ·  Today's work", pad, 36);
      paint.font = "700 32px Segoe UI, sans-serif";
      paint.fillText(user.name, pad, 78);
      paint.font = "500 16px Segoe UI, sans-serif";
      paint.fillStyle = "rgba(255,255,255,0.88)";
      const subtitle = [user.title, user.department].filter(Boolean).join("  ·  ");
      paint.fillText(subtitle || "Employee", pad, 106);

      paint.textAlign = "right";
      paint.fillStyle = "#ffffff";
      paint.font = "600 16px Segoe UI, sans-serif";
      paint.fillText(dateLabel, width - pad, 78);
      paint.font = "500 13px Segoe UI, sans-serif";
      paint.fillStyle = "rgba(255,255,255,0.88)";
      paint.fillText(`${open.length} still open  ·  ${done.length} done`, width - pad, 102);
      paint.textAlign = "left";

      let y = 156;
      function drawSection(title: string, list: Task[], rows: string[][], tone: "open" | "done") {
        paint.fillStyle = "#1f1633";
        paint.font = "700 15px Segoe UI, sans-serif";
        paint.fillText(title, pad, y);
        paint.fillStyle = "#6b6280";
        paint.font = "600 13px Segoe UI, sans-serif";
        paint.textAlign = "right";
        paint.fillText(String(list.length), width - pad, y);
        paint.textAlign = "left";
        y += 16;

        if (list.length === 0) {
          paint.fillStyle = "#ffffff";
          roundRect(paint, pad, y, inner, 36, 10);
          paint.fill();
          paint.fillStyle = "#6b6280";
          paint.font = "500 14px Segoe UI, sans-serif";
          paint.fillText(tone === "open" ? "Nothing left for today." : "Nothing marked done yet today.", pad + 16, y + 23);
          y += 48;
          return;
        }

        list.forEach((task, index) => {
          const lines = rows[index];
          const h = rowHeight(lines);
          paint.fillStyle = "#ffffff";
          roundRect(paint, pad, y, inner, h - 8, 12);
          paint.fill();
          paint.fillStyle = tone === "done" ? "#059669" : task && dueTone(task.dueDate, task.status) === "overdue" ? "#e11d48" : "#d97706";
          roundRect(paint, pad, y, 6, h - 8, 3);
          paint.fill();

          paint.fillStyle = tone === "done" ? "#065f46" : "#1f1633";
          paint.font = "600 18px Segoe UI, sans-serif";
          lines.forEach((line, lineIndex) => {
            paint.fillText(line, pad + 22, y + 28 + lineIndex * 24);
          });
          paint.fillStyle = "#6b6280";
          paint.font = "500 13px Segoe UI, sans-serif";
          const project = projectName.get(task.projectId) ?? "Task";
          const steps = task.checklist ?? [];
          const stepNote = steps.length > 0 ? `  ·  ${steps.filter((item) => item.done).length}/${steps.length} steps` : "";
          const late = tone === "open" && dueTone(task.dueDate, task.status) === "overdue" ? "  ·  Overdue" : "";
          paint.fillText(`${project}${stepNote}${late}`, pad + 22, y + 28 + lines.length * 24 + 4);

          paint.textAlign = "right";
          paint.fillStyle = tone === "done" ? "#059669" : "#6d28d9";
          paint.font = "600 12px Segoe UI, sans-serif";
          const badge = tone === "done" ? "Done" : statusMeta[task.status]?.label ?? "Open";
          paint.fillText(badge, width - pad - 16, y + 26);
          paint.fillStyle = "#6b6280";
          paint.font = "500 12px Segoe UI, sans-serif";
          paint.fillText(priorityMeta[task.priority]?.label ?? "", width - pad - 16, y + 44);
          paint.textAlign = "left";
          y += h;
        });
        y += 8;
      }

      drawSection("Still to do today", open, openRows, "open");
      y += 8;
      drawSection("Done today", done, doneRows, "done");

      paint.fillStyle = "#6b6280";
      paint.font = "500 12px Segoe UI, sans-serif";
      paint.fillText("Send this in the group. Done tasks from today stay on the card.", pad, height - 22);

      const filename = `${user.name} ${dateLabel}.png`.replace(/[<>:"/\\|?*]/g, "");
      canvas.toBlob((blob) => {
        if (!blob) {
          toast.error("Could not make the card");
          setBusy(false);
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
        toast.success("Today's card saved", filename);
        setBusy(false);
      }, "image/png");
    } catch {
      toast.error("Could not make the card");
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={download}
      disabled={busy}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground shadow-xs hover:bg-muted disabled:opacity-60",
        focusRing,
      )}
    >
      <ImageDown className="h-4 w-4 text-violet-600" />
      {busy ? "Saving…" : "Today's card"}
    </button>
  );
}
