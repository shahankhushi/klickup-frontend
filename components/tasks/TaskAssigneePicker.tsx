"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Popover } from "@/components/ui/Popover";
import { canLeadWorkspace } from "@/lib/access";
import { useAppData } from "@/lib/store";
import { useDismiss } from "@/lib/use-dismiss";
import { cn, focusRing } from "@/lib/utils";
import { Check } from "lucide-react";
import { useRef, useState } from "react";

interface TaskAssigneePickerProps {
  assigneeId: string;
  onChange: (userId: string) => void;
  className?: string;
  showName?: boolean;
}

export function TaskAssigneePicker({
  assigneeId,
  onChange,
  className,
  showName = true,
}: TaskAssigneePickerProps) {
  const { users, currentUser } = useAppData();
  const leads = canLeadWorkspace(currentUser.role);
  const choices = leads ? users : users.filter((user) => user.id === currentUser.id);
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  useDismiss(open, () => setOpen(false), anchorRef, panelRef);

  const current = users.find((u) => u.id === assigneeId);

  return (
    <div className="relative inline-flex items-center">
      <button
        ref={anchorRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        aria-label={`Assignee: ${current?.name ?? "Unassigned"}. Click to reassign.`}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-xs font-medium hover:bg-muted/70 transition-colors",
          focusRing,
          className,
        )}
      >
        <Avatar
          name={current?.name ?? "Unassigned"}
          initials={current?.initials}
          color={current?.color}
          src={current?.avatarUrl}
          size={showName ? "sm" : "xs"}
        />
        {showName && (
          <span className="truncate max-w-[120px] text-foreground">
            {current?.name ?? "Unassigned"}
          </span>
        )}
      </button>

      <Popover open={open} anchorRef={anchorRef} panelRef={panelRef} align="left" width={200}>
        <div className="p-1" role="menu">
          <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Assign To
          </p>
          <div className="max-h-60 overflow-y-auto flex flex-col gap-0.5">
            {choices.map((user) => {
              const isSelected = user.id === assigneeId;
              return (
                <button
                  key={user.id}
                  type="button"
                  role="menuitem"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(user.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-xs font-medium text-left hover:bg-muted transition-colors",
                    focusRing,
                  )}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <Avatar name={user.name} initials={user.initials} color={user.color} src={user.avatarUrl} size="sm" />
                    <span className="truncate text-foreground">{user.name}</span>
                  </span>
                  {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      </Popover>
    </div>
  );
}
