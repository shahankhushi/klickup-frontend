"use client";

import { KanbanBoard } from "@/components/tasks/KanbanBoard";
import { QuickAddRow } from "@/components/tasks/QuickAddRow";
import { TaskRow, type VisibleColumns } from "@/components/tasks/TaskRow";
import { TaskComposer } from "@/components/tasks/TaskComposer";
import { TodayCardButton } from "@/components/tasks/TodayCardButton";
import { canLeadWorkspace } from "@/lib/access";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { priorityMeta, PRIORITY_OPTIONS, statusMeta, STATUS_OPTIONS } from "@/lib/labels";
import { useAppData } from "@/lib/store";
import type { Task, TaskStatus } from "@/lib/types";
import { useDismiss } from "@/lib/use-dismiss";
import { cn, dueTone, focusRing, formatRelative, isSameDay, parseISODate, toISODate } from "@/lib/utils";
import {
  Activity,
  AlignLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Columns3,
  Copy,
  ExternalLink,
  Eye,
  Filter,
  GitBranch,
  Hash,
  Layers,
  LayoutGrid,
  MessageSquare,
  Plus,
  Search,
  Send,
  Share2,
  Shield,
  SlidersHorizontal,
  Star,
  Table2,
  Trash2,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

type ViewType = "list" | "board" | "calendar" | "table";
type GroupByType = "status" | "priority" | "assignee" | "project" | "none";

interface TaskGroup {
  id: string;
  label: string;
  color: string;
  tasks: Task[];
  status?: TaskStatus;
  projectId?: string;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function TasksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const {
    tasks,
    users,
    projects,
    feed,
    batchUpdateStatus,
    batchDeleteTasks,
    currentUser,
    isSuperAdmin,
    syncNow,
    lastSyncedAt,
  } = useAppData();
  const leads = canLeadWorkspace(currentUser.role);

  const initialStatus = searchParams.get("status") ?? "all";
  const initialDue = searchParams.get("due") ?? "all";
  const initialAssignee = searchParams.get("assignee") ?? "all";
  const initialCompose = searchParams.get("compose") === "1";
  const initialView = (searchParams.get("view") as ViewType) || "list";
  const initialProject = searchParams.get("project") ?? "all";

  const [view, setView] = useState<ViewType>(initialView);
  const [groupBy, setGroupBy] = useState<GroupByType>("status");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>(initialStatus);
  const [assignee, setAssignee] = useState<string>(initialAssignee);
  const [projectFilter, setProjectFilter] = useState<string>(initialProject);
  const [spaceFilter, setSpaceFilter] = useState<string>("all");
  const [dueFilter, setDueFilter] = useState<string>(initialDue);

  // Sync state if URL searchParams change
  useEffect(() => {
    const dueParam = searchParams.get("due");
    if (dueParam !== null) setDueFilter(dueParam);
    const statusParam = searchParams.get("status");
    if (statusParam !== null) setStatus(statusParam);
    const assigneeParam = searchParams.get("assignee");
    if (assigneeParam !== null) setAssignee(assigneeParam);
    const projectParam = searchParams.get("project");
    if (projectParam !== null) setProjectFilter(projectParam);
  }, [searchParams]);
  const [showSubtasks, setShowSubtasks] = useState(true);
  const [showClosed, setShowClosed] = useState(true);
  const [starred, setStarred] = useState(false);
  const [composerOpen, setComposerOpen] = useState(initialCompose);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState<VisibleColumns>({
    assignee: true,
    dueDate: true,
    priority: true,
    project: false,
    subtasks: true,
  });

  // Dropdown states & refs
  const [spaceMenuOpen, setSpaceMenuOpen] = useState(false);
  const spaceAnchorRef = useRef<HTMLButtonElement>(null);
  const spacePanelRef = useRef<HTMLDivElement>(null);
  useDismiss(spaceMenuOpen, () => setSpaceMenuOpen(false), spaceAnchorRef, spacePanelRef);

  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const [projectSearch, setProjectSearch] = useState("");
  const projectAnchorRef = useRef<HTMLButtonElement>(null);
  const projectPanelRef = useRef<HTMLDivElement>(null);
  useDismiss(projectMenuOpen, () => setProjectMenuOpen(false), projectAnchorRef, projectPanelRef);

  const [groupMenuOpen, setGroupMenuOpen] = useState(false);
  const groupAnchorRef = useRef<HTMLButtonElement>(null);
  const groupPanelRef = useRef<HTMLDivElement>(null);
  useDismiss(groupMenuOpen, () => setGroupMenuOpen(false), groupAnchorRef, groupPanelRef);

  const [subtasksMenuOpen, setSubtasksMenuOpen] = useState(false);
  const subtasksAnchorRef = useRef<HTMLButtonElement>(null);
  const subtasksPanelRef = useRef<HTMLDivElement>(null);
  useDismiss(subtasksMenuOpen, () => setSubtasksMenuOpen(false), subtasksAnchorRef, subtasksPanelRef);

  const [columnsMenuOpen, setColumnsMenuOpen] = useState(false);
  const columnsAnchorRef = useRef<HTMLButtonElement>(null);
  const columnsPanelRef = useRef<HTMLDivElement>(null);
  useDismiss(columnsMenuOpen, () => setColumnsMenuOpen(false), columnsAnchorRef, columnsPanelRef);

  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const filterAnchorRef = useRef<HTMLButtonElement>(null);
  const filterPanelRef = useRef<HTMLDivElement>(null);
  useDismiss(filterMenuOpen, () => setFilterMenuOpen(false), filterAnchorRef, filterPanelRef);

  const [assigneeMenuOpen, setAssigneeMenuOpen] = useState(false);
  const assigneeAnchorRef = useRef<HTMLButtonElement>(null);
  const assigneePanelRef = useRef<HTMLDivElement>(null);
  useDismiss(assigneeMenuOpen, () => setAssigneeMenuOpen(false), assigneeAnchorRef, assigneePanelRef);

  const [manageMenuOpen, setManageMenuOpen] = useState(false);
  const manageAnchorRef = useRef<HTMLButtonElement>(null);
  const managePanelRef = useRef<HTMLDivElement>(null);
  useDismiss(manageMenuOpen, () => setManageMenuOpen(false), manageAnchorRef, managePanelRef);

  const [viewMenuOpen, setViewMenuOpen] = useState(false);
  const viewAnchorRef = useRef<HTMLButtonElement>(null);
  const viewPanelRef = useRef<HTMLDivElement>(null);
  useDismiss(viewMenuOpen, () => setViewMenuOpen(false), viewAnchorRef, viewPanelRef);

  // Teammate & Due Date Filter Dropdowns
  const [teammateMenuOpen, setTeammateMenuOpen] = useState(false);
  const [teammateSearch, setTeammateSearch] = useState("");
  const teammateAnchorRef = useRef<HTMLButtonElement>(null);
  const teammatePanelRef = useRef<HTMLDivElement>(null);
  useDismiss(teammateMenuOpen, () => setTeammateMenuOpen(false), teammateAnchorRef, teammatePanelRef);

  const [dueMenuOpen, setDueMenuOpen] = useState(false);
  const dueAnchorRef = useRef<HTMLButtonElement>(null);
  const duePanelRef = useRef<HTMLDivElement>(null);
  useDismiss(dueMenuOpen, () => setDueMenuOpen(false), dueAnchorRef, duePanelRef);

  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const statusAnchorRef = useRef<HTMLButtonElement>(null);
  const statusPanelRef = useRef<HTMLDivElement>(null);
  useDismiss(statusMenuOpen, () => setStatusMenuOpen(false), statusAnchorRef, statusPanelRef);

  const [spaceSelectOpen, setSpaceSelectOpen] = useState(false);
  const spaceSelectAnchorRef = useRef<HTMLButtonElement>(null);
  const spaceSelectPanelRef = useRef<HTMLDivElement>(null);
  useDismiss(spaceSelectOpen, () => setSpaceSelectOpen(false), spaceSelectAnchorRef, spaceSelectPanelRef);

  // Modals & Drawers
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [channelDrawerOpen, setChannelDrawerOpen] = useState(false);
  const [channelMessage, setChannelMessage] = useState("");
  const [channelMessages, setChannelMessages] = useState<Array<{ id: string; user: string; text: string; time: string }>>([
    { id: "cm_1", user: "Abdul Rehman", text: "Updating performance test checklist for morning Obeya review.", time: "10:15 AM" },
    { id: "cm_2", user: "Talha Ahmad", text: "ERP API synchronization is active.", time: "11:30 AM" },
    { id: "cm_3", user: "Khushi Admin", text: "Great progress team, please keep subtask statuses updated.", time: "12:00 PM" },
  ]);
  const [oversightDrawerOpen, setOversightDrawerOpen] = useState(false);

  const [spaces, setSpaces] = useState<Array<{ id: string; name: string; color: string; projectIds?: string[] }>>([
    { id: "s_performance", name: "Performance", color: "bg-amber-600", projectIds: ["p_performance"] },
    { id: "s_creative", name: "Creative", color: "bg-rose-600", projectIds: ["p_creative"] },
    { id: "s_erp_web", name: "ERP/Web", color: "bg-cyan-600", projectIds: ["p_erp_web"] },
    { id: "s_data_upload", name: "Data-Upload", color: "bg-yellow-600", projectIds: ["p_data_upload"] },
    { id: "s_hr_admin", name: "HR/Admin", color: "bg-emerald-600", projectIds: ["p_hr_admin"] },
    { id: "s_projects", name: "Projects", color: "bg-violet-600", projectIds: ["p_projects"] },
  ]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("klickup_user_spaces_v3");
      if (saved) setSpaces(JSON.parse(saved));
    } catch {}
  }, []);

  // Calendar view cursor
  const [calCursor, setCalCursor] = useState(() => new Date());
  const [calSelected, setCalSelected] = useState(() => toISODate(new Date()));

  // Active Project or List meta
  const activeProjectId = searchParams.get("project") ?? projectFilter;
  const currentProject = projects.find((p) => p.id === activeProjectId) ?? projects[0];
  const currentSpace = spaces.find((s) => s.id === spaceFilter) ?? spaces.find((s) => s.projectIds?.includes(activeProjectId)) ?? spaces[1];

  // Manual cloud sync trigger
  async function handleManualSync() {
    await syncNow();
    toast.success("Workspace synchronized", "Latest changes loaded from live server");
  }

  // Filter tasks
  const filtered = useMemo(() => {
    return tasks
      .filter((task) => {
        if (!leads && task.assigneeId !== currentUser.id) return false;
        if (!showClosed && task.status === "done") return false;
        if (query && !task.title.toLowerCase().includes(query.trim().toLowerCase())) return false;
        if (status !== "all" && task.status !== status) return false;
        if (assignee !== "all") {
          if (assignee === "me" && task.assigneeId !== currentUser.id) return false;
          if (assignee !== "me" && task.assigneeId !== assignee) return false;
        }
        if (spaceFilter !== "all") {
          const sp = spaces.find((s) => s.id === spaceFilter);
          const spProjectIds = sp?.projectIds || [];
          const matched = spProjectIds.includes(task.projectId) || projects.find((p) => p.id === task.projectId)?.spaceId === spaceFilter;
          if (!matched) return false;
        }
        if (activeProjectId !== "all" && task.projectId !== activeProjectId) return false;
        const tone = dueTone(task.dueDate, task.status);
        if (dueFilter === "today" && tone !== "today") return false;
        if (dueFilter === "overdue" && tone !== "overdue") return false;
        return true;
      })
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [activeProjectId, assignee, currentUser.id, dueFilter, leads, projects, query, showClosed, spaceFilter, spaces, status, tasks]);

  // Group tasks
  const groups = useMemo<TaskGroup[]>(() => {
    if (groupBy === "none") {
      return [{ id: "all", label: "All Tasks", color: "#6d28d9", tasks: filtered }];
    }
    if (groupBy === "status") {
      return STATUS_OPTIONS.map((opt) => ({
        id: opt.value,
        label: opt.label,
        color: statusMeta[opt.value].color,
        tasks: filtered.filter((t) => t.status === opt.value),
        status: opt.value,
      }));
    }
    if (groupBy === "priority") {
      return PRIORITY_OPTIONS.map((opt) => ({
        id: opt.value,
        label: `${opt.label} Priority`,
        color: priorityMeta[opt.value].color,
        tasks: filtered.filter((t) => t.priority === opt.value),
      }));
    }
    if (groupBy === "assignee") {
      const userGroups = users.map((u) => ({
        id: u.id,
        label: u.name,
        color: u.color,
        tasks: filtered.filter((t) => t.assigneeId === u.id),
      }));
      const unassigned = filtered.filter((t) => !users.some((u) => u.id === t.assigneeId));
      if (unassigned.length > 0) {
        userGroups.push({
          id: "unassigned",
          label: "Unassigned",
          color: "#94a3b8",
          tasks: unassigned,
        });
      }
      return userGroups.filter((group) => leads || group.tasks.length > 0);
    }
    if (groupBy === "project") {
      return projects.map((p) => ({
        id: p.id,
        label: p.name,
        color: p.color,
        tasks: filtered.filter((t) => t.projectId === p.id),
        projectId: p.id,
      }));
    }
    return [{ id: "all", label: "Tasks", color: "#6d28d9", tasks: filtered }];
  }, [filtered, groupBy, leads, projects, users]);

  function toggleGroupCollapse(groupId: string) {
    setCollapsedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  }

  function handleSelectTask(id: string, checked: boolean) {
    setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((item) => item !== id)));
  }

  function selectAllInGroup(groupTasks: Task[], checked: boolean) {
    const ids = groupTasks.map((t) => t.id);
    setSelectedIds((prev) => {
      if (checked) {
        return Array.from(new Set([...prev, ...ids]));
      }
      return prev.filter((id) => !ids.includes(id));
    });
  }

  function closeComposer() {
    setComposerOpen(false);
    if (searchParams.get("compose")) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("compose");
      const next = params.toString();
      router.replace(next ? `/tasks?${next}` : "/tasks");
    }
  }

  function handleTaskCreated(task: Task) {
    setQuery("");
    setStatus("all");
    setDueFilter("all");
    setSpaceFilter("all");
    setAssignee("all");
    setShowClosed(true);
    setCollapsedGroups((current) => ({ ...current, [task.status]: false }));
    const params = new URLSearchParams(searchParams.toString());
    params.delete("compose");
    params.delete("due");
    params.delete("status");
    params.delete("assignee");
    if (activeProjectId !== "all" && activeProjectId !== task.projectId) {
      params.set("project", task.projectId);
      setProjectFilter(task.projectId);
    }
    const next = params.toString();
    router.replace(next ? `/tasks?${next}` : "/tasks");
  }

  // Workload summary across employees for Super Admin
  const employeeWorkloads = useMemo(() => {
    return users.map((u) => {
      const userTasks = tasks.filter((t) => t.assigneeId === u.id);
      const done = userTasks.filter((t) => t.status === "done").length;
      const inProgress = userTasks.filter((t) => t.status === "in_progress").length;
      const todo = userTasks.filter((t) => t.status === "todo").length;
      return {
        user: u,
        total: userTasks.length,
        done,
        inProgress,
        todo,
      };
    });
  }, [tasks, users]);

  // Calendar calculations
  const calCells = useMemo(() => {
    const year = calCursor.getFullYear();
    const month = calCursor.getMonth();
    const first = new Date(year, month, 1);
    const pad = (first.getDay() + 6) % 7;
    const days = new Date(year, month + 1, 0).getDate();
    const result: Array<Date | null> = Array.from({ length: pad }, () => null);
    for (let day = 1; day <= days; day += 1) result.push(new Date(year, month, day));
    while (result.length % 7 !== 0) result.push(null);
    return result;
  }, [calCursor]);

  return (
    <div className="space-y-3 pb-12 font-sans">
      {/* 1. ClickUp Breadcrumb & Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-2">
        <div className="flex items-center gap-2">
          {/* Space Selector Button */}
          {leads && (
          <div className="relative inline-block">
            <button
              ref={spaceAnchorRef}
              type="button"
              onClick={() => setSpaceMenuOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded px-1.5 py-1 text-sm font-medium text-foreground/80 hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              title="Switch Space / Department"
            >
              <span className="grid h-5 w-5 place-items-center rounded bg-amber-500 text-[11px] font-bold text-white shadow-2xs">
                {currentSpace?.name?.[0] || "P"}
              </span>
              <span>{spaceFilter === "all" ? (currentSpace?.name ?? "Performance Department") : currentSpace?.name}</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </button>

            {/* Space Dropdown Panel */}
            {spaceMenuOpen && (
              <div
                ref={spacePanelRef}
                className="absolute left-0 top-full mt-1.5 z-50 w-56 rounded-lg border border-border bg-popover p-1 text-xs shadow-lg animate-in fade-in zoom-in-95"
              >
                <p className="px-2 py-1 font-semibold text-[11px] uppercase tracking-wide text-muted-foreground">
                  Switch Space
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSpaceFilter("all");
                    setSpaceMenuOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left font-medium hover:bg-muted",
                    spaceFilter === "all" && "text-purple-600 font-semibold",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span className="grid h-4 w-4 place-items-center rounded bg-purple-600 text-[10px] font-bold text-white">
                      A
                    </span>
                    <span>All Spaces</span>
                  </span>
                  {spaceFilter === "all" && <Check className="h-3.5 w-3.5" />}
                </button>
                {spaces.map((sp) => (
                  <button
                    key={sp.id}
                    type="button"
                    onClick={() => {
                      setSpaceFilter(sp.id);
                      setSpaceMenuOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left font-medium hover:bg-muted",
                      spaceFilter === sp.id && "text-purple-600 font-semibold",
                    )}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span className="grid h-4 w-4 place-items-center rounded bg-amber-500 text-[10px] font-bold text-white">
                        {sp.name[0]}
                      </span>
                      <span className="truncate">{sp.name}</span>
                    </span>
                    {spaceFilter === sp.id && <Check className="h-3.5 w-3.5" />}
                  </button>
                ))}
              </div>
            )}
          </div>
          )}

          {leads && <span className="text-muted-foreground/50">/</span>}

          {/* Project / List Selector Button */}
          <div className="relative inline-block">
            <button
              ref={projectAnchorRef}
              type="button"
              onClick={() => setProjectMenuOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded px-2 py-1 font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Switch List / Project"
            >
              <svg className="h-4 w-4 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="m9 11 3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
              <span className="text-base tracking-tight">
                {!leads && activeProjectId === "all"
                  ? "My tasks"
                  : activeProjectId !== "all" && currentProject
                    ? currentProject.name
                    : "All Tasks"}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>

            {/* Project / List Dropdown Panel */}
            {projectMenuOpen && (
              <div
                ref={projectPanelRef}
                className="absolute left-0 top-full mt-1.5 z-50 w-72 rounded-lg border border-border bg-popover p-2 text-xs shadow-xl animate-in fade-in zoom-in-95"
              >
                <div className="mb-2 relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={projectSearch}
                    onChange={(e) => setProjectSearch(e.target.value)}
                    placeholder="Search projects & lists..."
                    className="w-full rounded-md border border-border bg-input pl-8 pr-2 py-1 text-xs"
                    autoFocus
                  />
                </div>

                <div className="max-h-60 overflow-y-auto space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setProjectFilter("all");
                      router.push("/tasks?project=all");
                      setProjectMenuOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left font-medium hover:bg-muted",
                      activeProjectId === "all" && "text-purple-600 font-semibold",
                    )}
                  >
                    <span>All Tasks in Space</span>
                    {activeProjectId === "all" && <Check className="h-3.5 w-3.5" />}
                  </button>

                  <div className="border-t border-border/50 my-1" />

                  {projects
                    .filter((p) => !projectSearch || p.name.toLowerCase().includes(projectSearch.toLowerCase()))
                    .map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setProjectFilter(p.id);
                          router.push(`/tasks?project=${p.id}`);
                          setProjectMenuOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left font-medium hover:bg-muted",
                          activeProjectId === p.id && "text-purple-600 font-semibold",
                        )}
                      >
                        <span className="flex items-center gap-2 truncate">
                          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                          <span className="truncate">{p.name}</span>
                        </span>
                        {activeProjectId === p.id && <Check className="h-3.5 w-3.5 shrink-0" />}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Star Favorite icon */}
          <button
            type="button"
            onClick={() => {
              setStarred(!starred);
              toast.info(starred ? "Removed from favorites" : "Starred list");
            }}
            aria-label="Star this list"
            className="ml-1 text-muted-foreground hover:text-amber-500 transition-colors cursor-pointer"
          >
            <Star className={cn("h-4 w-4", starred && "fill-amber-400 text-amber-500")} />
          </button>
        </div>

        {/* Top Right Actions (Share, Manage, Task, Cloud Sync) */}
        <div className="flex items-center gap-2">
          <TodayCardButton user={currentUser} tasks={tasks} projects={projects} />

          {leads && (
          <button
            type="button"
            onClick={() => setShareModalOpen(true)}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>Share</span>
          </button>
          )}

          {/* Manage Button with Dropdown */}
          <div className="relative inline-block">
            <button
              ref={manageAnchorRef}
              type="button"
              onClick={() => setManageMenuOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Manage</span>
            </button>

            {manageMenuOpen && (
              <div
                ref={managePanelRef}
                className="absolute right-0 top-full mt-1.5 z-50 w-52 rounded-lg border border-border bg-popover p-1 text-xs shadow-lg animate-in fade-in zoom-in-95"
              >
                <button
                  type="button"
                  onClick={() => {
                    setManageMenuOpen(false);
                    setColumnsMenuOpen(true);
                  }}
                  className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left hover:bg-muted text-foreground"
                >
                  <Columns3 className="h-3.5 w-3.5 text-purple-600" />
                  <span>Customize Columns</span>
                </button>
                {leads && (
                <button
                  type="button"
                  onClick={() => {
                    setManageMenuOpen(false);
                    setOversightDrawerOpen(true);
                  }}
                  className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left hover:bg-muted text-foreground"
                >
                  <Shield className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Team Oversight & Logs</span>
                </button>
                )}
                <div className="border-t border-border/50 my-1" />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success("Link copied to clipboard");
                    setManageMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left hover:bg-muted text-foreground"
                >
                  <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Copy List URL</span>
                </button>
              </div>
            )}
          </div>

          {/* ClickUp Black '+ Task' Button */}
          <button
            type="button"
            onClick={() => setComposerOpen(true)}
            className="flex items-center gap-1.5 rounded-md bg-[#1f242f] dark:bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-black transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 stroke-[3]" />
            <span>Task</span>
          </button>
        </div>
      </div>

      {/* 2. Super Admin Real-Time Team Oversight Card (Always visible to Super Admin / Admin) */}
      {isSuperAdmin && (
        <div className="rounded-xl border border-purple-500/20 bg-gradient-to-r from-purple-500/5 via-primary/5 to-transparent p-3 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-wide text-foreground">
                Super Admin Team Oversight
              </span>
              <span className="text-[11px] text-muted-foreground">
                • {tasks.length} total tasks • {users.length} teammates • Multi-device live
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setOversightDrawerOpen(true)}
                className="flex items-center gap-1 rounded bg-purple-600/10 px-2 py-0.5 text-[11px] font-semibold text-purple-700 dark:text-purple-300 hover:bg-purple-600/20 transition-colors cursor-pointer"
              >
                <Activity className="h-3 w-3 text-purple-600" />
                <span>Live Activity Stream ({feed.length})</span>
              </button>
            </div>
          </div>

          {/* Dropdown Filters Toolbar */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-purple-500/10">
            {/* 1. Inspect Teammate Dropdown */}
            <div className="relative inline-block">
              <button
                ref={teammateAnchorRef}
                type="button"
                onClick={() => setTeammateMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted shadow-2xs transition-colors cursor-pointer"
              >
                {assignee !== "all" ? (
                  <>
                    <Avatar name={users.find((u) => u.id === assignee)?.name || "Teammate"} color={users.find((u) => u.id === assignee)?.color} size="xs" />
                    <span className="truncate max-w-[150px]">{users.find((u) => u.id === assignee)?.name || "Teammate"}</span>
                    <span className="rounded-full bg-purple-600/15 px-1.5 py-0.2 text-[10px] font-bold text-purple-700 dark:text-purple-300">
                      {tasks.filter((t) => t.assigneeId === assignee).length}
                    </span>
                  </>
                ) : (
                  <>
                    <Users className="h-3.5 w-3.5 text-purple-600" />
                    <span>Inspect Teammate ({users.length})</span>
                  </>
                )}
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-0.5" />
              </button>

              {teammateMenuOpen && (
                <div
                  ref={teammatePanelRef}
                  className="absolute left-0 top-full mt-1.5 z-50 w-72 rounded-xl border border-border bg-popover p-1.5 text-xs shadow-xl animate-in fade-in zoom-in-95 max-h-80 overflow-y-auto"
                >
                  <div className="mb-1.5 px-1">
                    <input
                      type="text"
                      placeholder="Search teammates..."
                      value={teammateSearch}
                      onChange={(e) => setTeammateSearch(e.target.value)}
                      className="w-full rounded-md border border-border bg-muted/40 px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      autoFocus
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setAssignee("all");
                      setTeammateMenuOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left transition-colors cursor-pointer",
                      assignee === "all" ? "bg-purple-600/15 text-purple-700 dark:text-purple-300 font-bold" : "hover:bg-muted text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600/20 text-purple-600 font-bold text-[10px]">
                        ★
                      </div>
                      <span>All Teammates</span>
                    </div>
                    <span className="text-[11px] tabular-nums text-muted-foreground">
                      {tasks.length} tasks
                    </span>
                  </button>

                  <div className="border-t border-border/50 my-1" />

                  {employeeWorkloads
                    .filter(({ user: u }) => !teammateSearch || u.name.toLowerCase().includes(teammateSearch.toLowerCase()) || (u.department && u.department.toLowerCase().includes(teammateSearch.toLowerCase())))
                    .map(({ user: u, total, inProgress, done }) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          setAssignee(u.id);
                          setTeammateMenuOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left transition-colors cursor-pointer",
                          assignee === u.id ? "bg-purple-600/15 text-purple-700 dark:text-purple-300 font-bold" : "hover:bg-muted text-foreground"
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar name={u.name} color={u.color} size="xs" />
                          <div className="min-w-0 truncate">
                            <p className="truncate text-xs font-medium">{u.name}</p>
                            <p className="truncate text-[10px] text-muted-foreground">{u.department || u.role}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 text-[11px]">
                          <span className="tabular-nums font-bold text-foreground">{total}</span>
                          {inProgress > 0 && (
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" title={`${inProgress} in progress`} />
                          )}
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </div>

            {/* 2. Due Date Filter Dropdown */}
            <div className="relative inline-block">
              <button
                ref={dueAnchorRef}
                type="button"
                onClick={() => setDueMenuOpen((v) => !v)}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-2xs transition-colors cursor-pointer",
                  dueFilter !== "all"
                    ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                    : "border-border bg-card text-foreground hover:bg-muted"
                )}
              >
                <CalendarDays className="h-3.5 w-3.5 text-amber-600" />
                <span>
                  {dueFilter === "today"
                    ? "Due: Today"
                    : dueFilter === "overdue"
                    ? "Due: Overdue"
                    : dueFilter === "week"
                    ? "Due: This Week"
                    : "Due Date: All"}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-0.5" />
              </button>

              {dueMenuOpen && (
                <div
                  ref={duePanelRef}
                  className="absolute left-0 top-full mt-1.5 z-50 w-48 rounded-xl border border-border bg-popover p-1 text-xs shadow-xl animate-in fade-in zoom-in-95"
                >
                  {[
                    { key: "all", label: "All Due Dates" },
                    { key: "today", label: "Due Today", count: tasks.filter((t) => dueTone(t.dueDate, t.status) === "today").length },
                    { key: "overdue", label: "Overdue", count: tasks.filter((t) => dueTone(t.dueDate, t.status) === "overdue").length },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => {
                        setDueFilter(item.key);
                        setDueMenuOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left transition-colors cursor-pointer",
                        dueFilter === item.key ? "bg-primary/10 text-primary font-bold" : "hover:bg-muted text-foreground"
                      )}
                    >
                      <span>{item.label}</span>
                      {item.count !== undefined && (
                        <span className="rounded-full bg-muted px-1.5 py-0.2 text-[10px] font-bold text-muted-foreground">
                          {item.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Space Filter Dropdown */}
            <div className="relative inline-block">
              <button
                ref={spaceSelectAnchorRef}
                type="button"
                onClick={() => setSpaceSelectOpen((v) => !v)}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-2xs transition-colors cursor-pointer",
                  spaceFilter !== "all"
                    ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300"
                    : "border-border bg-card text-foreground hover:bg-muted"
                )}
              >
                <Layers className="h-3.5 w-3.5 text-cyan-600" />
                <span>
                  {spaceFilter === "all" ? "Space: All" : spaces.find((s) => s.id === spaceFilter)?.name || "Space"}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-0.5" />
              </button>

              {spaceSelectOpen && (
                <div
                  ref={spaceSelectPanelRef}
                  className="absolute left-0 top-full mt-1.5 z-50 w-52 rounded-xl border border-border bg-popover p-1 text-xs shadow-xl animate-in fade-in zoom-in-95 max-h-60 overflow-y-auto"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setSpaceFilter("all");
                      setSpaceSelectOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left transition-colors cursor-pointer",
                      spaceFilter === "all" ? "bg-primary/10 text-primary font-bold" : "hover:bg-muted text-foreground"
                    )}
                  >
                    <span>All Spaces</span>
                  </button>
                  <div className="border-t border-border/50 my-1" />
                  {spaces.map((sp) => (
                    <button
                      key={sp.id}
                      type="button"
                      onClick={() => {
                        setSpaceFilter(sp.id);
                        setSpaceSelectOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition-colors cursor-pointer",
                        spaceFilter === sp.id ? "bg-primary/10 text-primary font-bold" : "hover:bg-muted text-foreground"
                      )}
                    >
                      <span className={cn("h-2 w-2 rounded-full", sp.color)} />
                      <span>{sp.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Status Filter Dropdown */}
            <div className="relative inline-block">
              <button
                ref={statusAnchorRef}
                type="button"
                onClick={() => setStatusMenuOpen((v) => !v)}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-2xs transition-colors cursor-pointer",
                  status !== "all"
                    ? "border-purple-500/40 bg-purple-500/10 text-purple-700 dark:text-purple-300"
                    : "border-border bg-card text-foreground hover:bg-muted"
                )}
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-purple-600" />
                <span>
                  {status === "all" ? "Status: All" : statusMeta[status as TaskStatus]?.label || status}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-0.5" />
              </button>

              {statusMenuOpen && (
                <div
                  ref={statusPanelRef}
                  className="absolute left-0 top-full mt-1.5 z-50 w-44 rounded-xl border border-border bg-popover p-1 text-xs shadow-xl animate-in fade-in zoom-in-95"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setStatus("all");
                      setStatusMenuOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left transition-colors cursor-pointer",
                      status === "all" ? "bg-primary/10 text-primary font-bold" : "hover:bg-muted text-foreground"
                    )}
                  >
                    <span>All Statuses</span>
                  </button>
                  <div className="border-t border-border/50 my-1" />
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setStatus(opt.value);
                        setStatusMenuOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors cursor-pointer",
                        status === opt.value ? "bg-primary/10 text-primary font-bold" : "hover:bg-muted text-foreground"
                      )}
                    >
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: statusMeta[opt.value].color }} />
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 5. Clear All Filters Button */}
            {(assignee !== "all" || dueFilter !== "all" || spaceFilter !== "all" || status !== "all" || projectFilter !== "all" || query) && (
              <button
                type="button"
                onClick={() => {
                  setAssignee("all");
                  setDueFilter("all");
                  setSpaceFilter("all");
                  setStatus("all");
                  setProjectFilter("all");
                  setQuery("");
                  router.push("/tasks");
                }}
                className="flex items-center gap-1 rounded-lg border border-dashed border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
              >
                <X className="h-3 w-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. ClickUp View Switcher Tabs (Channel, Board, List, Calendar, Table, + View) */}
      <div className="flex items-center border-b border-border/50 text-xs font-medium">
        {/* Channel Tab */}
        <button
          type="button"
          onClick={() => setChannelDrawerOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <Hash className="h-3.5 w-3.5 text-purple-600" />
          <span>Channel</span>
          <span className="rounded bg-purple-100 dark:bg-purple-950 px-1 text-[10px] text-purple-700 dark:text-purple-300 font-bold">
            {channelMessages.length}
          </span>
        </button>

        {/* Board Tab */}
        <button
          type="button"
          onClick={() => setView("board")}
          className={cn(
            "flex items-center gap-1.5 border-b-2 px-3 py-2 transition-colors cursor-pointer",
            view === "board"
              ? "border-purple-600 text-purple-700 dark:text-purple-400 font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          <span>Board</span>
        </button>

        {/* List Tab */}
        <button
          type="button"
          onClick={() => setView("list")}
          className={cn(
            "flex items-center gap-1.5 border-b-2 px-3 py-2 transition-colors cursor-pointer",
            view === "list"
              ? "border-purple-600 text-purple-700 dark:text-purple-400 font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <AlignLeft className="h-3.5 w-3.5" />
          <span>List</span>
        </button>

        {/* Calendar Tab */}
        <button
          type="button"
          onClick={() => setView("calendar")}
          className={cn(
            "flex items-center gap-1.5 border-b-2 px-3 py-2 transition-colors cursor-pointer",
            view === "calendar"
              ? "border-purple-600 text-purple-700 dark:text-purple-400 font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <CalendarDays className="h-3.5 w-3.5" />
          <span>Calendar</span>
        </button>

        {/* Table Tab */}
        <button
          type="button"
          onClick={() => setView("table")}
          className={cn(
            "flex items-center gap-1.5 border-b-2 px-3 py-2 transition-colors cursor-pointer",
            view === "table"
              ? "border-purple-600 text-purple-700 dark:text-purple-400 font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <Table2 className="h-3.5 w-3.5" />
          <span>Table</span>
        </button>

        {/* + View Dropdown */}
        <div className="relative inline-block">
          <button
            ref={viewAnchorRef}
            type="button"
            onClick={() => setViewMenuOpen((v) => !v)}
            className="flex items-center gap-1 px-3 py-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>View</span>
          </button>

          {viewMenuOpen && (
            <div
              ref={viewPanelRef}
              className="absolute left-0 top-full mt-1 z-50 w-44 rounded-lg border border-border bg-popover p-1 text-xs shadow-lg animate-in fade-in zoom-in-95"
            >
              <button
                type="button"
                onClick={() => {
                  setView("list");
                  setViewMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 hover:bg-muted text-foreground"
              >
                <AlignLeft className="h-3.5 w-3.5 text-purple-600" />
                <span>List View</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setView("board");
                  setViewMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 hover:bg-muted text-foreground"
              >
                <LayoutGrid className="h-3.5 w-3.5 text-purple-600" />
                <span>Kanban Board</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setView("calendar");
                  setViewMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 hover:bg-muted text-foreground"
              >
                <CalendarDays className="h-3.5 w-3.5 text-purple-600" />
                <span>Calendar View</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setView("table");
                  setViewMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 hover:bg-muted text-foreground"
              >
                <Table2 className="h-3.5 w-3.5 text-purple-600" />
                <span>Table View</span>
              </button>
              {leads && (
              <button
                type="button"
                onClick={() => {
                  setOversightDrawerOpen(true);
                  setViewMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 hover:bg-muted text-foreground"
              >
                <Activity className="h-3.5 w-3.5 text-emerald-600" />
                <span>Live Activity Stream</span>
              </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 4. Secondary Filter & Grouping Pills Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
        {/* Left Pills (Group, Subtasks) */}
        <div className="flex items-center gap-2">
          {/* Group: Status pill with interactive dropdown */}
          <div className="relative inline-block">
            <button
              ref={groupAnchorRef}
              type="button"
              onClick={() => setGroupMenuOpen((v) => !v)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 font-medium text-foreground/80 hover:bg-muted/60 transition-colors shadow-2xs cursor-pointer",
                focusRing,
              )}
            >
              <Layers className="h-3.5 w-3.5 text-purple-600" />
              <span>
                Group: {groupBy === "status" ? "Status" : groupBy === "priority" ? "Priority" : groupBy === "assignee" ? "Assignee" : groupBy === "project" ? "Project" : "None"}
              </span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </button>

            {groupMenuOpen && (
              <div
                ref={groupPanelRef}
                className="absolute left-0 top-full mt-1.5 z-50 w-44 rounded-lg border border-border bg-popover p-1 text-xs shadow-lg animate-in fade-in zoom-in-95"
              >
                <p className="px-2 py-1 font-semibold text-[11px] uppercase tracking-wide text-muted-foreground">
                  Group by
                </p>
                {[
                  { id: "status", label: "Status" },
                  { id: "priority", label: "Priority" },
                  { id: "assignee", label: "Assignee" },
                  { id: "project", label: "Project" },
                  { id: "none", label: "None" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setGroupBy(opt.id as GroupByType);
                      setGroupMenuOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left font-medium hover:bg-muted cursor-pointer",
                      groupBy === opt.id && "text-purple-600 font-semibold",
                    )}
                  >
                    <span>{opt.label}</span>
                    {groupBy === opt.id && <Check className="h-3.5 w-3.5" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Subtasks dropdown & toggle */}
          <div className="relative inline-block">
            <button
              ref={subtasksAnchorRef}
              type="button"
              onClick={() => setSubtasksMenuOpen((v) => !v)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-medium transition-colors shadow-2xs cursor-pointer",
                showSubtasks
                  ? "border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 font-semibold"
                  : "border-border bg-card text-foreground/80 hover:bg-muted/60",
              )}
            >
              <GitBranch className={cn("h-3.5 w-3.5", showSubtasks ? "text-purple-600 dark:text-purple-400" : "text-muted-foreground")} />
              <span>Subtasks: {showSubtasks ? "Shown" : "Hidden"}</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </button>

            {subtasksMenuOpen && (
              <div
                ref={subtasksPanelRef}
                className="absolute left-0 top-full mt-1.5 z-50 w-52 rounded-lg border border-border bg-popover p-1 text-xs shadow-lg animate-in fade-in zoom-in-95"
              >
                <p className="px-2 py-1 font-semibold text-[11px] uppercase tracking-wide text-muted-foreground">
                  Subtask Display
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowSubtasks(true);
                    setSubtasksMenuOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded px-2 py-1.5 text-left hover:bg-muted cursor-pointer",
                    showSubtasks && "text-purple-600 font-semibold",
                  )}
                >
                  <span>Show expanded under tasks</span>
                  {showSubtasks && <Check className="h-3.5 w-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSubtasks(false);
                    setSubtasksMenuOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded px-2 py-1.5 text-left hover:bg-muted cursor-pointer",
                    !showSubtasks && "text-purple-600 font-semibold",
                  )}
                >
                  <span>Hide subtasks in list</span>
                  {!showSubtasks && <Check className="h-3.5 w-3.5" />}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Pills (Columns, Filter, Closed, Assignee) */}
        <div className="flex items-center gap-2">
          {/* Columns pill with interactive toggle menu */}
          <div className="relative inline-block">
            <button
              ref={columnsAnchorRef}
              type="button"
              onClick={() => setColumnsMenuOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 font-medium text-foreground/80 hover:bg-muted/60 transition-colors shadow-2xs cursor-pointer"
            >
              <Columns3 className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Columns</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </button>

            {columnsMenuOpen && (
              <div
                ref={columnsPanelRef}
                className="absolute right-0 top-full mt-1.5 z-50 w-52 rounded-lg border border-border bg-popover p-2 text-xs shadow-xl animate-in fade-in zoom-in-95"
              >
                <p className="font-semibold text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5">
                  Toggle Columns
                </p>
                <div className="space-y-1">
                  {[
                    { key: "assignee", label: "Assignee" },
                    { key: "dueDate", label: "Due Date" },
                    { key: "priority", label: "Priority" },
                  ].map(({ key, label }) => {
                    const k = key as keyof VisibleColumns;
                    const isChecked = !!visibleColumns[k];
                    return (
                      <label
                        key={key}
                        className="flex items-center justify-between rounded px-2 py-1 hover:bg-muted cursor-pointer select-none"
                      >
                        <span className="font-medium text-foreground">{label}</span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) =>
                            setVisibleColumns((prev) => ({ ...prev, [k]: e.target.checked }))
                          }
                          className="h-3.5 w-3.5 rounded border-border text-purple-600 cursor-pointer"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Filter pill with interactive popover */}
          <div className="relative inline-block">
            <button
              ref={filterAnchorRef}
              type="button"
              onClick={() => setFilterMenuOpen((v) => !v)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 font-medium text-foreground/80 hover:bg-muted/60 transition-colors shadow-2xs cursor-pointer",
                (query || dueFilter !== "all" || projectFilter !== "all" || spaceFilter !== "all" || status !== "all" || assignee !== "all") &&
                  "border-purple-500 text-purple-600 font-semibold",
                focusRing,
              )}
            >
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Filter</span>
              {(query || dueFilter !== "all" || projectFilter !== "all" || spaceFilter !== "all" || status !== "all" || assignee !== "all") && (
                <span className="grid h-4 w-4 place-items-center rounded-full bg-purple-600 text-[10px] font-bold text-white">
                  !
                </span>
              )}
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </button>

            {filterMenuOpen && (
              <div
                ref={filterPanelRef}
                className="absolute right-0 top-full mt-1.5 z-50 w-72 rounded-lg border border-border bg-popover p-3 text-xs shadow-xl animate-in fade-in zoom-in-95 space-y-3"
              >
                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                  <span className="font-semibold text-foreground">Filter Tasks</span>
                  {(query || dueFilter !== "all" || projectFilter !== "all" || spaceFilter !== "all" || status !== "all" || assignee !== "all") && (
                    <button
                      type="button"
                      onClick={() => {
                        setQuery("");
                        setDueFilter("all");
                        setProjectFilter("all");
                        setSpaceFilter("all");
                        setStatus("all");
                        setAssignee("all");
                      }}
                      className="text-primary hover:underline text-[11px] font-medium cursor-pointer"
                    >
                      Reset all
                    </button>
                  )}
                </div>

                {/* Search */}
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Search Title</label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Type to filter..."
                      className="w-full rounded-md border border-border bg-input pl-8 pr-2 py-1 text-xs"
                    />
                  </div>
                </div>

                {/* Space / Department Filter */}
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Space / Department</label>
                  <select
                    value={spaceFilter}
                    onChange={(e) => setSpaceFilter(e.target.value)}
                    className="w-full rounded-md border border-border bg-input px-2 py-1 text-xs cursor-pointer"
                  >
                    <option value="all">All Spaces</option>
                    {spaces.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Project Filter */}
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Project</label>
                  <select
                    value={projectFilter}
                    onChange={(e) => setProjectFilter(e.target.value)}
                    className="w-full rounded-md border border-border bg-input px-2 py-1 text-xs cursor-pointer"
                  >
                    <option value="all">All Projects</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {leads && (
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Assignee</label>
                  <select
                    value={assignee}
                    onChange={(e) => setAssignee(e.target.value)}
                    className="w-full rounded-md border border-border bg-input px-2 py-1 text-xs cursor-pointer"
                  >
                    <option value="all">All Teammates</option>
                    <option value="me">Assigned to me</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
                )}

                {/* Due Date Filter */}
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Due Date</label>
                  <select
                    value={dueFilter}
                    onChange={(e) => setDueFilter(e.target.value)}
                    className="w-full rounded-md border border-border bg-input px-2 py-1 text-xs cursor-pointer"
                  >
                    <option value="all">All Dates</option>
                    <option value="today">Due Today</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded-md border border-border bg-input px-2 py-1 text-xs cursor-pointer"
                  >
                    <option value="all">All Statuses</option>
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Closed Tasks Toggle Pill */}
          <button
            type="button"
            onClick={() => {
              setShowClosed((v) => !v);
              toast.info(!showClosed ? "Showing closed tasks" : "Hidden closed tasks");
            }}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-medium transition-colors shadow-2xs cursor-pointer",
              showClosed
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-semibold"
                : "border-border bg-card text-muted-foreground hover:bg-muted/60",
            )}
            title={showClosed ? "Click to hide closed tasks" : "Click to show closed tasks"}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Closed: {showClosed ? "Shown" : "Hidden"}</span>
          </button>

          {leads && (
          <div className="relative inline-block">
            <button
              ref={assigneeAnchorRef}
              type="button"
              onClick={() => setAssigneeMenuOpen((v) => !v)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 font-medium text-foreground/80 hover:bg-muted/60 transition-colors shadow-2xs cursor-pointer",
                assignee !== "all" && "border-purple-500 text-purple-600 font-semibold",
                focusRing,
              )}
            >
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <span>
                {assignee === "all" ? "Assignee" : assignee === "me" ? "Me" : users.find((u) => u.id === assignee)?.name ?? "Assignee"}
              </span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </button>

            {assigneeMenuOpen && (
              <div
                ref={assigneePanelRef}
                className="absolute right-0 top-full mt-1.5 z-50 w-56 rounded-lg border border-border bg-popover p-1 text-xs shadow-xl animate-in fade-in zoom-in-95"
              >
                <p className="px-2 py-1 font-semibold text-[11px] uppercase tracking-wide text-muted-foreground">
                  Filter by Assignee
                </p>
                <div className="max-h-60 overflow-y-auto space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setAssignee("all");
                      setAssigneeMenuOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left font-medium hover:bg-muted cursor-pointer",
                      assignee === "all" && "text-purple-600 font-semibold",
                    )}
                  >
                    <span>All Teammates ({tasks.length})</span>
                    {assignee === "all" && <Check className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAssignee("me");
                      setAssigneeMenuOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left font-medium hover:bg-muted cursor-pointer",
                      assignee === "me" && "text-purple-600 font-semibold",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <UserCheck className="h-3.5 w-3.5 text-purple-600" />
                      <span>Assigned to me</span>
                    </span>
                    {assignee === "me" && <Check className="h-3.5 w-3.5" />}
                  </button>

                  <div className="border-t border-border/50 my-1" />

                  {users.map((u) => {
                    const count = tasks.filter((t) => t.assigneeId === u.id).length;
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          setAssignee(u.id);
                          setAssigneeMenuOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left font-medium hover:bg-muted cursor-pointer",
                          assignee === u.id && "text-purple-600 font-semibold",
                        )}
                      >
                        <span className="flex items-center gap-1.5 truncate">
                          <Avatar name={u.name} color={u.color} size="xs" />
                          <span className="truncate">{u.name}</span>
                          <span className="text-[10px] text-muted-foreground">({count})</span>
                        </span>
                        {assignee === u.id && <Check className="h-3.5 w-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          )}
        </div>
      </div>

      {/* 5. MAIN VIEWS */}

      {/* VIEW A: LIST VIEW */}
      {view === "list" && (
        <div className="mt-3 overflow-hidden rounded-xl border border-border/70 bg-card shadow-xs">
          {/* Column Headers Row */}
          <div className="flex items-center border-b border-border/50 bg-card px-4 py-2 text-xs font-semibold text-muted-foreground select-none">
            {/* Checkbox spacer + title */}
            <div className="flex min-w-0 flex-1 items-center pl-8">
              <span>Name</span>
            </div>
            {visibleColumns.assignee && (
              <div className="w-24 shrink-0 text-left">
                <span>Assignee</span>
              </div>
            )}
            {visibleColumns.dueDate && (
              <div className="w-28 shrink-0 text-left">
                <span>Due date</span>
              </div>
            )}
            {visibleColumns.priority && (
              <div className="w-28 shrink-0 text-left">
                <span>Priority</span>
              </div>
            )}
            <div className="w-8 shrink-0" />
          </div>

          {/* Status Groups */}
          <div className="divide-y divide-border/30">
            {groups.map((group) => {
              const isCollapsed = collapsedGroups[group.id] ?? false;
              const groupTasks = group.tasks;
              const allSelected =
                groupTasks.length > 0 && groupTasks.every((t) => selectedIds.includes(t.id));

              return (
                <div key={group.id} className="bg-card">
                  {/* Status Group Header */}
                  <div className="flex items-center justify-between px-4 py-2 select-none hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-2">
                      {/* Triangle Chevron icon */}
                      <button
                        type="button"
                        onClick={() => toggleGroupCollapse(group.id)}
                        className="text-muted-foreground hover:text-foreground transition-colors p-0.5 cursor-pointer"
                        aria-label={`Toggle ${group.label}`}
                      >
                        <span
                          className={cn(
                            "inline-block text-[10px] transition-transform",
                            isCollapsed ? "-rotate-90" : "rotate-0",
                          )}
                        >
                          ▼
                        </span>
                      </button>

                      {/* Pill Badge */}
                      <div
                        className="inline-flex items-center gap-1.5 rounded-md border border-dashed px-2 py-0.5 text-xs font-bold uppercase tracking-wider shadow-2xs"
                        style={{
                          borderColor: group.color,
                          backgroundColor: `color-mix(in oklab, ${group.color} 10%, transparent)`,
                          color: group.color,
                        }}
                      >
                        {group.id === "todo" ? (
                          <svg className="h-3 w-3 stroke-current" viewBox="0 0 20 20">
                            <circle cx="10" cy="10" r="7" fill="none" strokeWidth="2.2" strokeDasharray="3 2" />
                          </svg>
                        ) : (
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: group.color }} />
                        )}
                        <span>{group.label}</span>
                      </div>

                      {/* Group task count */}
                      <span className="text-xs font-semibold text-muted-foreground">
                        {groupTasks.length}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {groupTasks.length > 0 && (
                        <button
                          type="button"
                          onClick={() => selectAllInGroup(groupTasks, !allSelected)}
                          className="text-[11px] text-muted-foreground/60 hover:text-muted-foreground cursor-pointer"
                        >
                          {allSelected ? "Deselect all" : "Select all"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Tasks in group */}
                  {!isCollapsed && (
                    <div>
                      {groupTasks.map((task) => (
                        <TaskRow
                          key={task.id}
                          task={task}
                          selected={selectedIds.includes(task.id)}
                          onSelect={handleSelectTask}
                          showProject={groupBy !== "project" && activeProjectId === "all"}
                          showSubtasks={showSubtasks}
                          visibleColumns={visibleColumns}
                        />
                      ))}

                      {/* ClickUp '⊕ Add Task' row at bottom of group */}
                      <QuickAddRow
                        status={(group.status as TaskStatus) || "todo"}
                        projectId={group.projectId || (activeProjectId !== "all" ? activeProjectId : undefined)}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW B: BOARD VIEW */}
      {view === "board" && (
        <div className="pt-2">
          <KanbanBoard tasks={filtered} projectId={projectFilter !== "all" ? projectFilter : undefined} />
        </div>
      )}

      {/* VIEW C: CALENDAR VIEW */}
      {view === "calendar" && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <section className="rounded-xl border border-border bg-card p-4 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                aria-label="Previous month"
                onClick={() =>
                  setCalCursor(new Date(calCursor.getFullYear(), calCursor.getMonth() - 1, 1))
                }
              >
                &larr; Prev
              </Button>
              <h2 className="text-sm font-bold">
                {calCursor.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Next month"
                onClick={() =>
                  setCalCursor(new Date(calCursor.getFullYear(), calCursor.getMonth() + 1, 1))
                }
              >
                Next &rarr;
              </Button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted-foreground">
              {WEEKDAYS.map((day) => (
                <span key={day} className="py-1">
                  {day}
                </span>
              ))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1">
              {calCells.map((date, index) => {
                if (!date)
                  return <span key={`empty-${index}`} className="min-h-16 rounded-lg bg-muted/40 sm:min-h-24" />;
                const iso = toISODate(date);
                const dayTasks = filtered.filter((task) => task.dueDate === iso);
                const isSelected = iso === calSelected;
                const isToday = isSameDay(date, new Date());
                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => setCalSelected(iso)}
                    className={cn(
                      "min-h-16 rounded-lg border p-1 text-left sm:min-h-24 sm:p-2 transition-all cursor-pointer",
                      isSelected
                        ? "border-primary bg-[color-mix(in_oklab,var(--primary)_10%,var(--card))]"
                        : "border-border/40 bg-muted/20 hover:bg-muted/50",
                    )}
                  >
                    <span className={cn("text-xs font-bold", isToday && "text-primary")}>
                      {date.getDate()}
                    </span>
                    <span className="mt-1 hidden flex-col gap-1 sm:flex">
                      {dayTasks.slice(0, 2).map((task) => (
                        <span
                          key={task.id}
                          className="truncate rounded bg-card px-1 py-0.5 text-[10px] font-medium border border-border/60"
                        >
                          {task.title}
                        </span>
                      ))}
                      {dayTasks.length > 2 && (
                        <span className="text-[10px] text-muted-foreground">+{dayTasks.length - 2} more</span>
                      )}
                    </span>
                    {dayTasks.length > 0 && (
                      <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-primary sm:hidden" />
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Calendar side pane */}
          <aside className="rounded-xl border border-border bg-card p-4 shadow-card">
            <h2 className="text-sm font-bold">
              {parseISODate(calSelected).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </h2>
            {filtered.filter((task) => task.dueDate === calSelected).length === 0 ? (
              <p className="mt-4 text-xs text-muted-foreground">No tasks due on this date.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {filtered
                  .filter((task) => task.dueDate === calSelected)
                  .map((task) => (
                    <TaskRow key={task.id} task={task} visibleColumns={visibleColumns} />
                  ))}
              </div>
            )}
          </aside>
        </div>
      )}

      {/* VIEW D: TABLE VIEW */}
      {view === "table" && (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-muted/60 uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Title</th>
                <th className="px-4 py-3 font-semibold">Assignee</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Priority</th>
                <th className="px-4 py-3 font-semibold">Due</th>
                <th className="px-4 py-3 font-semibold">Project</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.map((task) => {
                const user = users.find((p) => p.id === task.assigneeId);
                const proj = projects.find((p) => p.id === task.projectId);
                return (
                  <tr key={task.id} className="hover:bg-muted/40 transition-colors">
                    <td className="px-4 py-2.5 font-medium">
                      <Link href={`/tasks/${task.id}`} className="hover:text-primary">
                        {task.title}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="flex items-center gap-1.5">
                        <Avatar name={user?.name ?? "Unassigned"} color={user?.color} size="xs" />
                        <span>{user?.name ?? "Unassigned"}</span>
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className="rounded px-2 py-0.5 font-semibold text-[10px] uppercase"
                        style={{
                          color: statusMeta[task.status].color,
                          backgroundColor: statusMeta[task.status].bg,
                        }}
                      >
                        {statusMeta[task.status].label}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span style={{ color: priorityMeta[task.priority].color }} className="font-semibold">
                        {priorityMeta[task.priority].label}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-foreground/90 font-medium">
                        {task.dueDate}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: proj?.color }} />
                        <span>{proj?.name}</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Floating Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <aside
          aria-label="Bulk actions toolbar"
          className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 flex items-center gap-3 rounded-2xl border border-border bg-card px-5 py-3 shadow-2xl animate-in fade-in slide-in-from-bottom-5"
        >
          <span className="text-xs font-semibold text-foreground">
            {selectedIds.length} {selectedIds.length === 1 ? "task" : "tasks"} selected
          </span>

          <div className="h-4 w-px bg-border" />

          {/* Bulk Complete */}
          <button
            type="button"
            onClick={() => {
              batchUpdateStatus(selectedIds, "done");
              setSelectedIds([]);
            }}
            className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-500 cursor-pointer"
          >
            <Check className="h-4 w-4" />
            <span>Mark Complete</span>
          </button>

          {/* Bulk In Progress */}
          <button
            type="button"
            onClick={() => {
              batchUpdateStatus(selectedIds, "in_progress");
              setSelectedIds([]);
            }}
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover cursor-pointer"
          >
            <span>In Progress</span>
          </button>

          {/* Bulk Delete */}
          <button
            type="button"
            onClick={() => {
              batchDeleteTasks(selectedIds);
              setSelectedIds([]);
            }}
            className="flex items-center gap-1 text-xs font-semibold text-danger hover:opacity-80 cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedIds([])}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
            aria-label="Clear selection"
          >
            <X className="h-4 w-4" />
          </button>
        </aside>
      )}

      {/* Share Modal Dialog */}
      {shareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Share2 className="h-5 w-5 text-purple-600" />
                <h3 className="text-base font-bold text-foreground">Share List & Tasks</h3>
              </div>
              <button
                type="button"
                onClick={() => setShareModalOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:bg-muted cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Anyone with access can view tasks and real-time updates for{" "}
              <strong className="text-foreground">{currentProject?.name ?? "AbdulRehman"}</strong>.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">Public Workspace Link</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={typeof window !== "undefined" ? window.location.href : ""}
                  className="w-full rounded-md border border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground font-mono"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success("Link copied to clipboard!");
                  }}
                  className="rounded-md bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-700 transition-colors cursor-pointer shrink-0"
                >
                  Copy
                </button>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-xs font-semibold text-foreground">Members with Access</label>
              <div className="max-h-48 overflow-y-auto space-y-2 divide-y divide-border/30">
                {users.map((u) => (
                  <div key={u.id} className="flex items-center justify-between pt-2 text-xs">
                    <div className="flex items-center gap-2">
                      <Avatar name={u.name} color={u.color} size="xs" />
                      <div>
                        <p className="font-semibold text-foreground">{u.name}</p>
                        <p className="text-[11px] text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                    <span className="text-[11px] text-muted-foreground font-medium">
                      {u.role === "Super Admin" ? "Owner" : "Editor"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-border/50">
              <button
                type="button"
                onClick={() => setShareModalOpen(false)}
                className="rounded-md bg-muted px-4 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/80 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project Channel Slide-over Drawer */}
      {channelDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="h-full w-full max-w-md border-l border-border bg-card p-5 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Hash className="h-5 w-5 text-purple-600" />
                  <div>
                    <h3 className="text-base font-bold text-foreground">Project Channel</h3>
                    <p className="text-xs text-muted-foreground">{currentProject?.name ?? "AbdulRehman"} • Live Chat</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setChannelDrawerOpen(false)}
                  className="p-1 rounded-md text-muted-foreground hover:bg-muted cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Chat Message List */}
              <div className="space-y-3 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
                {channelMessages.map((msg) => (
                  <div key={msg.id} className="rounded-lg border border-border/60 bg-muted/20 p-2.5 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">{msg.user}</span>
                      <span className="text-[10px] text-muted-foreground">{msg.time}</span>
                    </div>
                    <p className="text-foreground/90">{msg.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Post Message Input */}
            <div className="border-t border-border/60 pt-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={channelMessage}
                  onChange={(e) => setChannelMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && channelMessage.trim()) {
                      setChannelMessages((prev) => [
                        ...prev,
                        {
                          id: `cm_${Date.now()}`,
                          user: currentUser.name,
                          text: channelMessage.trim(),
                          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                        },
                      ]);
                      setChannelMessage("");
                    }
                  }}
                  placeholder={`Post message to #${currentProject?.name ?? "channel"}...`}
                  className="w-full rounded-md border border-border bg-input px-3 py-2 text-xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!channelMessage.trim()) return;
                    setChannelMessages((prev) => [
                      ...prev,
                      {
                        id: `cm_${Date.now()}`,
                        user: currentUser.name,
                        text: channelMessage.trim(),
                        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                      },
                    ]);
                    setChannelMessage("");
                  }}
                  className="rounded-md bg-purple-600 p-2 text-white hover:bg-purple-700 transition-colors cursor-pointer shrink-0"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Super Admin Live Team Activity Stream Drawer */}
      {oversightDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="h-full w-full max-w-lg border-l border-border bg-card p-5 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-purple-600" />
                  <div>
                    <h3 className="text-base font-bold text-foreground">Live Team Activity Stream</h3>
                    <p className="text-xs text-muted-foreground">Real-time actions across all employee devices</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOversightDrawerOpen(false)}
                  className="p-1 rounded-md text-muted-foreground hover:bg-muted cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Feed items list */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 divide-y divide-border/20">
                {feed.map((item) => {
                  const author = users.find((u) => u.id === item.userId);
                  return (
                    <div key={item.id} className="pt-2 flex items-start gap-2.5 text-xs">
                      <Avatar name={author?.name ?? "Team Member"} color={author?.color} size="xs" />
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground/90">
                          <strong className="text-foreground">{author?.name ?? "Team Member"}</strong>{" "}
                          <span>{item.text}</span>
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{formatRelative(item.createdAt)}</p>
                      </div>
                      {item.href && (
                        <Link href={item.href} className="text-purple-600 hover:underline p-1">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-border/60 pt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Synchronized with cloud SQLite backend</span>
              </span>
              <button
                type="button"
                onClick={handleManualSync}
                className="rounded-md border border-border px-2.5 py-1 text-xs hover:bg-muted font-medium text-foreground cursor-pointer"
              >
                Sync Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Task Composer Modal */}
      <TaskComposer
        open={composerOpen}
        onClose={closeComposer}
        defaultProjectId={activeProjectId !== "all" ? activeProjectId : undefined}
        onCreated={handleTaskCreated}
      />
    </div>
  );
}
