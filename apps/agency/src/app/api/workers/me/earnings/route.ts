import { NextRequest } from "next/server";
import { prisma } from "@jobhop/db";
import { withAuth, apiSuccess, apiError } from "@/lib/api";

export const GET = withAuth(async (req: NextRequest, { user }) => {
  if (user.role !== "WORKER") {
    return apiError("Only workers can access this endpoint", 403);
  }

  const profile = await prisma.workerProfile.findUnique({
    where: { userId: user.id },
    select: { id: true, totalEarned: true, shiftsCount: true },
  });
  if (!profile) return apiError("Worker profile not found", 404);

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") ?? "month";

  const now = new Date();
  let periodStart: Date;

  if (period === "3months") {
    periodStart = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  } else if (period === "all") {
    periodStart = new Date(2000, 0, 1);
  } else {
    periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const earnings = await prisma.earning.findMany({
    where: {
      workerId: profile.id,
      periodStart: { gte: periodStart },
    },
    orderBy: { periodEnd: "desc" },
  });

  const totalGross = earnings.reduce((s, e) => s + e.grossAmount, 0);
  const totalBonus = earnings.reduce((s, e) => s + e.bonus, 0);
  const totalNet = earnings.reduce((s, e) => s + e.netAmount, 0);

  const shiftsInPeriod = await prisma.shiftAssignment.count({
    where: {
      workerId: profile.id,
      status: { in: ["CLOCKED_OUT", "CONFIRMED"] },
      shift: { date: { gte: periodStart } },
    },
  });

  const monthLabel = now.toLocaleDateString("en-SG", { month: "long", year: "numeric" });

  const payslips = earnings.map((e) => {
    const start = e.periodStart;
    const end = e.periodEnd;
    const weekLabel = `${start.toLocaleDateString("en-SG", { day: "numeric", month: "short" })} – ${end.toLocaleDateString("en-SG", { day: "numeric", month: "short" })}`;

    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const estimatedShifts = Math.max(1, Math.round(diffDays / 2));
    const estimatedHours = Math.round(e.grossAmount / 15);

    return {
      id: e.id,
      weekLabel,
      periodStart: start.toISOString(),
      periodEnd: end.toISOString(),
      grossAmount: e.grossAmount,
      bonus: e.bonus,
      netAmount: e.netAmount,
      status: e.status,
      paidAt: e.paidAt?.toISOString() ?? null,
      shiftsEstimate: estimatedShifts,
      hoursEstimate: estimatedHours,
    };
  });

  return apiSuccess({
    totalEarned: profile.totalEarned,
    periodLabel: monthLabel,
    shiftsCompleted: shiftsInPeriod > 0 ? shiftsInPeriod : profile.shiftsCount,
    breakdown: {
      gross: totalGross,
      bonus: totalBonus,
      net: totalNet,
    },
    payslips,
  });
});
