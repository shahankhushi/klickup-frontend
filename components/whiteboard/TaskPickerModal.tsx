"use client";

import { useAppData } from "@/lib/store";
import { Task } from "@/lib/types";
import { Search, X, CheckCircle2 } from "lucide-react";
import { useState } from "react";

interface TaskPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelectTask: (task: Task, projectName: string) => void;
}

export function TaskPickerModal({ open, onClose, onSelectTask }: TaskPickerModalProps) {
  const { tasks, projects } = useAppData();
  const [search, setSearch] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");

  if (!open) return null;

  const filteredTasks = tasks.filter((t) => {
    if (selectedProjectId !== "all" && t.projectId !== selectedProjectId) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-slate-800 text-sm">Insert Task Card</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Filter bar */}
        <div className="p-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search workspace tasks..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md outline-none focus:border-primary"
            />
          </div>

          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-md px-2 py-1.5 outline-none text-slate-700"
          >
            <option value="all">All Lists</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Task list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredTasks.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-8">No tasks found</p>
          ) : (
            filteredTasks.map((t) => {
              const project = projects.find((p) => p.id === t.projectId);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    onSelectTask(t, project?.name || "General");
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg border border-transparent hover:border-slate-200 hover:bg-slate-50 text-left transition-all group"
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <p className="text-xs font-medium text-slate-800 truncate group-hover:text-primary transition-colors">
                      {t.title}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      {project?.name || "No Project"} • Due {t.dueDate || "None"}
                    </p>
                  </div>

                  <span
                    className={`text-[9.5px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0 ${
                      t.status === "done"
                        ? "bg-emerald-100 text-emerald-700"
                        : t.status === "in_progress"
                        ? "bg-sky-100 text-sky-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {t.status}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
