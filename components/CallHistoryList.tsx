"use client";

import { CallStatusBadge } from "@/components/CallStatusBadge";
import type { CallRequest } from "@/types/call";
import { formatDistanceToNow } from "date-fns";

interface CallHistoryListProps {
  calls: CallRequest[];
  onSelect: (call: CallRequest) => void;
}

export const CallHistoryList = ({ calls, onSelect }: CallHistoryListProps) => {
  if (calls.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
        No calls scheduled yet. Create your first AI-assisted call to see it listed here.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {calls.map((call) => (
        <button
          key={call.id}
          type="button"
          onClick={() => onSelect(call)}
          className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                {call.clientName} → {call.businessName}
              </h3>
              <p className="text-sm text-slate-500">
                {call.appointmentGoal}
              </p>
            </div>
            <CallStatusBadge status={call.status} />
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Scheduled {formatDistanceToNow(new Date(call.createdAt), { addSuffix: true })}
          </div>
        </button>
      ))}
    </div>
  );
};
