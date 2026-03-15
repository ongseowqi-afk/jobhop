import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@jobhop/db";
import { withAuth, apiSuccess, apiError } from "@/lib/api";

const QR_SECRET = () => process.env.QR_JWT_SECRET || process.env.NEXTAUTH_SECRET || "jobhop-qr-secret-dev";

export const GET = withAuth(async (_req: NextRequest, { user, params }) => {
  if (user.role !== "AGENCY" && user.role !== "RECRUITER") {
    return apiError("Only agency/recruiter can generate QR codes", 403);
  }

  const shiftId = params?.id;
  if (!shiftId) return apiError("Shift ID is required", 400);

  const shift = await prisma.shift.findUnique({
    where: { id: shiftId },
    include: { job: { select: { title: true } } },
  });
  if (!shift) return apiError("Shift not found", 404);

  const token = jwt.sign(
    { shiftId, date: shift.date.toISOString(), type: "clock-in" },
    QR_SECRET(),
    { expiresIn: "1h" }
  );

  return apiSuccess({
    token,
    shiftId,
    jobTitle: shift.job.title,
    date: shift.date.toISOString(),
    startTime: shift.startTime,
    endTime: shift.endTime,
    expiresIn: 3600,
  });
});
