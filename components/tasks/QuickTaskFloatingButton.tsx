"use client";

import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { PRIORITY_OPTIONS, STATUS_OPTIONS } from "@/lib/labels";
import { canLeadWorkspace } from "@/lib/access";
import { useAppData } from "@/lib/store";
import type { Priority, TaskStatus } from "@/lib/types";
import { cn, focusRing, toISODate } from "@/lib/utils";
import { Calendar, Plus, X, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function QuickTaskFloatingButton() {
  const { projects, users, addTask, currentUser } = useAppData();
  const leads = canLeadWorkspace(currentUser.role);
  const assigneeChoices = leads ? users : users.filter((user) => user.id === currentUser.id);
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [assigneeId, setAssigneeId] = useState(currentUser.id);
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueDate, setDueDate] = useState(() => toISODate(new Date()));
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => titleInputRef.current?.focus(), 80);
    }
  }, [open]);

  // Global hotkey: press 't' when not typing in an input/textarea to open
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.key.toLowerCase() === "t" &&
        !open &&
        !["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)
      ) {
        e.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  function handleCreate() {
    const trimmed = title.trim();
    if (!trimmed) {
      toast.error("Please enter a task title");
      return;
    }

    addTask({
      title: trimmed,
      description: description.trim(),
      projectId: projectId || projects[0]?.id || "p_roadmap",
      assigneeId: leads ? assigneeId || currentUser.id : currentUser.id,
      status,
      priority,
      dueDate,
    });

    toast.success("Task created!", trimmed);
    setTitle("");
    setDescription("");
    setOpen(false);
  }

  return (
    <>
      {/* Floating Action Trigger Button */}
      {!open && (
        <aside aria-label="Quick task creation" className="fixed bottom-6 right-6 z-40">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Create new task (Hotkey: T)"
            className={cn(
              "flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:scale-105 hover:shadow-xl hover:shadow-violet-500/35 active:scale-95",
              focusRing,
            )}
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>Task</span>
            <kbd className="hidden sm:inline-block rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white">
              T
            </kbd>
          </button>
        </aside>
      )}

      {/* Docked Quick Create Card */}
      {open && (
        <aside
          aria-label="Quick task creation dock"
          className="fixed bottom-6 right-6 z-50 w-[92vw] max-w-lg rounded-2xl border border-border bg-card p-4 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-md bg-primary text-primary-foreground">
                <Zap className="h-3.5 w-3.5" />
              </span>
              <h2 className="text-sm font-semibold">Quick Create Task</h2>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Close quick task"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCreate();
            }}
            className="mt-3 space-y-3"
          >
            <div>
              <input
                ref={titleInputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                aria-label="Task title"
                className={cn(
                  "w-full rounded-lg border border-border bg-input px-3 py-2 text-sm font-medium placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary",
                )}
              />
            </div>

            <div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add description or context... (optional)"
                aria-label="Task description"
                rows={2}
                className="w-full rounded-lg border border-border bg-input px-3 py-1.5 text-xs placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>

            {/* Quick attribute selects */}
            <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
              {/* Project select */}
              <div>
                <label className="text-[10px] uppercase font-semibold text-muted-foreground block mb-1">
                  Project
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full rounded-md border border-border bg-input px-2 py-1.5 text-xs text-foreground"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Assignee select */}
              <div>
                <label className="text-[10px] uppercase font-semibold text-muted-foreground block mb-1">
                  Assignee
                </label>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full rounded-md border border-border bg-input px-2 py-1.5 text-xs text-foreground"
                >
                  {assigneeChoices.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status select */}
              <div>
                <label className="text-[10px] uppercase font-semibold text-muted-foreground block mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                  className="w-full rounded-md border border-border bg-input px-2 py-1.5 text-xs text-foreground"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority select */}
              <div>
                <label className="text-[10px] uppercase font-semibold text-muted-foreground block mb-1">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="w-full rounded-md border border-border bg-input px-2 py-1.5 text-xs text-foreground"
                >
                  {PRIORITY_OPTIONS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bottom Row */}
            <div className="flex items-center justify-between pt-2 border-t border-border/60">
              <div className="flex items-center gap-1.5">
                <label className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Due:
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="rounded border border-border bg-input px-2 py-0.5 text-xs text-foreground"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" type="button" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button size="sm" type="submit">
                  Create Task
                </Button>
              </div>
            </div>
          </form>
        </aside>
      )}
    </>
  );
}
