"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ClientCard {
  id: string;
  name: string;
  industry: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  createdAt: string;
  openShifts: number;
  workersDeployed: number;
  revenue: number;
  jobCount: number;
}

const INDUSTRY_COLORS: Record<string, string> = {
  Logistics: "bg-blue-50 text-blue-700",
  Retail: "bg-purple-50 text-purple-700",
  "Food & Beverage": "bg-orange-50 text-orange-700",
  Events: "bg-pink-50 text-pink-700",
  Technology: "bg-cyan-50 text-cyan-700",
};

export function ClientsGrid({ initialClients }: { initialClients: ClientCard[] }) {
  const router = useRouter();
  const [clients] = useState(initialClients);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: "",
    industry: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
  });
  const [adding, setAdding] = useState(false);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-SG", { month: "short", year: "numeric" });

  const handleAdd = async () => {
    if (!form.name || !form.industry || !form.contactName || !form.contactEmail) return;
    setAdding(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowAdd(false);
        setForm({ name: "", industry: "", contactName: "", contactEmail: "", contactPhone: "" });
        router.refresh();
      }
    } finally {
      setAdding(false);
    }
  };

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-ink">Clients</h1>
          <p className="mt-1 text-sm text-muted">{clients.length} client{clients.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent/90"
        >
          <span className="text-lg leading-none">+</span>
          Add Client
        </button>
      </div>

      {clients.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <div className="text-4xl">🏢</div>
          <p className="mt-3 text-lg font-semibold text-ink">No clients yet</p>
          <p className="mt-1 text-sm text-muted">Add your first client to start managing shifts and billing.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {clients.map((c) => {
            const industryStyle = INDUSTRY_COLORS[c.industry] ?? "bg-gray-100 text-gray-700";
            return (
              <div key={c.id} className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-ink">{c.name}</h3>
                    <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${industryStyle}`}>
                      {c.industry}
                    </span>
                  </div>
                  <div className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                    Active
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-cream/50 px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase text-muted">Open Shifts</p>
                    <p className="text-lg font-bold text-ink">{c.openShifts}</p>
                  </div>
                  <div className="rounded-lg bg-cream/50 px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase text-muted">Workers</p>
                    <p className="text-lg font-bold text-ink">{c.workersDeployed}</p>
                  </div>
                  <div className="rounded-lg bg-cream/50 px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase text-muted">Revenue</p>
                    <p className="text-lg font-bold text-ink">${c.revenue.toLocaleString()}</p>
                  </div>
                  <div className="rounded-lg bg-cream/50 px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase text-muted">Client Since</p>
                    <p className="text-sm font-bold text-ink">{formatDate(c.createdAt)}</p>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Link
                    href="/shifts"
                    className="flex-1 rounded-lg border border-border py-2 text-center text-xs font-semibold text-ink transition-colors hover:bg-cream"
                  >
                    Manage Shifts
                  </Link>
                  <button
                    className="flex-1 rounded-lg border border-border py-2 text-xs font-semibold text-muted transition-colors hover:bg-cream hover:text-ink"
                  >
                    Client Login
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Client Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowAdd(false)}>
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-ink">Add Client</h3>
            <p className="mt-1 text-sm text-muted">Register a new client for your agency.</p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted">Company Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. TechCorp Pte Ltd"
                  className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-muted">Industry</label>
                <select
                  value={form.industry}
                  onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-accent/30"
                >
                  <option value="">Select industry...</option>
                  {["Logistics", "Retail", "Food & Beverage", "Events", "Technology", "Healthcare", "Manufacturing", "Other"].map((i) => (
                    <option key={i} value={i}>{i}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-muted">Contact Name</label>
                <input
                  type="text"
                  value={form.contactName}
                  onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))}
                  placeholder="Full name"
                  className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-muted">Contact Email</label>
                <input
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
                  placeholder="email@company.com"
                  className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-muted">Contact Phone (optional)</label>
                <input
                  type="tel"
                  value={form.contactPhone}
                  onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))}
                  placeholder="+65 XXXX XXXX"
                  className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowAdd(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:bg-cream"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={adding || !form.name || !form.industry || !form.contactName || !form.contactEmail}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent/90 disabled:opacity-50"
              >
                {adding ? "Adding..." : "Add Client"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
