export type CallStatus = "draft" | "queued" | "completed" | "failed";

export interface CallRequest {
  id: string;
  clientName: string;
  businessName: string;
  phoneNumber: string;
  contactEmail: string;
  preferredDate: string;
  preferredTimeWindow: string;
  appointmentGoal: string;
  notes: string;
  script: string;
  createdAt: string;
  status: CallStatus;
  resultMessage?: string;
}
