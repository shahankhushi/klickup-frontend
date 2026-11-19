"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, PriorityBadge, StatusBadge } from "@/components/ui/Badge";
import { Popover } from "@/components/ui/Popover";
import { Select } from "@/components/ui/Select";
import { DueLabel } from "@/components/tasks/DueLabel";
import { TodayCardButton } from "@/components/tasks/TodayCardButton";
import { canLeadWorkspace } from "@/lib/access";
import { approvalTypeMeta, priorityMeta, statusMeta } from "@/lib/labels";
import { useAppData } from "@/lib/store";
import type { Priority, Project, Task, TaskStatus, User } from "@/lib/types";
import { useDismiss } from "@/lib/use-dismiss";
import {
  cn,
  dueTone,
  focusRing,
  formatDate,
  formatRelative,
  parseISODate,
  startOfToday,
  startOfWeek,
  toISODate,
} from "@/lib/utils";
import { CheckCircle2, ChevronDown, Circle, MessageSquare, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";

type RangeKey = "this_week" | "this_month" | "last_month" | "last_30" | "this_quarter" | "all" | "custom";
type ListTab = "left" | "done" | "overdue" | "all";

const RANGE_OPTIONS: { id: RangeKey; label: string }[] = [
  { id: "this_week", label: "This week" },
  { id: "this_month", label: "This month" },
  { id: "last_month", label: "Last month" },
  { id: "last_30", label: "Last 30 days" },
  { id: "this_quarter", label: "This quarter" },
  { id: "all", label: "All time" },
  { id: "custom", label: "Custom" },
];

const LIST_TABS: { id: ListTab; label: string }[] = [
  { id: "left", label: "Still open" },
  { id: "done", label: "Finished" },
  { id: "overdue", label: "Overdue" },
  { id: "all", label: "All" },
];

const PRIORITY_RANK: Record<Priority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

interface PeriodRange {
  start: Date;
  end: Date;
  label: string;
  detail: string;
}

interface PersonStats {
  user: User;
  tasks: Task[];
  done: number;
  left: number;
  overdue: number;
  total: number;
  rate: number;
}

function endOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

function instant(value: string) {
  return value.length <= 10 ? parseISODate(value) : new Date(value);
}

function inWindow(value: string, start: Date, end: Date) {
  const date = instant(value);
  return date >= start && date <= end;
}

function spanLabel(start: Date, end: Date) {
  return `${formatDate(toISODate(start))} – ${formatDate(toISODate(end))}`;
}

function resolveWindow(key: RangeKey, customStart: string, customEnd: string): PeriodRange | null {
  const now = new Date();
  const today = startOfToday();

  if (key === "custom") {
    if (!customStart || !customEnd) return null;
    let start = parseISODate(customStart);
    let end = endOfDay(parseISODate(customEnd));
    if (start > end) {
      const swap = start;
      start = parseISODate(customEnd);
      end = endOfDay(swap);
    }
    return { start, end, label: "Custom range", detail: spanLabel(start, end) };
  }

  if (key === "all") {
    return {
      start: new Date(2000, 0, 1),
      end: new Date(2100, 0, 1),
      label: "All time",
      detail: "Every task on this person's plate",
    };
  }

  if (key === "this_week") {
    const start = startOfWeek(now);
    const end = endOfDay(new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6));
    return { start, end, label: "This week", detail: spanLabel(start, end) };
  }

  if (key === "last_30") {
    const start = new Date(today);
    start.setDate(start.getDate() - 29);
    return { start, end: endOfDay(today), label: "Last 30 days", detail: spanLabel(start, today) };
  }

  if (key === "last_month") {
    const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const end = endOfDay(new Date(today.getFullYear(), today.getMonth(), 0));
    return {
      start,
      end,
      label: start.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      detail: spanLabel(start, end),
    };
  }

  if (key === "this_quarter") {
    const quarterStartMonth = Math.floor(today.getMonth() / 3) * 3;
    const start = new Date(today.getFullYear(), quarterStartMonth, 1);
    const end = endOfDay(new Date(today.getFullYear(), quarterStartMonth + 3, 0));
    const quarter = quarterStartMonth / 3 + 1;
    return { start, end, label: `Q${quarter} ${today.getFullYear()}`, detail: spanLabel(start, end) };
  }

  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const end = endOfDay(new Date(today.getFullYear(), today.getMonth() + 1, 0));
  return {
    start,
    end,
    label: start.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    detail: spanLabel(start, end),
  };
}

function periodHit(task: Task, period: PeriodRange) {
  const due = instant(task.dueDate);
  const dueIn = due >= period.start && due <= period.end;
  const finishedIn = Boolean(task.completedAt && inWindow(task.completedAt, period.start, period.end));
  const carried = task.status !== "done" && due < period.start;
  if (!dueIn && !finishedIn && !carried) return null;
  return { carried: carried && !dueIn };
}

function isOverdue(task: Task) {
  return dueTone(task.dueDate, task.status) === "overdue";
}

function slipDays(task: Task) {
  if (task.status !== "done" || !task.completedAt) return null;
  const done = parseISODate(toISODate(new Date(task.completedAt)));
  const due = parseISODate(task.dueDate);
  return Math.round((done.getTime() - due.getTime()) / 86400000);
}

function daysLate(dueDate: string) {
  const due = parseISODate(dueDate);
  return Math.max(0, Math.round((startOfToday().getTime() - due.getTime()) / 86400000));
}

function paceLine(period: PeriodRange, key: RangeKey, done: number, left: number) {
  if (key === "all") return null;
  const today = startOfToday();
  const span = Math.round((endOfDay(period.end).getTime() - period.start.getTime()) / 86400000);
  const daySpan = Math.max(1, span);
  let elapsed = daySpan;
  if (today < period.start) elapsed = 0;
  else if (today <= period.end) {
    elapsed = Math.round((today.getTime() - period.start.getTime()) / 86400000) + 1;
  }
  return `Day ${Math.min(elapsed, daySpan)} of ${daySpan}. ${done} closed, ${left} still open.`;
}

function fallbackUser(id: string): User {
  return {
    id,
    name: "Former teammate",
    email: "",
    title: "No longer on the roster",
    role: "Member",
    status: "active",
    initials: "?",
    color: "#64748b",
  };
}

function summarize(user: User, tasks: Task[]): PersonStats {
  const done = tasks.filter((task) => task.status === "done").length;
  const left = tasks.length - done;
  const overdue = tasks.filter(isOverdue).length;
  return {
    user,
    tasks,
    done,
    left,
    overdue,
    total: tasks.length,
    rate: tasks.length ? Math.round((done / tasks.length) * 100) : 0,
  };
}

function Ring({ done, open, overdue }: { done: number; open: number; overdue: number }) {
  const total = done + open + overdue;
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const parts = [
    { value: done, color: "#10b981" },
    { value: open, color: "#f59e0b" },
    { value: overdue, color: "#e11d48" },
  ].filter((part) => part.value > 0);
  let consumed = 0;
  const percent = total ? Math.round((done / total) * 100) : 0;

  return (
    <svg viewBox="0 0 140 140" className="h-36 w-36 shrink-0" role="img" aria-label={`${percent}% finished`}>
      <g transform="rotate(-90 70 70)">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="var(--muted)" strokeWidth="12" />
        {parts.map((part) => {
          const length = (part.value / total) * circumference;
          const dashOffset = -consumed;
          consumed += length;
          return (
            <circle
              key={part.color}
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke={part.color}
              strokeWidth="12"
              strokeLinecap="butt"
              strokeDasharray={`${length} ${circumference - length}`}
              strokeDashoffset={dashOffset}
            />
          );
        })}
      </g>
      <text x="70" y="68" textAnchor="middle" className="fill-foreground text-[26px] font-semibold">
        {percent}%
      </text>
      <text x="70" y="86" textAnchor="middle" className="fill-muted-foreground text-[11px]">
        finished
      </text>
    </svg>
  );
}

function SplitBar({ done, open, overdue }: { done: number; open: number; overdue: number }) {
  const total = Math.max(1, done + open + overdue);
  return (
    <div className="flex h-3 overflow-hidden rounded-full bg-muted" aria-hidden>
      <div style={{ width: `${(done / total) * 100}%`, background: "#10b981" }} />
      <div style={{ width: `${(open / total) * 100}%`, background: "#f59e0b" }} />
      <div style={{ width: `${(overdue / total) * 100}%`, background: "#e11d48" }} />
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function TaskReportRow({
  task,
  project,
  carried,
}: {
  task: Task;
  project?: Project;
  carried: boolean;
}) {
  const steps = task.checklist ?? [];
  const stepsDone = steps.filter((item) => item.done).length;
  const undone = steps.filter((item) => !item.done);
  const slip = slipDays(task);
  const lateOpen = isOverdue(task) ? daysLate(task.dueDate) : 0;

  return (
    <li className="px-4 py-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/tasks/${task.id}`} className="text-sm font-semibold text-foreground hover:text-primary">
              {task.title}
            </Link>
            <PriorityBadge priority={task.priority} />
          </div>
          {task.description && (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{task.description}</p>
          )}
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: project?.color ?? "#94a3b8" }} />
              {project?.name ?? "Project"}
            </span>
            {steps.length > 0 && (
              <span>
                {stepsDone}/{steps.length} steps
              </span>
            )}
            {task.comments.length > 0 && (
              <span className="inline-flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                {task.comments.length}
              </span>
            )}
            {carried && <Badge tone="warning">Carried in</Badge>}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <StatusBadge status={task.status} />
          <DueLabel date={task.dueDate} status={task.status} />
          {slip !== null && slip <= 0 && <Badge tone="success">On time</Badge>}
          {slip !== null && slip > 0 && <Badge tone="danger">{slip === 1 ? "1 day late" : `${slip} days late`}</Badge>}
          {lateOpen > 0 && (
            <Badge tone="danger">{lateOpen === 1 ? "1 day overdue" : `${lateOpen} days overdue`}</Badge>
          )}
        </div>
      </div>
      {undone.length > 0 && (
        <ul className="mt-2.5 space-y-1 pl-0.5">
          {undone.slice(0, 4).map((item) => (
            <li key={item.id} className="flex items-start gap-2 text-xs text-foreground/80">
              <Circle className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
              <span>{item.title}</span>
            </li>
          ))}
          {undone.length > 4 && (
            <li className="pl-5 text-xs text-muted-foreground">{undone.length - 4} more steps still open</li>
          )}
        </ul>
      )}
      {steps.length > 0 && undone.length === 0 && (
        <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5" />
          All {steps.length} steps checked off
        </p>
      )}
    </li>
  );
}

export function ReportsPage() {
  const { tasks, users, projects, approvals, currentUser } = useAppData();
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [rangeKey, setRangeKey] = useState<RangeKey>("this_month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [projectId, setProjectId] = useState("all");
  const [listTab, setListTab] = useState<ListTab>("left");
  const [query, setQuery] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const pickerAnchor = useRef<HTMLButtonElement>(null);
  const pickerPanel = useRef<HTMLDivElement>(null);
  useDismiss(pickerOpen, () => setPickerOpen(false), pickerAnchor, pickerPanel);

  const period = useMemo(
    () => resolveWindow(rangeKey, customStart, customEnd),
    [rangeKey, customStart, customEnd],
  );

  const projectName = useMemo(() => {
    const map = new Map(projects.map((project) => [project.id, project]));
    return map;
  }, [projects]);

  const people = useMemo(() => {
    if (!period) return [];
    const ids = new Set<string>(users.map((user) => user.id));
    for (const task of tasks) ids.add(task.assigneeId);
    const rows: PersonStats[] = [];
    for (const id of ids) {
      const user = users.find((item) => item.id === id) ?? fallbackUser(id);
      const owned = tasks.filter((task) => {
        if (task.assigneeId !== id) return false;
        if (projectId !== "all" && task.projectId !== projectId) return false;
        return Boolean(periodHit(task, period));
      });
      if (owned.length === 0 && !users.some((item) => item.id === id)) continue;
      rows.push(summarize(user, owned));
    }
    return rows.sort((a, b) => {
      if (b.overdue !== a.overdue) return b.overdue - a.overdue;
      if (b.left !== a.left) return b.left - a.left;
      if (b.done !== a.done) return b.done - a.done;
      return a.user.name.localeCompare(b.user.name);
    });
  }, [tasks, users, period, projectId]);

  const activePeople = people.filter((person) => person.total > 0);
  const leads = canLeadWorkspace(currentUser.role);
  const suggestedId = leads ? (activePeople[0]?.user.id ?? currentUser.id) : currentUser.id;
  const initialId = useRef<string | null>(null);
  if (initialId.current === null) initialId.current = suggestedId;
  const employeeId = leads ? (pickedId ?? initialId.current ?? currentUser.id) : currentUser.id;
  const employee = users.find((user) => user.id === employeeId) ?? people.find((person) => person.user.id === employeeId)?.user ?? currentUser;
  const stats = people.find((person) => person.user.id === employee.id) ?? summarize(employee, []);

  const openCount = Math.max(0, stats.left - stats.overdue);
  const steps = stats.tasks.flatMap((task) => task.checklist ?? []);
  const stepsDone = steps.filter((item) => item.done).length;
  const carried = period
    ? stats.tasks.filter((task) => periodHit(task, period)?.carried).length
    : 0;
  const onTime = stats.tasks.filter((task) => {
    const slip = slipDays(task);
    return slip !== null && slip <= 0;
  }).length;
  const finishedLate = stats.tasks.filter((task) => {
    const slip = slipDays(task);
    return slip !== null && slip > 0;
  }).length;
  const datedFinishes = onTime + finishedLate;
  const inReview = stats.tasks.filter((task) => task.status === "in_review").length;

  const others = activePeople.filter((person) => person.user.id !== employee.id);
  const othersDone = others.reduce((sum, person) => sum + person.done, 0);
  const othersTotal = others.reduce((sum, person) => sum + person.total, 0);
  const othersRate = othersTotal ? Math.round((othersDone / othersTotal) * 100) : 0;
  const teamLeft = activePeople.reduce((sum, person) => sum + person.left, 0);

  const byProject = useMemo(() => {
    const groups = new Map<string, Task[]>();
    for (const task of stats.tasks) {
      const list = groups.get(task.projectId) ?? [];
      list.push(task);
      groups.set(task.projectId, list);
    }
    return [...groups.entries()]
      .map(([id, list]) => {
        const done = list.filter((task) => task.status === "done").length;
        const overdue = list.filter(isOverdue).length;
        return {
          project: projectName.get(id),
          id,
          done,
          overdue,
          open: list.length - done - overdue,
          total: list.length,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [stats.tasks, projectName]);

  const byStatus = (Object.keys(statusMeta) as TaskStatus[]).map((status) => ({
    status,
    count: stats.tasks.filter((task) => task.status === status).length,
  }));

  const openByPriority = (Object.keys(priorityMeta) as Priority[]).map((priority) => ({
    priority,
    count: stats.tasks.filter((task) => task.status !== "done" && task.priority === priority).length,
  }));

  const pendingApprovals = approvals.filter((item) => item.requesterId === employee.id && item.status === "pending");

  const updates = useMemo(() => {
    if (!period) return [];
    const rows: { id: string; at: string; text: string; href: string }[] = [];
    for (const task of tasks) {
      const onTheirPlate = task.assigneeId === employee.id;
      for (const entry of task.activity) {
        if (!onTheirPlate || !inWindow(entry.createdAt, period.start, period.end)) continue;
        rows.push({ id: entry.id, at: entry.createdAt, text: entry.text, href: `/tasks/${task.id}` });
      }
      for (const entry of task.comments) {
        const theirs = entry.authorId === employee.id;
        if (!onTheirPlate && !theirs) continue;
        if (!inWindow(entry.createdAt, period.start, period.end)) continue;
        const author = users.find((user) => user.id === entry.authorId);
        const who = author?.name ?? "Someone";
        rows.push({
          id: entry.id,
          at: entry.createdAt,
          text: `${who} on ${task.title}: ${entry.body}`,
          href: `/tasks/${task.id}`,
        });
      }
    }
    return rows.sort((a, b) => instant(b.at).getTime() - instant(a.at).getTime()).slice(0, 8);
  }, [tasks, users, employee.id, period]);

  const visibleTasks = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return stats.tasks
      .filter((task) => {
        if (listTab === "done" && task.status !== "done") return false;
        if (listTab === "left" && task.status === "done") return false;
        if (listTab === "overdue" && !isOverdue(task)) return false;
        if (!needle) return true;
        const project = projectName.get(task.projectId)?.name ?? "";
        return `${task.title} ${task.description} ${project}`.toLowerCase().includes(needle);
      })
      .sort((a, b) => {
        if (listTab === "done") {
          const aTime = a.completedAt ? instant(a.completedAt).getTime() : 0;
          const bTime = b.completedAt ? instant(b.completedAt).getTime() : 0;
          return bTime - aTime;
        }
        const aLate = isOverdue(a) ? 0 : 1;
        const bLate = isOverdue(b) ? 0 : 1;
        if (aLate !== bLate) return aLate - bLate;
        if (a.dueDate !== b.dueDate) return a.dueDate.localeCompare(b.dueDate);
        return (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9);
      });
  }, [stats.tasks, listTab, query, projectName]);

  const chase = useMemo(() => {
    return stats.tasks
      .filter((task) => task.status !== "done" && (isOverdue(task) || dueTone(task.dueDate, task.status) === "today" || task.priority === "urgent" || task.priority === "high" || task.status === "in_review"))
      .sort((a, b) => {
        const aLate = isOverdue(a) ? 0 : 1;
        const bLate = isOverdue(b) ? 0 : 1;
        if (aLate !== bLate) return aLate - bLate;
        return (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9);
      })
      .slice(0, 5);
  }, [stats.tasks]);

  const pickerPeople = users
    .filter((user) => {
      const needle = pickerQuery.trim().toLowerCase();
      if (!needle) return true;
      return `${user.name} ${user.title} ${user.department ?? ""}`.toLowerCase().includes(needle);
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const tabCount = (tab: ListTab) => {
    if (tab === "done") return stats.done;
    if (tab === "left") return stats.left;
    if (tab === "overdue") return stats.overdue;
    return stats.total;
  };

  const verdict = !period
    ? "Pick a start and end date."
    : stats.total === 0
      ? `${employee.name.split(" ")[0]} has no tasks in ${period.label.toLowerCase()}.`
      : stats.left === 0
        ? `${employee.name.split(" ")[0]} finished all ${stats.done} tasks in this period.`
        : stats.overdue > 0
          ? `${stats.done} finished, ${stats.left} still open, ${stats.overdue} already past due.`
          : `${stats.done} finished and ${stats.left} still open.`;

  return (
    <div className="space-y-4 pb-12" suppressHydrationWarning>
      <PageHeader
        title={leads ? "Employee report" : "My report"}
        description={
          leads
            ? "Pick a person and a period. See what they finished, what is still open, and which tasks need a chase."
            : "Your own tasks for the period. Finished, still open, and what is left."
        }
        actions={<TodayCardButton user={employee} tasks={tasks} projects={projects} />}
      />

      <section className="rounded-xl border border-border/80 bg-card p-3 shadow-xs sm:p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
          {leads && (
          <div className="relative w-full xl:w-72">
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Employee</p>
            <button
              ref={pickerAnchor}
              type="button"
              aria-haspopup="listbox"
              aria-expanded={pickerOpen}
              onClick={() => setPickerOpen((open) => !open)}
              className={cn(
                "flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-border bg-background px-2.5 text-left",
                focusRing,
              )}
            >
              <span className="flex min-w-0 items-center gap-2">
                <Avatar name={employee.name} color={employee.color} src={employee.avatarUrl} size="xs" />
                <span className="truncate text-sm font-medium">{employee.name}</span>
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
            <Popover open={pickerOpen} anchorRef={pickerAnchor} panelRef={pickerPanel} matchWidth>
              <div className="p-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    autoFocus
                    value={pickerQuery}
                    onChange={(event) => setPickerQuery(event.target.value)}
                    placeholder="Search people"
                    className="h-8 w-full rounded-md border border-border bg-background pl-8 pr-2 text-sm outline-none"
                  />
                </div>
                <ul role="listbox" className="mt-2 max-h-64 overflow-auto">
                  {pickerPeople.map((user) => {
                    const active = user.id === employee.id;
                    return (
                      <li key={user.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setPickedId(user.id);
                            setPickerOpen(false);
                            setPickerQuery("");
                            setListTab("left");
                          }}
                          className={cn(
                            "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left",
                            active ? "bg-primary/10" : "hover:bg-muted",
                          )}
                        >
                          <Avatar name={user.name} color={user.color} src={user.avatarUrl} size="xs" />
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium">{user.name}</span>
                            <span className="block truncate text-[11px] text-muted-foreground">
                              {user.department ? `${user.department} · ` : ""}
                              {user.title}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                  {pickerPeople.length === 0 && (
                    <li className="px-2 py-3 text-xs text-muted-foreground">No one matches that search.</li>
                  )}
                </ul>
              </div>
            </Popover>
          </div>
          )}

          <div className="w-full xl:w-64">
            <Select
              label="Project"
              value={projectId}
              onChange={setProjectId}
              options={[{ value: "all", label: "All projects" }, ...projects.map((project) => ({ value: project.id, label: project.name }))]}
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Period</p>
            <div className="flex flex-wrap gap-1.5">
              {RANGE_OPTIONS.map((option) => {
                const active = option.id === rangeKey;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setRangeKey(option.id)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                    aria-pressed={active}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {rangeKey === "custom" && (
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
              From
              <input
                type="date"
                value={customStart}
                onChange={(event) => setCustomStart(event.target.value)}
                className="h-9 rounded-lg border border-border bg-background px-2 text-sm text-foreground"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
              To
              <input
                type="date"
                value={customEnd}
                onChange={(event) => setCustomEnd(event.target.value)}
                className="h-9 rounded-lg border border-border bg-background px-2 text-sm text-foreground"
              />
            </label>
          </div>
        )}

        <p className="mt-3 text-xs text-muted-foreground" suppressHydrationWarning>
          {period ? (
            <>
              <span className="font-medium text-foreground">{period.label}</span>
              <span> · {period.detail}</span>
            </>
          ) : (
            "Choose both dates. The report uses that exact range."
          )}
        </p>
      </section>

      {leads && period && activePeople.length > 0 && (
        <section aria-label="Team in this period">
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-semibold">Who needs a look</h2>
            <p className="text-xs text-muted-foreground">Late work first, then the fullest open lists.</p>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {activePeople.map((person) => {
              const selected = person.user.id === employee.id;
              return (
                <button
                  key={person.user.id}
                  type="button"
                  onClick={() => {
                    setPickedId(person.user.id);
                    setListTab(person.overdue > 0 ? "overdue" : "left");
                  }}
                  className={cn(
                    "w-48 shrink-0 rounded-xl border bg-card p-3 text-left shadow-xs transition-colors",
                    selected ? "border-primary ring-2 ring-primary/30" : "border-border/80 hover:border-border",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Avatar name={person.user.name} color={person.user.color} src={person.user.avatarUrl} size="sm" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{person.user.name}</span>
                      <span className="block truncate text-[11px] text-muted-foreground">
                        {person.user.department ?? person.user.title}
                      </span>
                    </span>
                  </span>
                  <span className="mt-2.5 block">
                    <SplitBar done={person.done} open={Math.max(0, person.left - person.overdue)} overdue={person.overdue} />
                  </span>
                  <span className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>
                      {person.done} done · {person.left} open
                    </span>
                    <span className={person.overdue > 0 ? "font-semibold text-rose-600" : ""}>
                      {person.overdue > 0 ? `${person.overdue} late` : `${person.rate}%`}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {!period ? (
        <section className="rounded-xl border border-dashed border-border bg-card px-5 py-10 text-center">
          <p className="text-sm font-medium">Set the custom range</p>
          <p className="mt-1 text-sm text-muted-foreground">Both dates are required. This month stays one click away.</p>
        </section>
      ) : (
        <>
          <section className="grid gap-4 lg:grid-cols-12">
            <div className="rounded-xl border border-border/80 bg-card p-5 shadow-xs lg:col-span-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <Ring done={stats.done} open={openCount} overdue={stats.overdue} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <Avatar name={employee.name} color={employee.color} src={employee.avatarUrl} size="lg" />
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-semibold">{employee.name}</h2>
                      <p className="truncate text-sm text-muted-foreground">
                        {employee.title}
                        {employee.department ? ` · ${employee.department}` : ""}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm font-medium text-foreground" suppressHydrationWarning>
                    {verdict}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground" suppressHydrationWarning>
                    {paceLine(period, rangeKey, stats.done, stats.left)}
                  </p>
                  {leads && teamLeft > 0 && stats.left > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {`${stats.left} of ${teamLeft} open tasks in this period sit with ${employee.name.split(" ")[0]}.`}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-5">
                <SplitBar done={stats.done} open={openCount} overdue={stats.overdue} />
                <div className="mt-2 flex flex-wrap gap-3">
                  <LegendDot color="#10b981" label={`${stats.done} finished`} />
                  <LegendDot color="#f59e0b" label={`${openCount} still open`} />
                  <LegendDot color="#e11d48" label={`${stats.overdue} overdue`} />
                </div>
              </div>
              {carried > 0 && (
                <p className="mt-3 text-xs text-muted-foreground">
                  {carried === 1
                    ? "1 open task was already due before this period."
                    : `${carried} open tasks were already due before this period.`}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 lg:col-span-5">
              {[
                ["Finished", stats.done, "Closed in this period"],
                ["Still open", stats.left, "On their plate"],
                ["Overdue", stats.overdue, "Past the due date"],
                ["On time", datedFinishes ? `${onTime}/${datedFinishes}` : "—", "Finished by the due date"],
                ["Steps", steps.length ? `${stepsDone}/${steps.length}` : "—", "Checklist items checked"],
                ["In review", inReview, "Waiting on a reviewer"],
              ].map(([label, value, hint]) => (
                <div key={String(label)} className="rounded-xl border border-border/80 bg-card p-4 shadow-xs">
                  <p className="text-xs font-medium text-muted-foreground">{label}</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>
                </div>
              ))}
            </div>
          </section>

          {leads && othersTotal > 0 && stats.total > 0 && (
            <section className="rounded-xl border border-border/80 bg-card p-5 shadow-xs">
              <h2 className="text-sm font-semibold">Against the rest of the team</h2>
              <p className="mt-1 text-xs text-muted-foreground">Same period, same project filter.</p>
              <div className="mt-4 space-y-3">
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="font-medium">{employee.name.split(" ")[0]}</span>
                    <span className="tabular-nums text-muted-foreground">{stats.rate}% finished</span>
                  </div>
                  <SplitBar done={stats.done} open={openCount} overdue={stats.overdue} />
                </div>
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="font-medium">Everyone else</span>
                    <span className="tabular-nums text-muted-foreground">{othersRate}% finished</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary/80" style={{ width: `${othersRate}%` }} />
                  </div>
                </div>
              </div>
            </section>
          )}

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-border/80 bg-card p-5 shadow-xs">
              <h2 className="text-sm font-semibold">Where the work sits</h2>
              <p className="mt-1 text-xs text-muted-foreground">Finished, still open, and overdue inside each project.</p>
              {byProject.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">No project work in this period.</p>
              ) : (
                <ul className="mt-4 space-y-3.5">
                  {byProject.map((row) => (
                    <li key={row.id}>
                      <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                        <span className="inline-flex min-w-0 items-center gap-1.5 font-medium">
                          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: row.project?.color ?? "#94a3b8" }} />
                          <span className="truncate">{row.project?.name ?? "Project"}</span>
                        </span>
                        <span className="shrink-0 tabular-nums text-muted-foreground">
                          {row.done} done · {row.open + row.overdue} open
                        </span>
                      </div>
                      <SplitBar done={row.done} open={row.open} overdue={row.overdue} />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex flex-col gap-4">
              <div className="rounded-xl border border-border/80 bg-card p-5 shadow-xs">
                <h2 className="text-sm font-semibold">Status of this period</h2>
                <ul className="mt-4 space-y-3">
                  {byStatus.map((row) => {
                    const meta = statusMeta[row.status];
                    const width = stats.total ? (row.count / stats.total) * 100 : 0;
                    return (
                      <li key={row.status}>
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="font-medium" style={{ color: meta.color }}>
                            {meta.label}
                          </span>
                          <span className="tabular-nums text-muted-foreground">{row.count}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full" style={{ width: `${width}%`, background: meta.color }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div className="rounded-xl border border-border/80 bg-card p-5 shadow-xs">
                <h2 className="text-sm font-semibold">What is still heavy</h2>
                <p className="mt-1 text-xs text-muted-foreground">Open tasks by priority.</p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {openByPriority.map((row) => (
                    <li
                      key={row.priority}
                      className="rounded-lg border border-border px-3 py-2 text-xs"
                    >
                      <span className="font-semibold" style={{ color: priorityMeta[row.priority].color }}>
                        {priorityMeta[row.priority].label}
                      </span>
                      <span className="ml-2 tabular-nums text-muted-foreground">{row.count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-border/80 bg-card p-5 shadow-xs">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold">Chase these first</h2>
                <p className="mt-1 text-xs text-muted-foreground">Overdue, due today, urgent, high, or sitting in review.</p>
              </div>
            </div>
            {chase.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">Nothing in this period needs a chase.</p>
            ) : (
              <ul className="mt-3 divide-y divide-border">
                {chase.map((task) => (
                  <li key={task.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <Link href={`/tasks/${task.id}`} className="text-sm font-medium hover:text-primary">
                        {task.title}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {projectName.get(task.projectId)?.name ?? "Project"}
                        {task.status === "in_review" ? " · Waiting on review" : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <PriorityBadge priority={task.priority} />
                      <DueLabel date={task.dueDate} status={task.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-border/80 bg-card shadow-xs">
            <div className="flex flex-col gap-3 border-b border-border/80 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-1.5">
                {LIST_TABS.map((tab) => {
                  const active = listTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setListTab(tab.id)}
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-medium",
                        active ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {tab.label}
                      <span className="ml-1 tabular-nums">{tabCount(tab.id)}</span>
                    </button>
                  );
                })}
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search these tasks"
                  className="h-9 w-full rounded-lg border border-border bg-background pl-8 pr-2 text-sm outline-none"
                />
              </div>
            </div>
            {visibleTasks.length === 0 ? (
              <p className="px-4 py-8 text-sm text-muted-foreground">
                {stats.total === 0 ? "No tasks landed in this period." : "Nothing in this view matches."}
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {visibleTasks.map((task) => (
                  <TaskReportRow
                    key={task.id}
                    task={task}
                    project={projectName.get(task.projectId)}
                    carried={Boolean(periodHit(task, period)?.carried)}
                  />
                ))}
              </ul>
            )}
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-border/80 bg-card p-5 shadow-xs">
              <h2 className="text-sm font-semibold">What moved in this period</h2>
              {updates.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">No updates were logged in this period.</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {updates.map((row) => (
                    <li key={row.id} className="flex gap-3">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <div className="min-w-0">
                        <Link href={row.href} className="text-sm leading-snug hover:text-primary">
                          {row.text}
                        </Link>
                        <p className="mt-0.5 text-[11px] text-muted-foreground" suppressHydrationWarning>
                          {formatRelative(row.at)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="rounded-xl border border-border/80 bg-card p-5 shadow-xs">
              <h2 className="text-sm font-semibold">Approvals they asked for</h2>
              {pendingApprovals.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">No approval is waiting on their request.</p>
              ) : (
                <ul className="mt-3 divide-y divide-border">
                  {pendingApprovals.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <Link href="/approvals" className="text-sm font-medium hover:text-primary">
                          {item.title}
                        </Link>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {approvalTypeMeta[item.type].label} · requested {formatDate(item.requestedAt)}
                        </p>
                      </div>
                      <Badge tone="warning">Pending</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
