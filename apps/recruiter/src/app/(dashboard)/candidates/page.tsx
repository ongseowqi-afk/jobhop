"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface Worker {
  id: string;
  name: string;
  phone: string | null;
  rating: number;
  showRate: number;
  skills: string[];
  stage: string;
  isAvailable: boolean;
}

interface Job {
  id: string;
  title: string;
  client: { name: string };
  payRate: number;
  slotsTotal: number;
  slotsFilled: number;
}

const STAGE_STYLES: Record<string, string> = {
  Screening: "bg-yellow-50 text-yellow-700",
  Ready: "bg-green-50 text-green-700",
  Placed: "bg-blue-50 text-blue-700",
};

export default function CandidatesPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [placeTarget, setPlaceTarget] = useState<Worker | null>(null);
  const [selectedJob, setSelectedJob] = useState("");
  const [commissionRate, setCommissionRate] = useState(10);
  const [placing, setPlacing] = useState(false);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    Promise.all([
      apiFetch<Worker[]>("/workers"),
      apiFetch<Job[]>("/jobs?status=OPEN"),
    ]).then(([wRes, jRes]) => {
      setWorkers(wRes.data ?? []);
      setJobs(jRes.data ?? []);
      setLoading(false);
    });
  }, []);

  const handlePlace = async () => {
    if (!placeTarget || !selectedJob) return;
    setPlacing(true);
    const { error } = await apiFetch("/placements", {
      method: "POST",
      body: JSON.stringify({
        workerId: placeTarget.id,
        jobId: selectedJob,
        commissionRate,
      }),
    });
    setPlacing(false);
    if (error) {
      alert(error);
      return;
    }
    setWorkers((prev) =>
      prev.map((w) => (w.id === placeTarget.id ? { ...w, stage: "Placed" } : w))
    );
    setPlaceTarget(null);
    setSelectedJob("");
  };

  const renderStars = (rating: number) => {
    const full = Math.round(rating);
    return (
      <span className="flex gap-0.5 text-gold">
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={i <= full ? "opacity-100" : "opacity-25"}>★</span>
        ))}
        <span className="ml-1 font-mono text-xs text-ink">{rating.toFixed(1)}</span>
      </span>
    );
  };

  const filtered = filter === "All" ? workers : workers.filter((w) => w.stage === filter);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-sm text-muted">Loading candidates...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-ink">Candidates</h1>
          <p className="mt-1 text-sm text-muted">{workers.length} candidates in your pipeline</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="mt-4 flex gap-1 rounded-lg bg-cream/60 p-1">
        {["All", "Screening", "Ready", "Placed"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              filter === f ? "bg-card text-ink shadow-sm" : "text-muted hover:text-ink"
            }`}
          >
            {f}
            <span className="ml-1.5 text-xs text-muted">
              {f === "All" ? workers.length : workers.filter((w) => w.stage === f).length}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-cream/40">
              <th className="px-5 py-3 font-semibold text-muted">Name</th>
              <th className="px-5 py-3 font-semibold text-muted">Skills</th>
              <th className="px-5 py-3 font-semibold text-muted">Rating</th>
              <th className="px-5 py-3 font-semibold text-muted">Show Rate</th>
              <th className="px-5 py-3 font-semibold text-muted">Stage</th>
              <th className="px-5 py-3 text-right font-semibold text-muted">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-sm text-muted">
                  No candidates in this stage.
                </td>
              </tr>
            ) : (
              filtered.map((w) => (
                <tr key={w.id} className="transition-colors hover:bg-cream/30">
                  <td className="px-5 py-4">
                    <span className="font-medium text-ink">{w.name}</span>
                    {w.phone && <span className="ml-2 text-xs text-muted">{w.phone}</span>}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1">
                      {w.skills.slice(0, 3).map((s) => (
                        <span key={s} className="rounded bg-cream px-1.5 py-0.5 text-[10px] font-medium text-muted">
                          {s}
                        </span>
                      ))}
                      {w.skills.length > 3 && (
                        <span className="text-[10px] text-muted">+{w.skills.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4">{renderStars(w.rating)}</td>
                  <td className="px-5 py-4">
                    <span className="font-mono text-xs font-semibold text-ink">{w.showRate}%</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STAGE_STYLES[w.stage] ?? "bg-gray-100 text-gray-600"}`}>
                      {w.stage}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    {w.stage === "Ready" && (
                      <button
                        onClick={() => {
                          setPlaceTarget(w);
                          setSelectedJob("");
                          setCommissionRate(10);
                        }}
                        className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent/90"
                      >
                        Place
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Place Modal */}
      {placeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setPlaceTarget(null)}>
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-ink">Place {placeTarget.name}</h3>
            <p className="mt-1 text-sm text-muted">Select a job order and set commission rate.</p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted">Job Order</label>
                <select
                  value={selectedJob}
                  onChange={(e) => setSelectedJob(e.target.value)}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-accent/30"
                >
                  <option value="">Select a job...</option>
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title} — {j.client.name} (${j.payRate}/hr, {j.slotsTotal - j.slotsFilled} slots)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-muted">Commission Rate (%)</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(Number(e.target.value))}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setPlaceTarget(null)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:bg-cream"
              >
                Cancel
              </button>
              <button
                onClick={handlePlace}
                disabled={placing || !selectedJob}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/90 disabled:opacity-50"
              >
                {placing ? "Placing..." : "Confirm Placement"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
