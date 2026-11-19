"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { DatePicker } from "@/components/ui/DatePicker";
import { RelativeTime } from "@/components/ui/RelativeTime";
import { Select } from "@/components/ui/Select";
import { TextField } from "@/components/ui/TextField";
import { useToast } from "@/components/ui/Toast";
import { PRIORITY_OPTIONS, priorityMeta, STATUS_OPTIONS, statusMeta } from "@/lib/labels";
import { canLeadWorkspace } from "@/lib/access";
import { useAppData } from "@/lib/store";
import type { Priority, TaskStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Check,
  CheckCircle2,
  Copy,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function TaskDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const {
    tasks,
    users,
    projects,
    updateTask,
    deleteTask,
    duplicateTask,
    toggleTaskComplete,
    addComment,
    addChecklistItem,
    toggleChecklistItem,
    removeChecklistItem,
    currentUser,
  } = useAppData();
  const toast = useToast();

  const task = tasks.find((item) => item.id === id);
  const leads = canLeadWorkspace(currentUser.role);

  if (task && !leads && task.assigneeId !== currentUser.id) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
        <h1 className="text-xl font-semibold">This task is not on your list</h1>
        <p className="mt-2 text-sm text-muted-foreground">You can open the tasks assigned to you.</p>
        <div className="mt-6 flex justify-center">
          <Button href="/tasks">Back to my tasks</Button>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
        <h1 className="text-xl font-semibold">This task is not in the workspace</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          It may have been deleted or a bad link. The rest of the list is still here.
        </p>
        <div className="mt-6 flex justify-center">
          <Button href="/tasks">Back to tasks</Button>
        </div>
      </div>
    );
  }

  return (
    <TaskDetailContent
      key={task.id}
      task={task}
      users={users}
      projects={projects}
      currentUser={currentUser}
      onUpdate={updateTask}
      onDelete={(taskId) => {
        deleteTask(taskId);
        toast.success("Task deleted");
        router.push("/tasks");
      }}
      onDuplicate={(taskId) => {
        const copy = duplicateTask(taskId);
        if (copy) {
          toast.success("Task duplicated", copy.title);
          router.push(`/tasks/${copy.id}`);
        }
      }}
      onToggleComplete={(taskId) => {
        toggleTaskComplete(taskId);
        toast.success(task.status === "done" ? "Task reopened" : "Task completed!");
      }}
      onAddComment={addComment}
      onAddChecklistItem={addChecklistItem}
      onToggleChecklistItem={toggleChecklistItem}
      onRemoveChecklistItem={removeChecklistItem}
    />
  );
}

function TaskDetailContent({
  task,
  users,
  projects,
  currentUser,
  onUpdate,
  onDelete,
  onDuplicate,
  onToggleComplete,
  onAddComment,
  onAddChecklistItem,
  onToggleChecklistItem,
  onRemoveChecklistItem,
}: {
  task: import("@/lib/types").Task;
  users: import("@/lib/types").User[];
  projects: import("@/lib/types").Project[];
  currentUser: import("@/lib/types").User;
  onUpdate: (id: string, patch: Partial<import("@/lib/types").Task>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onToggleComplete: (id: string) => void;
  onAddComment: (taskId: string, body: string) => void;
  onAddChecklistItem: (taskId: string, title: string) => void;
  onToggleChecklistItem: (taskId: string, itemId: string) => void;
  onRemoveChecklistItem: (taskId: string, itemId: string) => void;
}) {
  const toast = useToast();
  const [title, setTitle] = useState(task.title);
  const [editingTitle, setEditingTitle] = useState(false);
  const [description, setDescription] = useState(task.description);
  const [checklistDraft, setChecklistDraft] = useState("");
  const [comment, setComment] = useState("");
  const [commentError, setCommentError] = useState("");

  const assignee = users.find((user) => user.id === task.assigneeId);
  const project = projects.find((item) => item.id === task.projectId);
  const isDone = task.status === "done";
  const checklistTotal = task.checklist.length;
  const checklistDone = task.checklist.filter((i) => i.done).length;
  const checklistPercent = checklistTotal > 0 ? Math.round((checklistDone / checklistTotal) * 100) : 0;

  function saveTitle() {
    const next = title.trim();
    if (next.length < 3) {
      setTitle(task.title);
      toast.error("Title is too short", "Use at least 3 characters.");
    } else if (next !== task.title) {
      onUpdate(task.id, { title: next });
    }
    setEditingTitle(false);
  }

  function saveDescription() {
    if (description.trim() !== task.description) {
      onUpdate(task.id, { description: description.trim() });
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={task.title}
        breadcrumbs={[
          { label: "Tasks", href: "/tasks" },
          { label: project?.name ?? "Project", href: project ? `/projects?project=${project.id}` : undefined },
          { label: task.title },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant={isDone ? "secondary" : "primary"}
              onClick={() => onToggleComplete(task.id)}
            >
              {isDone ? (
                <>
                  <RotateCcw className="h-4 w-4" />
                  <span>Reopen Task</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Complete Task</span>
                </>
              )}
            </Button>
            <Button variant="secondary" onClick={() => onDuplicate(task.id)}>
              <Copy className="h-4 w-4" />
              <span>Duplicate</span>
            </Button>
            <Button variant="ghost" onClick={() => onDelete(task.id)} className="text-danger hover:bg-danger/10">
              <Trash2 className="h-4 w-4" />
              <span>Delete</span>
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          <section className="rounded-xl border border-border bg-card p-5 shadow-card">
            {editingTitle ? (
              <input
                autoFocus
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                onBlur={saveTitle}
                onKeyDown={(event) => {
                  if (event.key === "Enter") saveTitle();
                  if (event.key === "Escape") {
                    setTitle(task.title);
                    setEditingTitle(false);
                  }
                }}
                aria-label="Task title"
                className="w-full rounded-lg border border-border bg-input px-3 py-2 text-xl font-semibold"
              />
            ) : (
              <button
                type="button"
                onClick={() => setEditingTitle(true)}
                className="text-left text-xl font-semibold tracking-tight hover:text-primary transition-colors"
              >
                {task.title}
              </button>
            )}
            <p className="mt-1 text-xs text-muted-foreground">Click the title to rename it.</p>

            {/* In-place quick controls */}
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Select
                label="Status"
                value={task.status}
                onChange={(value) => onUpdate(task.id, { status: value as TaskStatus })}
                options={STATUS_OPTIONS}
              />
              <Select
                label="Priority"
                value={task.priority}
                onChange={(value) => onUpdate(task.id, { priority: value as Priority })}
                options={PRIORITY_OPTIONS}
              />
              <Select
                label="Assignee"
                value={task.assigneeId}
                onChange={(value) => onUpdate(task.id, { assigneeId: value })}
                options={(canLeadWorkspace(currentUser.role) ? users : users.filter((user) => user.id === currentUser.id)).map((user) => ({ value: user.id, label: user.name }))}
              />
              <DatePicker
                label="Due date"
                value={task.dueDate}
                onChange={(value) => value && onUpdate(task.id, { dueDate: value })}
              />
            </div>

            <div className="mt-4">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                onBlur={saveDescription}
                className="mt-1.5 min-h-32 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm"
              />
            </div>
          </section>

          {/* Subtasks / Checklist section */}
          <section className="rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold">Subtasks & Checklist</h2>
                {checklistTotal > 0 && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground font-medium">
                    {checklistDone}/{checklistTotal} ({checklistPercent}%)
                  </span>
                )}
              </div>
              {checklistTotal > 0 && (
                <div className="h-2 w-28 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${checklistPercent}%` }}
                  />
                </div>
              )}
            </div>

            <ul className="mt-4 space-y-2">
              {task.checklist.map((item) => (
                <li key={item.id} className="flex items-center gap-2.5 group">
                  <button
                    type="button"
                    aria-pressed={item.done}
                    onClick={() => onToggleChecklistItem(task.id, item.id)}
                    className={cn(
                      "grid h-4 w-4 place-items-center rounded border transition-colors",
                      item.done
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-border bg-input hover:border-emerald-500",
                    )}
                  >
                    {item.done && <Check className="h-3 w-3 stroke-[3]" />}
                  </button>
                  <span
                    className={cn(
                      "flex-1 text-sm font-medium transition-colors",
                      item.done && "text-muted-foreground line-through",
                    )}
                  >
                    {item.title}
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove ${item.title}`}
                    onClick={() => onRemoveChecklistItem(task.id, item.id)}
                    className="opacity-0 group-hover:opacity-100 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-danger transition-opacity"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
              {task.checklist.length === 0 && (
                <li className="text-xs text-muted-foreground italic py-1">
                  No subtasks yet. Add actionable steps below.
                </li>
              )}
            </ul>

            <form
              className="mt-4 flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                if (checklistDraft.trim().length < 2) return;
                onAddChecklistItem(task.id, checklistDraft);
                setChecklistDraft("");
              }}
            >
              <TextField
                value={checklistDraft}
                onChange={(event) => setChecklistDraft(event.target.value)}
                placeholder="Add a subtask..."
                aria-label="New subtask"
                className="flex-1"
              />
              <Button type="submit" variant="secondary">
                Add
              </Button>
            </form>
          </section>

          {/* Comments section */}
          <section className="rounded-xl border border-border bg-card p-5 shadow-card">
            <h2 className="text-sm font-semibold">Comments & Activity Updates</h2>
            <ul className="mt-4 space-y-4">
              {task.comments.length === 0 && (
                <li className="text-sm text-muted-foreground">
                  No comments yet. Leave context the next owner will need.
                </li>
              )}
              {task.comments.map((entry) => {
                const author = users.find((user) => user.id === entry.authorId);
                return (
                  <li key={entry.id} className="flex gap-3">
                    <Avatar name={author?.name ?? "Teammate"} color={author?.color} size="sm" />
                    <div>
                      <p className="text-sm">
                        <span className="font-medium">{author?.name ?? "Teammate"}</span>{" "}
                        <RelativeTime value={entry.createdAt} className="text-xs text-muted-foreground" />
                      </p>
                      <p className="mt-1 text-sm text-foreground">{entry.body}</p>
                    </div>
                  </li>
                );
              })}
            </ul>

            <form
              className="mt-4 space-y-2"
              onSubmit={(event) => {
                event.preventDefault();
                if (comment.trim().length < 2) {
                  setCommentError("Write a comment before sending it.");
                  return;
                }
                onAddComment(task.id, comment);
                setComment("");
                setCommentError("");
                toast.success("Comment added");
              }}
            >
              <TextField
                label={`Comment as ${currentUser.name.split(" ")[0]}`}
                multiline
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Share an update or tag a teammate..."
                error={commentError}
              />
              <Button type="submit">Comment</Button>
            </form>
          </section>
        </div>

        {/* Sidebar info & Activity */}
        <aside className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <h2 className="text-sm font-semibold">Task Details</h2>
            <div className="mt-3 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <span
                  className="rounded px-2 py-0.5 text-[10px] font-semibold uppercase"
                  style={{
                    color: statusMeta[task.status].color,
                    backgroundColor: statusMeta[task.status].bg,
                  }}
                >
                  {statusMeta[task.status].label}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Priority</span>
                <span className="font-semibold" style={{ color: priorityMeta[task.priority].color }}>
                  {priorityMeta[task.priority].label}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Assignee</span>
                <span className="font-medium">{assignee?.name ?? "Unassigned"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Project</span>
                <span className="font-medium">{project?.name ?? "None"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Due date</span>
                <span className="font-medium">{task.dueDate}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <h2 className="text-sm font-semibold">Activity Stream</h2>
            <ol className="mt-4 space-y-4 border-l border-border pl-4">
              {task.activity.map((entry) => (
                <li key={entry.id} className="relative">
                  <span className="absolute -left-[1.2rem] top-1 h-2 w-2 rounded-full bg-primary" />
                  <p className="text-xs text-foreground">{entry.text}</p>
                  <RelativeTime value={entry.createdAt} className="text-[11px] text-muted-foreground" />
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
}
