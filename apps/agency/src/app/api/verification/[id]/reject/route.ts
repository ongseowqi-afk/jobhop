import { NextRequest } from "next/server";
import { prisma } from "@jobhop/db";
import { withRole, apiSuccess, apiError } from "@/lib/api";

export const POST = withRole("AGENCY")(async (req: NextRequest, { user, params }) => {
  const workerId = params?.id;
  if (!workerId) {
    return apiError("Worker ID is required", 400);
  }

  const body = await req.json();
  const { reason } = body as { reason?: string };

  if (!reason || reason.trim().length === 0) {
    return apiError("Rejection reason is required", 400);
  }

  const profile = await prisma.workerProfile.findUnique({
    where: { id: workerId },
  });

  if (!profile) {
    return apiError("Worker profile not found", 404);
  }

  if (
    profile.verificationStatus !== "PENDING_VERIFICATION" &&
    profile.verificationStatus !== "VERIFIED"
  ) {
    return apiError(
      `Cannot reject — current status is ${profile.verificationStatus}`,
      400
    );
  }

  const updated = await prisma.workerProfile.update({
    where: { id: workerId },
    data: {
      verificationStatus: "REJECTED",
      rejectionReason: reason.trim(),
      verifiedBy: user.id,
    },
    include: {
      user: { select: { id: true, name: true } },
    },
  });

  await prisma.notification.create({
    data: {
      userId: updated.userId,
      title: "Verification Rejected",
      body: `Your verification was rejected: ${reason.trim()}. Please re-upload your documents.`,
      type: "VERIFICATION_REJECTED",
      data: { reason: reason.trim() },
    },
  });

  return apiSuccess({
    id: updated.id,
    userId: updated.userId,
    name: updated.user.name,
    verificationStatus: updated.verificationStatus,
    rejectionReason: updated.rejectionReason,
  });
});
