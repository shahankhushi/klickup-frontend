"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Tooltip } from "@/components/ui/Tooltip";
import { useToast } from "@/components/ui/Toast";
import { canLeadWorkspace } from "@/lib/access";
import { useAppData } from "@/lib/store";
import { cn, focusRing } from "@/lib/utils";
import {
  Calendar,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Home,
  Kanban,
  ListTodo,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Presentation,
  Settings,
  Trash2,
  Users,
  LayoutGrid,
  FileText,
  BarChart3,
  PieChart,
  Edit2,
  Check,
  X,
  FolderPlus,
  MoreVertical,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/Modal";

export interface CustomSpace {
  id: string;
  name: string;
  color: string;
  projectIds?: string[];
}

const DEFAULT_USER_SPACES: CustomSpace[] = [
  { id: "s_performance", name: "Performance", color: "bg-amber-600", projectIds: ["p_performance"] },
  { id: "s_creative", name: "Creative", color: "bg-rose-600", projectIds: ["p_creative"] },
  { id: "s_erp_web", name: "ERP/Web", color: "bg-cyan-600", projectIds: ["p_erp_web"] },
  { id: "s_data_upload", name: "Data-Upload", color: "bg-yellow-600", projectIds: ["p_data_upload"] },
  { id: "s_hr_admin", name: "HR/Admin", color: "bg-emerald-600", projectIds: ["p_hr_admin"] },
  { id: "s_projects", name: "Projects", color: "bg-violet-600", projectIds: ["p_projects"] },
];

export function Sidebar({
  collapsed,
  mobileOpen,
  onToggleCollapse,
  onCloseMobile,
}: {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const {
    projects,
    workspace,
    tasks,
    users,
    currentUser,
    isSuperAdmin,
    switchUser,
    addProject,
    updateProject,
    deleteProject,
  } = useAppData();
  const leads = canLeadWorkspace(currentUser.role);

  // Active project from URL query
  const currentProjectParam = searchParams.get("project");

  const [userSpaces, setUserSpaces] = useState<CustomSpace[]>(DEFAULT_USER_SPACES);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem("klickup_user_spaces_v3");
      if (saved) setUserSpaces(JSON.parse(saved));
    } catch {}
  }, []);

  const [openSpaces, setOpenSpaces] = useState<string[]>(DEFAULT_USER_SPACES.map((s) => s.id));
  const [isAddingSpace, setIsAddingSpace] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState("");

  // Space editing
  const [editingSpaceId, setEditingSpaceId] = useState<string | null>(null);
  const [editSpaceName, setEditSpaceName] = useState("");

  // Project adding under space
  const [addingProjectSpaceId, setAddingProjectSpaceId] = useState<string | null>(null);
  const [newProjectNameInSpace, setNewProjectNameInSpace] = useState("");

  // Project editing
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editProjectName, setEditProjectName] = useState("");

  // Active 3-dots dropdown menu
  const [activeMenu, setActiveMenu] = useState<{
    type: "space" | "project";
    id: string;
    spaceId?: string;
    name: string;
  } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Delete confirmation warning modal target
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "space" | "project";
    id: string;
    spaceId?: string;
    name: string;
  } | null>(null);

  // Apps menu states
  const [appsMenuOpen, setAppsMenuOpen] = useState(false);
  const [appsExpanded, setAppsExpanded] = useState(true);
  const appsFlyoutRef = useRef<HTMLDivElement>(null);

  // User switcher dropdown state
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const compact = collapsed && !mobileOpen;

  // Close flyouts & menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (appsFlyoutRef.current && !appsFlyoutRef.current.contains(e.target as Node)) {
        setAppsMenuOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    if (appsMenuOpen || activeMenu || userMenuOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [appsMenuOpen, activeMenu, userMenuOpen]);

  const myTasksCount = tasks.filter(
    (t) => t.assigneeId === currentUser.id && t.status !== "done",
  ).length;

  const overdueCount = tasks.filter((t) => {
    if (t.status === "done") return false;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const due = new Date(t.dueDate);
    return due < now;
  }).length;

  function toggleSpace(id: string) {
    setOpenSpaces((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function handleRailClick(targetPath: string) {
    if (targetPath.startsWith("/whiteboard")) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("klickup_reset_whiteboard_view"));
      }
    }
    if (targetPath.startsWith("/docs")) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("klickup_reset_docs_view"));
      }
    }

    if (compact) {
      onToggleCollapse(); // expand sidebar
      router.push(targetPath);
    } else {
      if (pathname === targetPath || (targetPath !== "/dashboard" && pathname.startsWith(targetPath))) {
        // Clicking same icon again collapses sidebar
        onToggleCollapse();
      } else {
        router.push(targetPath);
      }
    }
    onCloseMobile();
  }

  function handleCreateSpace(e: React.FormEvent) {
    e.preventDefault();
    if (!newSpaceName.trim()) return;
    const colors = ["bg-violet-600", "bg-emerald-600", "bg-amber-600", "bg-teal-600", "bg-rose-600", "bg-indigo-600"];
    const randomColor = colors[userSpaces.length % colors.length];
    const newSpace: CustomSpace = {
      id: `space_${Date.now()}`,
      name: newSpaceName.trim(),
      color: randomColor,
      projectIds: [],
    };
    const updated = [...userSpaces, newSpace];
    setUserSpaces(updated);
    setOpenSpaces((prev) => [...prev, newSpace.id]);
    try {
      localStorage.setItem("klickup_user_spaces_v3", JSON.stringify(updated));
    } catch {}
    setNewSpaceName("");
    setIsAddingSpace(false);
    toast.success("Space Created", newSpace.name);
  }

  function handleRenameSpace(spaceId: string) {
    if (!editSpaceName.trim()) {
      setEditingSpaceId(null);
      return;
    }
    const trimmed = editSpaceName.trim();
    const updated = userSpaces.map((s) => (s.id === spaceId ? { ...s, name: trimmed } : s));
    setUserSpaces(updated);
    try {
      localStorage.setItem("klickup_user_spaces_v3", JSON.stringify(updated));
    } catch {}
    setEditingSpaceId(null);
    toast.success("Space Renamed", trimmed);
  }

  function handleDeleteSpace(spaceId: string) {
    const updated = userSpaces.filter((s) => s.id !== spaceId);
    setUserSpaces(updated);
    try {
      localStorage.setItem("klickup_user_spaces_v3", JSON.stringify(updated));
    } catch {}
    toast.info("Space Deleted", "Removed space from workspace.");
  }

  function handleCreateProjectInSpace(spaceId: string) {
    if (!newProjectNameInSpace.trim()) {
      setAddingProjectSpaceId(null);
      return;
    }
    const trimmed = newProjectNameInSpace.trim();
    const created = addProject(trimmed, spaceId);
    if (!created) return;
    const updated = userSpaces.map((s) =>
      s.id === spaceId ? { ...s, projectIds: [...(s.projectIds || []), created.id] } : s
    );
    setUserSpaces(updated);
    try {
      localStorage.setItem("klickup_user_spaces_v3", JSON.stringify(updated));
    } catch {}
    setNewProjectNameInSpace("");
    setAddingProjectSpaceId(null);
    toast.success("Project Created", created.name);
  }

  function handleRenameProject(projectId: string) {
    if (!editProjectName.trim()) {
      setEditingProjectId(null);
      return;
    }
    const trimmed = editProjectName.trim();
    updateProject(projectId, { name: trimmed });
    setEditingProjectId(null);
    toast.success("Project Renamed", trimmed);
  }

  function handleDeleteProject(spaceId: string, projectId: string) {
    deleteProject(projectId);
    const updated = userSpaces.map((s) =>
      s.id === spaceId ? { ...s, projectIds: (s.projectIds || []).filter((id) => id !== projectId) } : s
    );
    setUserSpaces(updated);
    try {
      localStorage.setItem("klickup_user_spaces_v3", JSON.stringify(updated));
    } catch {}
    if (currentProjectParam === projectId) {
      router.push("/tasks");
    }
    toast.info("Project Deleted", "Project removed from space.");
  }

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex h-full shrink-0 transition-all duration-200 ease-in-out md:static md:h-full select-none",
        mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
      )}
      aria-label="Sidebar navigation"
    >
      {/* 1. ClickUp Dark Icon Rail */}
      <div className="flex w-[52px] h-full shrink-0 flex-col items-center justify-between border-r border-white/10 bg-[#12131a] py-3 text-[#9da3af] relative select-none">
        {/* Top: Logo mark */}
        <div className="flex flex-col items-center gap-4">
          <Link href={leads ? "/dashboard" : "/tasks"} onClick={onCloseMobile} aria-label="KlickUp Home">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-tr from-violet-600 via-purple-600 to-pink-500 text-white shadow-md shadow-violet-500/20">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="m4 13 5 5L20 6" />
              </svg>
            </span>
          </Link>

          {/* Rail Navigation Icons */}
          <nav className="flex flex-col items-center gap-1.5" aria-label="Rail">
            {leads && (
            <Tooltip content="Dashboard (Home)">
              <button
                type="button"
                onClick={() => handleRailClick("/dashboard")}
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-lg hover:bg-white/10 hover:text-white transition-colors cursor-pointer",
                  pathname === "/dashboard" && "bg-white/15 text-white font-bold",
                )}
              >
                <Home className="h-4 w-4" />
              </button>
            </Tooltip>
            )}

            <Tooltip content="Tasks">
              <button
                type="button"
                onClick={() => handleRailClick("/tasks")}
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-lg hover:bg-white/10 hover:text-white transition-colors cursor-pointer",
                  pathname.startsWith("/tasks") && "bg-white/15 text-white font-bold",
                )}
              >
                <ListTodo className="h-4 w-4" />
              </button>
            </Tooltip>

            {leads && (
            <>
            <Tooltip content="Projects (Board)">
              <button
                type="button"
                onClick={() => handleRailClick("/projects")}
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-lg hover:bg-white/10 hover:text-white transition-colors cursor-pointer",
                  pathname.startsWith("/projects") && "bg-white/15 text-white font-bold",
                )}
              >
                <Kanban className="h-4 w-4" />
              </button>
            </Tooltip>

            <Tooltip content="Calendar">
              <button
                type="button"
                onClick={() => handleRailClick("/calendar")}
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-lg hover:bg-white/10 hover:text-white transition-colors cursor-pointer",
                  pathname.startsWith("/calendar") && "bg-white/15 text-white font-bold",
                )}
              >
                <CalendarDays className="h-4 w-4" />
              </button>
            </Tooltip>

            <Tooltip content="Team">
              <button
                type="button"
                onClick={() => handleRailClick("/team")}
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-lg hover:bg-white/10 hover:text-white transition-colors cursor-pointer",
                  pathname.startsWith("/team") && "bg-white/15 text-white font-bold",
                )}
              >
                <Users className="h-4 w-4" />
              </button>
            </Tooltip>
            </>
            )}

            <Tooltip content={leads ? "Employee report" : "My report"}>
              <button
                type="button"
                onClick={() => handleRailClick("/reports")}
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-lg hover:bg-white/10 hover:text-white transition-colors cursor-pointer",
                  pathname.startsWith("/reports") && "bg-white/15 text-white font-bold",
                )}
              >
                <PieChart className="h-4 w-4" />
              </button>
            </Tooltip>

            {leads && (
            <div className="relative">
              <Tooltip content="Apps (Whiteboards, Docs, Dashboards)">
                <button
                  type="button"
                  onClick={() => setAppsMenuOpen(!appsMenuOpen)}
                  className={cn(
                    "grid h-8 w-8 place-items-center rounded-lg transition-colors cursor-pointer",
                    appsMenuOpen || pathname.startsWith("/whiteboard") || pathname.startsWith("/docs")
                      ? "bg-white/20 text-white font-bold shadow-xs"
                      : "hover:bg-white/10 hover:text-white",
                  )}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
              </Tooltip>

              {/* Flyout Panel */}
              {appsMenuOpen && (
                <div
                  ref={appsFlyoutRef}
                  className="fixed left-[56px] top-40 z-50 w-72 rounded-xl border border-border/80 bg-popover/95 p-2 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-left-3 duration-200 select-none"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between border-b border-border/50 px-2 py-1.5 pb-2">
                    <div className="flex items-center gap-1.5">
                      <LayoutGrid className="h-3.5 w-3.5 text-purple-600" />
                      <span className="text-xs font-bold text-foreground tracking-wide uppercase">Apps & Tools</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAppsMenuOpen(false)}
                      className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="mt-1 flex flex-col gap-1">
                    {/* Whiteboards */}
                    <Link
                      href="/whiteboard"
                      onClick={() => {
                        if (typeof window !== "undefined") {
                          window.dispatchEvent(new CustomEvent("klickup_reset_whiteboard_view"));
                        }
                        setAppsMenuOpen(false);
                        onCloseMobile();
                      }}
                      className="group flex items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-muted/80 cursor-pointer"
                    >
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-tr from-violet-600 to-purple-600 text-white shadow-xs group-hover:scale-105 transition-transform">
                        <Presentation className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-foreground group-hover:text-purple-600 transition-colors">
                          Whiteboards
                        </span>
                        <span className="text-[11px] text-muted-foreground leading-snug">
                          Visual canvas, diagrams & workflows
                        </span>
                      </div>
                    </Link>

                    {/* Docs */}
                    <Link
                      href="/docs"
                      onClick={() => {
                        if (typeof window !== "undefined") {
                          window.dispatchEvent(new CustomEvent("klickup_reset_docs_view"));
                        }
                        setAppsMenuOpen(false);
                        onCloseMobile();
                      }}
                      className="group flex items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-muted/80 cursor-pointer"
                    >
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-xs group-hover:scale-105 transition-transform">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-foreground group-hover:text-emerald-600 transition-colors">
                          Docs
                        </span>
                        <span className="text-[11px] text-muted-foreground leading-snug">
                          Notes, wikis & project specifications
                        </span>
                      </div>
                    </Link>

                    {/* Dashboards */}
                    <Link
                      href="/dashboard"
                      onClick={() => {
                        setAppsMenuOpen(false);
                        onCloseMobile();
                      }}
                      className="group flex items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-muted/80 cursor-pointer"
                    >
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xs group-hover:scale-105 transition-transform">
                        <BarChart3 className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-foreground group-hover:text-blue-600 transition-colors">
                          Dashboards
                        </span>
                        <span className="text-[11px] text-muted-foreground leading-snug">
                          Metrics, analytics & progress charts
                        </span>
                      </div>
                    </Link>

                    <Link
                      href="/reports"
                      onClick={() => {
                        setAppsMenuOpen(false);
                        onCloseMobile();
                      }}
                      className="group flex items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-muted/80 cursor-pointer"
                    >
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white shadow-xs group-hover:scale-105 transition-transform">
                        <PieChart className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-foreground group-hover:text-violet-600 transition-colors">
                          Employee report
                        </span>
                        <span className="text-[11px] text-muted-foreground leading-snug">
                          Done vs left for any person and month
                        </span>
                      </div>
                    </Link>
                  </div>
                </div>
              )}
            </div>
            )}
          </nav>
        </div>

        {/* Bottom Rail Icons */}
        <div className="flex flex-col items-center gap-2">
          <Tooltip content="Quick Task">
            <button
              type="button"
              onClick={() => router.push("/tasks?compose=1")}
              className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xs hover:opacity-90 cursor-pointer"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
            </button>
          </Tooltip>

          <Tooltip content="Toggle Sidebar Width">
            <button
              type="button"
              onClick={onToggleCollapse}
              className="grid h-8 w-8 place-items-center rounded-lg hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            >
              {compact ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </button>
          </Tooltip>
        </div>
      </div>

      {/* 2. Main White/Light Workspace Sidebar */}
      {!compact && (
        <div className="flex w-60 h-full shrink-0 flex-col justify-between border-r border-border bg-card text-xs text-foreground transition-all select-none">
          <div className="flex flex-1 min-h-0 flex-col gap-4 overflow-y-auto p-3">
            {/* Workspace Switcher Header */}
            <div className="flex items-center justify-between border-b border-border pb-2.5 px-1">
              <div className="flex items-center gap-2 truncate">
                <span className="grid h-6 w-6 place-items-center rounded bg-gradient-to-tr from-violet-600 to-indigo-600 text-[11px] font-bold text-white shadow-xs shrink-0">
                  {workspace.name.charAt(0)}
                </span>
                <span className="truncate font-bold text-foreground text-[13px]">{workspace.name}</span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            </div>

            {/* Top Workspace Navigation Links */}
            <div className="flex flex-col gap-0.5">
              {leads && (
              <Link
                href="/dashboard"
                onClick={onCloseMobile}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 font-medium hover:bg-muted transition-colors",
                  pathname === "/dashboard" ? "bg-muted text-foreground font-semibold" : "text-muted-foreground",
                )}
              >
                <Home className="h-3.5 w-3.5" />
                <span>Home</span>
              </Link>
              )}

              <Link
                href="/reports"
                data-nav="employee-report"
                onClick={onCloseMobile}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 font-medium hover:bg-muted transition-colors",
                  pathname.startsWith("/reports") ? "bg-muted text-foreground font-semibold" : "text-muted-foreground",
                )}
              >
                <PieChart className="h-3.5 w-3.5" />
                <span>{leads ? "Employee report" : "My report"}</span>
              </Link>

              {leads && (
              <Link
                href="/tasks?project=all"
                onClick={onCloseMobile}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 font-medium hover:bg-muted transition-colors",
                  pathname === "/tasks" && currentProjectParam === "all" ? "bg-muted text-foreground font-semibold" : "text-muted-foreground",
                )}
              >
                <ListTodo className="h-3.5 w-3.5" />
                <span>All Tasks</span>
              </Link>
              )}

              {leads && (
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => setAppsExpanded(!appsExpanded)}
                  className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 font-medium hover:bg-muted text-muted-foreground transition-colors cursor-pointer text-left"
                >
                  <span className="flex items-center gap-2.5">
                    <LayoutGrid className="h-3.5 w-3.5 text-purple-600" />
                    <span className="font-semibold text-foreground">Apps</span>
                  </span>
                  <ChevronRight className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform shrink-0", appsExpanded && "rotate-90")} />
                </button>

                {appsExpanded && (
                  <div className="mt-0.5 flex flex-col gap-0.5 pl-5 animate-in fade-in duration-150">
                    <Link
                      href="/whiteboard"
                      onClick={() => {
                        if (typeof window !== "undefined") {
                          window.dispatchEvent(new CustomEvent("klickup_reset_whiteboard_view"));
                        }
                        onCloseMobile();
                      }}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-2 py-1 text-xs transition-colors",
                        pathname.startsWith("/whiteboard")
                          ? "bg-purple-100/80 font-bold text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground font-medium",
                      )}
                    >
                      <Presentation className="h-3.5 w-3.5 text-amber-500" />
                      <span>Whiteboards</span>
                    </Link>

                    <Link
                      href="/docs"
                      onClick={() => {
                        if (typeof window !== "undefined") {
                          window.dispatchEvent(new CustomEvent("klickup_reset_docs_view"));
                        }
                        onCloseMobile();
                      }}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-2 py-1 text-xs transition-colors",
                        pathname.startsWith("/docs")
                          ? "bg-emerald-100/80 font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground font-medium",
                      )}
                    >
                      <FileText className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Docs</span>
                    </Link>

                    <Link
                      href="/dashboard"
                      onClick={onCloseMobile}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-2 py-1 text-xs transition-colors",
                        pathname === "/dashboard"
                          ? "bg-blue-100/80 font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground font-medium",
                      )}
                    >
                      <BarChart3 className="h-3.5 w-3.5 text-blue-600" />
                      <span>Dashboards</span>
                    </Link>

                    <Link
                      href="/reports"
                      onClick={onCloseMobile}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-2 py-1 text-xs transition-colors",
                        pathname.startsWith("/reports")
                          ? "bg-violet-100/80 font-bold text-violet-700 dark:bg-violet-950/40 dark:text-violet-300"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground font-medium",
                      )}
                    >
                      <PieChart className="h-3.5 w-3.5 text-violet-600" />
                      <span>Employee report</span>
                    </Link>
                  </div>
                )}
              </div>
              )}
            </div>

            {/* My Tasks Section */}
            <div>
              <p className="px-2.5 text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                My Tasks
              </p>
              <div className="mt-1 flex flex-col gap-0.5">
                <Link
                  href="/tasks"
                  onClick={onCloseMobile}
                  className="flex items-center justify-between rounded-md px-2.5 py-1.5 font-medium text-foreground hover:bg-muted"
                >
                  <span className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-600" />
                    <span>Assigned to me</span>
                  </span>
                  {mounted && (
                    <span
                      suppressHydrationWarning
                      className="rounded-full bg-purple-600/15 text-purple-700 dark:text-purple-300 px-1.5 py-0.2 text-[10px] font-semibold"
                    >
                      {myTasksCount}
                    </span>
                  )}
                </Link>

                <Link
                  href="/tasks?due=today"
                  onClick={onCloseMobile}
                  className="flex items-center justify-between rounded-md px-2.5 py-1.5 font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <span className="flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-amber-500" />
                    <span>Today & Overdue</span>
                  </span>
                  {mounted && overdueCount > 0 && (
                    <span
                      suppressHydrationWarning
                      className="rounded-full bg-rose-500/15 text-rose-600 px-1.5 py-0.2 text-[10px] font-semibold"
                    >
                      {overdueCount}
                    </span>
                  )}
                </Link>
              </div>
            </div>

            {leads && (
            <div>
              <div className="flex items-center justify-between px-2.5 text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                <span>Spaces (Departments)</span>
                {isSuperAdmin && (
                  <button
                    type="button"
                    onClick={() => setIsAddingSpace(true)}
                    className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                    title="Create new Space (Super Admin only)"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Inline Create Space Form */}
              {isAddingSpace && (
                <form onSubmit={handleCreateSpace} className="mt-1.5 px-2 flex flex-col gap-1.5">
                  <input
                    autoFocus
                    type="text"
                    value={newSpaceName}
                    onChange={(e) => setNewSpaceName(e.target.value)}
                    placeholder="Space/Department name..."
                    className="h-7 w-full rounded border border-primary bg-background px-2 text-xs outline-none shadow-2xs"
                  />
                  <div className="flex items-center gap-1.5">
                    <button
                      type="submit"
                      className="rounded bg-primary px-2.5 py-1 text-[11px] font-bold text-white shadow-2xs hover:bg-primary/90 cursor-pointer"
                    >
                      Create
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingSpace(false)}
                      className="rounded px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              <div className="mt-1.5 flex flex-col gap-1">
                {userSpaces.map((space) => {
                  const spaceProjects = projects.filter(
                    (p) => space.projectIds?.includes(p.id) || p.spaceId === space.id,
                  );
                  const open = openSpaces.includes(space.id);
                  const spaceInitial = space.name.charAt(0).toUpperCase();
                  const isEditingSpace = editingSpaceId === space.id;

                  return (
                    <div key={space.id} className="group/space flex flex-col">
                      {/* Space Title Row */}
                      <div className="flex items-center justify-between rounded-md hover:bg-muted transition-colors pr-1">
                        {isEditingSpace ? (
                          <div className="flex items-center gap-1.5 px-2 py-1 flex-1">
                            <input
                              autoFocus
                              type="text"
                              value={editSpaceName}
                              onChange={(e) => setEditSpaceName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleRenameSpace(space.id);
                                if (e.key === "Escape") setEditingSpaceId(null);
                              }}
                              className="h-6 flex-1 rounded border border-primary bg-background px-1.5 text-xs text-foreground outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleRenameSpace(space.id)}
                              className="text-emerald-600 hover:text-emerald-700 p-0.5 cursor-pointer"
                              title="Save"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingSpaceId(null)}
                              className="text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
                              title="Cancel"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => toggleSpace(space.id)}
                              className={cn(
                                "flex flex-1 min-w-0 items-center justify-between px-2 py-1 font-semibold text-foreground text-left",
                                focusRing,
                              )}
                              aria-expanded={open}
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1 mr-1">
                                <span
                                  className={cn(
                                    "grid h-4 w-4 place-items-center rounded text-[9px] font-bold text-white shrink-0",
                                    space.color,
                                  )}
                                >
                                  {spaceInitial}
                                </span>
                                <span className="truncate text-xs font-semibold block" title={space.name}>
                                  {space.name}
                                </span>
                              </div>
                              <ChevronRight
                                className={cn(
                                  "h-3.5 w-3.5 text-muted-foreground transition-transform shrink-0",
                                  open && "rotate-90",
                                )}
                              />
                            </button>

                            {/* Space Action Menu (3-dots) */}
                            <div className="relative shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenu((curr) =>
                                    curr?.type === "space" && curr.id === space.id
                                      ? null
                                      : { type: "space", id: space.id, name: space.name }
                                  );
                                }}
                                className={cn(
                                  "p-1 rounded text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors",
                                  activeMenu?.type === "space" && activeMenu.id === space.id
                                    ? "opacity-100 bg-muted text-foreground"
                                    : "opacity-80 hover:opacity-100"
                                )}
                                title="Space options"
                              >
                                <MoreVertical className="h-3.5 w-3.5" />
                              </button>

                              {activeMenu?.type === "space" && activeMenu.id === space.id && (
                                <div
                                  ref={menuRef}
                                  className="absolute right-0 top-full mt-1 z-50 w-36 rounded-lg border border-border bg-popover p-1 shadow-lg backdrop-blur-sm animate-in fade-in duration-100 text-xs"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingSpaceId(space.id);
                                      setEditSpaceName(space.name);
                                      setActiveMenu(null);
                                    }}
                                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-foreground hover:bg-muted cursor-pointer text-left font-medium"
                                  >
                                    <Edit2 className="h-3 w-3 text-muted-foreground" />
                                    <span>Rename</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenu(null);
                                      if (!isSuperAdmin) {
                                        toast.error("Permission Denied", "Only Super Admin can delete spaces.");
                                        return;
                                      }
                                      setDeleteTarget({ type: "space", id: space.id, name: space.name });
                                    }}
                                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer text-left font-medium"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Sub-projects inside Space */}
                      {open && (
                        <div className="mt-0.5 flex flex-col gap-0.5 pl-4">
                          {spaceProjects.map((project) => {
                            const projectTasks = tasks.filter((t) => t.projectId === project.id);
                            const openTasksCount = projectTasks.filter((t) => t.status !== "done").length;
                            // Instant bold/active styling on click
                            const isSelected =
                              pathname === "/tasks" &&
                              currentProjectParam === project.id;
                            const isEditingProject = editingProjectId === project.id;

                            return (
                              <div
                                key={project.id}
                                className={cn(
                                  "group/proj flex items-center justify-between gap-1.5 rounded-md px-2 py-1 text-xs transition-colors",
                                  isSelected
                                    ? "bg-purple-100/90 dark:bg-purple-950/50 font-bold text-purple-700 dark:text-purple-300 shadow-2xs"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground font-medium",
                                )}
                              >
                                {isEditingProject ? (
                                  <div className="flex items-center gap-1 w-full">
                                    <input
                                      autoFocus
                                      type="text"
                                      value={editProjectName}
                                      onChange={(e) => setEditProjectName(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") handleRenameProject(project.id);
                                        if (e.key === "Escape") setEditingProjectId(null);
                                      }}
                                      className="h-5 flex-1 rounded border border-primary bg-background px-1 text-xs text-foreground outline-none"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleRenameProject(project.id)}
                                      className="text-emerald-600 hover:text-emerald-700 p-0.5"
                                    >
                                      <Check className="h-3 w-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingProjectId(null)}
                                      className="text-muted-foreground hover:text-foreground p-0.5"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <Link
                                      href={`/tasks?project=${project.id}`}
                                      onClick={onCloseMobile}
                                      className="flex items-center gap-1.5 min-w-0 flex-1 mr-1"
                                      title={project.name}
                                    >
                                      <svg
                                        className={cn(
                                          "h-3 w-3 shrink-0",
                                          isSelected ? "text-purple-700 dark:text-purple-300" : "text-purple-600",
                                        )}
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                      >
                                        <path d="m9 11 3 3L22 4" />
                                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                                      </svg>
                                      <span className={cn("truncate block", isSelected && "font-bold text-foreground")}>
                                        {project.name}
                                      </span>
                                    </Link>

                                    <div className="flex items-center gap-1 shrink-0">
                                      <span className="rounded-full bg-muted/60 px-1.5 py-0.2 text-[10px] font-semibold text-muted-foreground">
                                        {openTasksCount}
                                      </span>

                                      {/* Project Action Menu (3-dots) */}
                                      <div className="relative">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveMenu((curr) =>
                                              curr?.type === "project" && curr.id === project.id
                                                ? null
                                                : { type: "project", id: project.id, spaceId: space.id, name: project.name }
                                            );
                                          }}
                                          className={cn(
                                            "p-0.5 rounded text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors",
                                            activeMenu?.type === "project" && activeMenu.id === project.id
                                              ? "opacity-100 bg-muted text-foreground"
                                              : "opacity-80 hover:opacity-100"
                                          )}
                                          title="Project options"
                                        >
                                          <MoreVertical className="h-3 w-3" />
                                        </button>

                                        {activeMenu?.type === "project" && activeMenu.id === project.id && (
                                          <div
                                            ref={menuRef}
                                            className="absolute right-0 top-full mt-1 z-50 w-36 rounded-lg border border-border bg-popover p-1 shadow-lg backdrop-blur-sm animate-in fade-in duration-100 text-xs"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setEditingProjectId(project.id);
                                                setEditProjectName(project.name);
                                                setActiveMenu(null);
                                              }}
                                              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-foreground hover:bg-muted cursor-pointer text-left font-medium"
                                            >
                                              <Edit2 className="h-3 w-3 text-muted-foreground" />
                                              <span>Rename</span>
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setActiveMenu(null);
                                                if (!isSuperAdmin) {
                                                  toast.error("Permission Denied", "Only Super Admin can delete projects.");
                                                  return;
                                                }
                                                setDeleteTarget({
                                                  type: "project",
                                                  id: project.id,
                                                  spaceId: space.id,
                                                  name: project.name,
                                                });
                                              }}
                                              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer text-left font-medium"
                                            >
                                              <Trash2 className="h-3 w-3" />
                                              <span>Delete</span>
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            );
                          })}

                          {/* Inline Add Project Form - Super Admin only */}
                          {isSuperAdmin && (
                            addingProjectSpaceId === space.id ? (
                              <div className="mt-1 flex items-center gap-1 px-1">
                                <input
                                  autoFocus
                                  type="text"
                                  placeholder="Project name..."
                                  value={newProjectNameInSpace}
                                  onChange={(e) => setNewProjectNameInSpace(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleCreateProjectInSpace(space.id);
                                    if (e.key === "Escape") setAddingProjectSpaceId(null);
                                  }}
                                  className="h-6 flex-1 rounded border border-primary bg-background px-1.5 text-xs text-foreground outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleCreateProjectInSpace(space.id)}
                                  className="rounded bg-primary px-2 py-0.5 text-[11px] font-bold text-white shadow-2xs hover:bg-primary/90 cursor-pointer"
                                >
                                  Add
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setAddingProjectSpaceId(null)}
                                  className="rounded px-1.5 py-0.5 text-[11px] text-muted-foreground hover:bg-muted cursor-pointer"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setAddingProjectSpaceId(space.id);
                                  setNewProjectNameInSpace("");
                                }}
                                className="mt-0.5 flex items-center gap-1.5 px-2 py-1 text-[11px] text-muted-foreground hover:text-primary transition-colors cursor-pointer text-left"
                              >
                                <Plus className="h-3 w-3" />
                                <span>Add Project</span>
                              </button>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            )}
          </div>

          {/* User profile footer with Role indicator & Switcher */}
          <div className="border-t border-border p-2 flex items-center justify-between relative bg-card">
            <button
              type="button"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 min-w-0 flex-1 p-1 rounded-lg hover:bg-muted transition-colors text-left cursor-pointer"
              title={leads ? "Click to switch user or view profile" : "Account"}
            >
              <Avatar
                name={currentUser.name}
                color={currentUser.color}
                src={currentUser.avatarUrl}
                size="xs"
              />
              <div className="flex flex-col min-w-0 flex-1 leading-tight">
                <span className="truncate text-xs font-semibold text-foreground">
                  {currentUser.name}
                </span>
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-wider",
                  isSuperAdmin ? "text-purple-600 dark:text-purple-400" : "text-muted-foreground"
                )}>
                  {isSuperAdmin ? "👑 Super Admin" : "👤 Employee"}
                </span>
              </div>
              <ChevronDown className={cn("h-3 w-3 text-muted-foreground transition-transform shrink-0", userMenuOpen && "rotate-180")} />
            </button>

            {/* Quick Switch User & Logout Dropdown */}
            {userMenuOpen && (
              <div
                ref={userMenuRef}
                className="absolute bottom-full left-2 right-2 mb-1.5 z-50 rounded-xl border border-border bg-popover p-2 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-150 select-none text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-border/60 pb-1.5 px-1 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {leads ? "Switch Account" : "Account"}
                  </span>
                  <span className="text-[10px] text-purple-600 font-semibold">
                    {currentUser.role}
                  </span>
                </div>
                {leads && (
                <div className="flex flex-col gap-0.5 max-h-48 overflow-y-auto">
                  {users.map((u) => {
                    const isSelf = u.id === currentUser.id;
                    const isUserAdmin = u.role === "Super Admin" || u.role === "Admin";
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          switchUser(u.id);
                          setUserMenuOpen(false);
                          toast.success(`Active user switched to ${u.name}`, `Viewing as ${u.role}`);
                        }}
                        className={cn(
                          "flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 transition-colors cursor-pointer text-left",
                          isSelf
                            ? "bg-purple-100/80 dark:bg-purple-950/40 font-bold text-purple-700 dark:text-purple-300"
                            : "hover:bg-muted text-foreground"
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar name={u.name} color={u.color} src={u.avatarUrl} size="xs" />
                          <div className="flex flex-col min-w-0">
                            <span className="truncate text-xs font-medium">{u.name}</span>
                            <span className="text-[10px] text-muted-foreground truncate">{u.title}</span>
                          </div>
                        </div>
                        <span className={cn(
                          "rounded px-1.5 py-0.2 text-[9px] font-bold shrink-0",
                          isUserAdmin ? "bg-purple-500/15 text-purple-700 dark:text-purple-300" : "bg-muted text-muted-foreground"
                        )}>
                          {isUserAdmin ? "Super Admin" : "Employee"}
                        </span>
                      </button>
                    );
                  })}
                </div>
                )}
                <div className="mt-1.5 border-t border-border/60 pt-1.5 flex flex-col gap-0.5">
                  {leads && (
                  <Link
                    href="/team"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-2 py-1 text-muted-foreground hover:bg-muted hover:text-foreground font-medium"
                  >
                    <Users className="h-3.5 w-3.5" />
                    <span>Manage Team & Users</span>
                  </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      router.push("/login");
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-medium cursor-pointer text-left"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Warning Modal */}
      {deleteTarget && (
        <Modal
          open={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          title={`Delete ${deleteTarget.type === "space" ? "Space" : "Project"}?`}
          description="This action requires confirmation."
          footer={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deleteTarget.type === "space") {
                    handleDeleteSpace(deleteTarget.id);
                  } else if (deleteTarget.type === "project" && deleteTarget.spaceId) {
                    handleDeleteProject(deleteTarget.spaceId, deleteTarget.id);
                  }
                  setDeleteTarget(null);
                }}
                className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-rose-700 cursor-pointer transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete {deleteTarget.type === "space" ? "Space" : "Project"}</span>
              </button>
            </div>
          }
        >
          <div className="flex flex-col gap-3 py-1">
            <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50/80 p-3.5 dark:border-rose-900/40 dark:bg-rose-950/30">
              <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-900 dark:text-rose-200 leading-relaxed">
                <p className="font-bold text-rose-700 dark:text-rose-400">
                  Warning: Permanent action
                </p>
                <p className="mt-1">
                  Are you sure you want to permanently delete{" "}
                  <span className="font-bold underline decoration-rose-400">
                    {deleteTarget.name}
                  </span>
                  ?
                </p>
                <p className="mt-1 text-[11px] opacity-90">
                  {deleteTarget.type === "space"
                    ? "This space and its project groupings will be removed from your sidebar."
                    : "This project and its associated task views will be removed."}
                </p>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </aside>
  );
}
