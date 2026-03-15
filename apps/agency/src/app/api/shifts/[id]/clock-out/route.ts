import { NextRequest } from "next/server";
import { prisma } from "@jobhop/db";
import { withAuth, apiSuccess, apiError } from "@/lib/api";

export const POST = withAuth(async (_req: NextRequest, { user, params }) => {
  if (user.role !== "WORKER") {
    return apiError("Only workers can clock out", 403);
  }

  const shiftId = params?.id;
  if (!shiftId) return apiError("Shift ID is required", 400);

  const profile = await prisma.workerProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!profile) return apiError("Worker profile not found", 404);

  const timesheet = await prisma.timesheet.findUnique({
    where: { workerId_shiftId: { workerId: profile.id, shiftId } },
  });
  if (!timesheet) return apiError("No clock-in record found for this shift", 404);
  if (timesheet.clockOut) return apiError("You have already clocked out", 400);

  const now = new Date();
  const diffMs = now.getTime() - timesheet.clockIn.getTime();
  const totalHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;

  const [updated] = await Promise.all([
    prisma.timesheet.update({
      where: { id: timesheet.id },
      data: { clockOut: now, totalHours },
    }),
    prisma.shiftAssignment.updateMany({
      where: { shiftId, workerId: profile.id },
      data: { status: "CLOCKED_OUT" },
    }),
  ]);

  return apiSuccess({
    timesheetId: updated.id,
    clockIn: updated.clockIn.toISOString(),
    clockOut: updated.clockOut!.toISOString(),
    totalHours,
  });
});
