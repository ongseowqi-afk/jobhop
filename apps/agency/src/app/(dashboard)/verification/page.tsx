import { prisma } from "@jobhop/db";
import { VerificationTable } from "./verification-table";

export const dynamic = "force-dynamic";

export default async function VerificationPage() {
  const pendingWorkers = await prisma.workerProfile.findMany({
    where: { verificationStatus: "PENDING_VERIFICATION" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          createdAt: true,
        },
      },
      documents: true,
    },
    orderBy: { user: { createdAt: "desc" } },
  });

  const serialized = pendingWorkers.map((w) => ({
    id: w.id,
    userId: w.userId,
    name: w.user.name,
    phone: w.user.phone ?? "",
    email: w.user.email ?? "",
    residencyStatus: w.residencyStatus ?? "CITIZEN",
    isStudentPass: w.isStudentPass,
    schoolName: w.schoolName,
    locExpiryDate: w.locExpiryDate?.toISOString() ?? null,
    createdAt: w.user.createdAt.toISOString(),
    documents: w.documents.map((d) => ({
      id: d.id,
      name: d.name,
      type: d.type,
      url: d.url,
      uploadedAt: d.uploadedAt.toISOString(),
    })),
  }));

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Worker Verification</h1>
          <p className="mt-1 text-sm text-muted">
            MOM compliance — verify work eligibility before any gig work
          </p>
        </div>
        <div className="rounded-full bg-accent/10 px-4 py-1.5 text-sm font-semibold text-accent">
          {serialized.length} pending
        </div>
      </div>

      {serialized.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <div className="text-4xl">✓</div>
          <p className="mt-3 text-lg font-semibold text-ink">All clear</p>
          <p className="mt-1 text-sm text-muted">No workers pending verification.</p>
        </div>
      ) : (
        <VerificationTable workers={serialized} />
      )}
    </div>
  );
}
