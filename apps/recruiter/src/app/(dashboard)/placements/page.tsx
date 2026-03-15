"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface Placement {
  id: string;
  workerName: string;
  workerPhone: string | null;
  jobTitle: string;
  clientName: string;
  recruiterName: string;
  commissionRate: number;
  totalCommission: number;
  totalHours: number;
  status: string;
  createdAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-50 text-yellow-700",
  CONFIRMED: "bg-blue-50 text-blue-700",
  ACTIVE: "bg-green-50 text-green-700",
  COMPLETED: "bg-gray-100 text-gray-600",
  CANCELLED: "bg-red-50 text-red-600",
};

export default function PlacementsPage() {
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<Placement[]>("/placements?mine=true").then((res) => {
      setPlacements(res.data ?? []);
      setLoading(false);
    });
  }, []);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-sm text-muted">Loading placements...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="font-heading text-2xl font-bold text-ink">Placements</h1>
      <p className="mt-1 text-sm text-muted">{placements.length} placement{placements.length !== 1 ? "s" : ""} total</p>

      {placements.length === 0 ? (
        <div className="mt-6 rounded-xl border border-border bg-card p-12 text-center">
          <div className="text-4xl">📌</div>
          <p className="mt-3 text-lg font-semibold text-ink">No placements yet</p>
          <p className="mt-1 text-sm text-muted">Place candidates from the Candidates page to see them here.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-cream/40">
                <th className="px-5 py-3 font-semibold text-muted">Worker</th>
                <th className="px-5 py-3 font-semibold text-muted">Job</th>
                <th className="px-5 py-3 font-semibold text-muted">Client</th>
                <th className="px-5 py-3 font-semibold text-muted">Date</th>
                <th className="px-5 py-3 font-semibold text-muted">Hours</th>
                <th className="px-5 py-3 font-semibold text-muted">Rate</th>
                <th className="px-5 py-3 font-semibold text-muted">Commission</th>
                <th className="px-5 py-3 font-semibold text-muted">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {placements.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-cream/30">
                  <td className="px-5 py-4 font-medium text-ink">{p.workerName}</td>
                  <td className="px-5 py-4 text-ink">{p.jobTitle}</td>
                  <td className="px-5 py-4 text-muted">{p.clientName}</td>
                  <td className="px-5 py-4 text-ink">{formatDate(p.createdAt)}</td>
                  <td className="px-5 py-4 font-mono text-xs text-ink">{p.totalHours.toFixed(1)}</td>
                  <td className="px-5 py-4 font-mono text-xs text-ink">{p.commissionRate}%</td>
                  <td className="px-5 py-4 font-semibold text-accent">${p.totalCommission.toFixed(2)}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[p.status] ?? "bg-gray-100 text-gray-600"}`}>
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
  );
}
