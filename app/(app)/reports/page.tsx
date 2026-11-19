import type { Metadata } from "next";
import { ReportsPage } from "@/components/pages/ReportsPage";

export const metadata: Metadata = { title: "Employee report" };

export default function Page() {
  return <ReportsPage />;
}
