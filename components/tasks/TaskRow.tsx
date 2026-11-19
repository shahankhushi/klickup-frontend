"use client";

import { TaskAssigneePicker } from "@/components/tasks/TaskAssigneePicker";
import { TaskDatePicker } from "@/components/tasks/TaskDatePicker";
import { TaskPriorityPicker } from "@/components/tasks/TaskPriorityPicker";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import { useToast } from "@/components/ui/Toast";
import { useAppData } from "@/lib/store";
import type { Task } from "@/lib/types";
import { cn, focusRing } from "@/lib/utils";
import {
  Check,
  CheckSquare,
  ChevronRight,
  Copy,
  ExternalLink,
  MessageSquare,
  MoreHorizontal,
  RotateCcw,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export interface VisibleColumns {
  assignee: boolean;
  dueDate: boolean;
  priority: boolean;
  project?: boolean;
  subtasks?: boolean;
}

interface TaskRowProps {
  task: Task;
  selected?: boolean;
  onSelect?: (id: string, checked: boolean) => void;
  showProject?: boolean;
  showSubtasks?: boolean;
  visibleColumns?: VisibleColumns;
}

export function TaskRow({
  task,
  selected = false,
  onSelect,
  showProject = false,
  showSubtasks = true,
  visibleColumns,
}: TaskRowProps) {
  const router = useRouter();
  const toast = useToast();
  const {
    projects,
    updateTask,
    deleteTask,
    duplicateTask,
    toggleTaskComplete,
    toggleChecklistItem,
    addChecklistItem,
    removeChecklistItem,
  } = useAppData();

  const cols = visibleColumns ?? { assignee: true, dueDate: true, priority: true, project: false, subtasks: true };
  const [isExpanded, setIsExpanded] = useState(showSubtasks);

  useEffect(() => {
    setIsExpanded(showSubtasks);
  }, [showSubtasks]);

  const isDone = task.status === "done";
  const project = projects.find((p) => p.id === task.projectId);
  const checklistTotal = task.checklist.length;
  const checklistDone = task.checklist.filter((item) => item.done).length;
  const commentCount = task.comments.length;

  return (
    <div className="flex flex-col">
      <div
        className={cn(
          "group relative flex items-center border-b border-border/40 bg-card px-4 py-2 text-sm transition-colors hover:bg-muted/30",
          isDone && "bg-muted/15 opacity-80",
          selected && "bg-[color-mix(in_oklab,var(--primary)_8%,var(--card))]",
        )}
      >
        {/* Selection checkbox (subtle on hover) */}
        {onSelect && (
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => onSelect(task.id, e.target.checked)}
            aria-label={`Select ${task.title}`}
            className="mr-2 h-3.5 w-3.5 rounded border-border text-primary opacity-0 group-hover:opacity-100 transition-opacity checked:opacity-100 shrink-0"
          />
        )}

        {/* Subtask expand/collapse chevron if task has subtasks */}
        {checklistTotal > 0 && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="mr-1.5 p-0.5 text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer"
            title={isExpanded ? "Collapse subtasks" : "Expand subtasks"}
          >
            <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", isExpanded && "rotate-90")} />
          </button>
        )}

        {/* Signature ClickUp Dotted Circular Checkmark Button */}
      <button
        type="button"
        onClick={() => {
          toggleTaskComplete(task.id);
          toast.success(
            isDone ? "Task reopened" : "Task completed!",
            task.title,
          );
        }}
        aria-label={isDone ? `Reopen task: ${task.title}` : `Complete task: ${task.title}`}
        className={cn(
          "relative mr-3 grid h-[18px] w-[18px] shrink-0 place-items-center transition-all",
          focusRing,
        )}
      >
        {isDone ? (
          <span className="grid h-[18px] w-[18px] place-items-center rounded-full bg-emerald-500 text-white shadow-xs">
            <Check className="h-3 w-3 stroke-[3]" />
          </span>
        ) : (
          <div className="relative group/check grid h-[18px] w-[18px] place-items-center">
            {/* ClickUp Dotted ring */}
            <svg
              className="h-[18px] w-[18px] text-muted-foreground/60 group-hover/check:text-emerald-500 transition-colors"
              viewBox="0 0 20 20"
            >
              <circle
                cx="10"
                cy="10"
                r="8"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeDasharray="3 2"
              />
            </svg>
            <Check className="absolute h-2.5 w-2.5 text-emerald-600 opacity-0 group-hover/check:opacity-100 transition-opacity stroke-[3]" />
          </div>
        )}
      </button>

      {/* Column 1: Task Name & Subtasks / Comments counters */}
      <div className="flex min-w-0 flex-1 items-center gap-2 pr-4">
        <Link
          href={`/tasks/${task.id}`}
          className={cn(
            "truncate text-[13.5px] font-normal text-foreground/90 hover:text-primary transition-colors",
            isDone && "line-through text-muted-foreground/60",
          )}
        >
          {task.title}
        </Link>

        {/* Optional project indicator badge */}
        {showProject && project && (
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium shrink-0 bg-muted/60 text-muted-foreground"
            title={`Project: ${project.name}`}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: project.color }}
            />
            <span className="truncate max-w-[100px]">{project.name}</span>
          </span>
        )}

        {/* Subtask count */}
        {checklistTotal > 0 && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium shrink-0",
              checklistDone === checklistTotal
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-muted text-muted-foreground",
            )}
            title={`${checklistDone} of ${checklistTotal} subtasks completed`}
          >
            <CheckSquare className="h-3 w-3" />
            <span>
              {checklistDone}/{checklistTotal}
            </span>
          </span>
        )}

        {/* Comment count */}
        {commentCount > 0 && (
          <span
            className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-muted-foreground bg-muted shrink-0"
            title={`${commentCount} comments`}
          >
            <MessageSquare className="h-3 w-3" />
            <span>{commentCount}</span>
          </span>
        )}
      </div>

      {/* Column 2: Assignee */}
      {cols.assignee && (
        <div className="w-24 shrink-0 flex items-center justify-start">
          <TaskAssigneePicker
            assigneeId={task.assigneeId}
            onChange={(newAssigneeId) => updateTask(task.id, { assigneeId: newAssigneeId })}
            showName={false}
          />
        </div>
      )}

      {/* Column 3: Due date */}
      {cols.dueDate && (
        <div className="w-28 shrink-0 flex items-center justify-start">
          <TaskDatePicker
            dueDate={task.dueDate}
            status={task.status}
            onChange={(newDueDate) => updateTask(task.id, { dueDate: newDueDate })}
          />
        </div>
      )}

      {/* Column 4: Priority */}
      {cols.priority && (
        <div className="w-28 shrink-0 flex items-center justify-start">
          <TaskPriorityPicker
            priority={task.priority}
            onChange={(newPriority) => updateTask(task.id, { priority: newPriority })}
            showLabel={true}
          />
        </div>
      )}

      {/* Quick context options menu */}
      <div className="w-8 shrink-0 flex items-center justify-end">
        <DropdownMenu
          align="right"
          trigger={
            <button
              type="button"
              className={cn(
                "rounded p-1 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-muted hover:text-foreground transition-all",
                focusRing,
              )}
              aria-label="More task options"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          }
          items={[
            {
              id: "open",
              label: "Open detail view",
              icon: <ExternalLink className="h-4 w-4" />,
              onSelect: () => router.push(`/tasks/${task.id}`),
            },
            {
              id: "toggle-done",
              label: isDone ? "Reopen task" : "Mark complete",
              icon: isDone ? <RotateCcw className="h-4 w-4" /> : <Check className="h-4 w-4" />,
              onSelect: () => {
                toggleTaskComplete(task.id);
                toast.success(isDone ? "Task reopened" : "Task completed");
              },
            },
            {
              id: "duplicate",
              label: "Duplicate task",
              icon: <Copy className="h-4 w-4" />,
              onSelect: () => {
                const copy = duplicateTask(task.id);
                if (copy) toast.success("Task duplicated", copy.title);
              },
            },
            {
              id: "delete",
              label: "Delete task",
              icon: <Trash2 className="h-4 w-4" />,
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

    {/* Indented Subtask rows when expanded */}
    {isExpanded && checklistTotal > 0 && (
      <div className="flex flex-col border-b border-border/30 bg-muted/15 divide-y divide-border/20">
        {task.checklist.map((item) => (
          <div
            key={item.id}
            className="group/sub flex items-center gap-2 pl-12 pr-4 py-1.5 text-xs text-foreground/80 hover:bg-muted/30 transition-colors"
          >
            <span className="text-muted-foreground/50 font-mono text-[11px] select-none">└─</span>
            <button
              type="button"
              onClick={() => toggleChecklistItem(task.id, item.id)}
              className="grid h-3.5 w-3.5 place-items-center rounded border border-border bg-card cursor-pointer"
            >
              {item.done && <Check className="h-2.5 w-2.5 text-primary stroke-[3]" />}
            </button>
            <span className={cn("flex-1 text-[12.5px]", item.done && "line-through text-muted-foreground/60")}>
              {item.title}
            </span>
            <button
              type="button"
              onClick={() => removeChecklistItem(task.id, item.id)}
              className="opacity-0 group-hover/sub:opacity-100 p-1 text-muted-foreground hover:text-rose-500 transition-all cursor-pointer"
              title="Delete subtask"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}

        {/* Quick Add Subtask Input */}
        <div className="flex items-center gap-2 pl-12 pr-4 py-1.5 text-xs">
          <span className="text-muted-foreground/50 font-mono text-[11px] select-none">└─</span>
          <input
            type="text"
            placeholder="+ Add subtask (press Enter)..."
            className="bg-transparent text-[12px] text-foreground placeholder:text-muted-foreground/50 outline-none w-72"
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.currentTarget.value.trim()) {
                addChecklistItem(task.id, e.currentTarget.value.trim());
                e.currentTarget.value = "";
              }
            }}
          />
        </div>
      </div>
    )}
  </div>
  );
}
