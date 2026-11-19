"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { useToast } from "@/components/ui/Toast";
import { approvalTypeMeta } from "@/lib/labels";
import { useAppData } from "@/lib/store";
import type { ApprovalStatus } from "@/lib/types";
import { formatDate, wait } from "@/lib/utils";
import { useState } from "react";

const filters = [
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
  { id: "all", label: "All" },
];

export function ApprovalsPage() {
  const { approvals, users, setApprovalStatus } = useAppData();
  const toast = useToast();
  const [filter, setFilter] = useState("pending");
  const [busyId, setBusyId] = useState<string | null>(null);
  const visible = approvals.filter((item) => filter === "all" || item.status === filter);

  async function decide(id: string, status: Exclude<ApprovalStatus, "pending">, title: string) {
    setBusyId(id);
    await wait(500);
    setApprovalStatus(id, status);
    setBusyId(null);
    toast.success(status === "approved" ? "Approved" : "Rejected", title);
  }

  return (
    <div>
      <PageHeader
        title="Pending approvals"
        description="Vendor spend, launch copy, and production deploys waiting on a decision."
      />
      <Tabs tabs={filters} value={filter} onChange={setFilter} label="Approval status" className="mb-4 w-fit" />
      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
          Nothing in this view. The queue is clear.
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((item) => {
            const requester = users.find((user) => user.id === item.requesterId);
            const type = approvalTypeMeta[item.type];
            return (
              <li key={item.id} className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-card lg:flex-row lg:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <Avatar name={requester?.name ?? "Teammate"} color={requester?.color} />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {requester?.name ?? "Teammate"} · requested {formatDate(item.requestedAt)}
                    </p>
                  </div>
                </div>
                <Badge tone={type.tone}>{type.label}</Badge>
                {item.status === "pending" ? (
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      loading={busyId === item.id}
                      onClick={() => void decide(item.id, "rejected", item.title)}
                    >
                      Reject
                    </Button>
                    <Button loading={busyId === item.id} onClick={() => void decide(item.id, "approved", item.title)}>
                      Approve
                    </Button>
                  </div>
                ) : (
                  <Badge tone={item.status === "approved" ? "success" : "danger"}>
                    {item.status === "approved" ? "Approved" : "Rejected"}
                  </Badge>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
