import { prisma } from "@jobhop/db";
import { BillingDashboard } from "./billing-dashboard";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const [invoices, clients] = await Promise.all([
    prisma.invoice.findMany({
      include: { client: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.client.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const revenueMTD = invoices
    .filter((i) => i.createdAt >= monthStart && i.status !== "DRAFT")
    .reduce((s, i) => s + i.amount, 0);

  const outstanding = invoices
    .filter((i) => i.status === "PENDING" || i.status === "OVERDUE")
    .reduce((s, i) => s + i.amount, 0);

  const collected = invoices
    .filter((i) => i.status === "PAID")
    .reduce((s, i) => s + i.amount, 0);

  const rateArr = invoices.filter((i) => i.billRate > 0).map((i) => i.billRate);
  const avgBillRate = rateArr.length > 0 ? rateArr.reduce((s, r) => s + r, 0) / rateArr.length : 0;

  const serialized = invoices.map((inv) => ({
    id: inv.id,
    invoiceNo: inv.invoiceNo,
    clientName: inv.client.name,
    clientId: inv.clientId,
    periodStart: inv.periodStart.toISOString(),
    periodEnd: inv.periodEnd.toISOString(),
    totalHours: inv.totalHours,
    billRate: inv.billRate,
    amount: inv.amount,
    status: inv.status,
    createdAt: inv.createdAt.toISOString(),
    paidAt: inv.paidAt?.toISOString() ?? null,
  }));

  return (
    <div className="p-8">
      <BillingDashboard
        invoices={serialized}
        clients={clients}
        stats={{ revenueMTD, outstanding, collected, avgBillRate }}
      />
    </div>
  );
}
