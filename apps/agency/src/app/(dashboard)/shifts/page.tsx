import { prisma } from "@jobhop/db";
import { ShiftManagement } from "./shift-management";

export const dynamic = "force-dynamic";

export default async function ShiftsPage() {
  const [shifts, jobs, verifiedWorkers] = await Promise.all([
    prisma.shift.findMany({
      include: {
        job: { include: { client: { select: { id: true, name: true } } } },
        assignments: {
          include: { worker: { include: { user: { select: { name: true, phone: true } } } } },
        },
        _count: { select: { assignments: true } },
      },
      orderBy: { date: "asc" },
    }),
    prisma.job.findMany({
      where: { status: { in: ["OPEN", "FILLING", "IN_PROGRESS"] } },
      include: { client: { select: { name: true } } },
      orderBy: { title: "asc" },
    }),
    prisma.workerProfile.findMany({
      where: { verificationStatus: "VERIFIED" },
      include: { user: { select: { name: true, phone: true } } },
      orderBy: { user: { name: "asc" } },
    }),
  ]);

  const serializedShifts = shifts.map((s) => ({
    id: s.id,
    date: s.date.toISOString(),
    startTime: s.startTime,
    endTime: s.endTime,
    slotsTotal: s.slotsTotal,
    slotsFilled: s._count.assignments,
    jobId: s.jobId,
    jobTitle: s.job.title,
    clientName: s.job.client.name,
    location: s.job.location,
    assignments: s.assignments.map((a) => ({
      id: a.id,
      status: a.status,
      workerId: a.workerId,
      workerName: a.worker.user.name,
      workerPhone: a.worker.user.phone,
    })),
  }));

  const serializedJobs = jobs.map((j) => ({
    id: j.id,
    title: j.title,
    clientName: j.client.name,
  }));

  const serializedWorkers = verifiedWorkers.map((w) => ({
    id: w.id,
    name: w.user.name,
    phone: w.user.phone,
  }));

  return (
    <div className="p-8">
      <ShiftManagement
        initialShifts={serializedShifts}
        jobs={serializedJobs}
        workers={serializedWorkers}
      />
    </div>
  );
}
