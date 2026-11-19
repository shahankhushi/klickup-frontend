"use client";

import { Popover } from "@/components/ui/Popover";
import type { TaskStatus } from "@/lib/types";
import { useDismiss } from "@/lib/use-dismiss";
import { cn, focusRing, formatDueDateDisplay, toISODate } from "@/lib/utils";
import { useRef, useState } from "react";

interface TaskDatePickerProps {
  dueDate: string;
  status: TaskStatus;
  onChange: (nextDate: string) => void;
  className?: string;
}

export function TaskDatePicker({ dueDate, status, onChange, className }: TaskDatePickerProps) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  useDismiss(open, () => setOpen(false), anchorRef, panelRef);

  const { text, colorClass } = formatDueDateDisplay(dueDate, status);

  function setDays(offset: number) {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    onChange(toISODate(d));
    setOpen(false);
  }

  return (
    <div className="relative inline-flex items-center">
      <button
        ref={anchorRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        aria-label={`Due date: ${dueDate}. Click to change.`}
        className={cn(
          "inline-flex items-center rounded px-1.5 py-0.5 text-xs transition-colors hover:bg-muted/70",
          colorClass,
          focusRing,
          className,
        )}
      >
        <span className="truncate">{text}</span>
      </button>

      <Popover open={open} anchorRef={anchorRef} panelRef={panelRef} align="left" width={200}>
        <div className="p-2 space-y-2">
          <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Due Date
          </p>
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => setDays(0)}
              className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs hover:bg-muted font-medium text-left"
            >
              <span>Today</span>
              <span className="text-[10px] text-muted-foreground">Due now</span>
            </button>
            <button
              type="button"
              onClick={() => setDays(1)}
              className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs hover:bg-muted font-medium text-left"
            >
              <span>Tomorrow</span>
              <span className="text-[10px] text-muted-foreground">+1 day</span>
            </button>
            <button
              type="button"
              onClick={() => setDays(3)}
              className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs hover:bg-muted font-medium text-left"
            >
              <span>In 3 days</span>
              <span className="text-[10px] text-muted-foreground">+3 days</span>
            </button>
            <button
              type="button"
              onClick={() => setDays(7)}
              className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs hover:bg-muted font-medium text-left"
            >
              <span>Next week</span>
              <span className="text-[10px] text-muted-foreground">+7 days</span>
            </button>
          </div>
          <div className="border-t border-border pt-2">
            <label className="text-[11px] text-muted-foreground block mb-1">Custom date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => {
                if (e.target.value) {
                  onChange(e.target.value);
                  setOpen(false);
                }
              }}
              className="w-full text-xs rounded border border-border bg-input px-2 py-1 text-foreground"
            />
          </div>
        </div>
      </Popover>
    </div>
  );
}
