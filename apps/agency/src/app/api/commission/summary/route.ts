import { NextRequest } from "next/server";
import { prisma } from "@jobhop/db";
import { withAuth, apiSuccess, apiError } from "@/lib/api";

export const GET = withAuth(async (_req: NextRequest, { user }) => {
  if (user.role !== "RECRUITER") {
    return apiError("Only recruiters can view commission summary", 403);
  }

  const profile = await prisma.recruiterProfile.findUnique({
    where: { userId: user.id },
    select: { id: true, totalCommission: true },
  });
  if (!profile) return apiError("Recruiter profile not found", 404);

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  const allPlacements = await prisma.placement.findMany({
    where: { recruiterId: profile.id },
    include: { job: { select: { title: true, payRate: true, client: { select: { name: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  const thisMonth = allPlacements.filter((p) => p.createdAt >= thisMonthStart);
  const lastMonth = allPlacements.filter(
    (p) => p.createdAt >= lastMonthStart && p.createdAt <= lastMonthEnd
  );

  const thisMonthCommission = thisMonth.reduce((sum, p) => sum + p.totalCommission, 0);
  const lastMonthCommission = lastMonth.reduce((sum, p) => sum + p.totalCommission, 0);
  const allTimeCommission = profile.totalCommission;
  const avgPerPlacement = allPlacements.length > 0 ? allTimeCommission / allPlacements.length : 0;

  const weeklyBreakdown: Array<{
    weekStart: string;
    weekEnd: string;
    placements: number;
    hours: number;
    avgRate: number;
    earned: number;
    status: string;
  }> = [];

  const weeks = new Map<string, typeof allPlacements>();
  for (const p of allPlacements) {
    const d = new Date(p.createdAt);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const key = weekStart.toISOString();
    if (!weeks.has(key)) weeks.set(key, []);
    weeks.get(key)!.push(p);
  }

  for (const [weekStartIso, placements] of Array.from(weeks.entries()).slice(0, 8)) {
    const weekStart = new Date(weekStartIso);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const totalHours = placements.reduce((s, p) => s + p.totalHours, 0);
    const earned = placements.reduce((s, p) => s + p.totalCommission, 0);
    const avgRate =
      placements.length > 0
        ? placements.reduce((s, p) => s + p.commissionRate, 0) / placements.length
        : 0;
    const isPast = weekEnd < now;

    weeklyBreakdown.push({
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      placements: placements.length,
      hours: totalHours,
      avgRate,
      earned,
      status: isPast ? "Paid" : "Processing",
    });
  }

  return apiSuccess({
    thisMonth: { placements: thisMonth.length, commission: thisMonthCommission },
    lastMonth: { placements: lastMonth.length, commission: lastMonthCommission },
    allTime: allTimeCommission,
    avgPerPlacement,
    weeklyBreakdown,
  });
});
