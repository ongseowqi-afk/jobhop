import { NextRequest } from "next/server";
import { prisma } from "@jobhop/db";
import { withAuth, apiSuccess, apiError } from "@/lib/api";

export const PATCH = withAuth(async (req: NextRequest, { user, params }) => {
  if (user.role !== "AGENCY" && user.role !== "RECRUITER") {
    return apiError("Only agency/recruiter can update timesheets", 403);
  }

  const tsId = params?.id;
  if (!tsId) return apiError("Timesheet ID is required", 400);

  const body = await req.json();
  const { status, reason } = body as { status: "APPROVED" | "FLAGGED"; reason?: string };

  if (!status || !["APPROVED", "FLAGGED"].includes(status)) {
    return apiError("status must be APPROVED or FLAGGED", 400);
  }

  if (status === "FLAGGED" && !reason?.trim()) {
    return apiError("A reason is required when flagging a timesheet", 400);
  }

  const timesheet = await prisma.timesheet.findUnique({
    where: { id: tsId },
    include: { worker: { select: { userId: true } }, shift: { include: { job: true } } },
  });

  if (!timesheet) return apiError("Timesheet not found", 404);

  const updated = await prisma.timesheet.update({
    where: { id: tsId },
    data: {
      status,
      approvedBy: user.id,
      approvedAt: new Date(),
    },
  });

  await prisma.notification.create({
    data: {
      userId: timesheet.worker.userId,
      title: status === "APPROVED" ? "Timesheet Approved" : "Timesheet Flagged",
      body:
        status === "APPROVED"
          ? `Your timesheet for ${timesheet.shift.job.title} has been approved.`
          : `Your timesheet for ${timesheet.shift.job.title} has been flagged: ${reason}`,
      type: status === "APPROVED" ? "TIMESHEET_APPROVED" : "TIMESHEET_FLAGGED",
      data: { timesheetId: tsId, reason: reason ?? null },
    },
  });

  return apiSuccess({
    id: updated.id,
    status: updated.status,
    approvedAt: updated.approvedAt?.toISOString(),
  });
});
