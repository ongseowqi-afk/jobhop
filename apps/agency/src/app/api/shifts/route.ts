import { NextRequest } from "next/server";
import { prisma } from "@jobhop/db";
import { withAuth, apiSuccess, apiError } from "@/lib/api";

export const GET = withAuth(async (req: NextRequest, { user }) => {
  const { searchParams } = new URL(req.url);
  const upcoming = searchParams.get("upcoming") === "true";
  const jobId = searchParams.get("jobId");

  if (user.role === "WORKER") {
    const profile = await prisma.workerProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!profile) return apiError("Worker profile not found", 404);

    const where: Record<string, unknown> = {
      assignments: { some: { workerId: profile.id } },
    };
    if (upcoming) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      where.date = { gte: today };
    }

    const shifts = await prisma.shift.findMany({
      where,
      include: {
        job: { include: { client: { select: { id: true, name: true, industry: true } } } },
        assignments: { where: { workerId: profile.id }, select: { status: true } },
      },
      orderBy: { date: "asc" },
      take: 20,
    });

    return apiSuccess(
      shifts.map((s) => ({
        id: s.id,
        date: s.date.toISOString(),
        startTime: s.startTime,
        endTime: s.endTime,
        assignmentStatus: s.assignments[0]?.status ?? null,
        job: {
          id: s.job.id,
          title: s.job.title,
          category: s.job.category,
          location: s.job.location,
          payRate: s.job.payRate,
          client: s.job.client,
        },
      }))
    );
  }

  if (user.role !== "AGENCY" && user.role !== "RECRUITER") {
    return apiError("Access denied", 403);
  }

  const where: Record<string, unknown> = {};
  if (jobId) where.jobId = jobId;
  if (upcoming) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    where.date = { gte: today };
  }

  const shifts = await prisma.shift.findMany({
    where,
    include: {
      job: { include: { client: { select: { id: true, name: true, industry: true } } } },
      assignments: {
        include: { worker: { include: { user: { select: { name: true, phone: true } } } } },
      },
      _count: { select: { assignments: true } },
    },
    orderBy: { date: "asc" },
  });

  return apiSuccess(
    shifts.map((s) => ({
      id: s.id,
      date: s.date.toISOString(),
      startTime: s.startTime,
      endTime: s.endTime,
      slotsTotal: s.slotsTotal,
      slotsFilled: s._count.assignments,
      job: {
        id: s.job.id,
        title: s.job.title,
        category: s.job.category,
        location: s.job.location,
        payRate: s.job.payRate,
        client: s.job.client,
      },
      assignments: s.assignments.map((a) => ({
        id: a.id,
        status: a.status,
        worker: { id: a.workerId, name: a.worker.user.name, phone: a.worker.user.phone },
      })),
    }))
  );
});

export const POST = withAuth(async (req: NextRequest, { user }) => {
  if (user.role !== "AGENCY" && user.role !== "RECRUITER") {
    return apiError("Only agency/recruiter can create shifts", 403);
  }

  const body = await req.json();
  const { jobId, date, startTime, endTime, slotsTotal } = body as {
    jobId: string;
    date: string;
    startTime: string;
    endTime: string;
    slotsTotal: number;
  };

  if (!jobId || !date || !startTime || !endTime || !slotsTotal) {
    return apiError("jobId, date, startTime, endTime, and slotsTotal are required", 400);
  }

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) return apiError("Job not found", 404);

  const shift = await prisma.shift.create({
    data: {
      jobId,
      date: new Date(date),
      startTime,
      endTime,
      slotsTotal,
    },
    include: {
      job: { include: { client: { select: { id: true, name: true } } } },
    },
  });

  return apiSuccess(
    {
      id: shift.id,
      date: shift.date.toISOString(),
      startTime: shift.startTime,
      endTime: shift.endTime,
      slotsTotal: shift.slotsTotal,
      slotsFilled: 0,
      job: { id: shift.job.id, title: shift.job.title, client: shift.job.client },
    },
    201
  );
});
