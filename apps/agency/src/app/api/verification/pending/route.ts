import { NextRequest } from "next/server";
import { prisma } from "@jobhop/db";
import { withRole, apiSuccess } from "@/lib/api";

export const GET = withRole("AGENCY")(async (_req: NextRequest) => {
  const pendingWorkers = await prisma.workerProfile.findMany({
    where: { verificationStatus: "PENDING_VERIFICATION" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          createdAt: true,
        },
      },
      documents: true,
    },
    orderBy: { user: { createdAt: "desc" } },
  });

  return apiSuccess(pendingWorkers);
});
