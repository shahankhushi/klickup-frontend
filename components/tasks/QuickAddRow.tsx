"use client";

import { useToast } from "@/components/ui/Toast";
import { useAppData } from "@/lib/store";
import type { TaskStatus } from "@/lib/types";
import { cn, focusRing } from "@/lib/utils";
import { ChevronDown, Plus, X } from "lucide-react";
import { useRef, useState } from "react";

interface QuickAddRowProps {
  status: TaskStatus;
  projectId?: string;
  className?: string;
}

export function QuickAddRow({ status, projectId, className }: QuickAddRowProps) {
  const { quickAddTask } = useAppData();
  const toast = useToast();
  const [active, setActive] = useState(false);
  const [title, setTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleAdd() {
    const trimmed = title.trim();
    if (!trimmed) {
      setActive(false);
      return;
    }
    const created = quickAddTask(trimmed, status, projectId);
    toast.success("Task added", created.title);
    setTitle("");
    // Keep focus for rapid entry
    inputRef.current?.focus();
  }

  if (!active) {
    return (
      <button
        type="button"
        onClick={() => {
          setActive(true);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className={cn(
          "flex w-full items-center gap-1.5 px-4 py-2 text-xs font-normal text-muted-foreground hover:text-foreground transition-colors",
          focusRing,
          className,
        )}
      >
        <span className="grid h-4 w-4 place-items-center rounded-full border border-muted-foreground/40 text-muted-foreground">
          <Plus className="h-2.5 w-2.5 stroke-[2.5]" />
        </span>
        <span className="text-[13px]">Add Task</span>
        <ChevronDown className="h-3 w-3 text-muted-foreground/60" />
      </button>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 border-b border-border/60 bg-card px-4 py-2 shadow-xs",
        className,
      )}
    >
      <span className="grid h-4 w-4 place-items-center rounded-full border border-primary text-primary shrink-0">
        <Plus className="h-2.5 w-2.5 stroke-[2.5]" />
      </span>
      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleAdd();
          } else if (e.key === "Escape") {
            e.preventDefault();
            setActive(false);
            setTitle("");
          }
        }}
        placeholder="Task name... (press Enter to save, Esc to cancel)"
        className={cn(
          "flex-1 bg-transparent text-[13px] placeholder:text-muted-foreground/60 border-none outline-none focus:outline-none",
        )}
      />
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={handleAdd}
          className="rounded bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Save
        </button>
        <button
          type="button"
          onClick={() => {
            setActive(false);
            setTitle("");
          }}
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Cancel adding task"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
