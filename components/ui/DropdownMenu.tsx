"use client";

import { Popover } from "@/components/ui/Popover";
import { useDismiss } from "@/lib/use-dismiss";
import { cn, focusRing } from "@/lib/utils";
import { useRef, useState, type ReactNode } from "react";

export interface DropdownItem {
  id: string;
  label: string;
  icon?: ReactNode;
  danger?: boolean;
  disabled?: boolean;
  onSelect: () => void;
}

interface DropdownMenuProps {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: "left" | "right";
  label?: string;
}

export function DropdownMenu({ trigger, items, align = "right", label = "Open menu" }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  useDismiss(open, () => setOpen(false), anchorRef, panelRef);

  return (
    <div ref={anchorRef} className="inline-flex">
      <div onClick={() => setOpen((current) => !current)} aria-label={label}>
        {trigger}
      </div>
      <Popover open={open} anchorRef={anchorRef} panelRef={panelRef} align={align} width={220}>
        <ul className="p-1" role="menu">
          {items.map((item) => (
            <li key={item.id} role="none">
              <button
                type="button"
                role="menuitem"
                disabled={item.disabled}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm hover:bg-muted disabled:opacity-50",
                  focusRing,
                  item.danger ? "text-danger" : "text-foreground",
                )}
                onClick={() => {
                  item.onSelect();
                  setOpen(false);
                }}
              >
                {item.icon}
                <span className="truncate">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </Popover>
    </div>
  );
}
