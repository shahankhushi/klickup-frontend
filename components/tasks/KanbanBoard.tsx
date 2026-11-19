"use client";

import { TaskDatePicker } from "@/components/tasks/TaskDatePicker";
import { TaskPriorityPicker } from "@/components/tasks/TaskPriorityPicker";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import { useToast } from "@/components/ui/Toast";
import { statusMeta, STATUS_OPTIONS } from "@/lib/labels";
import { useAppData } from "@/lib/store";
import type { Task, TaskStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  Calendar,
  Check,
  Copy,
  ExternalLink,
  GitBranch,
  GripVertical,
  MoreHorizontal,
  Plus,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

interface KanbanBoardProps {
  tasks: Task[];
  projectId?: string;
}

export function KanbanBoard({ tasks, projectId }: KanbanBoardProps) {
  const { updateTask } = useAppData();
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const activeTask = tasks.find((t) => t.id === activeId) ?? null;

  function onDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const status = String(event.over?.id ?? "");
    if (!STATUS_OPTIONS.some((option) => option.value === status)) return;
    const task = tasks.find((item) => item.id === String(event.active.id));
    if (!task || task.status === status) return;
    updateTask(task.id, { status: status as TaskStatus });
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 pt-1 items-start">
        {STATUS_OPTIONS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.value);
          return (
            <KanbanColumn
              key={col.value}
              status={col.value}
              count={colTasks.length}
              projectId={projectId}
            >
              {colTasks.map((task) => (
                <KanbanTaskCard key={task.id} task={task} />
              ))}
            </KanbanColumn>
          );
        })}

        {/* '+ Add group' button (matching Screenshot 3) */}
        <button
          type="button"
          className="flex h-10 w-60 shrink-0 items-center gap-1.5 rounded-xl border border-dashed border-border px-3 text-xs font-semibold text-muted-foreground hover:border-primary hover:text-foreground transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add group</span>
        </button>
      </div>
      <DragOverlay>{activeTask ? <KanbanTaskCardPreview task={activeTask} /> : null}</DragOverlay>
    </DndContext>
  );
}

function KanbanColumn({
  status,
  count,
  projectId,
  children,
}: {
  status: TaskStatus;
  count: number;
  projectId?: string;
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const { quickAddTask } = useAppData();
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");

  const meta = statusMeta[status];

  // Colors matching Screenshot 3: NOT STARTED (Red), IN PROGRESS (Blue), COMPLETED (Green)
  const headerBadgeBg =
    status === "todo"
      ? "bg-rose-600 text-white"
      : status === "in_progress"
        ? "bg-sky-600 text-white"
        : status === "in_review"
          ? "bg-amber-600 text-white"
          : "bg-emerald-600 text-white";

  const columnBg =
    status === "todo"
      ? "bg-rose-50/50 dark:bg-rose-950/10"
      : status === "in_progress"
        ? "bg-sky-50/50 dark:bg-sky-950/10"
        : status === "in_review"
          ? "bg-amber-50/50 dark:bg-amber-950/10"
          : "bg-emerald-50/50 dark:bg-emerald-950/10";

  function handleQuickAdd() {
    const trimmed = title.trim();
    if (!trimmed) {
      setAdding(false);
      return;
    }
    const created = quickAddTask(trimmed, status, projectId);
    toast.success("Task created in " + meta.label, created.title);
    setTitle("");
    setAdding(false);
  }

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex w-[82vw] max-w-xs shrink-0 flex-col rounded-2xl border border-border/70 p-3 transition-colors sm:w-[310px]",
        columnBg,
        isOver && "border-primary ring-2 ring-primary/20",
      )}
    >
      {/* Column Header (matching Screenshot 3: Solid Pill + Count) */}
      <header className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn("rounded-md px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wide", headerBadgeBg)}>
            {status === "todo" ? "NOT STARTED" : meta.label}
          </span>
          <span className="text-xs font-bold text-muted-foreground">
            {count}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="rounded p-1 text-muted-foreground hover:bg-card hover:text-foreground transition-colors"
          aria-label={`Add task to ${meta.label}`}
        >
          <Plus className="h-4 w-4" />
        </button>
      </header>

      {/* Task cards in column */}
      <div className="flex min-h-24 flex-col gap-2.5">{children}</div>

      {/* Column Footer: Inline Add Card or '+ Add Task' text button */}
      {adding ? (
        <div className="mt-2.5 rounded-xl border border-border bg-card p-2.5 shadow-sm">
          <input
            autoFocus
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleQuickAdd();
              } else if (e.key === "Escape") {
                setAdding(false);
                setTitle("");
              }
            }}
            placeholder="Task name... (press Enter)"
            className="w-full bg-transparent text-xs placeholder:text-muted-foreground/60 border-none outline-none focus:outline-none"
          />
          <div className="mt-2 flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setTitle("");
              }}
              className="rounded px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleQuickAdd}
              className="rounded bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Add Card
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className={cn(
            "mt-2 flex items-center gap-1 px-1 py-1 text-xs font-semibold hover:underline transition-all text-left",
            status === "todo"
              ? "text-rose-600 dark:text-rose-400"
              : status === "in_progress"
                ? "text-sky-600 dark:text-sky-400"
                : status === "in_review"
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-emerald-600 dark:text-emerald-400",
          )}
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Task</span>
        </button>
      )}
    </section>
  );
}

function KanbanTaskCard({ task }: { task: Task }) {
  const router = useRouter();
  const toast = useToast();
  const { users, updateTask, deleteTask, duplicateTask, toggleTaskComplete } = useAppData();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id });

  const assignee = users.find((u) => u.id === task.assigneeId);
  const isDone = task.status === "done";
  const checklistTotal = task.checklist.length;

  return (
    <article
      ref={setNodeRef}
      className={cn(
        "group relative rounded-xl border border-border/80 bg-card p-3 shadow-xs hover:shadow-md transition-all hover:border-border",
        isDragging && "opacity-30",
        isDone && "bg-card/80 opacity-85",
      )}
    >
      <div className="flex items-start gap-2">
        {/* Drag handle */}
        <button
          type="button"
          className="mt-0.5 cursor-grab text-muted-foreground/40 opacity-0 group-hover:opacity-100 hover:text-foreground active:cursor-grabbing transition-opacity shrink-0"
          aria-label={`Drag ${task.title}`}
          {...listeners}
          {...attributes}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="min-w-0 flex-1">
          {/* Card Title */}
          <Link
            href={`/tasks/${task.id}`}
            className={cn(
              "block text-[13px] font-medium leading-snug text-foreground hover:text-primary transition-colors",
              isDone && "line-through text-muted-foreground",
            )}
          >
            {task.title}
          </Link>

          {/* Subtasks counter (matching Screenshot 3: e.g. '2 subtasks') */}
          {checklistTotal > 0 && (
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <GitBranch className="h-3 w-3" />
              <span>{checklistTotal} subtasks</span>
            </div>
          )}

          {/* Card footer: Due Date, Priority Flag, Assignee Tag Pill */}
          <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2 text-xs">
            <div className="flex items-center gap-2">
              {/* Due Date with Calendar icon (matching Screenshot 3) */}
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Calendar className="h-3 w-3 shrink-0" />
                <TaskDatePicker
                  dueDate={task.dueDate}
                  status={task.status}
                  onChange={(d) => updateTask(task.id, { dueDate: d })}
                />
              </div>

              {/* Priority Flag */}
              <TaskPriorityPicker
                priority={task.priority}
                onChange={(p) => updateTask(task.id, { priority: p })}
                showLabel={false}
              />
            </div>

            <div className="flex items-center gap-1.5">
              {/* Teal Assignee pill (matching Screenshot 3: e.g. 'abubakar') */}
              {assignee && (
                <span
                  className="rounded-md bg-teal-600 dark:bg-teal-700 px-2 py-0.5 text-[10px] font-semibold text-white truncate max-w-[80px]"
                  title={assignee.name}
                >
                  {assignee.name.split(" ")[0].toLowerCase()}
                </span>
              )}

              <DropdownMenu
                align="right"
                trigger={
                  <button
                    type="button"
                    className="rounded p-0.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-muted hover:text-foreground"
                    aria-label="Card actions"
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </button>
                }
                items={[
                  {
                    id: "open",
                    label: "Open details",
                    icon: <ExternalLink className="h-3.5 w-3.5" />,
                    onSelect: () => router.push(`/tasks/${task.id}`),
                  },
                  {
                    id: "complete",
                    label: isDone ? "Reopen task" : "Mark complete",
                    icon: <Check className="h-3.5 w-3.5" />,
                    onSelect: () => toggleTaskComplete(task.id),
                  },
                  {
                    id: "duplicate",
                    label: "Duplicate",
                    icon: <Copy className="h-3.5 w-3.5" />,
                    onSelect: () => {
                      const copy = duplicateTask(task.id);
                      if (copy) toast.success("Task duplicated", copy.title);
                    },
                  },
                  {
                    id: "delete",
                    label: "Delete",
                    icon: <Trash2 className="h-3.5 w-3.5" />,
                    danger: true,
                    onSelect: () => {
                      deleteTask(task.id);
                      toast.success("Task deleted", task.title);
                    },
                  },
                ]}
              />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function KanbanTaskCardPreview({ task }: { task: Task }) {
  return (
    <div className="w-72 rotate-1 rounded-xl border border-primary bg-card p-3 shadow-xl">
      <p className="text-xs font-semibold">{task.title}</p>
    </div>
  );
}
