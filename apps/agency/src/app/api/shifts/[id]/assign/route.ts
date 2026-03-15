import { NextRequest } from "next/server";
import { prisma } from "@jobhop/db";
import { withAuth, apiSuccess, apiError } from "@/lib/api";

export const POST = withAuth(async (req: NextRequest, { user, params }) => {
  if (user.role !== "AGENCY" && user.role !== "RECRUITER") {
    return apiError("Only agency/recruiter can assign workers", 403);
  }

  const shiftId = params?.id;
  if (!shiftId) return apiError("Shift ID is required", 400);

  const body = await req.json();
  const { workerId } = body as { workerId: string };
  if (!workerId) return apiError("workerId is required", 400);

  const shift = await prisma.shift.findUnique({ where: { id: shiftId } });
  if (!shift) return apiError("Shift not found", 404);

  const filled = await prisma.shiftAssignment.count({ where: { shiftId } });
  if (filled >= shift.slotsTotal) {
    return apiError("Shift is already fully assigned", 400);
  }

  const worker = await prisma.workerProfile.findUnique({
    where: { id: workerId },
    select: { id: true, verificationStatus: true, userId: true },
  });
  if (!worker) return apiError("Worker not found", 404);
  if (worker.verificationStatus !== "VERIFIED") {
    return apiError("Worker must be verified before assignment", 400);
  }

  const existing = await prisma.shiftAssignment.findUnique({
    where: { shiftId_workerId: { shiftId, workerId } },
  });
  if (existing) return apiError("Worker is already assigned to this shift", 400);

  const assignment = await prisma.shiftAssignment.create({
    data: { shiftId, workerId },
  });

  await prisma.shift.update({
    where: { id: shiftId },
    data: { slotsFilled: { increment: 1 } },
  });

  const job = await prisma.shift.findUnique({
    where: { id: shiftId },
    select: { job: { select: { title: true } }, date: true, startTime: true },
  });

  await prisma.notification.create({
    data: {
      userId: worker.userId,
      title: "New Shift Assigned",
      body: `You've been assigned to ${job?.job.title ?? "a shift"} on ${job?.date.toLocaleDateString("en-SG")} at ${job?.startTime}.`,
      type: "SHIFT_ASSIGNED",
      data: { shiftId, assignmentId: assignment.id },
    },
  });

  return apiSuccess({ id: assignment.id, status: assignment.status }, 201);
});
