"use client";

import { useState } from "react";

interface Worker {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  rating: number;
  showRate: number;
  shiftsCount: number;
  verificationStatus: string;
  isAvailable: boolean;
  skills: string[];
  stage: string;
}

const STAGE_TABS = ["All", "Ready", "Placed", "Screening"] as const;

const STAGE_COLORS: Record<string, string> = {
  Ready: "bg-green-100 text-green-700",
  Placed: "bg-blue-100 text-blue-700",
  Screening: "bg-yellow-100 text-yellow-700",
};

const VERIFY_COLORS: Record<string, string> = {
  VERIFIED: "bg-green-100 text-green-700",
  PENDING_VERIFICATION: "bg-yellow-100 text-yellow-700",
  UNVERIFIED: "bg-gray-100 text-gray-600",
  REJECTED: "bg-red-100 text-red-700",
};

function StarsDisplay({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= Math.round(rating) ? "text-yellow-400" : "text-gray-200"}>
          ★
        </span>
      ))}
      <span className="ml-1 text-xs text-muted font-mono">{rating.toFixed(1)}</span>
    </span>
  );
}

export default function RosterTable({ initialWorkers }: { initialWorkers: Worker[] }) {
  const [activeTab, setActiveTab] = useState<string>("All");
  const [search, setSearch] = useState("");

  const filtered = initialWorkers.filter((w) => {
    const matchStage = activeTab === "All" || w.stage === activeTab;
    const matchSearch =
      !search ||
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      (w.phone ?? "").includes(search) ||
      w.skills.some((s) => s.toLowerCase().includes(search.toLowerCase()));
    return matchStage && matchSearch;
  });

  return (
    <div>
      {/* Search + Tabs */}
      <div className="mb-4 flex items-center gap-4">
        <input
          type="text"
          placeholder="Search by name, phone or skill…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-72 rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent2/30"
        />
        <div className="flex gap-1">
          {STAGE_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "bg-ink text-white"
                  : "bg-card text-muted hover:text-ink border border-border"
              }`}
            >
              {tab}
              <span className="ml-1.5 text-xs opacity-60">
                {tab === "All"
                  ? initialWorkers.length
                  : initialWorkers.filter((w) => w.stage === tab).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-cream/50">
              <th className="px-4 py-3 text-left font-semibold text-ink">Worker</th>
              <th className="px-4 py-3 text-left font-semibold text-ink">Skills</th>
              <th className="px-4 py-3 text-left font-semibold text-ink">Rating</th>
              <th className="px-4 py-3 text-right font-semibold text-ink">Show Rate</th>
              <th className="px-4 py-3 text-right font-semibold text-ink">Shifts</th>
              <th className="px-4 py-3 text-left font-semibold text-ink">Stage</th>
              <th className="px-4 py-3 text-left font-semibold text-ink">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-ink">Available</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-muted">
                  No workers found
                </td>
              </tr>
            ) : (
              filtered.map((w) => (
                <tr key={w.id} className="hover:bg-cream/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-ink">{w.name}</div>
                    <div className="text-xs text-muted">{w.phone ?? w.email ?? "—"}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {w.skills.slice(0, 3).map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full bg-cream px-2 py-0.5 text-xs text-muted border border-border"
                        >
                          {skill}
                        </span>
                      ))}
                      {w.skills.length > 3 && (
                        <span className="text-xs text-muted">+{w.skills.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StarsDisplay rating={w.rating} />
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm">
                    {w.showRate}%
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm">
                    {w.shiftsCount}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        STAGE_COLORS[w.stage] ?? "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {w.stage}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        VERIFY_COLORS[w.verificationStatus] ?? "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {w.verificationStatus.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block h-2.5 w-2.5 rounded-full ${
                        w.isAvailable ? "bg-green-400" : "bg-gray-300"
                      }`}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
