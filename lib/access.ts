import type { WorkspaceRole } from "@/lib/types";

export function canLeadWorkspace(role: WorkspaceRole) {
  return role === "Super Admin" || role === "Admin" || role === "Manager";
}
