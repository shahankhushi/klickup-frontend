import type { Metadata } from "next";
import { TaskDetailPage } from "@/components/pages/TaskDetailPage";
import { tasks } from "@/lib/mock-data";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const task = tasks.find((item) => item.id === id);
  return { title: task?.title ?? "Task" };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TaskDetailPage id={id} />;
}
