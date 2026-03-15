import { prisma } from "@jobhop/db";
import { notFound } from "next/navigation";
import { ShiftQRView } from "./shift-qr-view";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ShiftDetailPage({ params }: Props) {
  const { id } = await params;

  const shift = await prisma.shift.findUnique({
    where: { id },
    include: {
      job: { include: { client: { select: { name: true } } } },
      assignments: {
        include: { worker: { include: { user: { select: { name: true, phone: true } } } } },
      },
      timesheets: {
        include: { worker: { include: { user: { select: { name: true } } } } },
      },
    },
  });

  if (!shift) notFound();

  const serialized = {
    id: shift.id,
    date: shift.date.toISOString(),
    startTime: shift.startTime,
    endTime: shift.endTime,
    slotsTotal: shift.slotsTotal,
    jobTitle: shift.job.title,
    clientName: shift.job.client.name,
    location: shift.job.location,
    assignments: shift.assignments.map((a) => ({
      id: a.id,
      status: a.status,
      workerName: a.worker.user.name,
      workerPhone: a.worker.user.phone,
    })),
    timesheets: shift.timesheets.map((t) => ({
      id: t.id,
      workerName: t.worker.user.name,
      clockIn: t.clockIn.toISOString(),
      clockOut: t.clockOut?.toISOString() ?? null,
      totalHours: t.totalHours,
      status: t.status,
    })),
  };

  return (
    <div className="p-8">
      <ShiftQRView shift={serialized} />
    </div>
  );
}
