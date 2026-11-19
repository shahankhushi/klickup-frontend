import type { Metadata } from "next";
import { Suspense } from "react";
import { TasksPage } from "@/components/pages/TasksPage";

export const metadata: Metadata = { title: "Tasks" };

export default function Page() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading tasks…</p>}>
      <TasksPage />
    </Suspense>
  );
}
