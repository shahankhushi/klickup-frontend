"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Banner } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { RadioGroup } from "@/components/ui/RadioGroup";
import { Switch } from "@/components/ui/Switch";
import { Tabs } from "@/components/ui/Tabs";
import { TextField } from "@/components/ui/TextField";
import { useToast } from "@/components/ui/Toast";
import { readSquareImage } from "@/lib/images";
import { useAppData } from "@/lib/store";
import { isValidEmail, wait } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

const tabs = [
  { id: "profile", label: "Profile" },
  { id: "notifications", label: "Notifications" },
  { id: "security", label: "Security" },
  { id: "workspace", label: "Workspace" },
];

const notificationTypes = [
  { id: "assigned", label: "Task assigned to me", description: "When someone puts you on a task." },
  { id: "comments", label: "Comments on my tasks", description: "Replies and new comments where you are the assignee." },
  { id: "due", label: "Due date reminders", description: "A morning note for tasks due today." },
  { id: "approvals", label: "Approval requests", description: "When a document, task, or request needs your decision." },
  { id: "digest", label: "Monday digest", description: "A weekly summary of overdue work and open approvals." },
];

export function SettingsPage() {
  const params = useSearchParams();
  const tabParam = params.get("tab");
  const defaultTab = tabs.some((item) => item.id === tabParam) ? (tabParam as string) : "profile";
  const [tab, setTab] = useState(defaultTab);
  const [prevParam, setPrevParam] = useState(tabParam);

  if (tabParam !== prevParam) {
    setPrevParam(tabParam);
    if (tabParam && tabs.some((item) => item.id === tabParam)) {
      setTab(tabParam);
    }
  }

  return (
    <div>
      <PageHeader title="Settings" description="Profile, notifications, security, and the workspace name." />
      <Tabs tabs={tabs} value={tab} onChange={setTab} label="Settings sections" className="mb-6 w-full sm:w-fit" />
      {tab === "profile" && <ProfileTab />}
      {tab === "notifications" && <NotificationsTab />}
      {tab === "security" && <SecurityTab />}
      {tab === "workspace" && <WorkspaceTab />}
    </div>
  );
}

function ProfileTab() {
  const { currentUser, updateCurrentUser } = useAppData();
  const toast = useToast();
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function save() {
    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.name = "Enter your name.";
    if (!isValidEmail(email)) next.email = "Enter a valid email.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setLoading(true);
    await wait(500);
    updateCurrentUser({ name: name.trim(), email: email.trim() });
    setLoading(false);
    toast.success("Profile updated");
  }

  async function onFile(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file");
      return;
    }
    try {
      const url = await readSquareImage(file);
      updateCurrentUser({ avatarUrl: url });
      toast.success("Photo updated");
    } catch {
      toast.error("Could not read that image");
    }
  }

  return (
    <section className="max-w-xl rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center gap-4">
        <Avatar name={name || currentUser.name} src={currentUser.avatarUrl} color={currentUser.color} size="lg" />
        <label className="text-sm font-medium text-primary">
          Upload photo
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => void onFile(event.target.files?.[0])}
          />
        </label>
      </div>
      <div className="mt-5 flex flex-col gap-4">
        <TextField label="Name" value={name} onChange={(event) => setName(event.target.value)} error={errors.name} />
        <TextField label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} error={errors.email} />
        <Button className="self-start" loading={loading} onClick={() => void save()}>
          Save profile
        </Button>
      </div>
    </section>
  );
}

function NotificationsTab() {
  const toast = useToast();
  const [values, setValues] = useState<Record<string, boolean>>({
    assigned: true,
    comments: true,
    due: true,
    approvals: true,
    digest: false,
  });
  const [loading, setLoading] = useState(false);

  return (
    <section className="max-w-xl rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="divide-y divide-border">
        {notificationTypes.map((item) => (
          <div key={item.id} className="py-4 first:pt-0 last:pb-0">
            <Switch
              label={item.label}
              description={item.description}
              checked={values[item.id]}
              onChange={(checked) => setValues((current) => ({ ...current, [item.id]: checked }))}
            />
          </div>
        ))}
      </div>
      <Button
        className="mt-5"
        loading={loading}
        onClick={() => {
          setLoading(true);
          void wait(500).then(() => {
            setLoading(false);
            toast.success("Notification preferences saved");
          });
        }}
      >
        Save preferences
      </Button>
    </section>
  );
}

function SecurityTab() {
  const toast = useToast();
  const [current, setCurrent] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function save() {
    const next: Record<string, string> = {};
    if (current.length < 8) next.current = "Enter your current password (8+ characters).";
    if (nextPassword.length < 8) next.next = "Use at least 8 characters.";
    if (confirm !== nextPassword) next.confirm = "Passwords do not match.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setLoading(true);
    await wait(600);
    setLoading(false);
    setCurrent("");
    setNextPassword("");
    setConfirm("");
    toast.success("Password updated", "Saved in this preview only.");
  }

  return (
    <section className="max-w-xl rounded-xl border border-border bg-card p-5 shadow-card">
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <TextField label="Current password" type="password" value={current} onChange={(event) => setCurrent(event.target.value)} error={errors.current} />
        <TextField label="New password" type="password" value={nextPassword} onChange={(event) => setNextPassword(event.target.value)} error={errors.next} />
        <TextField label="Confirm new password" type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} error={errors.confirm} />
        <Button type="submit" className="self-start" loading={loading}>
          Update password
        </Button>
      </form>
    </section>
  );
}

function WorkspaceTab() {
  const { workspace, updateWorkspace, users, resetToSeedData } = useAppData();
  const toast = useToast();
  const [name, setName] = useState(workspace.name);
  const [landing, setLanding] = useState("dashboard");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onFile(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file");
      return;
    }
    try {
      const url = await readSquareImage(file, 64);
      updateWorkspace({ logoUrl: url });
      toast.success("Logo updated");
    } catch {
      toast.error("Could not read that image");
    }
  }

  return (
    <section className="max-w-xl space-y-4">
      <Banner tone="info" title="Changes stay in this browser">
        Workspace settings are local until a backend is connected.
      </Banner>
      <div className="rounded-xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-center gap-4">
          <span
            className="grid h-12 w-12 place-items-center overflow-hidden rounded-lg bg-primary text-sm font-semibold text-primary-foreground"
            style={workspace.logoUrl ? { backgroundImage: `url("${workspace.logoUrl}")`, backgroundSize: "cover" } : undefined}
          >
            {workspace.logoUrl ? "" : "NW"}
          </span>
          <label className="text-sm font-medium text-primary">
            Upload logo
            <input type="file" accept="image/*" className="sr-only" onChange={(event) => void onFile(event.target.files?.[0])} />
          </label>
        </div>
        <div className="mt-5 flex flex-col gap-4">
          <TextField label="Workspace name" value={name} onChange={(event) => setName(event.target.value)} error={error} />
          <p className="text-sm text-muted-foreground">{users.length} people in this directory · 40 at Northwind.</p>
          <RadioGroup
            label="Default landing page"
            value={landing}
            onChange={setLanding}
            options={[
              { value: "dashboard", label: "Dashboard", description: "Open on the morning summary." },
              { value: "tasks", label: "Tasks", description: "Open on the full task list." },
              { value: "projects", label: "Projects", description: "Open on the board." },
            ]}
          />
          <div className="flex items-center gap-3">
            <Button
              className="self-start"
              loading={loading}
              onClick={() => {
                if (name.trim().length < 2) {
                  setError("Workspace name needs at least 2 characters.");
                  return;
                }
                setError("");
                setLoading(true);
                void wait(500).then(() => {
                  updateWorkspace({ name: name.trim() });
                  setLoading(false);
                  toast.success("Workspace saved", `Landing page preference: ${landing}.`);
                });
              }}
            >
              Save workspace
            </Button>

            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                resetToSeedData();
                setName("Northwind Internal");
                toast.success("Workspace reset to initial seed data");
              }}
            >
              Reset Demo Data
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
