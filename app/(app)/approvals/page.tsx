import type { Metadata } from "next";
import { ApprovalsPage } from "@/components/pages/ApprovalsPage";

export const metadata: Metadata = { title: "Approvals" };

export default function Page() {
  return <ApprovalsPage />;
}
