import { NextRequest } from "next/server";
import { prisma } from "@jobhop/db";
import { withAuth, apiSuccess, apiError } from "@/lib/api";

export const GET = withAuth(async (_req: NextRequest, { params }) => {
  const jobId = params?.id;
  if (!jobId) return apiError("Job ID is required", 400);

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      client: { select: { id: true, name: true, industry: true } },
      shifts: {
        include: {
          assignments: {
            include: {
              worker: {
                include: { user: { select: { name: true } } },
              },
            },
          },
          _count: { select: { assignments: true } },
        },
        orderBy: { date: "asc" },
      },
      requiredSkills: { include: { skill: true } },
      _count: { select: { applications: true } },
    },
  });

  if (!job) return apiError("Job not found", 404);

  return apiSuccess({
    id: job.id,
    title: job.title,
    description: job.description,
    category: job.category,
    location: job.location,
    latitude: job.latitude,
    longitude: job.longitude,
    payRate: job.payRate,
    slotsTotal: job.slotsTotal,
    slotsFilled: job.slotsFilled,
    status: job.status,
    startDate: job.startDate.toISOString(),
    endDate: job.endDate?.toISOString() ?? null,
    isOngoing: job.isOngoing,
    client: job.client,
    requiredSkills: job.requiredSkills.map((rs) => rs.skill),
    applicationCount: job._count.applications,
    shifts: job.shifts.map((s) => ({
      id: s.id,
      date: s.date.toISOString(),
      startTime: s.startTime,
      endTime: s.endTime,
      slotsTotal: s.slotsTotal,
      slotsFilled: s.slotsFilled,
      assignedCount: s._count.assignments,
    })),
  });
});
