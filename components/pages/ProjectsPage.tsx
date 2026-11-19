"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { KanbanBoard } from "@/components/tasks/KanbanBoard";
import { QuickAddRow } from "@/components/tasks/QuickAddRow";
import { TaskRow } from "@/components/tasks/TaskRow";
import { TaskComposer } from "@/components/tasks/TaskComposer";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { spaces } from "@/lib/mock-data";
import { statusMeta, STATUS_OPTIONS } from "@/lib/labels";
import { useAppData } from "@/lib/store";
import type { TaskStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AlignLeft, ChevronDown, ChevronRight, LayoutGrid, Plus } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

export function ProjectsPage() {
  const searchParams = useSearchParams();
  const { tasks, projects } = useAppData();
  const [projectId, setProjectId] = useState(searchParams.get("project") ?? "all");
  const [view, setView] = useState<"board" | "list">("board");
  const [composerOpen, setComposerOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const currentProject = projects.find((p) => p.id === projectId);
  const currentSpace = spaces.find((s) => s.id === currentProject?.spaceId);

  const visible = useMemo(
    () => tasks.filter((task) => projectId === "all" || task.projectId === projectId),
    [projectId, tasks],
  );

  const completed = visible.filter((t) => t.status === "done").length;
  const percent = visible.length > 0 ? Math.round((completed / visible.length) * 100) : 0;

  function toggleGroupCollapse(id: string) {
    setCollapsedGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={currentProject ? currentProject.name : "Projects"}
        description={
          currentProject
            ? `${currentProject.description} (${currentSpace?.name ?? "Workspace"})`
            : "Drag cards into columns or switch to List view to manage project deliverables."
        }
        actions={
          <div className="flex items-center gap-2">
            <div className="w-48 sm:w-56">
              <Select
                value={projectId}
                onChange={setProjectId}
                options={[
                  { value: "all", label: "All projects" },
                  ...projects.map((project) => ({ value: project.id, label: project.name })),
                ]}
              />
            </div>
            <Button onClick={() => setComposerOpen(true)}>
              <Plus className="h-4 w-4 stroke-[3]" />
              <span className="hidden sm:inline">Add Task</span>
            </Button>
          </div>
        }
      />

      {/* Project Status Bar & View Switcher */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 shadow-card sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 rounded-lg bg-muted p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setView("board")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-all",
              view === "board"
                ? "bg-card text-foreground shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>Board View</span>
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-all",
              view === "list"
                ? "bg-card text-foreground shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <AlignLeft className="h-3.5 w-3.5" />
            <span>List View</span>
          </button>
        </div>

        {/* Project progress */}
        <div className="flex items-center gap-3 text-xs">
          {currentProject && (
            <span
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium"
              style={{
                color: currentProject.color,
                backgroundColor: `color-mix(in oklab, ${currentProject.color} 15%, transparent)`,
              }}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: currentProject.color }} />
              {currentSpace?.name}
            </span>
          )}
          <span className="text-muted-foreground">
            <strong className="text-foreground">{completed}</strong> / {visible.length} tasks
          </span>
          <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="font-semibold text-foreground">{percent}%</span>
        </div>
      </div>

      {/* Main Board or List */}
      {view === "board" ? (
        <KanbanBoard tasks={visible} projectId={projectId !== "all" ? projectId : undefined} />
      ) : (
        <div className="space-y-4">
          {STATUS_OPTIONS.map((opt) => {
            const groupTasks = visible.filter((t) => t.status === opt.value);
            const isCollapsed = collapsedGroups[opt.value] ?? false;
            const meta = statusMeta[opt.value];

            return (
              <div
                key={opt.value}
                className="overflow-hidden rounded-xl border border-border bg-card shadow-card"
              >
                <div
                  className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-2 select-none"
                  style={{ borderLeftWidth: "4px", borderLeftColor: meta.color }}
                >
                  <button
                    type="button"
                    onClick={() => toggleGroupCollapse(opt.value)}
                    className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground hover:opacity-80 transition-opacity"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span style={{ color: meta.color }}>{opt.label}</span>
                    <span className="rounded-full bg-card px-2 py-0.5 text-[11px] font-semibold text-muted-foreground shadow-xs">
                      {groupTasks.length}
                    </span>
                  </button>

                  <span className="text-[11px] text-muted-foreground font-medium">
                    {groupTasks.length} {groupTasks.length === 1 ? "task" : "tasks"}
                  </span>
                </div>

                {!isCollapsed && (
                  <div>
                    {groupTasks.length === 0 ? (
                      <p className="px-4 py-3 text-xs text-muted-foreground italic">
                        No tasks in this status.
                      </p>
                    ) : (
                      groupTasks.map((task) => (
                        <TaskRow
                          key={task.id}
                          task={task}
                          showProject={projectId === "all"}
                        />
                      ))
                    )}
                    <QuickAddRow
                      status={opt.value as TaskStatus}
                      projectId={projectId !== "all" ? projectId : undefined}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <TaskComposer
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
      />
    </div>
  );
}
