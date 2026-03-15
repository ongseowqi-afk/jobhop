import { prisma } from "@jobhop/db";
import Link from "next/link";

async function getDashboardStats() {
  try {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const [
      clientCount,
      activeJobCount,
      upcomingShiftCount,
      pendingVerificationCount,
      pendingTimesheetCount,
      workerCount,
    ] = await Promise.all([
      prisma.client.count(),
      prisma.job.count({ where: { status: { in: ["OPEN", "FILLING", "IN_PROGRESS"] } } }),
      prisma.shift.count({ where: { date: { gte: now } } }),
      prisma.workerProfile.count({ where: { verificationStatus: "PENDING_VERIFICATION" } }),
      prisma.timesheet.count({ where: { status: "PENDING" } }),
      prisma.workerProfile.count({ where: { verificationStatus: "VERIFIED" } }),
    ]);

    const recentShifts = await prisma.shift.findMany({
      where: { date: { gte: now } },
      include: {
        job: { include: { client: { select: { name: true } } } },
        _count: { select: { assignments: true } },
      },
      orderBy: { date: "asc" },
      take: 5,
    });

    return {
      clientCount,
      activeJobCount,
      upcomingShiftCount,
      pendingVerificationCount,
      pendingTimesheetCount,
      workerCount,
      recentShifts,
    };
  } catch {
    return null;
  }
}

function KpiCard({
  label,
  value,
  sub,
  href,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  href?: string;
  accent?: boolean;
}) {
  const content = (
    <div
      className={`rounded-xl border p-5 transition-shadow hover:shadow-sm ${
        accent
          ? "border-accent/20 bg-accent/5"
          : "border-border bg-card"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 font-heading text-3xl font-bold text-ink">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

export default async function DashboardHome() {
  const stats = await getDashboardStats();

  if (!stats) {
    return (
      <div className="p-8">
        <h1 className="font-heading text-2xl font-bold">Dashboard</h1>
        <p className="mt-2 text-sm text-muted">Could not load stats — database may be connecting.</p>
      </div>
    );
  }

  const today = new Date();

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-ink">Dashboard</h1>
        <p className="mt-1 text-sm text-muted">
          {today.toLocaleDateString("en-SG", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <KpiCard
          label="Verified Workers"
          value={stats.workerCount}
          sub="Ready to deploy"
          href="/roster"
        />
        <KpiCard
          label="Active Jobs"
          value={stats.activeJobCount}
          sub="Open + filling"
          href="/shifts"
        />
        <KpiCard
          label="Upcoming Shifts"
          value={stats.upcomingShiftCount}
          sub="From today"
          href="/shifts"
        />
        <KpiCard
          label="Clients"
          value={stats.clientCount}
          href="/clients"
        />
        <KpiCard
          label="Pending Timesheets"
          value={stats.pendingTimesheetCount}
          sub="Awaiting approval"
          href="/timesheets"
          accent={stats.pendingTimesheetCount > 0}
        />
        <KpiCard
          label="Pending Verification"
          value={stats.pendingVerificationCount}
          sub="Needs review"
          href="/verification"
          accent={stats.pendingVerificationCount > 0}
        />
      </div>

      {/* Upcoming Shifts */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
          Upcoming Shifts
        </h2>
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {stats.recentShifts.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">No upcoming shifts</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-cream/50">
                  <th className="px-4 py-3 text-left font-semibold text-ink">Job</th>
                  <th className="px-4 py-3 text-left font-semibold text-ink">Client</th>
                  <th className="px-4 py-3 text-left font-semibold text-ink">Date</th>
                  <th className="px-4 py-3 text-left font-semibold text-ink">Time</th>
                  <th className="px-4 py-3 text-right font-semibold text-ink">Filled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stats.recentShifts.map((shift) => (
                  <tr key={shift.id} className="hover:bg-cream/30">
                    <td className="px-4 py-3 font-medium text-ink">{shift.job.title}</td>
                    <td className="px-4 py-3 text-muted">{shift.job.client.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted">
                      {new Date(shift.date).toLocaleDateString("en-SG", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted">
                      {shift.startTime} – {shift.endTime}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs">
                      <span
                        className={
                          shift._count.assignments >= shift.slotsTotal
                            ? "text-green-600"
                            : "text-amber-600"
                        }
                      >
                        {shift._count.assignments}/{shift.slotsTotal}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
