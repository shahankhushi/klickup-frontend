"use client";

import { TaskCardObject } from "../types";
import { Flag } from "lucide-react";

interface TaskCardRendererProps {
  object: TaskCardObject;
}

export function TaskCardRenderer({ object }: TaskCardRendererProps) {
  const { taskTitle, projectName, spaceName, status, priority, assigneeInitials, assigneeColor } = object;

  const isCompleted = status === "done" || status === "COMPLETED";

  return (
    <div className="w-full h-full bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-3 flex flex-col justify-between select-none overflow-hidden">
      {/* Top breadcrumb */}
      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium truncate">
        {spaceName && <span className="truncate max-w-[70px]">{spaceName}</span>}
        {spaceName && <span>›</span>}
        <span className="truncate max-w-[90px]">{projectName}</span>
      </div>

      {/* Task title */}
      <div className="text-[13px] font-semibold text-slate-800 line-clamp-2 leading-tight">
        {taskTitle}
      </div>

      {/* Footer: status pill, priority flag, and assignee */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          {/* Status pill */}
          <span
            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9.5px] font-bold uppercase tracking-wider ${
              isCompleted
                ? "bg-emerald-500 text-white"
                : status === "in_progress"
                ? "bg-sky-500 text-white"
                : "bg-slate-200 text-slate-700"
            }`}
          >
            {isCompleted ? "COMPLETED" : status.replace("_", " ")}
          </span>

          {/* Priority flag */}
          {priority && (
            <Flag
              className={`h-3 w-3 ${
                priority === "urgent"
                  ? "text-red-500 fill-red-500"
                  : priority === "high"
                  ? "text-amber-500 fill-amber-500"
                  : priority === "normal"
                  ? "text-sky-500 fill-sky-500"
                  : "text-slate-400"
              }`}
            />
          )}
        </div>

        {/* Assignee Avatar */}
        {assigneeInitials && (
          <span
            className="grid h-5 w-5 place-items-center rounded-full text-[9px] font-bold text-white shrink-0 shadow-2xs"
            style={{ backgroundColor: assigneeColor || "#0d9488" }}
          >
            {assigneeInitials}
          </span>
        )}
      </div>
    </div>
  );
}
