import { NextRequest } from "next/server";
import { prisma } from "@jobhop/db";
import { withAuth, apiSuccess, apiError } from "@/lib/api";

export const GET = withAuth(async (req: NextRequest, { user }) => {
  if (user.role === "WORKER") {
    const profile = await prisma.workerProfile.findUnique({
      where: { userId: user.id },
      select: { verificationStatus: true },
    });

    if (profile?.verificationStatus !== "VERIFIED") {
      return apiError("Account must be verified to browse jobs", 403);
    }
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const search = searchParams.get("search");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {
    status: { in: status ? [status] : ["OPEN", "FILLING"] },
  };

  if (category && category !== "All") {
    where.category = category;
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { location: { contains: search, mode: "insensitive" } },
      { client: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const jobs = await prisma.job.findMany({
    where,
    include: {
      client: { select: { id: true, name: true, industry: true } },
      shifts: {
        select: { id: true, date: true, startTime: true, endTime: true, slotsTotal: true, slotsFilled: true },
        orderBy: { date: "asc" },
      },
      _count: { select: { applications: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const result = jobs.map((job) => ({
    id: job.id,
    title: job.title,
    description: job.description,
    category: job.category,
    location: job.location,
    payRate: job.payRate,
    slotsTotal: job.slotsTotal,
    slotsFilled: job.slotsFilled,
    status: job.status,
    startDate: job.startDate.toISOString(),
    endDate: job.endDate?.toISOString() ?? null,
    isOngoing: job.isOngoing,
    client: job.client,
    shiftCount: job.shifts.length,
    nextShift: job.shifts[0]
      ? { date: job.shifts[0].date.toISOString(), startTime: job.shifts[0].startTime, endTime: job.shifts[0].endTime }
      : null,
    applicationCount: job._count.applications,
  }));

  return apiSuccess(result);
});
