import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@jobhop/db";
import { withAuth, apiSuccess, apiError } from "@/lib/api";

const QR_SECRET = () => process.env.QR_JWT_SECRET || process.env.NEXTAUTH_SECRET || "jobhop-qr-secret-dev";

export const POST = withAuth(async (req: NextRequest, { user, params }) => {
  if (user.role !== "WORKER") {
    return apiError("Only workers can clock in", 403);
  }

  const shiftId = params?.id;
  if (!shiftId) return apiError("Shift ID is required", 400);

  const body = await req.json();
  const { token } = body as { token: string };
  if (!token) return apiError("QR token is required", 400);

  let payload: { shiftId: string; type: string };
  try {
    payload = jwt.verify(token, QR_SECRET()) as { shiftId: string; type: string };
  } catch {
    return apiError("QR code is invalid or expired. Please ask for a new one.", 400);
  }

  if (payload.shiftId !== shiftId || payload.type !== "clock-in") {
    return apiError("QR code does not match this shift", 400);
  }

  const profile = await prisma.workerProfile.findUnique({
    where: { userId: user.id },
  });
  if (!profile) return apiError("Worker profile not found", 404);

  if (profile.isStudentPass && profile.weeklyHoursCap) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const approvedHours = await prisma.timesheet.aggregate({
      where: {
        workerId: profile.id,
        status: { in: ["APPROVED", "PENDING"] },
        clockIn: { gte: weekStart, lt: weekEnd },
      },
      _sum: { totalHours: true },
    });

    const currentHours = approvedHours._sum.totalHours ?? 0;

    if (currentHours >= profile.weeklyHoursCap) {
      return apiError(
        `Student pass weekly cap reached (${profile.weeklyHoursCap} hrs). You have ${currentHours.toFixed(1)} hours this week. Clock-in is blocked.`,
        403
      );
    }

    if (currentHours >= 12) {
      // We'll still allow clock-in but include a warning in the response
    }
  }

  const assignment = await prisma.shiftAssignment.findUnique({
    where: { shiftId_workerId: { shiftId, workerId: profile.id } },
  });
  if (!assignment) {
    return apiError("You are not assigned to this shift", 403);
  }

  const existingTimesheet = await prisma.timesheet.findUnique({
    where: { workerId_shiftId: { workerId: profile.id, shiftId } },
  });
  if (existingTimesheet) {
    return apiError("You have already clocked in for this shift", 400);
  }

  const now = new Date();

  const [timesheet] = await Promise.all([
    prisma.timesheet.create({
      data: { workerId: profile.id, shiftId, clockIn: now },
    }),
    prisma.shiftAssignment.update({
      where: { id: assignment.id },
      data: { status: "CLOCKED_IN" },
    }),
  ]);

  let warning: string | null = null;
  if (profile.isStudentPass && profile.weeklyHoursCap) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const hrs = await prisma.timesheet.aggregate({
      where: { workerId: profile.id, status: { in: ["APPROVED", "PENDING"] }, clockIn: { gte: weekStart, lt: weekEnd } },
      _sum: { totalHours: true },
    });
    const total = hrs._sum.totalHours ?? 0;
    if (total >= 12) {
      warning = `Approaching weekly cap: ${total.toFixed(1)}/${profile.weeklyHoursCap} hrs used this week.`;
    }
  }

  return apiSuccess({
    timesheetId: timesheet.id,
    clockIn: timesheet.clockIn.toISOString(),
    warning,
  }, 201);
});
