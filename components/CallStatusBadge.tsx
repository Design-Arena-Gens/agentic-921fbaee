"use client";

import type { CallStatus } from "@/types/call";
import clsx from "clsx";

const STATUS_STYLES: Record<CallStatus, string> = {
  draft: "bg-slate-100 text-slate-600",
  queued: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
  failed: "bg-rose-100 text-rose-700"
};

const STATUS_LABELS: Record<CallStatus, string> = {
  draft: "Draft",
  queued: "Queued",
  completed: "Completed",
  failed: "Failed"
};

export const CallStatusBadge = ({ status }: { status: CallStatus }) => (
  <span
    className={clsx(
      "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
      STATUS_STYLES[status]
    )}
  >
    {STATUS_LABELS[status]}
  </span>
);
