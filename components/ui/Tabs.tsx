"use client";

import { cn, focusRing } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: TabItem[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}

export function Tabs({ tabs, value, onChange, label = "Sections", className }: TabsProps) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn("flex w-full max-w-full gap-1 overflow-x-auto rounded-lg bg-muted p-1", className)}
    >
      {tabs.map((tab) => {
        const selected = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={cn(
              "shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              focusRing,
              selected ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
