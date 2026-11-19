"use client";

import {
  approvals as seedApprovals,
  CURRENT_USER_ID,
  feed as seedFeed,
  notifications as seedNotifications,
  projects as seedProjects,
  tasks as seedTasks,
  users as seedUsers,
} from "@/lib/mock-data";
import { canLeadWorkspace } from "@/lib/access";
import { statusMeta, priorityMeta } from "@/lib/labels";
import type {
  Approval,
  ApprovalStatus,
  AppNotification,
  FeedItem,
  Priority,
  Project,
  Task,
  TaskStatus,
  User,
  Workspace,
  WorkspaceRole,
} from "@/lib/types";
import { initialsFrom, nameFromEmail, uid } from "@/lib/utils";
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

export interface NewTaskInput {
  title: string;
  description: string;
  assigneeId: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: string;
  projectId: string;
}

export interface AppData {
  users: User[];
  tasks: Task[];
  projects: Project[];
  approvals: Approval[];
  feed: FeedItem[];
  notifications: AppNotification[];
  workspace: Workspace;
  currentUser: User;
  isSuperAdmin: boolean;
  signIn: (email: string, password?: string) => { success: boolean; user?: User; error?: string };
  switchUser: (userId: string) => void;
  createUser: (input: {
    name: string;
    email: string;
    password?: string;
    role: WorkspaceRole;
    title?: string;
    department?: string;
    color?: string;
  }) => User | undefined;
  updateUser: (id: string, patch: Partial<User>) => void;
  deleteUser: (id: string) => void;
  addProject: (name: string, spaceId?: string, color?: string) => Project | undefined;
  updateProject: (id: string, patch: Partial<Pick<Project, "name" | "color" | "description">>) => void;
  deleteProject: (id: string) => void;
  addTask: (input: NewTaskInput) => Task;
  quickAddTask: (title: string, status?: TaskStatus, projectId?: string, assigneeId?: string) => Task;
  updateTask: (id: string, patch: Partial<Omit<Task, "id" | "checklist" | "comments" | "activity">>) => void;
  deleteTask: (id: string) => void;
  duplicateTask: (id: string) => Task | undefined;
  toggleTaskComplete: (id: string) => void;
  batchUpdateStatus: (taskIds: string[], status: TaskStatus) => void;
  batchDeleteTasks: (taskIds: string[]) => void;
  addComment: (taskId: string, body: string) => void;
  addChecklistItem: (taskId: string, title: string) => void;
  toggleChecklistItem: (taskId: string, itemId: string) => void;
  removeChecklistItem: (taskId: string, itemId: string) => void;
  setApprovalStatus: (id: string, status: ApprovalStatus) => void;
  inviteMember: (email: string, role: WorkspaceRole) => void;
  updateCurrentUser: (patch: Partial<Pick<User, "name" | "email" | "avatarUrl">>) => void;
  updateWorkspace: (patch: Partial<Workspace>) => void;
  markNotificationsRead: () => void;
  resetToSeedData: () => void;
  syncNow: () => Promise<void>;
  lastSyncedAt: Date | null;
}

const AppDataContext = createContext<AppData | null>(null);

const STORAGE_KEY = "klickup_workspace_state_v7";

function mergeRemoteTasks(local: Task[], remote: Task[]) {
  const remoteIds = new Set(remote.map((task) => task.id));
  const onlyLocal = local.filter((task) => !remoteIds.has(task.id));
  return [...onlyLocal, ...remote];
}

function getInitialStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return fallback;
    const parsed = JSON.parse(saved);
    if (parsed[key] !== undefined) return parsed[key];
  } catch {
    // ignore
  }
  return fallback;
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>(() => structuredClone(seedUsers));
  const [tasks, setTasks] = useState<Task[]>(() => structuredClone(seedTasks));
  const [projects, setProjects] = useState<Project[]>(() => structuredClone(seedProjects));
  const [approvals, setApprovals] = useState<Approval[]>(() => structuredClone(seedApprovals));
  const [feed, setFeed] = useState<FeedItem[]>(() => structuredClone(seedFeed));
  const [notifications, setNotifications] = useState<AppNotification[]>(() => structuredClone(seedNotifications));
  const [workspace, setWorkspace] = useState<Workspace>({ name: "Khushi Motors" });
  const [currentUserId, setCurrentUserId] = useState(CURRENT_USER_ID);

  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [storageReady, setStorageReady] = useState(false);

  // Hydrate from localStorage once mounted on client. Saving waits until this
  // finishes so the first paint cannot overwrite the signed-in person.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.users && Array.isArray(parsed.users) && parsed.users.length > 0) setUsers(parsed.users);
        if (parsed.tasks && Array.isArray(parsed.tasks) && parsed.tasks.length > 0) setTasks(parsed.tasks);
        if (parsed.projects && Array.isArray(parsed.projects) && parsed.projects.length > 0) setProjects(parsed.projects);
        if (parsed.approvals && Array.isArray(parsed.approvals)) setApprovals(parsed.approvals);
        if (parsed.feed && Array.isArray(parsed.feed)) setFeed(parsed.feed);
        if (parsed.notifications && Array.isArray(parsed.notifications)) setNotifications(parsed.notifications);
        if (parsed.workspace) setWorkspace(parsed.workspace);
        if (parsed.currentUserId) setCurrentUserId(parsed.currentUserId);
      }
    } catch {}
    setStorageReady(true);
  }, []);

  const usersRef = useRef(users);
  const tasksRef = useRef(tasks);
  const projectsRef = useRef(projects);
  const feedRef = useRef(feed);
  const currentUserIdRef = useRef(currentUserId);
  const lastServerTimestamp = useRef(0);
  const syncTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    usersRef.current = users;
    tasksRef.current = tasks;
    projectsRef.current = projects;
    feedRef.current = feed;
    currentUserIdRef.current = currentUserId;
  }, [users, tasks, projects, feed, currentUserId]);

  // Push updates to centralized backend sync
  function pushSyncToServer(override?: {
    tasks?: Task[];
    users?: User[];
    projects?: Project[];
    feed?: FeedItem[];
    updatedBy?: string;
  }) {
    if (typeof window === "undefined") return;
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      try {
        const payload = {
          tasks: override?.tasks ?? tasksRef.current,
          users: override?.users ?? usersRef.current,
          projects: override?.projects ?? projectsRef.current,
          feed: override?.feed ?? feedRef.current,
          updatedBy: override?.updatedBy || "Employee",
        };
        fetch("http://localhost:5000/api/workspace/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
          .then((r) => r.json())
          .then((d) => {
            if (d.lastModified) {
              lastServerTimestamp.current = d.lastModified;
              setLastSyncedAt(new Date(d.lastModified));
            }
          })
          .catch(() => {});
      } catch {}
    }, 300);
  }

  // Cross-device sync: poll backend every 2.5s and on window focus
  useEffect(() => {
    let isMounted = true;

    async function pollSync() {
      try {
        const res = await fetch("http://localhost:5000/api/workspace/sync");
        if (!res.ok) return;
        const json = await res.json();
        if (!isMounted) return;

        if (json.data && json.lastModified > lastServerTimestamp.current) {
          lastServerTimestamp.current = json.lastModified;
          setLastSyncedAt(new Date(json.lastModified));
          if (Array.isArray(json.data.tasks) && json.data.tasks.length > 0) {
            setTasks((local) => mergeRemoteTasks(local, json.data.tasks));
          }
          if (Array.isArray(json.data.users) && json.data.users.length > 0) {
            setUsers(json.data.users);
          }
          if (Array.isArray(json.data.projects) && json.data.projects.length > 0) {
            setProjects(json.data.projects);
          }
          if (Array.isArray(json.data.feed) && json.data.feed.length > 0) {
            setFeed(json.data.feed);
          }
        } else if (!json.data) {
          // Initialize server with initial seed
          pushSyncToServer({ updatedBy: "initial" });
        }
      } catch {}
    }

    pollSync();
    const interval = setInterval(pollSync, 2500);
    window.addEventListener("focus", pollSync);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener("focus", pollSync);
    };
  }, []);

  // Save changes to localStorage and push to backend
  useEffect(() => {
    if (!storageReady) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          tasks,
          users,
          projects,
          approvals,
          feed,
          notifications,
          workspace,
          currentUserId,
        }),
      );
    } catch {
      // ignore quota / storage errors
    }
    pushSyncToServer({ tasks, users, projects, feed });
  }, [storageReady, tasks, users, projects, approvals, feed, notifications, workspace, currentUserId]);

  const currentUser = users.find((user) => user.id === currentUserId) ?? users[0];

  const api = useMemo<AppData>(() => {
    function actor() {
      return (
        usersRef.current.find((user) => user.id === currentUserIdRef.current) ?? usersRef.current[0]
      );
    }

    function leadUser(person = actor()) {
      return canLeadWorkspace(person.role);
    }

    function canTouch(task: Task) {
      return leadUser() || task.assigneeId === actor().id;
    }

    function pushFeed(text: string, href?: string) {
      const person = actor();
      const newItem: FeedItem = {
        id: uid("f"),
        userId: person.id,
        text,
        createdAt: new Date().toISOString(),
        href,
      };
      setFeed((current) => {
        const next = [newItem, ...current];
        pushSyncToServer({ feed: next, updatedBy: person.name });
        return next;
      });
    }

    const isSuperAdmin = currentUser?.role === "Super Admin" || currentUser?.role === "Admin";

    return {
      users,
      tasks,
      projects,
      approvals,
      feed,
      notifications,
      workspace,
      currentUser,
      isSuperAdmin,
      signIn(email, password) {
        const trimmedEmail = email.trim().toLowerCase();
        const match = usersRef.current.find((user) => user.email.toLowerCase() === trimmedEmail);
        if (!match) {
          return { success: false, error: "No account found with this email." };
        }
        if (password) {
          const expected = match.password || "password123";
          if (password.trim() !== expected) {
            return { success: false, error: "Incorrect password. (Default is password123)" };
          }
        }
        setCurrentUserId(match.id);
        pushFeed(`signed in as ${match.name}`);
        return { success: true, user: match };
      },
      switchUser(userId) {
        if (!leadUser()) return;
        const match = usersRef.current.find((u) => u.id === userId);
        if (match) {
          setCurrentUserId(match.id);
          pushFeed(`switched active user to ${match.name}`);
        }
      },
      createUser(input) {
        if (!leadUser()) return undefined;
        const colors = ["#6d28d9", "#0d9488", "#a88365", "#0f766e", "#be185d", "#1d4ed8", "#b45309"];
        const randomColor = input.color || colors[usersRef.current.length % colors.length];
        const trimmedName = input.name.trim();
        const trimmedEmail = input.email.trim().toLowerCase();
        const newUser: User = {
          id: uid("u"),
          name: trimmedName,
          email: trimmedEmail,
          password: input.password?.trim() || "password123",
          role: input.role,
          title: input.title?.trim() || (input.role === "Super Admin" ? "Super Administrator" : "Team Member"),
          department: input.department?.trim() || "Operations",
          status: "active",
          initials: initialsFrom(trimmedName),
          color: randomColor,
        };
        setUsers((curr) => [...curr, newUser]);
        pushFeed(`created user account for “${trimmedName}” (${input.role})`);
        return newUser;
      },
      updateUser(id, patch) {
        if (!leadUser() && id !== actor().id) return;
        setUsers((current) =>
          current.map((u) => {
            if (u.id !== id) return u;
            const next = { ...u, ...patch };
            if (patch.name) next.initials = initialsFrom(patch.name);
            return next;
          })
        );
        pushFeed(`updated user account`);
      },
      deleteUser(id) {
        if (!leadUser()) return;
        const target = usersRef.current.find((u) => u.id === id);
        setUsers((current) => current.filter((u) => u.id !== id));
        if (target) {
          pushFeed(`removed user account “${target.name}”`);
        }
      },
      addProject(name, spaceId = "s_khushi", color = "#7c3aed") {
        if (!leadUser()) return undefined;
        const trimmed = name.trim();
        const newProj: Project = {
          id: `p_${Date.now()}`,
          name: trimmed,
          spaceId,
          description: "",
          color,
        };
        setProjects((curr) => [...curr, newProj]);
        pushFeed(`created project “${trimmed}”`);
        return newProj;
      },
      updateProject(id, patch) {
        if (!leadUser()) return;
        setProjects((current) =>
          current.map((p) => (p.id === id ? { ...p, ...patch } : p))
        );
        pushFeed(`updated project`);
      },
      deleteProject(id) {
        if (!leadUser()) return;
        setProjects((current) => current.filter((p) => p.id !== id));
        pushFeed(`deleted project`);
      },
      addTask(input) {
        const person = actor();
        const task: Task = {
          id: uid("t"),
          title: input.title.trim(),
          description: input.description.trim(),
          status: input.status,
          priority: input.priority,
          assigneeId: leadUser(person) ? input.assigneeId : person.id,
          projectId: input.projectId,
          dueDate: input.dueDate,
          checklist: [],
          comments: [],
          activity: [
            {
              id: uid("a"),
              text: `${person.name} created this task`,
              createdAt: new Date().toISOString(),
            },
          ],
          completedAt: input.status === "done" ? new Date().toISOString() : undefined,
        };
        setTasks((current) => {
          const next = [task, ...current];
          tasksRef.current = next;
          return next;
        });
        pushFeed(`created “${task.title}”`, `/tasks/${task.id}`);
        return task;
      },
      quickAddTask(title, status = "todo", projectId, assigneeId) {
        const person = actor();
        const defaultProjectId = projectId || (projects[0]?.id ?? "p_roadmap");
        const defaultAssigneeId = leadUser(person) ? assigneeId || person.id : person.id;
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
        const task: Task = {
          id: uid("t"),
          title: title.trim(),
          description: "",
          status,
          priority: "medium",
          assigneeId: defaultAssigneeId,
          projectId: defaultProjectId,
          dueDate: todayStr,
          checklist: [],
          comments: [],
          activity: [
            {
              id: uid("a"),
              text: `${person.name} created this task`,
              createdAt: new Date().toISOString(),
            },
          ],
          completedAt: status === "done" ? new Date().toISOString() : undefined,
        };
        setTasks((current) => {
          const next = [task, ...current];
          tasksRef.current = next;
          return next;
        });
        pushFeed(`created “${task.title}”`, `/tasks/${task.id}`);
        return task;
      },
      updateTask(id, patch) {
        const person = actor();
        setTasks((current) =>
          current.map((task) => {
            if (task.id !== id) return task;
            if (!canTouch(task)) return task;
            const safePatch = leadUser(person) ? patch : { ...patch, assigneeId: task.assigneeId };
            const activity = [...task.activity];
            const now = new Date().toISOString();
            if (safePatch.status && safePatch.status !== task.status) {
              activity.unshift({
                id: uid("a"),
                text: `${person.name} moved this to ${statusMeta[safePatch.status].label}`,
                createdAt: now,
              });
            }
            if (safePatch.priority && safePatch.priority !== task.priority) {
              activity.unshift({
                id: uid("a"),
                text: `${person.name} set priority to ${priorityMeta[safePatch.priority].label}`,
                createdAt: now,
              });
            }
            if (safePatch.assigneeId && safePatch.assigneeId !== task.assigneeId) {
              const assignee = usersRef.current.find((user) => user.id === safePatch.assigneeId);
              activity.unshift({
                id: uid("a"),
                text: `${person.name} assigned this to ${assignee?.name ?? "a teammate"}`,
                createdAt: now,
              });
            }
            if (safePatch.dueDate && safePatch.dueDate !== task.dueDate) {
              activity.unshift({
                id: uid("a"),
                text: `${person.name} changed the due date`,
                createdAt: now,
              });
            }
            if (safePatch.title && safePatch.title !== task.title) {
              activity.unshift({
                id: uid("a"),
                text: `${person.name} renamed this task`,
                createdAt: now,
              });
            }
            let completedAt = task.completedAt;
            if (safePatch.status === "done" && task.status !== "done") completedAt = now;
            if (safePatch.status && safePatch.status !== "done") completedAt = undefined;
            return { ...task, ...safePatch, activity, completedAt };
          }),
        );
      },
      deleteTask(id) {
        const task = tasks.find((t) => t.id === id);
        if (task && !canTouch(task)) return;
        setTasks((current) => current.filter((t) => t.id !== id));
        if (task) {
          pushFeed(`deleted task “${task.title}”`);
        }
      },
      duplicateTask(id) {
        const original = tasks.find((t) => t.id === id);
        if (!original || !canTouch(original)) return undefined;
        const person = actor();
        const copy: Task = {
          ...structuredClone(original),
          id: uid("t"),
          title: `${original.title} (copy)`,
          assigneeId: leadUser(person) ? original.assigneeId : person.id,
          comments: [],
          activity: [
            {
              id: uid("a"),
              text: `${person.name} duplicated this task`,
              createdAt: new Date().toISOString(),
            },
          ],
        };
        setTasks((current) => [copy, ...current]);
        pushFeed(`duplicated “${original.title}”`, `/tasks/${copy.id}`);
        return copy;
      },
      toggleTaskComplete(id) {
        const person = actor();
        const now = new Date().toISOString();
        const target = tasks.find((t) => t.id === id);
        if (!target || !canTouch(target)) return;
        const isDone = target.status === "done";
        const nextStatus: TaskStatus = isDone ? "todo" : "done";
        setTasks((current) =>
          current.map((task) => {
            if (task.id !== id) return task;
            const activity = [
              {
                id: uid("a"),
                text: isDone
                  ? `${person.name} reopened this task`
                  : `${person.name} marked this task as complete`,
                createdAt: now,
              },
              ...task.activity,
            ];
            return {
              ...task,
              status: nextStatus,
              completedAt: isDone ? undefined : now,
              activity,
            };
          }),
        );
        pushFeed(isDone ? `reopened “${target.title}”` : `completed “${target.title}”`, `/tasks/${id}`);
      },
      batchUpdateStatus(taskIds, status) {
        const person = actor();
        const now = new Date().toISOString();
        const set = new Set(taskIds);
        setTasks((current) =>
          current.map((task) => {
            if (!set.has(task.id) || !canTouch(task)) return task;
            const activity = [
              {
                id: uid("a"),
                text: `${person.name} moved this to ${statusMeta[status].label}`,
                createdAt: now,
              },
              ...task.activity,
            ];
            return {
              ...task,
              status,
              completedAt: status === "done" ? now : undefined,
              activity,
            };
          }),
        );
      },
      batchDeleteTasks(taskIds) {
        const set = new Set(taskIds);
        setTasks((current) => current.filter((t) => !set.has(t.id) || !canTouch(t)));
        pushFeed(`deleted ${taskIds.length} tasks`);
      },
      addComment(taskId, body) {
        const person = actor();
        const now = new Date().toISOString();
        setTasks((current) =>
          current.map((task) => {
            if (task.id !== taskId || !canTouch(task)) return task;
            return {
              ...task,
              comments: [
                ...task.comments,
                { id: uid("c"), authorId: person.id, body: body.trim(), createdAt: now },
              ],
              activity: [
                { id: uid("a"), text: `${person.name} commented`, createdAt: now },
                ...task.activity,
              ],
            };
          }),
        );
        const task = tasks.find((item) => item.id === taskId);
        pushFeed(`commented on “${task?.title ?? "a task"}”`, `/tasks/${taskId}`);
      },
      addChecklistItem(taskId, title) {
        const person = actor();
        const now = new Date().toISOString();
        setTasks((current) =>
          current.map((task) => {
            if (task.id !== taskId || !canTouch(task)) return task;
            return {
              ...task,
              checklist: [...task.checklist, { id: uid("check"), title: title.trim(), done: false }],
              activity: [
                { id: uid("a"), text: `${person.name} added a checklist item`, createdAt: now },
                ...task.activity,
              ],
            };
          }),
        );
      },
      toggleChecklistItem(taskId, itemId) {
        setTasks((current) =>
          current.map((task) => {
            if (task.id !== taskId || !canTouch(task)) return task;
            return {
              ...task,
              checklist: task.checklist.map((item) =>
                item.id === itemId ? { ...item, done: !item.done } : item,
              ),
            };
          }),
        );
      },
      removeChecklistItem(taskId, itemId) {
        setTasks((current) =>
          current.map((task) => {
            if (task.id !== taskId || !canTouch(task)) return task;
            return { ...task, checklist: task.checklist.filter((item) => item.id !== itemId) };
          }),
        );
      },
      setApprovalStatus(id, status) {
        setApprovals((current) =>
          current.map((approval) => (approval.id === id ? { ...approval, status } : approval)),
        );
        const approval = approvals.find((item) => item.id === id);
        pushFeed(`${status} “${approval?.title ?? "a request"}”`, "/approvals");
      },
      inviteMember(email, role) {
        const trimmed = email.trim().toLowerCase();
        const name = nameFromEmail(trimmed);
        const member: User = {
          id: uid("u"),
          name,
          email: trimmed,
          title: "Pending invite",
          role,
          status: "invited",
          initials: initialsFrom(name),
          color: "#6d28d9",
        };
        setUsers((current) => [...current, member]);
        pushFeed(`invited ${trimmed} as ${role}`);
      },
      updateCurrentUser(patch) {
        const id = currentUserIdRef.current;
        setUsers((current) =>
          current.map((user) => {
            if (user.id !== id) return user;
            const next = { ...user, ...patch };
            if (patch.name) next.initials = initialsFrom(patch.name);
            return next;
          }),
        );
      },
      updateWorkspace(patch) {
        setWorkspace((current) => ({ ...current, ...patch }));
      },
      markNotificationsRead() {
        setNotifications((current) => current.map((item) => ({ ...item, unread: false })));
      },
      resetToSeedData() {
        try {
          window.localStorage.removeItem(STORAGE_KEY);
        } catch {
          // ignore
        }
        setUsers(structuredClone(seedUsers));
        setTasks(structuredClone(seedTasks));
        setApprovals(structuredClone(seedApprovals));
        setFeed(structuredClone(seedFeed));
        setNotifications(structuredClone(seedNotifications));
        setWorkspace({ name: "Khushi Motors" });
        setCurrentUserId(CURRENT_USER_ID);
      },
      lastSyncedAt,
      async syncNow() {
        try {
          const res = await fetch("http://localhost:5000/api/workspace/sync");
          if (!res.ok) return;
          const json = await res.json();
          if (json.data) {
            lastServerTimestamp.current = json.lastModified;
            setLastSyncedAt(new Date(json.lastModified));
            if (Array.isArray(json.data.tasks)) {
              setTasks((local) => mergeRemoteTasks(local, json.data.tasks));
            }
            if (Array.isArray(json.data.users)) setUsers(json.data.users);
            if (Array.isArray(json.data.projects)) setProjects(json.data.projects);
            if (Array.isArray(json.data.feed)) setFeed(json.data.feed);
          }
        } catch {}
      },
    };
  }, [approvals, currentUser, feed, lastSyncedAt, notifications, projects, tasks, users, workspace]);

  return <AppDataContext.Provider value={api}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) throw new Error("useAppData must be used within AppDataProvider");
  return context;
}
