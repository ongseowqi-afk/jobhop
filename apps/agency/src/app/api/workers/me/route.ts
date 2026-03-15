import { NextRequest } from "next/server";
import { prisma } from "@jobhop/db";
import { withAuth, apiSuccess, apiError } from "@/lib/api";

export const GET = withAuth(async (_req: NextRequest, { user }) => {
  if (user.role !== "WORKER") {
    return apiError("Only workers can access this endpoint", 403);
  }

  const worker = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      workerProfile: {
        include: {
          skills: { include: { skill: true } },
          documents: true,
          assignments: {
            where: { status: "CONFIRMED" },
            include: {
              shift: {
                include: {
                  job: { include: { client: true } },
                },
              },
            },
            orderBy: { shift: { date: "asc" } },
            take: 10,
          },
          earnings: {
            orderBy: { periodEnd: "desc" },
            take: 5,
          },
        },
      },
    },
  });

  if (!worker?.workerProfile) {
    return apiError("Worker profile not found", 404);
  }

  return apiSuccess({
    id: worker.id,
    name: worker.name,
    email: worker.email,
    phone: worker.phone,
    avatarUrl: worker.avatarUrl,
    profile: worker.workerProfile,
  });
});
