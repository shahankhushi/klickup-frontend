export type TaskStatus = "todo" | "in_progress" | "in_review" | "done";
export type Priority = "low" | "medium" | "high" | "urgent";
export type MemberStatus = "active" | "invited";
export type WorkspaceRole = "Super Admin" | "Admin" | "Manager" | "Member" | "Guest";
export type ApprovalStatus = "pending" | "approved" | "rejected";
export type ApprovalType = "task" | "document" | "request";
export type BadgeTone = "neutral" | "info" | "success" | "warning" | "danger" | "primary";

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  title: string;
  role: WorkspaceRole;
  status: MemberStatus;
  initials: string;
  color: string;
  avatarUrl?: string;
  department?: string;
}

export interface Project {
  id: string;
  name: string;
  spaceId: string;
  description: string;
  color: string;
}

export interface Space {
  id: string;
  name: string;
}

export interface ChecklistItem {
  id: string;
  title: string;
  done: boolean;
}

export interface Comment {
  id: string;
  authorId: string;
  body: string;
  createdAt: string;
}

export interface ActivityEvent {
  id: string;
  text: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  assigneeId: string;
  projectId: string;
  dueDate: string;
  completedAt?: string;
  checklist: ChecklistItem[];
  comments: Comment[];
  activity: ActivityEvent[];
}

export interface Approval {
  id: string;
  requesterId: string;
  title: string;
  type: ApprovalType;
  requestedAt: string;
  status: ApprovalStatus;
}

export interface FeedItem {
  id: string;
  userId: string;
  text: string;
  createdAt: string;
  href?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  unread: boolean;
  href?: string;
}

export interface Workspace {
  name: string;
  logoUrl?: string;
}
