"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

interface Job {
  id: string;
  title: string;
  category: string;
  location: string;
  payRate: number;
  slotsTotal: number;
  slotsFilled: number;
  status: string;
  startDate: string;
  endDate: string | null;
  client: { name: string; industry: string };
  shiftCount: number;
  applicationCount: number;
}

export default function JobOrdersPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<Job[]>("/jobs").then((res) => {
      setJobs(res.data ?? []);
      setLoading(false);
    });
  }, []);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-SG", { day: "numeric", month: "short" });

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-sm text-muted">Loading job orders...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="font-heading text-2xl font-bold text-ink">Job Orders</h1>
      <p className="mt-1 text-sm text-muted">{jobs.length} open job{jobs.length !== 1 ? "s" : ""}</p>

      {jobs.length === 0 ? (
        <div className="mt-6 rounded-xl border border-border bg-card p-12 text-center">
          <div className="text-4xl">📋</div>
          <p className="mt-3 text-lg font-semibold text-ink">No open job orders</p>
          <p className="mt-1 text-sm text-muted">Jobs created by the agency will appear here.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((j) => {
            const slotsLeft = j.slotsTotal - j.slotsFilled;
            const fillPct = j.slotsTotal > 0 ? Math.round((j.slotsFilled / j.slotsTotal) * 100) : 0;
            const commissionRate = 10;

            return (
              <div key={j.id} className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-ink">{j.title}</h3>
                    <p className="text-xs text-muted">{j.client.name}</p>
                  </div>
                  <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">
                    ×{slotsLeft} slots
                  </span>
                </div>

                <div className="mt-3 space-y-2 text-xs text-muted">
                  <div className="flex items-center gap-1.5">
                    <span>📍</span> {j.location}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span>📅</span> {formatDate(j.startDate)}
                    {j.endDate ? ` – ${formatDate(j.endDate)}` : " (ongoing)"}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span>🏷️</span> {j.category}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                  <div>
                    <span className="text-lg font-bold text-ink">${j.payRate.toFixed(2)}</span>
                    <span className="text-xs text-muted">/hr</span>
                  </div>
                  <div className="text-right text-xs">
                    <span className="font-semibold text-ink">{j.slotsFilled}/{j.slotsTotal}</span>
                    <span className="text-muted"> placed</span>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="text-accent font-semibold">{commissionRate}%</span>
                      <span className="text-muted">commission</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="h-1.5 overflow-hidden rounded-full bg-border">
                    <div
                      className={`h-full rounded-full ${fillPct >= 100 ? "bg-green-500" : "bg-accent"}`}
                      style={{ width: `${fillPct}%` }}
                    />
                  </div>
                </div>

                <button
                  onClick={() => router.push("/candidates")}
                  className="mt-4 w-full rounded-lg border border-border py-2 text-xs font-semibold text-ink transition-colors hover:bg-cream"
                >
                  Match Candidates
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
