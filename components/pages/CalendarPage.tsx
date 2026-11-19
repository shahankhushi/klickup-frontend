"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { DueLabel } from "@/components/tasks/DueLabel";
import { Button } from "@/components/ui/Button";
import { useAppData } from "@/lib/store";
import { cn, isSameDay, parseISODate, toISODate } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function CalendarPage() {
  const { tasks } = useAppData();
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState(() => toISODate(new Date()));

  const cells = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = new Date(year, month, 1);
    const pad = (first.getDay() + 6) % 7;
    const days = new Date(year, month + 1, 0).getDate();
    const result: Array<Date | null> = Array.from({ length: pad }, () => null);
    for (let day = 1; day <= days; day += 1) result.push(new Date(year, month, day));
    while (result.length % 7 !== 0) result.push(null);
    return result;
  }, [cursor]);

  const selectedTasks = tasks.filter((task) => task.dueDate === selected);

  return (
    <div>
      <PageHeader title="Calendar" description="Tasks land on the day they're due." />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="rounded-xl border border-border bg-card p-4 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              aria-label="Previous month"
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-sm font-semibold">
              {cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Next month"
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
            {WEEKDAYS.map((day) => (
              <span key={day} className="py-1">
                {day}
              </span>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {cells.map((date, index) => {
              if (!date) return <span key={`empty-${index}`} className="min-h-16 rounded-lg bg-muted/40 sm:min-h-24" />;
              const iso = toISODate(date);
              const dayTasks = tasks.filter((task) => task.dueDate === iso);
              const isSelected = iso === selected;
              const isToday = isSameDay(date, new Date());
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => setSelected(iso)}
                  className={cn(
                    "min-h-16 rounded-lg border p-1 text-left sm:min-h-24 sm:p-2",
                    isSelected ? "border-primary bg-[color-mix(in_oklab,var(--primary)_8%,var(--card))]" : "border-transparent bg-muted/30 hover:bg-muted",
                  )}
                >
                  <span className={cn("text-xs font-medium", isToday && "text-primary")}>{date.getDate()}</span>
                  <span className="mt-1 hidden flex-col gap-1 sm:flex">
                    {dayTasks.slice(0, 2).map((task) => (
                      <span key={task.id} className="truncate rounded bg-card px-1 py-0.5 text-[10px] text-foreground">
                        {task.title}
                      </span>
                    ))}
                    {dayTasks.length > 2 && <span className="text-[10px] text-muted-foreground">+{dayTasks.length - 2}</span>}
                  </span>
                  {dayTasks.length > 0 && <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-primary sm:hidden" />}
                </button>
              );
            })}
          </div>
        </section>
        <aside className="rounded-xl border border-border bg-card p-4 shadow-card">
          <h2 className="text-sm font-semibold">{parseISODate(selected).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</h2>
          {selectedTasks.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Nothing is due this day.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {selectedTasks.map((task) => (
                <li key={task.id}>
                  <Link href={`/tasks/${task.id}`} className="text-sm font-medium hover:text-primary">
                    {task.title}
                  </Link>
                  <div className="mt-1">
                    <DueLabel date={task.dueDate} status={task.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
