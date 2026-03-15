import { NextRequest } from "next/server";
import { prisma } from "@jobhop/db";
import { withAuth, apiSuccess, apiError } from "@/lib/api";

export const POST = withAuth(async (_req: NextRequest, { user }) => {
  if (user.role !== "WORKER") {
    return apiError("Only workers can accept the contractor agreement", 403);
  }

  const profile = await prisma.workerProfile.findUnique({
    where: { userId: user.id },
  });

  if (!profile) {
    return apiError("Worker profile not found. Complete onboarding first.", 404);
  }

  if (profile.contractorAgreed) {
    return apiSuccess({ alreadyAccepted: true });
  }

  const updated = await prisma.workerProfile.update({
    where: { id: profile.id },
    data: {
      contractorAgreed: true,
      contractorAgreedAt: new Date(),
      verificationStatus: "PENDING_VERIFICATION",
    },
  });

  return apiSuccess({
    contractorAgreed: updated.contractorAgreed,
    verificationStatus: updated.verificationStatus,
  });
});
