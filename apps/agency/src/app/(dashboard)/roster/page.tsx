import { prisma } from "@jobhop/db";
import RosterTable from "./roster-table";

async function getWorkers() {
  try {
    const workers = await prisma.workerProfile.findMany({
      include: {
        user: { select: { id: true, name: true, phone: true, email: true } },
        skills: { include: { skill: { select: { name: true } } } },
      },
      orderBy: { user: { name: "asc" } },
    });

    return workers.map((w) => ({
      id: w.id,
      name: w.user.name,
      phone: w.user.phone,
      email: w.user.email,
      rating: w.rating,
      showRate: w.showRate,
      shiftsCount: w.shiftsCount,
      verificationStatus: w.verificationStatus,
      isAvailable: w.isAvailable,
      skills: w.skills.map((s) => s.skill.name),
      stage:
        w.verificationStatus === "VERIFIED"
          ? w.shiftsCount > 0
            ? "Placed"
            : "Ready"
          : w.verificationStatus === "PENDING_VERIFICATION"
          ? "Screening"
          : "Screening",
    }));
  } catch {
    return [];
  }
}

export default async function RosterPage() {
  const workers = await getWorkers();
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-ink">Worker Roster</h1>
        <p className="mt-1 text-sm text-muted">All workers in the talent pool</p>
      </div>
      <RosterTable initialWorkers={workers} />
    </div>
  );
}
