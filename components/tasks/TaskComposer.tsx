"use client";

import { Button } from "@/components/ui/Button";
import { DatePicker } from "@/components/ui/DatePicker";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { TextField } from "@/components/ui/TextField";
import { useToast } from "@/components/ui/Toast";
import { PRIORITY_OPTIONS, STATUS_OPTIONS } from "@/lib/labels";
import { canLeadWorkspace } from "@/lib/access";
import { useAppData } from "@/lib/store";
import type { Priority, Task, TaskStatus } from "@/lib/types";
import { toISODate, wait } from "@/lib/utils";
import { FolderPlus, Plus } from "lucide-react";
import { useState } from "react";

const SPACE_LABELS: Record<string, string> = {
  s_performance: "Performance",
  s_creative: "Creative",
  s_erp_web: "ERP/Web",
  s_data_upload: "Data-Upload",
  s_hr_admin: "HR/Admin",
  s_projects: "Projects",
  s_khushi: "Khushi Motors",
};

function spaceLabel(id: string) {
  return SPACE_LABELS[id] ?? id.replace(/^s_/, "").replace(/_/g, " ");
}

interface TaskComposerProps {
  open: boolean;
  onClose: () => void;
  defaultProjectId?: string;
  onCreated?: (task: Task) => void;
}

export function TaskComposer({ open, onClose, defaultProjectId, onCreated }: TaskComposerProps) {
  if (!open) return null;
  return (
    <TaskComposerModal
      onClose={onClose}
      defaultProjectId={defaultProjectId}
      onCreated={onCreated}
    />
  );
}

function TaskComposerModal({
  onClose,
  defaultProjectId,
  onCreated,
}: {
  onClose: () => void;
  defaultProjectId?: string;
  onCreated?: (task: Task) => void;
}) {
  const { users, projects, addTask, addProject, currentUser } = useAppData();
  const leads = canLeadWorkspace(currentUser.role);
  const assigneeChoices = leads ? users : users.filter((user) => user.id === currentUser.id);
  const toast = useToast();

  const spaceOptions = Array.from(
    projects.reduce((map, project) => {
      if (!map.has(project.spaceId)) map.set(project.spaceId, spaceLabel(project.spaceId));
      return map;
    }, new Map<string, string>()),
  ).map(([id, name]) => ({ id, name }));

  const startingProject =
    projects.find((project) => project.id === defaultProjectId) ?? projects[0];

  const [selectedSpaceId, setSelectedSpaceId] = useState<string>(startingProject?.spaceId ?? spaceOptions[0]?.id ?? "");
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState(currentUser.id);
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueDate, setDueDate] = useState(() => toISODate(new Date()));
  const [projectId, setProjectId] = useState(startingProject?.id ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function handleCreateNewProject() {
    if (!newProjectName.trim()) return;
    const trimmed = newProjectName.trim();
    const created = addProject(trimmed, selectedSpaceId);
    if (!created) return;

    // Persist into user spaces
    setSelectedSpaceId(created.spaceId);
    setProjectId(created.id);
    setNewProjectName("");
    setIsCreatingProject(false);
    toast.success("Project created", created.name);
  }

  async function submit() {
    const next: Record<string, string> = {};
    if (title.trim().length < 3) next.title = "Give the task a title of at least 3 characters.";
    if (!assigneeValue) next.assigneeId = "Choose who owns this task.";
    if (!dueDate) next.dueDate = "Pick a due date.";
    if (!projectValue) next.projectId = "Choose a project.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setLoading(true);
    await wait(400);
    const task = addTask({
      title,
      description,
      assigneeId: leads ? assigneeValue : currentUser.id,
      status: statusValue,
      priority: priorityValue,
      dueDate,
      projectId: projectValue,
    });
    setLoading(false);
    toast.success("Task created", title.trim());
    onCreated?.(task);
    onClose();
  }

  const projectOptionsList = projects.filter((project) => project.spaceId === selectedSpaceId);
  const assigneeValue = assigneeChoices.some((user) => user.id === assigneeId) ? assigneeId : currentUser.id;
  const statusValue = STATUS_OPTIONS.some((option) => option.value === status) ? status : "todo";
  const priorityValue = PRIORITY_OPTIONS.some((option) => option.value === priority) ? priority : "medium";
  const projectValue = projectOptionsList.some((project) => project.id === projectId)
    ? projectId
    : (projectOptionsList[0]?.id ?? "");

  return (
    <Modal
      open={true}
      onClose={onClose}
      title="New task"
      description="Add a piece of work to the workspace."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={submit} loading={loading}>
            Create task
          </Button>
        </>
      }
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <TextField
          label="Title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="e.g. Obeya meeting report"
          error={errors.title}
        />

        <TextField
          label="Description"
          multiline
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="What does done look like?"
          helperText="Optional. A sentence or two is enough."
        />

        {/* Space Selection */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Select
            label="Space / Department"
            value={selectedSpaceId}
            onChange={(val) => {
              setSelectedSpaceId(val);
              const spaceProjects = projects.filter((project) => project.spaceId === val);
              setProjectId(spaceProjects[0]?.id ?? "");
            }}
            options={spaceOptions.map((space) => ({
              value: space.id,
              label: space.name,
            }))}
          />

          {/* Project Selection with inline + New Project */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Project</label>
              <button
                type="button"
                onClick={() => setIsCreatingProject(!isCreatingProject)}
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="h-3 w-3" />
                <span>New Project</span>
              </button>
            </div>

            <Select
              value={projectValue}
              onChange={setProjectId}
              placeholder={projectOptionsList.length === 0 ? "No project in this space" : "Select a project"}
              options={projectOptionsList.map((project) => ({
                value: project.id,
                label: project.name,
              }))}
              error={errors.projectId}
            />
          </div>
        </div>

        {/* Inline Create Project Form */}
        {isCreatingProject && (
          <div className="p-3 rounded-lg border border-primary/30 bg-primary/5 flex flex-col gap-2">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <FolderPlus className="h-3.5 w-3.5 text-primary" />
              <span>Create New Project in {spaceLabel(selectedSpaceId)}</span>
            </span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Project name (e.g. Q4 Roadmap)"
                className="flex-1 rounded-md border border-border bg-card px-3 py-1.5 text-xs text-foreground outline-none focus:border-primary"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCreateNewProject();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleCreateNewProject}
                className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 shadow-2xs cursor-pointer"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setIsCreatingProject(false)}
                className="rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Assignee"
            value={assigneeValue}
            onChange={setAssigneeId}
            placeholder="Select a teammate"
            options={assigneeChoices.map((user) => ({ value: user.id, label: user.name }))}
            error={errors.assigneeId}
          />
          <DatePicker label="Due date" value={dueDate} onChange={setDueDate} error={errors.dueDate} />
          <Select
            label="Status"
            value={statusValue}
            onChange={(value) => setStatus(value as TaskStatus)}
            options={STATUS_OPTIONS}
          />
          <Select
            label="Priority"
            value={priorityValue}
            onChange={(value) => setPriority(value as Priority)}
            options={PRIORITY_OPTIONS}
          />
        </div>
      </form>
    </Modal>
  );
}
