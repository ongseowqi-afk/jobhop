import { NextRequest } from "next/server";
import { prisma } from "@jobhop/db";
import { withAuth, apiSuccess, apiError } from "@/lib/api";

export const GET = withAuth(async (req: NextRequest, { user }) => {
  if (user.role !== "AGENCY") {
    return apiError("Only agency staff can view invoices", 403);
  }

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (clientId) where.clientId = clientId;
  if (status) where.status = status;

  const invoices = await prisma.invoice.findMany({
    where,
    include: { client: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return apiSuccess(
    invoices.map((inv) => ({
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
    }))
  );
});
