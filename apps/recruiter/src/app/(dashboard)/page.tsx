"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface Placement {
  id: string;
  workerName: string;
  jobTitle: string;
  clientName: string;
  commissionRate: number;
  totalCommission: number;
  status: string;
  createdAt: string;
}

interface CommissionSummary {
  thisMonth: { placements: number; commission: number };
  lastMonth: { placements: number; commission: number };
  allTime: number;
  avgPerPlacement: number;
}

interface JobOrder {
  id: string;
  status: string;
}

interface Candidate {
  id: string;
  stage: string;
}

export default function DashboardPage() {
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [commission, setCommission] = useState<CommissionSummary | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<JobOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch<Placement[]>("/placements?mine=true"),
      apiFetch<CommissionSummary>("/commission/summary"),
      apiFetch<Candidate[]>("/workers"),
      apiFetch<JobOrder[]>("/jobs?status=OPEN"),
    ]).then(([pRes, cRes, wRes, jRes]) => {
      setPlacements(pRes.data ?? []);
      setCommission(cRes.data ?? null);
      setCandidates(wRes.data ?? []);
      setJobs(jRes.data ?? []);
      setLoading(false);
    });
  }, []);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-SG", { day: "numeric", month: "short" });

  const activeCandidates = candidates.filter((c) => c.stage !== "Placed").length;
  const placementsMTD = commission?.thisMonth.placements ?? 0;
  const commissionMTD = commission?.thisMonth.commission ?? 0;
  const openJobs = jobs.length;

  const stats = [
    { label: "Active Candidates", value: activeCandidates.toString(), accent: false },
    { label: "Placements MTD", value: placementsMTD.toString(), accent: false },
    { label: "Commission MTD", value: `$${commissionMTD.toLocaleString()}`, accent: true },
    { label: "Open Job Orders", value: openJobs.toString(), accent: false },
  ];

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-sm text-muted">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="font-heading text-2xl font-bold text-ink">Dashboard</h1>
      <p className="mt-1 text-sm text-muted">Welcome back. Here&apos;s your overview.</p>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{s.label}</p>
            <p className={`mt-2 text-3xl font-bold ${s.accent ? "text-accent" : "text-ink"}`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Recent Placements */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-ink">Recent Placements</h2>
        {placements.length === 0 ? (
          <div className="mt-4 rounded-xl border border-border bg-card p-12 text-center">
            <p className="text-sm text-muted">No placements yet. Start by placing candidates from the Candidates page.</p>
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-cream/40">
                  <th className="px-5 py-3 font-semibold text-muted">Worker</th>
                  <th className="px-5 py-3 font-semibold text-muted">Job</th>
                  <th className="px-5 py-3 font-semibold text-muted">Client</th>
                  <th className="px-5 py-3 font-semibold text-muted">Date</th>
                  <th className="px-5 py-3 font-semibold text-muted">Rate</th>
                  <th className="px-5 py-3 font-semibold text-muted">Commission</th>
                  <th className="px-5 py-3 font-semibold text-muted">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {placements.slice(0, 10).map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-cream/30">
                    <td className="px-5 py-4 font-medium text-ink">{p.workerName}</td>
                    <td className="px-5 py-4 text-ink">{p.jobTitle}</td>
                    <td className="px-5 py-4 text-muted">{p.clientName}</td>
                    <td className="px-5 py-4 text-ink">{formatDate(p.createdAt)}</td>
                    <td className="px-5 py-4 font-mono text-xs text-ink">{p.commissionRate}%</td>
                    <td className="px-5 py-4 font-semibold text-accent">
                      ${p.totalCommission.toFixed(2)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          p.status === "ACTIVE" || p.status === "CONFIRMED"
                            ? "bg-green-50 text-green-700"
                            : p.status === "COMPLETED"
                              ? "bg-gray-100 text-gray-600"
                              : "bg-yellow-50 text-yellow-700"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
