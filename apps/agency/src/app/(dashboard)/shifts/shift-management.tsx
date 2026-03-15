"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Assignment {
  id: string;
  status: string;
  workerId: string;
  workerName: string;
  workerPhone: string | null;
}

interface ShiftRow {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  slotsTotal: number;
  slotsFilled: number;
  jobId: string;
  jobTitle: string;
  clientName: string;
  location: string;
  assignments: Assignment[];
}

interface JobOption {
  id: string;
  title: string;
  clientName: string;
}

interface WorkerOption {
  id: string;
  name: string;
  phone: string | null;
}

interface Props {
  initialShifts: ShiftRow[];
  jobs: JobOption[];
  workers: WorkerOption[];
}

export function ShiftManagement({ initialShifts, jobs, workers }: Props) {
  const router = useRouter();
  const [shifts] = useState<ShiftRow[]>(initialShifts);
  const [showCreate, setShowCreate] = useState(false);
  const [assignTarget, setAssignTarget] = useState<ShiftRow | null>(null);

  const [createForm, setCreateForm] = useState({
    jobId: "",
    date: "",
    startTime: "09:00",
    endTime: "17:00",
    slotsTotal: 1,
  });
  const [creating, setCreating] = useState(false);

  const [assignWorkerId, setAssignWorkerId] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [workerSearch, setWorkerSearch] = useState("");

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-SG", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

  const fillPercent = (filled: number, total: number) =>
    total > 0 ? Math.round((filled / total) * 100) : 0;

  const handleCreate = async () => {
    if (!createForm.jobId || !createForm.date) return;
    setCreating(true);
    try {
      const res = await fetch("/api/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...createForm, slotsTotal: Number(createForm.slotsTotal) }),
      });
      if (res.ok) {
        setShowCreate(false);
        setCreateForm({ jobId: "", date: "", startTime: "09:00", endTime: "17:00", slotsTotal: 1 });
        router.refresh();
      }
    } finally {
      setCreating(false);
    }
  };

  const handleAssign = async () => {
    if (!assignTarget || !assignWorkerId) return;
    setAssigning(true);
    try {
      const res = await fetch(`/api/shifts/${assignTarget.id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerId: assignWorkerId }),
      });
      if (res.ok) {
        setAssignTarget(null);
        setAssignWorkerId("");
        setWorkerSearch("");
        router.refresh();
      }
    } finally {
      setAssigning(false);
    }
  };

  const assignedWorkerIds = new Set(assignTarget?.assignments.map((a) => a.workerId) ?? []);
  const availableWorkers = workers.filter(
    (w) => !assignedWorkerIds.has(w.id) && (workerSearch === "" || w.name.toLowerCase().includes(workerSearch.toLowerCase()) || (w.phone ?? "").includes(workerSearch))
  );

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-ink">Shift Management</h1>
          <p className="mt-1 text-sm text-muted">{shifts.length} shift{shifts.length !== 1 ? "s" : ""} total</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent/90"
        >
          <span className="text-lg leading-none">+</span>
          Create Shift
        </button>
      </div>

      {/* Table */}
      {shifts.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <div className="text-4xl">📋</div>
          <p className="mt-3 text-lg font-semibold text-ink">No shifts yet</p>
          <p className="mt-1 text-sm text-muted">Create a shift to get started.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-cream/40">
                <th className="px-5 py-3 font-semibold text-muted">Shift</th>
                <th className="px-5 py-3 font-semibold text-muted">Client</th>
                <th className="px-5 py-3 font-semibold text-muted">Location</th>
                <th className="px-5 py-3 font-semibold text-muted">Date</th>
                <th className="px-5 py-3 font-semibold text-muted">Time</th>
                <th className="px-5 py-3 font-semibold text-muted">Workers</th>
                <th className="px-5 py-3 font-semibold text-muted">Fill Rate</th>
                <th className="px-5 py-3 text-right font-semibold text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {shifts.map((s) => {
                const pct = fillPercent(s.slotsFilled, s.slotsTotal);
                const barColor = pct >= 100 ? "bg-green-500" : pct >= 50 ? "bg-accent2" : "bg-accent";
                const isFull = s.slotsFilled >= s.slotsTotal;
                return (
                  <tr key={s.id} className="transition-colors hover:bg-cream/30">
                    <td className="px-5 py-4 font-medium text-ink">{s.jobTitle}</td>
                    <td className="px-5 py-4 text-muted">{s.clientName}</td>
                    <td className="px-5 py-4 text-muted">{s.location}</td>
                    <td className="px-5 py-4 text-ink">{formatDate(s.date)}</td>
                    <td className="whitespace-nowrap px-5 py-4 font-mono text-xs text-ink">
                      {s.startTime} – {s.endTime}
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-semibold text-ink">{s.slotsFilled}</span>
                      <span className="text-muted">/{s.slotsTotal}</span>
                      {s.assignments.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {s.assignments.map((a) => (
                            <span
                              key={a.id}
                              className="inline-block rounded bg-cream px-1.5 py-0.5 text-[10px] font-medium text-muted"
                            >
                              {a.workerName}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 overflow-hidden rounded-full bg-border">
                          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-medium text-muted">{pct}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/shifts/${s.id}`}
                          className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:bg-cream hover:text-ink"
                        >
                          QR
                        </Link>
                        <button
                          onClick={() => {
                            setAssignTarget(s);
                            setAssignWorkerId("");
                            setWorkerSearch("");
                          }}
                          disabled={isFull}
                          className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-cream disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {isFull ? "Full" : "Assign"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Shift Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-ink">Create Shift</h3>
            <p className="mt-1 text-sm text-muted">Add a new shift for an active job.</p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted">Job</label>
                <select
                  value={createForm.jobId}
                  onChange={(e) => setCreateForm((f) => ({ ...f, jobId: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-accent/30"
                >
                  <option value="">Select a job...</option>
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title} — {j.clientName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-muted">Date</label>
                <input
                  type="date"
                  value={createForm.date}
                  onChange={(e) => setCreateForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted">Start Time</label>
                  <input
                    type="time"
                    value={createForm.startTime}
                    onChange={(e) => setCreateForm((f) => ({ ...f, startTime: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-accent/30"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted">End Time</label>
                  <input
                    type="time"
                    value={createForm.endTime}
                    onChange={(e) => setCreateForm((f) => ({ ...f, endTime: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-accent/30"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-muted">Slots</label>
                <input
                  type="number"
                  min={1}
                  value={createForm.slotsTotal}
                  onChange={(e) => setCreateForm((f) => ({ ...f, slotsTotal: Number(e.target.value) }))}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowCreate(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:bg-cream"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !createForm.jobId || !createForm.date}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent/90 disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create Shift"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Worker Modal */}
      {assignTarget && (
        <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/50 sm:items-center sm:justify-center" onClick={() => setAssignTarget(null)}>
          <div
            className="w-full max-w-md rounded-t-2xl bg-card p-6 shadow-xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-ink">Assign Worker</h3>
            <p className="mt-1 text-sm text-muted">
              {assignTarget.jobTitle} — {formatDate(assignTarget.date)}, {assignTarget.startTime}–{assignTarget.endTime}
            </p>
            <p className="mt-0.5 text-xs text-muted">
              {assignTarget.slotsFilled}/{assignTarget.slotsTotal} filled
            </p>

            {assignTarget.assignments.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold text-muted">Currently Assigned</p>
                <div className="flex flex-wrap gap-1.5">
                  {assignTarget.assignments.map((a) => (
                    <span key={a.id} className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                      {a.workerName}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4">
              <label className="mb-1 block text-xs font-semibold text-muted">Search verified workers</label>
              <input
                type="text"
                placeholder="Name or phone..."
                value={workerSearch}
                onChange={(e) => setWorkerSearch(e.target.value)}
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>

            <div className="mt-3 max-h-52 space-y-1 overflow-y-auto">
              {availableWorkers.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted">No available workers found.</p>
              ) : (
                availableWorkers.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => setAssignWorkerId(w.id)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                      assignWorkerId === w.id
                        ? "bg-accent/10 ring-1 ring-accent"
                        : "hover:bg-cream"
                    }`}
                  >
                    <div>
                      <span className="font-medium text-ink">{w.name}</span>
                      {w.phone && <span className="ml-2 text-xs text-muted">{w.phone}</span>}
                    </div>
                    {assignWorkerId === w.id && (
                      <span className="text-xs font-bold text-accent">Selected</span>
                    )}
                  </button>
                ))
              )}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setAssignTarget(null)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:bg-cream"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={assigning || !assignWorkerId}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent/90 disabled:opacity-50"
              >
                {assigning ? "Assigning..." : "Assign Worker"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
