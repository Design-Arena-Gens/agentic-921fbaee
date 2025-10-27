'use client';

import { useEffect, useMemo, useState } from "react";
import { CallHistoryList } from "@/components/CallHistoryList";
import type { CallRequest } from "@/types/call";
import { computeReadinessScore, readinessInsight } from "@/lib/readiness";
import { callRequestSchema, scriptInputSchema } from "@/lib/validators";
import { v4 as uuid } from "uuid";

interface FormState {
  clientName: string;
  businessName: string;
  phoneNumber: string;
  contactEmail: string;
  preferredDate: string;
  preferredTimeWindow: string;
  appointmentGoal: string;
  notes: string;
  script: string;
}

const defaultForm: FormState = {
  clientName: "",
  businessName: "",
  phoneNumber: "",
  contactEmail: "",
  preferredDate: "",
  preferredTimeWindow: "",
  appointmentGoal: "",
  notes: "",
  script: ""
};

const STORAGE_KEY = "callpilot-history";

const loadHistory = (): CallRequest[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CallRequest[];
    return parsed.map((call) => ({ ...call, createdAt: call.createdAt ?? new Date().toISOString() }));
  } catch (error) {
    console.warn("Failed to parse stored history", error);
    return [];
  }
};

const saveHistory = (calls: CallRequest[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(calls));
};

export default function Home() {
  const [form, setForm] = useState<FormState>(defaultForm);
  const [history, setHistory] = useState<CallRequest[]>([]);
  const [selectedCall, setSelectedCall] = useState<CallRequest | null>(null);
  const [scriptLoading, setScriptLoading] = useState(false);
  const [callLoading, setCallLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [insight, setInsight] = useState<string | null>(null);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  useEffect(() => {
    saveHistory(history);
  }, [history]);

  useEffect(() => {
    const score = computeReadinessScore(form);
    setInsight(readinessInsight(score, Boolean(form.script)));
  }, [form]);

  useEffect(() => {
    if (!selectedCall) return;
    setForm({
      clientName: selectedCall.clientName,
      businessName: selectedCall.businessName,
      phoneNumber: selectedCall.phoneNumber,
      contactEmail: selectedCall.contactEmail,
      preferredDate: selectedCall.preferredDate,
      preferredTimeWindow: selectedCall.preferredTimeWindow,
      appointmentGoal: selectedCall.appointmentGoal,
      notes: selectedCall.notes,
      script: selectedCall.script
    });
  }, [selectedCall]);

  const readinessScore = useMemo(() => computeReadinessScore(form), [form]);

  const handleChange = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleGenerateScript = async () => {
    setErrorMessage(null);
    setScriptLoading(true);
    try {
      const { script, ...rest } = form;
      const validated = scriptInputSchema.parse(rest);
      const response = await fetch("/api/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated)
      });

      if (!response.ok) {
        throw new Error("Failed to generate script");
      }

      const data = (await response.json()) as { script: string; usedFallback: boolean };
      setForm((prev) => ({ ...prev, script: data.script }));
      setInsight(
        data.usedFallback
          ? "AI fallback script created. Add more details or configure OPENAI_API_KEY for richer scripts."
          : "Script generated successfully. You can make edits before placing the call."
      );
    } catch (error) {
      console.error(error);
      setErrorMessage("We couldn't generate a script. Please refine the details and try again.");
    } finally {
      setScriptLoading(false);
    }
  };

  const handleQueueCall = async () => {
    setErrorMessage(null);
    setCallLoading(true);
    try {
      const validated = callRequestSchema.parse(form);
      const response = await fetch("/api/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated)
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.message ?? "Call request failed");
      }

      const result = await response.json();

      const call: CallRequest = {
        id: uuid(),
        ...validated,
        createdAt: new Date().toISOString(),
        status: result.status ?? "queued",
        resultMessage: result.message
      };

      setHistory((prev) => [call, ...prev]);
      setSelectedCall(call);
      setInsight("Call queued with Twilio. We'll update status when webhooks come in.");
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to queue the call. Please check configuration."
      );
    } finally {
      setCallLoading(false);
    }
  };

  const resetForm = () => {
    setForm(defaultForm);
    setSelectedCall(null);
  };

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pb-16 pt-12">
      <header className="flex flex-col gap-3">
        <div className="inline-flex max-w-fit items-center gap-2 rounded-full bg-blue-50 px-4 py-1 text-xs font-semibold text-blue-700">
          <span>CallPilot AI</span>
          <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            Voice Automation
          </span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
          Automate appointment scheduling calls with AI
        </h1>
        <p className="max-w-3xl text-base text-slate-600">
          Draft smart phone scripts, queue voice calls through Twilio, and keep every outreach neatly organized.
          Provide a few details about the appointment and let the AI handle the rest.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Call blueprint</h2>
            <p className="mt-1 text-sm text-slate-500">
              Fill in the key details and the AI will craft a persuasive calling script.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium text-slate-700">Your name</span>
                <input
                  type="text"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  value={form.clientName}
                  onChange={(event) => handleChange("clientName", event.target.value)}
                  placeholder="Jordan from Summit Dental"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium text-slate-700">Business / Team</span>
                <input
                  type="text"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  value={form.businessName}
                  onChange={(event) => handleChange("businessName", event.target.value)}
                  placeholder="Summit Dental Clinic"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium text-slate-700">Target phone number</span>
                <input
                  type="tel"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  value={form.phoneNumber}
                  onChange={(event) => handleChange("phoneNumber", event.target.value)}
                  placeholder="+15551231234"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium text-slate-700">Follow-up email</span>
                <input
                  type="email"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  value={form.contactEmail}
                  onChange={(event) => handleChange("contactEmail", event.target.value)}
                  placeholder="jordan@summitdental.com"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium text-slate-700">Preferred date</span>
                <input
                  type="date"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  value={form.preferredDate}
                  onChange={(event) => handleChange("preferredDate", event.target.value)}
                />
              </label>

              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium text-slate-700">Time window</span>
                <input
                  type="text"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  value={form.preferredTimeWindow}
                  onChange={(event) => handleChange("preferredTimeWindow", event.target.value)}
                  placeholder="Between 2-4 PM"
                />
              </label>
            </div>

            <label className="mt-4 flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Appointment objective</span>
              <textarea
                className="min-h-[90px] rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                value={form.appointmentGoal}
                onChange={(event) => handleChange("appointmentGoal", event.target.value)}
                placeholder="Schedule a yearly cleaning for Maria Lopez in the last week of November"
              />
            </label>

            <label className="mt-4 flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Extra context for the AI</span>
              <textarea
                className="min-h-[90px] rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                value={form.notes}
                onChange={(event) => handleChange("notes", event.target.value)}
                placeholder="Maria prefers weekday afternoons. Offer telehealth if in-person is unavailable."
              />
            </label>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleGenerateScript}
                disabled={scriptLoading}
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {scriptLoading ? "Generating..." : "Generate AI script"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              >
                Reset form
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-slate-900">Call script</h2>
              <span className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                Readiness: {readinessScore}%
              </span>
            </div>

            <textarea
              className="mt-4 min-h-[200px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
              value={form.script}
              onChange={(event) => handleChange("script", event.target.value)}
              placeholder="Your AI-generated call script will appear here."
            />

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleQueueCall}
                disabled={callLoading}
                className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
              >
                {callLoading ? "Queuing call..." : "Queue live call"}
              </button>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(form.script).catch(() => undefined);
                }}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              >
                Copy script
              </button>
            </div>

            {errorMessage && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                {errorMessage}
              </div>
            )}

            {insight && (
              <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                {insight}
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Call queue</h2>
            <p className="mt-1 text-xs text-slate-500">Recent AI-powered outreach attempts.</p>

            <div className="mt-4 max-h-[420px] space-y-3 overflow-y-auto pr-1">
              <CallHistoryList
                calls={history}
                onSelect={(call) => {
                  setSelectedCall(call);
                }}
              />
            </div>
          </div>

          {selectedCall && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Selected call</h3>
              <dl className="mt-4 space-y-2 text-sm text-slate-600">
                <div>
                  <dt className="font-medium text-slate-700">Contact</dt>
                  <dd>
                    {selectedCall.clientName} → {selectedCall.businessName}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-700">Phone</dt>
                  <dd>{selectedCall.phoneNumber}</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-700">Created</dt>
                  <dd>{new Date(selectedCall.createdAt).toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-700">Status message</dt>
                  <dd>{selectedCall.resultMessage ?? "Queued with provider"}</dd>
                </div>
              </dl>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}
