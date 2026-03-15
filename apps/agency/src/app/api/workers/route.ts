import { NextRequest } from "next/server";
import { prisma } from "@jobhop/db";
import { withAuth, apiSuccess, apiError } from "@/lib/api";

export const GET = withAuth(async (req: NextRequest, { user }) => {
  if (user.role !== "RECRUITER" && user.role !== "AGENCY") {
    return apiError("Only recruiters/agency can list workers", 403);
  }

  const { searchParams } = new URL(req.url);
  const stage = searchParams.get("stage");

  let where: Record<string, unknown> = {};

  if (stage === "ready") {
    where = { verificationStatus: "VERIFIED" };
  } else if (stage === "screening") {
    where = { verificationStatus: { in: ["UNVERIFIED", "PENDING_VERIFICATION"] } };
  } else if (stage === "placed") {
    where = { verificationStatus: "VERIFIED" };
  }

  const workers = await prisma.workerProfile.findMany({
    where,
    include: {
      user: { select: { name: true, phone: true, email: true } },
      skills: { include: { skill: true } },
    },
    orderBy: { user: { name: "asc" } },
  });

  let placedWorkerIds = new Set<string>();
  if (stage === "placed" || !stage) {
    const activePlacements = await prisma.placement.findMany({
      where: { status: { in: ["CONFIRMED", "ACTIVE"] } },
      select: { workerId: true },
    });
    placedWorkerIds = new Set(activePlacements.map((p) => p.workerId));
  }

  let result = workers.map((w) => ({
    id: w.id,
    userId: w.userId,
    name: w.user.name,
    phone: w.user.phone,
    email: w.user.email,
    rating: w.rating,
    showRate: w.showRate,
    shiftsCount: w.shiftsCount,
    verificationStatus: w.verificationStatus,
    isAvailable: w.isAvailable,
    skills: w.skills.map((s) => s.skill.name),
    stage: placedWorkerIds.has(w.id)
      ? "Placed"
      : w.verificationStatus === "VERIFIED"
        ? "Ready"
        : "Screening",
  }));

  if (stage === "placed") {
    result = result.filter((w) => w.stage === "Placed");
  } else if (stage === "ready") {
    result = result.filter((w) => w.stage === "Ready");
  }

  return apiSuccess(result);
});
