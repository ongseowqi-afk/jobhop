import { NextRequest } from "next/server";
import { prisma } from "@jobhop/db";
import { withAuth, apiSuccess, apiError } from "@/lib/api";

export const GET = withAuth(async (req: NextRequest, { user }) => {
  if (user.role !== "RECRUITER" && user.role !== "AGENCY") {
    return apiError("Only recruiters and agency staff can list applications", 403);
  }

  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("jobId");

  const where: Record<string, unknown> = {};
  if (jobId) where.jobId = jobId;

  const applications = await prisma.application.findMany({
    where,
    include: {
      worker: {
        include: {
          user: { select: { name: true, phone: true } },
          skills: { include: { skill: true } },
        },
      },
      job: { select: { id: true, title: true, client: { select: { name: true } } } },
    },
    orderBy: { appliedAt: "desc" },
  });

  return apiSuccess(
    applications.map((a) => ({
      id: a.id,
      status: a.status,
      appliedAt: a.appliedAt.toISOString(),
      worker: {
        id: a.worker.id,
        name: a.worker.user.name,
        phone: a.worker.user.phone,
        rating: a.worker.rating,
        showRate: a.worker.showRate,
        skills: a.worker.skills.map((s) => s.skill.name),
      },
      job: a.job,
    }))
  );
});

export const POST = withAuth(async (req: NextRequest, { user }) => {
  if (user.role !== "WORKER") {
    return apiError("Only workers can apply for jobs", 403);
  }

  const profile = await prisma.workerProfile.findUnique({
    where: { userId: user.id },
  });

  if (!profile || profile.verificationStatus !== "VERIFIED") {
    return apiError("Your account must be verified before applying", 403);
  }

  const body = await req.json();
  const { jobId } = body as { jobId: string };

  if (!jobId) return apiError("jobId is required", 400);

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) return apiError("Job not found", 404);
  if (job.status !== "OPEN" && job.status !== "FILLING") {
    return apiError("This job is no longer accepting applications", 400);
  }

  const existing = await prisma.application.findUnique({
    where: { workerId_jobId: { workerId: profile.id, jobId } },
  });
  if (existing) return apiError("You have already applied for this job", 400);

  if (profile.isStudentPass && profile.weeklyHoursCap) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const approvedHours = await prisma.timesheet.aggregate({
      where: {
        workerId: profile.id,
        status: "APPROVED",
        clockIn: { gte: weekStart, lt: weekEnd },
      },
      _sum: { totalHours: true },
    });

    const currentHours = approvedHours._sum.totalHours ?? 0;
    if (currentHours >= profile.weeklyHoursCap) {
      return apiError(
        `Student pass weekly cap reached (${profile.weeklyHoursCap} hrs). You have ${currentHours} approved hours this week.`,
        400
      );
    }
  }

  const application = await prisma.application.create({
    data: {
      workerId: profile.id,
      jobId,
    },
  });

  return apiSuccess(
    { id: application.id, status: application.status, jobId },
    201
  );
});
