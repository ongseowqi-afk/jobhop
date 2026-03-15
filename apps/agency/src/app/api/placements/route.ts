import { NextRequest } from "next/server";
import { prisma } from "@jobhop/db";
import { withAuth, apiSuccess, apiError } from "@/lib/api";

export const GET = withAuth(async (req: NextRequest, { user }) => {
  if (user.role !== "RECRUITER" && user.role !== "AGENCY") {
    return apiError("Only recruiters/agency can view placements", 403);
  }

  const { searchParams } = new URL(req.url);
  const mine = searchParams.get("mine") === "true";

  const where: Record<string, unknown> = {};

  if (mine && user.role === "RECRUITER") {
    const profile = await prisma.recruiterProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!profile) return apiError("Recruiter profile not found", 404);
    where.recruiterId = profile.id;
  }

  const placements = await prisma.placement.findMany({
    where,
    include: {
      job: { include: { client: { select: { name: true } } } },
      recruiter: { include: { user: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  const workerIds = placements.map((p) => p.workerId);
  const workers = await prisma.workerProfile.findMany({
    where: { id: { in: workerIds } },
    include: { user: { select: { name: true, phone: true } } },
  });
  const workerMap = new Map(workers.map((w) => [w.id, w]));

  return apiSuccess(
    placements.map((p) => {
      const worker = workerMap.get(p.workerId);
      return {
        id: p.id,
        workerName: worker?.user.name ?? "Unknown",
        workerPhone: worker?.user.phone ?? null,
        jobTitle: p.job.title,
        clientName: p.job.client.name,
        recruiterName: p.recruiter.user.name,
        commissionRate: p.commissionRate,
        totalCommission: p.totalCommission,
        totalHours: p.totalHours,
        status: p.status,
        createdAt: p.createdAt.toISOString(),
      };
    })
  );
});

export const POST = withAuth(async (req: NextRequest, { user }) => {
  if (user.role !== "RECRUITER" && user.role !== "AGENCY") {
    return apiError("Only recruiters/agency can create placements", 403);
  }

  const profile = await prisma.recruiterProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!profile) return apiError("Recruiter profile not found", 404);

  const body = await req.json();
  const { workerId, jobId, commissionRate } = body as {
    workerId: string;
    jobId: string;
    commissionRate: number;
  };

  if (!workerId || !jobId || commissionRate == null) {
    return apiError("workerId, jobId, and commissionRate are required", 400);
  }

  const worker = await prisma.workerProfile.findUnique({
    where: { id: workerId },
    select: { verificationStatus: true },
  });
  if (!worker) return apiError("Worker not found", 404);
  if (worker.verificationStatus !== "VERIFIED") {
    return apiError("Worker must be verified for placement", 400);
  }

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) return apiError("Job not found", 404);

  const existing = await prisma.placement.findUnique({
    where: { workerId_jobId: { workerId, jobId } },
  });
  if (existing) return apiError("Worker is already placed for this job", 400);

  const placement = await prisma.placement.create({
    data: {
      recruiterId: profile.id,
      workerId,
      jobId,
      commissionRate,
      status: "CONFIRMED",
    },
  });

  return apiSuccess(
    { id: placement.id, status: placement.status, commissionRate },
    201
  );
});
