"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface InvoiceRow {
  id: string;
  invoiceNo: string;
  clientName: string;
  clientId: string;
  periodStart: string;
  periodEnd: string;
  totalHours: number;
  billRate: number;
  amount: number;
  status: string;
  createdAt: string;
  paidAt: string | null;
}

interface ClientOption {
  id: string;
  name: string;
}

interface Stats {
  revenueMTD: number;
  outstanding: number;
  collected: number;
  avgBillRate: number;
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  PENDING: "bg-yellow-50 text-yellow-700",
  PAID: "bg-green-50 text-green-700",
  OVERDUE: "bg-red-50 text-red-600",
};

export function BillingDashboard({
  invoices,
  clients,
  stats,
}: {
  invoices: InvoiceRow[];
  clients: ClientOption[];
  stats: Stats;
}) {
  const router = useRouter();
  const [showGenerate, setShowGenerate] = useState(false);
  const [form, setForm] = useState({
    clientId: "",
    periodStart: "",
    periodEnd: "",
    billRate: 25,
  });
  const [generating, setGenerating] = useState(false);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });

  const formatPeriod = (start: string, end: string) =>
    `${new Date(start).toLocaleDateString("en-SG", { day: "numeric", month: "short" })} – ${new Date(end).toLocaleDateString("en-SG", { day: "numeric", month: "short" })}`;

  const handleGenerate = async () => {
    if (!form.clientId || !form.periodStart || !form.periodEnd) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/invoices/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, billRate: Number(form.billRate) }),
      });
      const json = await res.json();
      if (res.ok) {
        setShowGenerate(false);
        setForm({ clientId: "", periodStart: "", periodEnd: "", billRate: 25 });
        router.refresh();
      } else {
        alert(json.error || "Failed to generate invoice");
      }
    } finally {
      setGenerating(false);
    }
  };

  const statCards = [
    { label: "Revenue MTD", value: `$${stats.revenueMTD.toLocaleString()}`, accent: true },
    { label: "Outstanding", value: `$${stats.outstanding.toLocaleString()}`, accent: false },
    { label: "Collected", value: `$${stats.collected.toLocaleString()}`, accent: false },
    { label: "Avg Bill Rate", value: `$${stats.avgBillRate.toFixed(2)}/hr`, accent: false },
  ];

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-ink">Billing</h1>
          <p className="mt-1 text-sm text-muted">{invoices.length} invoice{invoices.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => setShowGenerate(true)}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent/90"
        >
          <span className="text-lg leading-none">+</span>
          Generate Invoice
        </button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{s.label}</p>
            <p className={`mt-2 text-2xl font-bold ${s.accent ? "text-accent" : "text-ink"}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Invoice Table */}
      {invoices.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <div className="text-4xl">💵</div>
          <p className="mt-3 text-lg font-semibold text-ink">No invoices yet</p>
          <p className="mt-1 text-sm text-muted">Generate your first invoice from approved timesheets.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-cream/40">
                <th className="px-5 py-3 font-semibold text-muted">Invoice #</th>
                <th className="px-5 py-3 font-semibold text-muted">Client</th>
                <th className="px-5 py-3 font-semibold text-muted">Period</th>
                <th className="px-5 py-3 font-semibold text-muted">Hours</th>
                <th className="px-5 py-3 font-semibold text-muted">Amount</th>
                <th className="px-5 py-3 font-semibold text-muted">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoices.map((inv) => (
                <tr key={inv.id} className="transition-colors hover:bg-cream/30">
                  <td className="px-5 py-4 font-mono text-xs font-semibold text-ink">{inv.invoiceNo}</td>
                  <td className="px-5 py-4 font-medium text-ink">{inv.clientName}</td>
                  <td className="px-5 py-4 text-ink">{formatPeriod(inv.periodStart, inv.periodEnd)}</td>
                  <td className="px-5 py-4 font-mono text-xs text-ink">{inv.totalHours.toFixed(1)}</td>
                  <td className="px-5 py-4 font-semibold text-ink">${inv.amount.toLocaleString()}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[inv.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {inv.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Generate Modal */}
      {showGenerate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowGenerate(false)}>
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-ink">Generate Invoice</h3>
            <p className="mt-1 text-sm text-muted">Create an invoice from approved timesheets.</p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted">Client</label>
                <select
                  value={form.clientId}
                  onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-accent/30"
                >
                  <option value="">Select a client...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted">Period Start</label>
                  <input
                    type="date"
                    value={form.periodStart}
                    onChange={(e) => setForm((f) => ({ ...f, periodStart: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-accent/30"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted">Period End</label>
                  <input
                    type="date"
                    value={form.periodEnd}
                    onChange={(e) => setForm((f) => ({ ...f, periodEnd: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-accent/30"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-muted">Bill Rate ($/hr)</label>
                <input
                  type="number"
                  min={1}
                  value={form.billRate}
                  onChange={(e) => setForm((f) => ({ ...f, billRate: Number(e.target.value) }))}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowGenerate(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:bg-cream"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={generating || !form.clientId || !form.periodStart || !form.periodEnd}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent/90 disabled:opacity-50"
              >
                {generating ? "Generating..." : "Generate Invoice"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
