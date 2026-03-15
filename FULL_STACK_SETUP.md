# JobHop — Full Stack Setup (MVP Speed Run)
## From zero to all 3 apps running

You have: Supabase ✅ Vercel ✅
Architecture: Agency Next.js app hosts the shared API. Recruiter + Worker call it.

---

## 1. GLOBAL CLI TOOLS (install once)

```bash
npm install -g pnpm eas-cli turbo
# Verify
node -v      # 20+ or 22+
pnpm -v      # 9+
```

For mobile (Worker App):
- **Mac/iOS**: Xcode 15+ from App Store → `xcode-select --install` → `sudo gem install cocoapods`
- **Android**: Android Studio → install SDK + emulator → set `ANDROID_HOME`
- **Quick test without native builds**: Use Expo Go app on your phone (scan QR from terminal)

---

## 2. SUPABASE SETUP

### Project Config
1. Region: **Southeast Asia (Singapore)**
2. Go to Authentication → Providers:
   - Enable **Email** (recruiter/agency login)
   - Enable **Phone** (worker OTP) — use Supabase test numbers for dev
3. Go to Storage → Create buckets:
   - `documents` (private) — NRIC photos, student passes, LOC
   - `avatars` (public) — profile photos
4. Go to Database → Replication → Enable Realtime on: `shift_assignments`, `timesheets`, `applications`, `notifications`

### Grab Your Keys (Settings → API)
```
SUPABASE_URL = https://[ref].supabase.co
SUPABASE_ANON_KEY = eyJ...
SUPABASE_SERVICE_ROLE_KEY = eyJ... (keep secret!)
DATABASE_URL = postgresql://postgres:[pw]@db.[ref].supabase.co:5432/postgres
```

---

## 3. PROJECT INIT

```bash
# Create the monorepo
mkdir jobhop && cd jobhop
pnpm init
# Copy in: package.json, pnpm-workspace.yaml, turbo.json, .cursorrules
# from the files provided

# Create folder structure
mkdir -p apps/agency apps/recruiter apps/worker packages/db packages/types reference

# Copy prototype
cp jobhop-unified.html reference/
```

### Init Agency Portal (Next.js — hosts API)
```bash
cd apps/agency
pnpm create next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

pnpm add @supabase/supabase-js @supabase/ssr @prisma/client
pnpm add @tanstack/react-query zod react-hook-form @hookform/resolvers
pnpm add lucide-react sonner recharts date-fns jsonwebtoken qrcode
pnpm add class-variance-authority clsx tailwind-merge
pnpm add -D @types/jsonwebtoken @types/qrcode

# Init shadcn
npx shadcn@latest init
npx shadcn@latest add button card table badge input select dialog sheet tabs avatar separator skeleton dropdown-menu
```

### Init Recruiter Portal (Next.js)
```bash
cd ../recruiter
pnpm create next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

pnpm add @supabase/supabase-js @supabase/ssr @tanstack/react-query
pnpm add zod react-hook-form @hookform/resolvers
pnpm add lucide-react sonner recharts date-fns
pnpm add class-variance-authority clsx tailwind-merge

npx shadcn@latest init
npx shadcn@latest add button card table badge input select dialog sheet tabs avatar separator skeleton dropdown-menu
```

### Init Worker App (Expo)
```bash
cd ../worker
npx create-expo-app@latest . --template tabs

pnpm add @supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill
pnpm add expo-secure-store expo-camera expo-image-picker expo-document-picker
pnpm add expo-notifications expo-device expo-font expo-file-system
pnpm add @tanstack/react-query zustand date-fns
pnpm add nativewind tailwindcss
pnpm add react-native-reanimated react-native-gesture-handler
```

### Init Database Package
```bash
cd ../../packages/db
pnpm init
pnpm add prisma @prisma/client
pnpm add -D tsx

# Copy schema.prisma into prisma/ folder
mkdir prisma
# Paste the schema from .cursorrules into prisma/schema.prisma

npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed  # after adding seed.ts
```

---

## 4. ENVIRONMENT VARIABLES

### apps/agency/.env.local
```bash
DATABASE_URL="postgresql://postgres:[PW]@db.[REF].supabase.co:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://[REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."
QR_SECRET="generate-a-random-32-char-string"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### apps/recruiter/.env.local
```bash
NEXT_PUBLIC_SUPABASE_URL="https://[REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
```

### apps/worker/.env
```bash
EXPO_PUBLIC_SUPABASE_URL="https://[REF].supabase.co"
EXPO_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
EXPO_PUBLIC_API_URL="http://localhost:3000/api"
```

---

## 5. KEY CONFIGS (paste these in)

### Supabase Client — Next.js Server
```ts
// apps/agency/src/lib/supabase/server.ts (same for recruiter)
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}
```

### Supabase Client — Next.js Browser
```ts
// apps/agency/src/lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### Supabase Client — React Native
```ts
// apps/worker/lib/supabase.ts
import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
```

### Prisma Client Singleton
```ts
// apps/agency/src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";
const g = globalThis as unknown as { prisma: PrismaClient };
export const prisma = g.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") g.prisma = prisma;
```

### Auth Middleware
```ts
// apps/agency/middleware.ts (and apps/recruiter/middleware.ts)
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && !request.nextUrl.pathname.startsWith("/login")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|login|api).*)"],
};
```

### Tailwind Config (shared design tokens)
```ts
// tailwind.config.ts — same for both Next.js apps
const config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0D0D0D", paper: "#F5F2EC", cream: "#EDE9DF",
        accent: "#E85A2A", accent2: "#2A7AE8", gold: "#C8A84B",
        muted: "#8B8580", card: "#FFFFFF",
      },
      fontFamily: {
        serif: ["DM Serif Display", "serif"],
        sans: ["DM Sans", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
```

---

## 6. RUN IT

```bash
# From project root
pnpm dev
# Agency: localhost:3000 (+ API)
# Recruiter: localhost:3001

# Worker app (separate terminal)
cd apps/worker
npx expo start
# Scan QR with Expo Go on your phone, or press 'i' for iOS sim
```

---

## 7. DEPLOY

### Vercel (web apps)
```
Agency Portal:
  Root Directory: apps/agency
  Framework: Next.js
  Build: pnpm turbo build --filter=agency
  Add all env vars

Recruiter Portal:
  Root Directory: apps/recruiter
  Framework: Next.js
  Build: pnpm turbo build --filter=recruiter
  NEXT_PUBLIC_API_URL = https://your-agency-app.vercel.app/api
```

### Expo EAS (mobile)
```bash
cd apps/worker
eas login
eas build:configure
eas build --platform all --profile preview
```

---

## 8. WHAT TO SKIP FOR MVP (add later)

- SingPass MyInfo integration (use manual doc upload)
- Push notifications (use in-app notifications first)
- Location-based job search (use text search)
- Payment gateway integration (track manually, pay via bank transfer)
- Automated invoice PDF generation (use simple table view)
- Worker ratings/reviews system (hardcode for demo)
- Cron jobs for shift reminders (manual for now)
