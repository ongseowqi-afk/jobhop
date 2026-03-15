import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { prisma, UserRole } from "@jobhop/db";

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, phone, password, name, role } = body as {
      email?: string;
      phone?: string;
      password: string;
      name: string;
      role: UserRole;
    };

    if (!name || !password || !role) {
      return NextResponse.json(
        { error: "name, password, and role are required" },
        { status: 400 }
      );
    }

    if (!email && !phone) {
      return NextResponse.json(
        { error: "email or phone is required" },
        { status: 400 }
      );
    }

    const validRoles: UserRole[] = ["WORKER", "RECRUITER", "AGENCY", "CLIENT"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${validRoles.join(", ")}` },
        { status: 400 }
      );
    }

    const supabaseAdmin = getAdminClient();
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: email || undefined,
        phone: phone || undefined,
        password,
        email_confirm: true,
        phone_confirm: true,
      });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const user = await prisma.user.create({
      data: {
        email: email || null,
        phone: phone || null,
        name,
        role,
        ...(role === "WORKER" && {
          workerProfile: { create: {} },
        }),
        ...(role === "RECRUITER" && {
          recruiterProfile: { create: {} },
        }),
      },
      include: {
        workerProfile: true,
        recruiterProfile: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: user.id,
          supabaseId: authData.user.id,
          name: user.name,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Registration error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
