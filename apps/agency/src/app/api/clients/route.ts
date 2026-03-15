import { NextRequest } from "next/server";
import { prisma } from "@jobhop/db";
import { withAuth, apiSuccess, apiError } from "@/lib/api";

export const GET = withAuth(async (_req: NextRequest, { user }) => {
  if (user.role !== "AGENCY") {
    return apiError("Only agency staff can view clients", 403);
  }

  const agencyProfile = await prisma.agencyProfile.findUnique({
    where: { userId: user.id },
    select: { agencyId: true },
  });

  const clients = await prisma.client.findMany({
    where: agencyProfile ? { agencyId: agencyProfile.agencyId } : {},
    include: {
      jobs: {
        select: {
          id: true,
          status: true,
          shifts: { select: { slotsFilled: true } },
        },
      },
      invoices: {
        where: { status: "PAID" },
        select: { amount: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return apiSuccess(
    clients.map((c) => {
      const openShifts = c.jobs
        .filter((j) => ["OPEN", "FILLING", "IN_PROGRESS"].includes(j.status))
        .reduce((sum, j) => sum + j.shifts.length, 0);

      const workersDeployed = c.jobs.reduce(
        (sum, j) => sum + j.shifts.reduce((s2, sh) => s2 + sh.slotsFilled, 0),
        0
      );

      const revenue = c.invoices.reduce((s, inv) => s + inv.amount, 0);

      return {
        id: c.id,
        name: c.name,
        industry: c.industry,
        contactName: c.contactName,
        contactEmail: c.contactEmail,
        contactPhone: c.contactPhone,
        createdAt: c.createdAt.toISOString(),
        openShifts,
        workersDeployed,
        revenue,
        jobCount: c.jobs.length,
      };
    })
  );
});

export const POST = withAuth(async (req: NextRequest, { user }) => {
  if (user.role !== "AGENCY") {
    return apiError("Only agency staff can add clients", 403);
  }

  const agencyProfile = await prisma.agencyProfile.findUnique({
    where: { userId: user.id },
    select: { agencyId: true },
  });

  if (!agencyProfile) return apiError("Agency profile not found", 404);

  const body = await req.json();
  const { name, industry, contactName, contactEmail, contactPhone } = body as {
    name: string;
    industry: string;
    contactName: string;
    contactEmail: string;
    contactPhone?: string;
  };

  if (!name || !industry || !contactName || !contactEmail) {
    return apiError("name, industry, contactName, and contactEmail are required", 400);
  }

  const client = await prisma.client.create({
    data: {
      name,
      industry,
      agencyId: agencyProfile.agencyId,
      contactName,
      contactEmail,
      contactPhone: contactPhone ?? null,
    },
  });

  return apiSuccess(
    {
      id: client.id,
      name: client.name,
      industry: client.industry,
    },
    201
  );
});
