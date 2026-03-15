import { NextRequest } from "next/server";
import { prisma } from "@jobhop/db";
import { withRole, apiSuccess, apiError } from "@/lib/api";

export const POST = withRole("AGENCY")(async (_req: NextRequest, { user, params }) => {
  const workerId = params?.id;
  if (!workerId) {
    return apiError("Worker ID is required", 400);
  }

  const profile = await prisma.workerProfile.findUnique({
    where: { id: workerId },
  });

  if (!profile) {
    return apiError("Worker profile not found", 404);
  }

  if (profile.verificationStatus !== "PENDING_VERIFICATION") {
    return apiError(
      `Cannot approve — current status is ${profile.verificationStatus}`,
      400
    );
  }

  const updated = await prisma.workerProfile.update({
    where: { id: workerId },
    data: {
      verificationStatus: "VERIFIED",
      verifiedAt: new Date(),
      verifiedBy: user.id,
      rejectionReason: null,
    },
    include: {
      user: { select: { id: true, name: true } },
    },
  });

  await prisma.notification.create({
    data: {
      userId: updated.userId,
      title: "Verification Approved",
      body: "Your identity has been verified. You can now browse and apply for jobs.",
      type: "VERIFICATION_APPROVED",
    },
  });

  return apiSuccess({
    id: updated.id,
    userId: updated.userId,
    name: updated.user.name,
    verificationStatus: updated.verificationStatus,
    verifiedAt: updated.verifiedAt,
  });
});
