import { NextRequest } from "next/server";
import { prisma } from "@jobhop/db";
import { withAuth, apiSuccess, apiError } from "@/lib/api";

export const GET = withAuth(async (req: NextRequest, { user }) => {
  if (user.role !== "AGENCY" && user.role !== "RECRUITER") {
    return apiError("Only agency/recruiter can list timesheets", 403);
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const timesheets = await prisma.timesheet.findMany({
    where,
    include: {
      worker: { include: { user: { select: { name: true, phone: true } } } },
      shift: {
        include: {
          job: { include: { client: { select: { id: true, name: true } } } },
        },
      },
    },
    orderBy: { clockIn: "desc" },
  });

  return apiSuccess(
    timesheets.map((t) => ({
      id: t.id,
      workerName: t.worker.user.name,
      workerPhone: t.worker.user.phone,
      shiftId: t.shiftId,
      jobTitle: t.shift.job.title,
      clientName: t.shift.job.client.name,
      date: t.shift.date.toISOString(),
      shiftStart: t.shift.startTime,
      shiftEnd: t.shift.endTime,
      clockIn: t.clockIn.toISOString(),
      clockOut: t.clockOut?.toISOString() ?? null,
      totalHours: t.totalHours,
      status: t.status,
      approvedBy: t.approvedBy,
      approvedAt: t.approvedAt?.toISOString() ?? null,
    }))
  );
});
