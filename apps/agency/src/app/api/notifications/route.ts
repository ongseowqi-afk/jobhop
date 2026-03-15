import { NextRequest } from "next/server";
import { prisma } from "@jobhop/db";
import { withAuth, apiSuccess, apiError } from "@/lib/api";

export const GET = withAuth(async (_req: NextRequest, { user }) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return apiSuccess(
    notifications.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      type: n.type,
      data: n.data,
      read: n.read,
      createdAt: n.createdAt.toISOString(),
    }))
  );
});

export const PATCH = withAuth(async (_req: NextRequest, { user }) => {
  await prisma.notification.updateMany({
    where: { userId: user.id, read: false },
    data: { read: true },
  });

  return apiSuccess({ marked: true });
});

export const DELETE = withAuth(async (req: NextRequest, { user }) => {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (id) {
    const n = await prisma.notification.findUnique({ where: { id } });
    if (!n || n.userId !== user.id) return apiError("Not found", 404);
    await prisma.notification.delete({ where: { id } });
  } else {
    await prisma.notification.deleteMany({ where: { userId: user.id } });
  }

  return apiSuccess({ deleted: true });
});
