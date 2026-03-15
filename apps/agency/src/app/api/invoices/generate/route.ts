import { NextRequest } from "next/server";
import { prisma } from "@jobhop/db";
import { withAuth, apiSuccess, apiError } from "@/lib/api";

export const POST = withAuth(async (req: NextRequest, { user }) => {
  if (user.role !== "AGENCY") {
    return apiError("Only agency staff can generate invoices", 403);
  }

  const body = await req.json();
  const { clientId, periodStart, periodEnd, billRate } = body as {
    clientId: string;
    periodStart: string;
    periodEnd: string;
    billRate: number;
  };

  if (!clientId || !periodStart || !periodEnd || !billRate) {
    return apiError("clientId, periodStart, periodEnd, and billRate are required", 400);
  }

  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) return apiError("Client not found", 404);

  const start = new Date(periodStart);
  const end = new Date(periodEnd);

  const approvedTimesheets = await prisma.timesheet.findMany({
    where: {
      status: "APPROVED",
      shift: {
        job: { clientId },
        date: { gte: start, lte: end },
      },
    },
    select: { totalHours: true },
  });

  const totalHours = approvedTimesheets.reduce((s, t) => s + (t.totalHours ?? 0), 0);

  if (totalHours === 0) {
    return apiError("No approved timesheet hours found for this client and period", 400);
  }

  const amount = Math.round(totalHours * billRate * 100) / 100;

  const count = await prisma.invoice.count();
  const invoiceNo = `INV-${String(count + 1).padStart(5, "0")}`;

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNo,
      clientId,
      periodStart: start,
      periodEnd: end,
      totalHours,
      billRate,
      amount,
      status: "PENDING",
    },
  });

  return apiSuccess(
    {
      id: invoice.id,
      invoiceNo: invoice.invoiceNo,
      clientName: client.name,
      totalHours,
      billRate,
      amount,
      status: invoice.status,
    },
    201
  );
});
