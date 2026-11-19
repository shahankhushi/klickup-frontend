"use client";

import { Popover } from "@/components/ui/Popover";
import { statusMeta, STATUS_OPTIONS } from "@/lib/labels";
import type { TaskStatus } from "@/lib/types";
import { useDismiss } from "@/lib/use-dismiss";
import { cn, focusRing } from "@/lib/utils";
import { Check } from "lucide-react";
import { useRef, useState } from "react";

interface TaskStatusPickerProps {
  status: TaskStatus;
  onChange: (next: TaskStatus) => void;
  className?: string;
  size?: "sm" | "md";
}

export function TaskStatusPicker({ status, onChange, className, size = "md" }: TaskStatusPickerProps) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  useDismiss(open, () => setOpen(false), anchorRef, panelRef);

  const meta = statusMeta[status] ?? statusMeta.todo;

  return (
    <div className="relative inline-flex items-center">
      <button
        ref={anchorRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        aria-label={`Status: ${meta.label}. Click to change.`}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md font-semibold tracking-wide transition-all uppercase select-none",
          size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs",
          focusRing,
          className,
        )}
        style={{
          color: meta.color,
          backgroundColor: meta.bg,
          border: `1px solid ${meta.border}`,
        }}
      >
        <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: meta.color }} />
        <span className="truncate">{meta.label}</span>
      </button>

      <Popover open={open} anchorRef={anchorRef} panelRef={panelRef} align="left" width={180}>
        <div className="p-1" role="menu" aria-orientation="vertical">
          <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Change Status
          </p>
          <div className="mt-1 flex flex-col gap-0.5">
            {STATUS_OPTIONS.map((option) => {
              const optMeta = statusMeta[option.value];
              const isSelected = option.value === status;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="menuitem"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-xs font-medium text-left hover:bg-muted transition-colors",
                    focusRing,
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: optMeta.color }}
                    />
                    <span style={{ color: optMeta.color }} className="font-semibold uppercase tracking-wide">
                      {optMeta.label}
                    </span>
                  </span>
                  {isSelected && <Check className="h-3.5 w-3.5 text-foreground shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      </Popover>
    </div>
  );
}
