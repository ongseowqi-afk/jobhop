import { NextRequest } from "next/server";
import { prisma } from "@jobhop/db";
import { withAuth, apiSuccess, apiError } from "@/lib/api";

export const PATCH = withAuth(async (req: NextRequest, { user, params }) => {
  if (user.role !== "RECRUITER" && user.role !== "AGENCY") {
    return apiError("Only recruiters and agency staff can update applications", 403);
  }

  const appId = params?.id;
  if (!appId) return apiError("Application ID is required", 400);

  const body = await req.json();
  const { status } = body as { status: "ACCEPTED" | "REJECTED" };

  if (!status || !["ACCEPTED", "REJECTED"].includes(status)) {
    return apiError("status must be ACCEPTED or REJECTED", 400);
  }

  const application = await prisma.application.findUnique({
    where: { id: appId },
    include: { worker: { include: { user: true } }, job: true },
  });

  if (!application) return apiError("Application not found", 404);
  if (application.status !== "PENDING") {
    return apiError(`Cannot update — application is already ${application.status}`, 400);
  }

  const updated = await prisma.application.update({
    where: { id: appId },
    data: {
      status,
      reviewedAt: new Date(),
      reviewedBy: user.id,
    },
  });

  if (status === "ACCEPTED") {
    await prisma.job.update({
      where: { id: application.jobId },
      data: { slotsFilled: { increment: 1 } },
    });
  }

  await prisma.notification.create({
    data: {
      userId: application.worker.userId,
      title: status === "ACCEPTED" ? "Application Accepted" : "Application Rejected",
      body:
        status === "ACCEPTED"
          ? `You've been accepted for ${application.job.title}! Check your schedule for shift details.`
          : `Your application for ${application.job.title} was not selected this time.`,
      type: status === "ACCEPTED" ? "APPLICATION_ACCEPTED" : "APPLICATION_REJECTED",
      data: { jobId: application.jobId, applicationId: appId },
    },
  });

  return apiSuccess({
    id: updated.id,
    status: updated.status,
    reviewedAt: updated.reviewedAt?.toISOString(),
  });
});
