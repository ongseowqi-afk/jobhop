"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface TimesheetRow {
  id: string;
  workerName: string;
  workerPhone: string | null;
  shiftId: string;
  jobTitle: string;
  clientName: string;
  date: string;
  shiftStart: string;
  shiftEnd: string;
  clockIn: string;
  clockOut: string | null;
  totalHours: number | null;
  status: string;
}

type TabFilter = "ALL" | "PENDING" | "APPROVED" | "FLAGGED";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-50 text-yellow-700",
  APPROVED: "bg-green-50 text-green-700",
  FLAGGED: "bg-red-50 text-red-600",
  REJECTED: "bg-red-50 text-red-600",
};

export function TimesheetTable({ initialTimesheets }: { initialTimesheets: TimesheetRow[] }) {
  const router = useRouter();
  const [timesheets, setTimesheets] = useState<TimesheetRow[]>(initialTimesheets);
  const [tab, setTab] = useState<TabFilter>("ALL");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [flagTarget, setFlagTarget] = useState<TimesheetRow | null>(null);
  const [flagReason, setFlagReason] = useState("");
  const [viewTarget, setViewTarget] = useState<TimesheetRow | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("timesheets-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "Timesheet" },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  useEffect(() => {
    setTimesheets(initialTimesheets);
  }, [initialTimesheets]);

  const filtered = tab === "ALL" ? timesheets : timesheets.filter((t) => t.status === tab);

  const counts = {
    ALL: timesheets.length,
    PENDING: timesheets.filter((t) => t.status === "PENDING").length,
    APPROVED: timesheets.filter((t) => t.status === "APPROVED").length,
    FLAGGED: timesheets.filter((t) => t.status === "FLAGGED").length,
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit" });

  const handleApprove = async (id: string) => {
    if (!confirm("Approve this timesheet?")) return;
    setLoadingId(id);
    try {
      const res = await fetch(`/api/timesheets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "APPROVED" }),
      });
      if (res.ok) {
        setTimesheets((prev) =>
          prev.map((t) => (t.id === id ? { ...t, status: "APPROVED" } : t))
        );
      }
    } finally {
      setLoadingId(null);
    }
  };

  const handleFlag = async () => {
    if (!flagTarget || !flagReason.trim()) return;
    setLoadingId(flagTarget.id);
    try {
      const res = await fetch(`/api/timesheets/${flagTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "FLAGGED", reason: flagReason.trim() }),
      });
      if (res.ok) {
        setTimesheets((prev) =>
          prev.map((t) => (t.id === flagTarget.id ? { ...t, status: "FLAGGED" } : t))
        );
        setFlagTarget(null);
        setFlagReason("");
      }
    } finally {
      setLoadingId(null);
    }
  };

  const TABS: { key: TabFilter; label: string }[] = [
    { key: "ALL", label: "All" },
    { key: "PENDING", label: "Pending" },
    { key: "APPROVED", label: "Approved" },
    { key: "FLAGGED", label: "Flagged" },
  ];

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-ink">Timesheets</h1>
        <p className="mt-1 text-sm text-muted">
          Review and approve worker timesheets.
          <span className="ml-2 inline-flex items-center gap-1 text-xs text-green-600">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            Live updates
          </span>
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-lg bg-cream/60 p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key ? "bg-card text-ink shadow-sm" : "text-muted hover:text-ink"
            }`}
          >
            {t.label}
            <span className="ml-1.5 text-xs text-muted">{counts[t.key]}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <div className="text-4xl">📋</div>
          <p className="mt-3 text-lg font-semibold text-ink">No timesheets</p>
          <p className="mt-1 text-sm text-muted">
            {tab === "PENDING" ? "No timesheets pending review." : "No timesheets in this category."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-cream/40">
                <th className="px-5 py-3 font-semibold text-muted">Worker</th>
                <th className="px-5 py-3 font-semibold text-muted">Shift</th>
                <th className="px-5 py-3 font-semibold text-muted">Client</th>
                <th className="px-5 py-3 font-semibold text-muted">Date</th>
                <th className="px-5 py-3 font-semibold text-muted">Clock In</th>
                <th className="px-5 py-3 font-semibold text-muted">Clock Out</th>
                <th className="px-5 py-3 font-semibold text-muted">Total Hrs</th>
                <th className="px-5 py-3 font-semibold text-muted">Status</th>
                <th className="px-5 py-3 text-right font-semibold text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((t) => {
                const isLoading = loadingId === t.id;
                return (
                  <tr key={t.id} className="transition-colors hover:bg-cream/30">
                    <td className="px-5 py-4">
                      <span className="font-medium text-ink">{t.workerName}</span>
                      {t.workerPhone && (
                        <span className="ml-1 text-xs text-muted">{t.workerPhone}</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-ink">{t.jobTitle}</td>
                    <td className="px-5 py-4 text-muted">{t.clientName}</td>
                    <td className="px-5 py-4 text-ink">{formatDate(t.date)}</td>
                    <td className="whitespace-nowrap px-5 py-4 font-mono text-xs text-ink">
                      {formatTime(t.clockIn)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 font-mono text-xs text-ink">
                      {t.clockOut ? formatTime(t.clockOut) : <span className="text-muted">—</span>}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs font-semibold text-ink">
                      {t.totalHours != null ? `${t.totalHours.toFixed(2)}` : "—"}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${
                          STATUS_STYLES[t.status] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {t.status === "PENDING" ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApprove(t.id)}
                            disabled={isLoading}
                            className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                          >
                            {isLoading ? "..." : "Approve"}
                          </button>
                          <button
                            onClick={() => {
                              setFlagTarget(t);
                              setFlagReason("");
                            }}
                            disabled={isLoading}
                            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                          >
                            Flag
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setViewTarget(t)}
                          className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:bg-cream hover:text-ink"
                        >
                          View
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Flag Modal */}
      {flagTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setFlagTarget(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-ink">Flag Timesheet</h3>
            <p className="mt-1 text-sm text-muted">
              {flagTarget.workerName} — {flagTarget.jobTitle} on {formatDate(flagTarget.date)}
            </p>
            <div className="mt-4">
              <label className="mb-1 block text-xs font-semibold text-muted">Reason</label>
              <textarea
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                placeholder="Why is this timesheet being flagged?"
                rows={3}
                className="w-full resize-none rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-red-200"
              />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setFlagTarget(null)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:bg-cream"
              >
                Cancel
              </button>
              <button
                onClick={handleFlag}
                disabled={!flagReason.trim() || loadingId === flagTarget.id}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {loadingId === flagTarget.id ? "Flagging..." : "Flag Timesheet"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setViewTarget(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-ink">Timesheet Details</h3>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Worker</span>
                <span className="font-medium text-ink">{viewTarget.workerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Shift</span>
                <span className="font-medium text-ink">{viewTarget.jobTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Client</span>
                <span className="font-medium text-ink">{viewTarget.clientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Date</span>
                <span className="font-medium text-ink">{formatDate(viewTarget.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Scheduled</span>
                <span className="font-mono text-xs font-medium text-ink">
                  {viewTarget.shiftStart} – {viewTarget.shiftEnd}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Clock In</span>
                <span className="font-mono text-xs font-medium text-ink">{formatTime(viewTarget.clockIn)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Clock Out</span>
                <span className="font-mono text-xs font-medium text-ink">
                  {viewTarget.clockOut ? formatTime(viewTarget.clockOut) : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Total Hours</span>
                <span className="font-mono text-xs font-semibold text-ink">
                  {viewTarget.totalHours != null ? `${viewTarget.totalHours.toFixed(2)} hrs` : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Status</span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    STATUS_STYLES[viewTarget.status] ?? "bg-gray-100 text-gray-600"
                  }`}
                >
                  {viewTarget.status}
                </span>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setViewTarget(null)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:bg-cream"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
