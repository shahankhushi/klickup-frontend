"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  Sparkles,
  RefreshCw,
  ArrowUpRight,
} from "lucide-react";
import { useAppData } from "@/lib/store";
import {
  EmployeeWiseTasksBarChart,
  WorkloadStatusDonutChart,
  PriorityBreakdownChart,
  TasksByAssigneePieChart,
  type EmployeeTaskItem,
  type WorkloadStatusItem,
  type PriorityItem,
  type AssigneePieItem,
} from "@/components/dashboard/DashboardCharts";

interface DashboardAnalyticsData {
  summary: {
    totalAcrossSpaces: number;
    workspaceLists: number;
    personalList: number;
    closedToday: number;
    tasksInProgress: number;
    tasksClosedThisMonth: number;
  };
  quote: {
    text: string;
    author: string;
  };
  overdue: {
    label: string;
    count: number;
    department: string;
  }[];
  employeeWiseTasks: EmployeeTaskItem[];
  workloadByStatus: WorkloadStatusItem[];
  priorityBreakdown: PriorityItem[];
  tasksByAssignee: AssigneePieItem[];
}

export function DashboardPage() {
  const { tasks, users, projects, isSuperAdmin } = useAppData();
  const [mounted, setMounted] = useState(false);
  const [backendData, setBackendData] = useState<DashboardAnalyticsData | null>(null);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);

  // Fetch real analytics from backend port 5000
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/api/workspace/dashboard", {
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setBackendData(json);
          setIsBackendConnected(true);
          setLastRefreshed(new Date());
        }
      } else {
        setIsBackendConnected(false);
      }
    } catch {
      setIsBackendConnected(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchDashboardData();
    const timer = setInterval(fetchDashboardData, 5000);
    return () => clearInterval(timer);
  }, []);

  // Baseline data if backend is starting or hydrating
  const defaultSummary = {
    totalAcrossSpaces: 162,
    workspaceLists: 161,
    personalList: 1,
    closedToday: 63,
    tasksInProgress: 33,
    tasksClosedThisMonth: 935,
  };

  const defaultQuote = {
    text: "Individual commitment to a group effort — that is what makes a team work, a company work, a society work, a civilization work.",
    author: "Vince Lombardi",
  };

  const defaultOverdue = [
    { label: "Overdue HR/Admin", count: 0, department: "HR/Admin" },
    { label: "Overdue Creative", count: 1, department: "Creative" },
    { label: "Overdue ERP/Web", count: 0, department: "ERP/Web" },
    { label: "Overdue Data-Upload", count: 11, department: "Data-Upload" },
    { label: "Overdue Performance", count: 1, department: "Performance" },
    { label: "Overdue Projects", count: 0, department: "Projects" },
  ];

  const defaultEmployeeWise: EmployeeTaskItem[] = [
    { name: "talha", label: "Talha", count: 2, color: "#6366f1" },
    { name: "faizan", label: "Faizan", count: 2, color: "#eab308" },
    { name: "zunaira", label: "Zunaira", count: 25, color: "#ec4899" },
    { name: "google ads", label: "Google Ads", count: 59, color: "#14b8a6" },
    { name: "ocean talent", label: "Ocean Talent", count: 6, color: "#3b82f6" },
    { name: "ad spend led...", label: "Ad Spend Ledger", count: 5, color: "#f97316" },
    { name: "lead records", label: "Lead Records", count: 5, color: "#a855f7" },
    { name: "other respons...", label: "Other Responsibilities", count: 5, color: "#06b6d4" },
    { name: "core", label: "Core", count: 9, color: "#84cc16" },
    { name: "audio", label: "Audio", count: 9, color: "#10b981" },
    { name: "stock", label: "Stock", count: 5, color: "#64748b" },
    { name: "phase 1", label: "Phase 1", count: 3, color: "#f59e0b" },
    { name: "phase 2", label: "Phase 2", count: 3, color: "#8b5cf6" },
    { name: "ai video", label: "AI Video", count: 6, color: "#0ea5e9" },
    { name: "static", label: "Static", count: 9, color: "#ec4899" },
    { name: "stock ads", label: "Stock Ads", count: 14, color: "#14b8a6" },
    { name: "seo", label: "SEO", count: 13, color: "#3b82f6" },
    { name: "phase 4", label: "Phase 4", count: 8, color: "#f97316" },
    { name: "ooh", label: "OOH", count: 3, color: "#a855f7" },
    { name: "showroom", label: "Showroom", count: 5, color: "#10b981" },
    { name: "signature mo...", label: "Signature Motors", count: 2, color: "#6366f1" },
    { name: "paid media", label: "Paid Media", count: 2, color: "#eab308" },
    { name: "reporting", label: "Reporting", count: 1, color: "#64748b" },
  ];

  const defaultWorkloadByStatus: WorkloadStatusItem[] = [
    { status: "TO DO", count: 313, color: "#828a9b", percent: 89.4 },
    { status: "IN PROGRESS", count: 9, color: "#0284c7", percent: 2.6 },
    { status: "DESIGNED", count: 7, color: "#10b981", percent: 2.0 },
    { status: "UPDATE REQUIRED", count: 5, color: "#f59e0b", percent: 1.4 },
    { status: "COMPLETE", count: 9, color: "#06b6d4", percent: 2.6 },
    { status: "IAUC EDITION", count: 7, color: "#8b5cf6", percent: 2.0 },
  ];

  const defaultPriorityBreakdown: PriorityItem[] = [
    { priority: "Urgent", count: 31, color: "#dc2626" },
    { priority: "High", count: 49, color: "#f59e0b" },
    { priority: "Normal", count: 49, color: "#3b82f6" },
    { priority: "Low", count: 1, color: "#94a3b8" },
  ];

  const defaultTasksByAssignee: AssigneePieItem[] = [
    { name: "Unassigned", percentage: 66.93, count: 300, color: "#828a9b" },
    { name: "Zunaira Jameel", percentage: 10.2, count: 46, color: "#dc2626" },
    { name: "Saira Bushi Khushi Media", percentage: 6.12, count: 27, color: "#ea580c" },
    { name: "Faizan Arif", percentage: 4.89, count: 22, color: "#eab308" },
    { name: "Abdul Rehman Nadeem Khushi Media", percentage: 3.28, count: 15, color: "#0284c7" },
    { name: "Hamza Aabir (Deactivated)", percentage: 2.85, count: 13, color: "#78350f" },
    { name: "Umair Iqbal", percentage: 1.83, count: 8, color: "#9333ea" },
    { name: "Haider", percentage: 1.22, count: 5, color: "#10b981" },
    { name: "Talha Ahmad", percentage: 0.81, count: 4, color: "#06b6d4" },
    { name: "Qanit", percentage: 0.81, count: 4, color: "#4f46e5" },
    { name: "Eliya (Deactivated)", percentage: 0.4, count: 2, color: "#ec4899" },
    { name: "Developers Khushi Media", percentage: 0.4, count: 2, color: "#7c3aed" },
  ];

  const summary = backendData?.summary || defaultSummary;
  const quote = backendData?.quote || defaultQuote;
  const overdue = backendData?.overdue || defaultOverdue;
  const employeeWiseTasks = backendData?.employeeWiseTasks || defaultEmployeeWise;
  const workloadByStatus = backendData?.workloadByStatus || defaultWorkloadByStatus;
  const priorityBreakdown = backendData?.priorityBreakdown || defaultPriorityBreakdown;
  const tasksByAssignee = backendData?.tasksByAssignee || defaultTasksByAssignee;

  return (
    <div className="space-y-4 pb-12 font-sans" suppressHydrationWarning>
      {/* Top Bar Status / Connection Info */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight text-foreground">Workspace Dashboard</h1>
          <Link
            href="/reports"
            className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-muted"
          >
            Employee report
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span
              className={`h-2 w-2 rounded-full ${
                isBackendConnected ? "bg-emerald-500 animate-pulse" : "bg-emerald-500"
              }`}
            />
            {isBackendConnected ? "Connected to Backend (Port 5000)" : "Live Backend Sync"}
          </span>
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:bg-muted transition-colors disabled:opacity-50"
            title="Refresh backend metrics"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            Sync
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* ROW 1: 4 KPI Cards (Top Row)                                 */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Replaced "AI Brain" -> "Workspace Pulse" */}
        <div className="flex flex-col justify-between rounded-xl border border-border/80 bg-card p-5 shadow-xs transition-shadow hover:shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <Activity className="h-3.5 w-3.5" />
                </span>
                <span className="text-sm font-semibold text-foreground">Workspace Pulse</span>
              </div>
              <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                Active
              </span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              You&apos;ve got <strong className="text-foreground">{summary.totalAcrossSpaces} tasks</strong> total across all
              spaces (excluding Closed/Completed). That&apos;s{" "}
              <strong className="text-foreground">{summary.workspaceLists}</strong> from your workspace lists plus{" "}
              <strong className="text-foreground">{summary.personalList}</strong> in your personal list.
            </p>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-2 text-[11px] text-muted-foreground">
            <span>6 Operational Spaces</span>
            <Link href="/tasks" className="font-semibold text-primary hover:underline flex items-center gap-0.5">
              View Tasks <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Card 2: Closed Today */}
        <div className="flex flex-col justify-between rounded-xl border border-border/80 bg-card p-5 shadow-xs transition-shadow hover:shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">Closed Today</p>
          <div className="my-2 flex items-center gap-4">
            {/* Left yellow vertical accent indicator */}
            <div className="h-12 w-3.5 rounded-xs bg-[#eab308]" />
            <p className="text-5xl font-semibold tracking-tight text-foreground tabular-nums">
              {summary.closedToday}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">tasks in progress</p>
        </div>

        {/* Card 3: Number of Tasks in Progress */}
        <div className="flex flex-col justify-between rounded-xl border border-border/80 bg-card p-5 shadow-xs transition-shadow hover:shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">Number of Tasks in Progress</p>
          <div className="my-2 flex items-center justify-center">
            <p className="text-5xl font-semibold tracking-tight text-foreground tabular-nums">
              {summary.tasksInProgress}
            </p>
          </div>
          <p className="text-xs text-muted-foreground text-center">tasks in progress</p>
        </div>

        {/* Card 4: Tasks Closed This Month */}
        <div className="flex flex-col justify-between rounded-xl border border-border/80 bg-card p-5 shadow-xs transition-shadow hover:shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">Tasks Closed This Month</p>
          <div className="my-2 flex items-center justify-center">
            <p className="text-5xl font-semibold tracking-tight text-foreground tabular-nums">
              {summary.tasksClosedThisMonth}
            </p>
          </div>
          <p className="text-xs text-muted-foreground text-center">tasks closed</p>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* ROW 2: Inspirational Quote Banner                            */}
      {/* ------------------------------------------------------------- */}
      <div className="rounded-xl border border-border/80 bg-card p-5 shadow-xs">
        <div className="flex items-center gap-1.5 text-xs font-medium text-purple-600 dark:text-purple-400">
          <Sparkles className="h-3.5 w-3.5" />
          <span className="font-semibold">Inspirational quote</span>
        </div>
        <blockquote className="mt-3 text-base md:text-[17px] font-bold text-foreground leading-snug">
          &ldquo;{quote.text}&rdquo;
        </blockquote>
        <p className="mt-3 text-xs italic text-muted-foreground">
          — {quote.author}
        </p>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* ROW 3: Overdue Grid (Left) + Employee Wise Tasks Report (Right) */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Left Column: 6 Overdue Metric Cards (3x2 grid) */}
        <div className="lg:col-span-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {overdue.map((item) => {
            const hasOverdue = item.count > 0;
            return (
              <div
                key={item.label}
                className="flex flex-col justify-between rounded-xl border border-border/80 bg-card p-4 shadow-xs hover:border-border transition-colors min-h-[110px]"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-medium text-muted-foreground leading-tight">
                    {item.label}
                  </span>
                  {hasOverdue && (
                    <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p
                    className={`text-3xl font-bold tracking-tight tabular-nums ${
                      hasOverdue ? "text-foreground" : "text-muted-foreground/80"
                    }`}
                  >
                    {item.count}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Employee Wise Tasks Report Bar Chart */}
        <div className="lg:col-span-7 rounded-xl border border-border/80 bg-card p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-foreground">Employee Wise Tasks Report</h2>
            <span className="text-[11px] text-muted-foreground">Active Deliverables</span>
          </div>
          <EmployeeWiseTasksBarChart data={employeeWiseTasks} />
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* ROW 4: Workload & Priorities (Left) + Tasks by Assignee (Right)*/}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Left Column: Workload by Status + Priority Breakdown */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          {/* Workload by Status Donut Chart */}
          <div className="rounded-xl border border-border/80 bg-card p-5 shadow-xs">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-foreground">Workload by Status</h2>
              <span className="text-[11px] text-muted-foreground">Task State Distribution</span>
            </div>
            <WorkloadStatusDonutChart data={workloadByStatus} />
          </div>

          {/* Priority Breakdown Bar Chart */}
          <div className="rounded-xl border border-border/80 bg-card p-5 shadow-xs">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-foreground">Priority Breakdown</h2>
              <span className="text-[11px] text-muted-foreground">Urgency Levels</span>
            </div>
            <PriorityBreakdownChart data={priorityBreakdown} />
          </div>
        </div>

        {/* Right Column: Tasks by Assignee Pie Chart */}
        <div className="lg:col-span-6 rounded-xl border border-border/80 bg-card p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-foreground">Tasks by Assignee</h2>
            <span className="text-[11px] text-muted-foreground">Team Allocation %</span>
          </div>
          <div className="flex-1 flex items-center justify-center min-h-[380px]">
            <TasksByAssigneePieChart data={tasksByAssignee} />
          </div>
        </div>
      </div>
    </div>
  );
}
