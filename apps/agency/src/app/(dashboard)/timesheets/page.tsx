import { prisma } from "@jobhop/db";
import { TimesheetTable } from "./timesheet-table";

export const dynamic = "force-dynamic";

export default async function TimesheetsPage() {
  const timesheets = await prisma.timesheet.findMany({
    include: {
      worker: { include: { user: { select: { name: true, phone: true } } } },
      shift: {
        include: {
          job: { include: { client: { select: { id: true, name: true } } } },
        },
      },
    },
    orderBy: { clockIn: "desc" },
  });

  const serialized = timesheets.map((t) => ({
    id: t.id,
    workerName: t.worker.user.name,
    workerPhone: t.worker.user.phone,
    shiftId: t.shiftId,
    jobTitle: t.shift.job.title,
    clientName: t.shift.job.client.name,
    date: t.shift.date.toISOString(),
    shiftStart: t.shift.startTime,
    shiftEnd: t.shift.endTime,
    clockIn: t.clockIn.toISOString(),
    clockOut: t.clockOut?.toISOString() ?? null,
    totalHours: t.totalHours,
    status: t.status,
  }));

  return (
    <div className="p-8">
      <TimesheetTable initialTimesheets={serialized} />
    </div>
  );
}
