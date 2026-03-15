import { prisma } from "@jobhop/db";
import { ClientsGrid } from "./clients-grid";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const agencyWithClients = await prisma.client.findMany({
    include: {
      jobs: {
        select: {
          id: true,
          status: true,
          shifts: { select: { slotsFilled: true } },
        },
      },
      invoices: {
        where: { status: "PAID" },
        select: { amount: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = agencyWithClients.map((c) => {
    const openShifts = c.jobs
      .filter((j) => ["OPEN", "FILLING", "IN_PROGRESS"].includes(j.status))
      .reduce((sum, j) => sum + j.shifts.length, 0);

    const workersDeployed = c.jobs.reduce(
      (sum, j) => sum + j.shifts.reduce((s2, sh) => s2 + sh.slotsFilled, 0),
      0
    );

    const revenue = c.invoices.reduce((s, inv) => s + inv.amount, 0);

    return {
      id: c.id,
      name: c.name,
      industry: c.industry,
      contactName: c.contactName,
      contactEmail: c.contactEmail,
      contactPhone: c.contactPhone,
      createdAt: c.createdAt.toISOString(),
      openShifts,
      workersDeployed,
      revenue,
      jobCount: c.jobs.length,
    };
  });

  return (
    <div className="p-8">
      <ClientsGrid initialClients={serialized} />
    </div>
  );
}
