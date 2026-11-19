"use client";

import { Popover } from "@/components/ui/Popover";
import { priorityMeta, PRIORITY_OPTIONS } from "@/lib/labels";
import type { Priority } from "@/lib/types";
import { useDismiss } from "@/lib/use-dismiss";
import { cn, focusRing } from "@/lib/utils";
import { Check, Flag } from "lucide-react";
import { useRef, useState } from "react";

interface TaskPriorityPickerProps {
  priority: Priority;
  onChange: (next: Priority) => void;
  className?: string;
  showLabel?: boolean;
}

export function TaskPriorityPicker({
  priority,
  onChange,
  className,
  showLabel = true,
}: TaskPriorityPickerProps) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  useDismiss(open, () => setOpen(false), anchorRef, panelRef);

  const meta = priorityMeta[priority] ?? priorityMeta.medium;

  return (
    <div className="relative inline-flex items-center">
      <button
        ref={anchorRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        aria-label={`Priority: ${meta.label}. Click to change.`}
        className={cn(
          "inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 text-xs transition-colors hover:bg-muted/70",
          focusRing,
          className,
        )}
      >
        <Flag className="h-3.5 w-3.5 shrink-0 fill-current" style={{ color: meta.flagColor }} />
        {showLabel && (
          <span className="truncate text-[13px] font-normal text-foreground/90">
            {meta.label}
          </span>
        )}
      </button>

      <Popover open={open} anchorRef={anchorRef} panelRef={panelRef} align="left" width={160}>
        <div className="p-1" role="menu">
          <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Priority
          </p>
          <div className="mt-1 flex flex-col gap-0.5">
            {PRIORITY_OPTIONS.map((option) => {
              const optMeta = priorityMeta[option.value];
              const isSelected = option.value === priority;
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
                    <Flag className="h-3.5 w-3.5 shrink-0 fill-current" style={{ color: optMeta.flagColor }} />
                    <span className="text-foreground/90">{optMeta.label}</span>
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
