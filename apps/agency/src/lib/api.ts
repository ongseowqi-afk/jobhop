import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { prisma, UserRole } from "@jobhop/db";

interface AuthedUser {
  id: string;
  supabaseId: string;
  email: string;
  role: UserRole;
}

type RouteHandler = (
  req: NextRequest,
  context: { user: AuthedUser; params?: Record<string, string> }
) => Promise<NextResponse>;

type NextRouteHandler = (
  req: NextRequest,
  ctx: { params: Promise<Record<string, string>> }
) => Promise<NextResponse>;

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

export function withAuth(handler: RouteHandler): NextRouteHandler {
  return async (req, ctx) => {
    try {
      const supabase = supabaseFromRequest(req);
      const { data: { user: supaUser }, error } = await supabase.auth.getUser();

      if (error || !supaUser) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const dbUser = await prisma.user.findFirst({
        where: {
          OR: [
            ...(supaUser.email ? [{ email: supaUser.email }] : []),
            ...(supaUser.phone ? [{ phone: supaUser.phone }] : []),
          ],
        },
      });

      if (!dbUser) {
        return NextResponse.json({ error: "User not found in database" }, { status: 404 });
      }

      const resolvedParams = ctx?.params ? await ctx.params : undefined;

      return handler(req, {
        user: {
          id: dbUser.id,
          supabaseId: supaUser.id,
          email: supaUser.email ?? "",
          role: dbUser.role,
        },
        params: resolvedParams,
      });
    } catch (err) {
      console.error("Auth middleware error:", err);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  };
}

export function withRole(...roles: UserRole[]) {
  return (handler: RouteHandler): NextRouteHandler => {
    return withAuth(async (req, context) => {
      if (!roles.includes(context.user.role)) {
        return NextResponse.json(
          { error: `Forbidden — requires role: ${roles.join(" | ")}` },
          { status: 403 }
        );
      }
      return handler(req, context);
    });
  };
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}
