"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface WeeklyRow {
  weekStart: string;
  weekEnd: string;
  placements: number;
  hours: number;
  avgRate: number;
  earned: number;
  status: string;
}

interface CommissionData {
  thisMonth: { placements: number; commission: number };
  lastMonth: { placements: number; commission: number };
  allTime: number;
  avgPerPlacement: number;
  weeklyBreakdown: WeeklyRow[];
}

export default function CommissionPage() {
  const [data, setData] = useState<CommissionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<CommissionData>("/commission/summary").then((res) => {
      setData(res.data ?? null);
      setLoading(false);
    });
  }, []);

  const formatWeek = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-SG", { day: "numeric", month: "short" });
  };

  if (loading || !data) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-sm text-muted">Loading commission data...</div>
      </div>
    );
  }

  const stats = [
    { label: "This Month", value: `$${data.thisMonth.commission.toLocaleString()}`, accent: true },
    { label: "Last Month", value: `$${data.lastMonth.commission.toLocaleString()}`, accent: false },
    { label: "All Time", value: `$${data.allTime.toLocaleString()}`, accent: false },
    { label: "Avg / Placement", value: `$${data.avgPerPlacement.toFixed(0)}`, accent: false },
  ];

  return (
    <div className="p-8">
      <h1 className="font-heading text-2xl font-bold text-ink">Commission</h1>
      <p className="mt-1 text-sm text-muted">Track your earnings and payouts.</p>

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

      {/* Weekly Breakdown */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-ink">Weekly Breakdown</h2>

        {data.weeklyBreakdown.length === 0 ? (
          <div className="mt-4 rounded-xl border border-border bg-card p-12 text-center">
            <p className="text-sm text-muted">No commission data yet.</p>
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-cream/40">
                  <th className="px-5 py-3 font-semibold text-muted">Week</th>
                  <th className="px-5 py-3 font-semibold text-muted">Placements</th>
                  <th className="px-5 py-3 font-semibold text-muted">Hours</th>
                  <th className="px-5 py-3 font-semibold text-muted">Avg Rate</th>
                  <th className="px-5 py-3 font-semibold text-muted">Earned</th>
                  <th className="px-5 py-3 font-semibold text-muted">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.weeklyBreakdown.map((row) => (
                  <tr key={row.weekStart} className="transition-colors hover:bg-cream/30">
                    <td className="px-5 py-4 text-ink">
                      {formatWeek(row.weekStart)} – {formatWeek(row.weekEnd)}
                    </td>
                    <td className="px-5 py-4 font-semibold text-ink">{row.placements}</td>
                    <td className="px-5 py-4 font-mono text-xs text-ink">{row.hours.toFixed(1)}</td>
                    <td className="px-5 py-4 font-mono text-xs text-ink">{row.avgRate.toFixed(1)}%</td>
                    <td className="px-5 py-4 font-semibold text-accent">${row.earned.toFixed(2)}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          row.status === "Paid"
                            ? "bg-green-50 text-green-700"
                            : "bg-yellow-50 text-yellow-700"
                        }`}
                      >
                        {row.status}
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
