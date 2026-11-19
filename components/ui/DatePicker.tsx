"use client";

import { Popover } from "@/components/ui/Popover";
import { useDismiss } from "@/lib/use-dismiss";
import { cn, focusRing, formatDate, isSameDay, parseISODate, toISODate } from "@/lib/utils";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useId, useMemo, useRef, useState } from "react";

interface DatePickerProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
}

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

export function DatePicker({
  id,
  label,
  value,
  onChange,
  error,
  placeholder = "Pick a date",
  disabled,
}: DatePickerProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const [open, setOpen] = useState(false);
  const selected = value ? parseISODate(value) : null;
  const [visibleMonth, setVisibleMonth] = useState(() => selected ?? new Date());
  const anchorRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  useDismiss(open, () => setOpen(false), anchorRef, panelRef);

  const cells = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const first = new Date(year, month, 1);
    const pad = (first.getDay() + 6) % 7;
    const days = new Date(year, month + 1, 0).getDate();
    const result: Array<Date | null> = Array.from({ length: pad }, () => null);
    for (let day = 1; day <= days; day += 1) result.push(new Date(year, month, day));
    return result;
  }, [visibleMonth]);

  const today = new Date();

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={fieldId} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <button
        id={fieldId}
        ref={anchorRef}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (selected) setVisibleMonth(selected);
          setOpen((current) => !current);
        }}
        className={cn(
          "flex h-9 w-full items-center gap-2 rounded-lg border bg-input px-3 text-left text-sm shadow-sm disabled:cursor-not-allowed disabled:opacity-60",
          error ? "border-danger" : "border-border",
          focusRing,
        )}
      >
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className={value ? "text-foreground" : "text-muted-foreground"}>
          {value ? formatDate(value) : placeholder}
        </span>
      </button>
      <Popover open={open} anchorRef={anchorRef} panelRef={panelRef} width={292}>
        <div className="p-3">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              className={cn("rounded-md p-1 hover:bg-muted", focusRing)}
              aria-label="Previous month"
              onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-sm font-medium">
              {visibleMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </p>
            <button
              type="button"
              className={cn("rounded-md p-1 hover:bg-muted", focusRing)}
              aria-label="Next month"
              onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-muted-foreground">
            {WEEKDAYS.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {cells.map((date, index) => {
              if (!date) return <span key={`empty-${index}`} />;
              const isSelected = selected ? isSameDay(date, selected) : false;
              const isToday = isSameDay(date, today);
              return (
                <button
                  key={toISODate(date)}
                  type="button"
                  onClick={() => {
                    onChange(toISODate(date));
                    setOpen(false);
                  }}
                  className={cn(
                    "h-8 rounded-md text-sm text-foreground hover:bg-muted",
                    isSelected && "bg-primary text-primary-foreground hover:bg-primary-hover",
                    isToday && !isSelected && "ring-1 ring-primary",
                  )}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <button
              type="button"
              className="text-xs font-medium text-primary"
              onClick={() => {
                onChange(toISODate(new Date()));
                setOpen(false);
              }}
            >
              Today
            </button>
            {value && (
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </Popover>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
