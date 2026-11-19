import type { Metadata } from "next";
import { Suspense } from "react";
import { ProjectsPage } from "@/components/pages/ProjectsPage";

export const metadata: Metadata = { title: "Projects" };

export default function Page() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading the board…</p>}>
      <ProjectsPage />
    </Suspense>
  );
}
