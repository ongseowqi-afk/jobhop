import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { prisma } from "@jobhop/db";

function supabaseFromRequest(req: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll() {},
      },
    }
  );
}

export async function POST(req: NextRequest) {
  try {
    const supabase = supabaseFromRequest(req);
    const {
      data: { user: supaUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !supaUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, residencyStatus, documents, isStudentPass, schoolName, locExpiryDate } =
      body as {
        name: string;
        residencyStatus: string;
        documents: Array<{ type: string; url: string }>;
        isStudentPass?: boolean;
        schoolName?: string;
        locExpiryDate?: string;
      };

    if (!name || !residencyStatus) {
      return NextResponse.json(
        { error: "name and residencyStatus are required" },
        { status: 400 }
      );
    }

    const validStatuses = ["CITIZEN", "PR", "STUDENT_PASS", "DEPENDANT_PASS"];
    if (!validStatuses.includes(residencyStatus)) {
      return NextResponse.json(
        { error: `Invalid residencyStatus. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    let user = await prisma.user.findFirst({
      where: {
        OR: [
          ...(supaUser.email ? [{ email: supaUser.email }] : []),
          ...(supaUser.phone ? [{ phone: supaUser.phone }] : []),
        ],
      },
      include: { workerProfile: true },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name,
          email: supaUser.email || null,
          phone: supaUser.phone || null,
          role: "WORKER",
          workerProfile: {
            create: {
              residencyStatus: residencyStatus as "CITIZEN" | "PR" | "STUDENT_PASS" | "DEPENDANT_PASS",
              isStudentPass: isStudentPass || residencyStatus === "STUDENT_PASS",
              schoolName: schoolName || null,
              locExpiryDate: locExpiryDate ? new Date(locExpiryDate) : null,
              weeklyHoursCap: residencyStatus === "STUDENT_PASS" ? 16 : null,
            },
          },
        },
        include: { workerProfile: true },
      });
    } else {
      if (user.workerProfile) {
        await prisma.workerProfile.update({
          where: { id: user.workerProfile.id },
          data: {
            residencyStatus: residencyStatus as "CITIZEN" | "PR" | "STUDENT_PASS" | "DEPENDANT_PASS",
            isStudentPass: isStudentPass || residencyStatus === "STUDENT_PASS",
            schoolName: schoolName || null,
            locExpiryDate: locExpiryDate ? new Date(locExpiryDate) : null,
            weeklyHoursCap: residencyStatus === "STUDENT_PASS" ? 16 : null,
          },
        });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { name },
      });
    }

    if (documents?.length && user.workerProfile) {
      await prisma.document.deleteMany({
        where: { workerId: user.workerProfile.id },
      });

      await prisma.document.createMany({
        data: documents.map((doc) => ({
          workerId: user.workerProfile!.id,
          name: doc.type,
          type: doc.type as "NRIC_FRONT" | "NRIC_BACK" | "STUDENT_PASS" | "LETTER_OF_CONSENT" | "DEPENDANT_PASS" | "OTHER_CERT",
          url: doc.url,
        })),
      });
    }

    return NextResponse.json({
      success: true,
      data: { userId: user.id, profileId: user.workerProfile?.id },
    });
  } catch (err) {
    console.error("Onboarding error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
