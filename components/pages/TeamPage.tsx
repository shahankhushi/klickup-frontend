"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { TextField } from "@/components/ui/TextField";
import { useToast } from "@/components/ui/Toast";
import { ROLE_OPTIONS } from "@/lib/labels";
import { useAppData } from "@/lib/store";
import type { WorkspaceRole } from "@/lib/types";
import { cn, focusRing, isValidEmail, wait } from "@/lib/utils";
import {
  AlertTriangle,
  Briefcase,
  CheckCircle2,
  Clock,
  Copy,
  KeyRound,
  ListTodo,
  MoreHorizontal,
  Search,
  Shield,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export function TeamPage() {
  const router = useRouter();
  const { users, tasks, currentUser, isSuperAdmin, createUser, deleteUser, switchUser } = useAppData();
  const toast = useToast();

  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Create Employee Modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("password123");
  const [newRole, setNewRole] = useState<WorkspaceRole>("Member");
  const [newTitle, setNewTitle] = useState("");
  const [newDepartment, setNewDepartment] = useState("Performance");
  const [customDepartment, setCustomDepartment] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const availableDepartments = useMemo(() => {
    const list = ["Performance", "Creative", "ERP/Web", "Data-Upload", "HR/Admin", "Projects"];
    try {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("klickup_user_spaces_v3");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            parsed.forEach((s: any) => {
              if (s.name && !list.includes(s.name)) list.push(s.name);
            });
          }
        }
      }
    } catch {}
    return list;
  }, []);

  // Delete User Confirmation Modal state
  const [deleteTargetUser, setDeleteTargetUser] = useState<{ id: string; name: string } | null>(null);

  // Overall Task Stats across workspace
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "done").length;
  const inProgressTasks = tasks.filter((t) => t.status !== "done").length;
  const overallRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const visibleUsers = useMemo(() => {
    let list = users;
    if (roleFilter !== "all") {
      if (roleFilter === "admin") {
        list = list.filter((u) => u.role === "Super Admin" || u.role === "Admin");
      } else {
        list = list.filter((u) => u.role !== "Super Admin" && u.role !== "Admin");
      }
    }
    const term = query.trim().toLowerCase();
    if (!term) return list;
    return list.filter((user) =>
      [user.name, user.email, user.title, user.role, user.department ?? ""].some((value) =>
        value.toLowerCase().includes(term),
      ),
    );
  }, [query, roleFilter, users]);

  async function handleCreateEmployee(e: React.FormEvent) {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!newName.trim()) errors.name = "Full name is required.";
    if (!newEmail.trim()) errors.email = "Work email is required.";
    else if (!isValidEmail(newEmail)) errors.email = "Enter a valid email address.";
    else if (users.some((u) => u.email.toLowerCase() === newEmail.trim().toLowerCase())) {
      errors.email = "A user with this email already exists.";
    }
    if (!newPassword.trim() || newPassword.length < 6) {
      errors.password = "Password must be at least 6 characters.";
    }

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    await wait(300);
    const finalDepartment = newDepartment === "__custom__"
      ? (customDepartment.trim() || "Performance")
      : newDepartment;

    const created = createUser({
      name: newName.trim(),
      email: newEmail.trim(),
      password: newPassword.trim(),
      role: newRole,
      title: newTitle.trim() || (newRole === "Super Admin" ? "Administrator" : "Employee"),
      department: finalDepartment,
    });
    if (!created) {
      setLoading(false);
      return;
    }

    setLoading(false);
    setCreateOpen(false);
    setNewName("");
    setNewEmail("");
    setNewPassword("password123");
    setNewRole("Member");
    setNewTitle("");
    setNewDepartment(availableDepartments[0] || "Performance");
    setCustomDepartment("");
    setFormErrors({});
    toast.success("Employee Created", `${created.name} can now log in with their email and password.`);
  }

  function handleDeleteUserConfirm() {
    if (!deleteTargetUser) return;
    deleteUser(deleteTargetUser.id);
    toast.info("User Account Removed", `${deleteTargetUser.name} has been removed from the team.`);
    setDeleteTargetUser(null);
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <PageHeader
        title="Team & Employee Management"
        description="Oversee company-wide task allocations, employee workloads, and system access."
        actions={
          isSuperAdmin ? (
            <Button onClick={() => setCreateOpen(true)} className="bg-primary hover:bg-primary/90 text-white font-semibold">
              <UserPlus className="h-4 w-4 mr-1.5" />
              Add Employee / User
            </Button>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
              <Shield className="h-3.5 w-3.5 text-purple-600" />
              <span>Super Admin manages employee creation</span>
            </span>
          )
        }
      />

      {/* Super Admin Executive Overview Bar */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Team</span>
            <Users className="h-4 w-4 text-purple-600" />
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">{users.length} Members</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {users.filter((u) => u.role === "Super Admin" || u.role === "Admin").length} Admins ·{" "}
            {users.filter((u) => u.role !== "Super Admin" && u.role !== "Admin").length} Employees
          </p>
        </Card>

        <Card className="p-4 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Assigned Tasks</span>
            <ListTodo className="h-4 w-4 text-blue-600" />
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">{totalTasks} Tasks</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Across all spaces & projects</p>
        </Card>

        <Card className="p-4 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">In Progress</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">{inProgressTasks} Active</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Currently being worked on</p>
        </Card>

        <Card className="p-4 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Completion Rate</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{overallRate}%</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{completedTasks} of {totalTasks} finished</p>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, email, department, or title..."
            aria-label="Search teammates"
            className={cn("h-9 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-xs shadow-xs", focusRing)}
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setRoleFilter("all")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
              roleFilter === "all" ? "bg-primary text-white font-semibold" : "bg-card border border-border text-muted-foreground hover:text-foreground"
            )}
          >
            All Members ({users.length})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter("admin")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
              roleFilter === "admin" ? "bg-primary text-white font-semibold" : "bg-card border border-border text-muted-foreground hover:text-foreground"
            )}
          >
            Super Admins
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter("member")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
              roleFilter === "member" ? "bg-primary text-white font-semibold" : "bg-card border border-border text-muted-foreground hover:text-foreground"
            )}
          >
            Employees
          </button>
        </div>
      </div>

      {/* Team Member Cards Grid */}
      {visibleUsers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
          No team members match your criteria.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleUsers.map((user) => {
            const userTasks = tasks.filter((t) => t.assigneeId === user.id);
            const openTasks = userTasks.filter((t) => t.status !== "done");
            const doneTasks = userTasks.filter((t) => t.status === "done");
            const userCompletion = userTasks.length > 0 ? Math.round((doneTasks.length / userTasks.length) * 100) : 0;
            const isUserAdmin = user.role === "Super Admin" || user.role === "Admin";
            const isSelf = user.id === currentUser.id;

            return (
              <div
                key={user.id}
                className={cn(
                  "flex flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-card transition-all hover:border-primary/40",
                  isSelf && "ring-1.5 ring-purple-500/50"
                )}
              >
                <div>
                  {/* Card Header: Avatar, Name, Role */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={user.name} color={user.color} src={user.avatarUrl} size="lg" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate font-bold text-sm text-foreground">{user.name}</p>
                          {isSelf && (
                            <span className="rounded bg-purple-500/15 text-purple-700 dark:text-purple-300 px-1 py-0.2 text-[9px] font-bold">
                              YOU
                            </span>
                          )}
                        </div>
                        <p className="truncate text-xs text-muted-foreground">{user.title}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0",
                          isUserAdmin
                            ? "bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/20"
                            : "bg-muted text-muted-foreground border border-border"
                        )}
                      >
                        {isUserAdmin ? "👑 Super Admin" : "👤 Employee"}
                      </span>
                    </div>
                  </div>

                  {/* Email & Department info */}
                  <div className="mt-3.5 space-y-1 text-xs">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Email:</span>
                      <span className="font-mono text-[11px] text-foreground truncate max-w-[170px]">{user.email}</span>
                    </div>
                    {user.department && (
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>Department:</span>
                        <span className="font-medium text-foreground">{user.department}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Login Password:</span>
                      <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        {user.password || "password123"}
                      </span>
                    </div>
                  </div>

                  {/* Task Workload & Progress for this Employee */}
                  <div className="mt-4 rounded-lg border border-border/80 bg-muted/30 p-2.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-muted-foreground">Workload:</span>
                      <span className="text-foreground">
                        {userTasks.length} {userTasks.length === 1 ? "task" : "tasks"}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-purple-600 to-emerald-500 transition-all duration-300"
                        style={{ width: `${userCompletion}%` }}
                      />
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{openTasks.length} in progress</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">{doneTasks.length} completed ({userCompletion}%)</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/tasks?assignee=${user.id}`}
                      className="inline-flex items-center gap-1 rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted/80 transition-colors"
                      title={`View all tasks assigned to ${user.name}`}
                    >
                      <ListTodo className="h-3 w-3 text-purple-600" />
                      <span>Tasks ({userTasks.length})</span>
                    </Link>

                    {!isSelf && (
                      <button
                        type="button"
                        onClick={() => {
                          switchUser(user.id);
                          toast.success(`Switched active user to ${user.name}`, `Now viewing workspace as ${user.role}`);
                        }}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-colors"
                        title="Quick switch to this user"
                      >
                        <UserCheck className="h-3 w-3 text-emerald-600" />
                        <span>Switch</span>
                      </button>
                    )}
                  </div>

                  {isSuperAdmin && !isSelf && (
                    <button
                      type="button"
                      onClick={() => setDeleteTargetUser({ id: user.id, name: user.name })}
                      className="rounded p-1 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition-colors"
                      title="Remove employee"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Super Admin: Create Employee Modal */}
      {createOpen && (
        <Modal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          title="Add New Employee / User"
          description="Create a user account with login credentials. The employee can then log in to view and complete their assigned tasks."
          footer={
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={() => setCreateOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button loading={loading} onClick={handleCreateEmployee} className="bg-primary hover:bg-primary/90 text-white font-semibold">
                Create Account
              </Button>
            </div>
          }
        >
          <form onSubmit={handleCreateEmployee} className="flex flex-col gap-3 py-1 text-xs">
            <TextField
              label="Full Name"
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Tariq Mehmood"
              error={formErrors.name}
              autoFocus
            />

            <TextField
              label="Work Email (Login ID)"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="e.g. tariq@khushimotors.com"
              error={formErrors.email}
            />

            <TextField
              label="Login Password"
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              error={formErrors.password}
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-foreground">Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as WorkspaceRole)}
                  className={cn(
                    "h-9 w-full rounded-lg border border-border bg-input px-2 text-xs text-foreground shadow-xs outline-none",
                    focusRing
                  )}
                >
                  <option value="Member">Member (Employee)</option>
                  <option value="Admin">Admin</option>
                  <option value="Super Admin">Super Admin (Full Access)</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-foreground">Department / Space</label>
                <select
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  className={cn(
                    "h-9 w-full rounded-lg border border-border bg-input px-2 text-xs text-foreground shadow-xs outline-none",
                    focusRing
                  )}
                >
                  {availableDepartments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                  <option value="__custom__">+ Add Custom Space / Dept...</option>
                </select>
                {newDepartment === "__custom__" && (
                  <input
                    type="text"
                    value={customDepartment}
                    onChange={(e) => setCustomDepartment(e.target.value)}
                    placeholder="Type space / department name..."
                    className={cn(
                      "mt-1.5 h-8 w-full rounded-lg border border-border bg-input px-2.5 text-xs text-foreground shadow-xs outline-none",
                      focusRing
                    )}
                    autoFocus
                  />
                )}
              </div>
            </div>

            <TextField
              label="Job Title / Designation"
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Senior Vehicle Appraiser"
            />
          </form>
        </Modal>
      )}

      {/* Delete Employee Confirmation Warning Modal */}
      {deleteTargetUser && (
        <Modal
          open={Boolean(deleteTargetUser)}
          onClose={() => setDeleteTargetUser(null)}
          title="Remove Employee Account?"
          description="This action requires confirmation."
          footer={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDeleteTargetUser(null)}
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUserConfirm}
                className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-rose-700 cursor-pointer transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Remove Account</span>
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
                  Are you sure you want to remove <span className="font-bold underline decoration-rose-400">{deleteTargetUser.name}</span> from the workspace?
                </p>
                <p className="mt-1 text-[11px] opacity-90">
                  The user will no longer be able to log in. Tasks currently assigned to them will become unassigned.
                </p>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
