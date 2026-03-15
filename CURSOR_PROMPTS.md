# JobHop — Cursor Prompts (MVP Speed Run)
## Paste these into Cursor sequentially. Each builds on the last.

---

## SPRINT 1: Foundation (Days 1–3)

### Prompt 1: Monorepo + DB
```
Set up a Turborepo monorepo called "jobhop" with pnpm:
- apps/agency (Next.js 15, App Router, Tailwind, src/ dir)
- apps/recruiter (Next.js 15, App Router, Tailwind, src/ dir)
- apps/worker (Expo React Native with Expo Router tabs)
- packages/db (Prisma + PostgreSQL)
- packages/types (shared TypeScript types)

Use the schema from .cursorrules for Prisma. Run prisma generate + migrate dev.
The Agency app hosts all API routes at app/api/* — Recruiter and Worker call this API.
```

### Prompt 2: Seed Data
```
Create a seed file in packages/db that populates:
- 1 Agency: "MCI Workforce Solutions"
- 1 Recruiter: Priya Sharma (priya@mciworkforce.sg)
- 1 Agency Admin: Sarah Chen (sarah@mciworkforce.sg)
- 4 Clients: DBS Marina Bay Sands, Lazada Fulfillment, Uniqlo Singapore, GrabFood
- 5 Workers: Marcus Lim (4.9★, 47 shifts, verified citizen), Aisha Tan, Rajesh Kumar, Jenny Wong, Siti Nurhayati — with skills and ratings matching the prototype
- 5 Jobs with shifts matching the prototype data
- Skills: Warehouse Ops, Event Management, Forklift, Retail, Food Handling, Delivery, Logistics, F&B

All workers should be VERIFIED status with CITIZEN residency for demo purposes.
Marcus should have 3 upcoming shifts and $2,840 total earned.
```

### Prompt 3: Auth + API Foundation
```
In apps/agency, set up:
1. Supabase client (server.ts + client.ts + prisma.ts) using configs from .cursorrules
2. Auth middleware (middleware.ts) protecting all routes except /login and /api
3. Login page at (auth)/login with email + password form
4. Base API route helpers: withAuth() wrapper that checks supabase.auth.getUser() and returns the user with their role, withRole('AGENCY') wrapper that enforces role

Create these initial API routes:
- POST /api/auth/register — creates user in Supabase + creates profile in Prisma
- GET /api/workers/me — returns current worker's full profile
- GET /api/verification/pending — returns workers with PENDING_VERIFICATION status
- POST /api/verification/[id]/approve — sets worker to VERIFIED
- POST /api/verification/[id]/reject — sets worker to REJECTED with reason
```

### Prompt 4: Agency Layout + Dashboard
```
Build the Agency Portal layout matching the prototype (Panel 3).
Reference /reference/jobhop-unified.html for exact design.

Sidebar with nav: Dashboard, Clients, Shift Management, Worker Roster, Timesheets, Billing, Verification (new — with pending count badge).
Use design tokens from .cursorrules. Brand: "JobHop" with blue dot.

Dashboard page with 4 stat cards (Active Clients, Shifts This Week, Workers Deployed, Revenue MTD) + Upcoming Shifts table + Pending Timesheets table.
Use mock data matching the prototype for now. Wire to API later.
```

---

## SPRINT 2: Worker Onboarding + Jobs (Days 4–6)

### Prompt 5: Worker Auth + Onboarding
```
In apps/worker, set up:
1. Supabase client with AsyncStorage adapter (detectSessionInUrl: false)
2. Auth flow: phone number input → OTP verification → profile creation
3. Onboarding screens (after first login):
   a. Name + basic info
   b. Residency status picker: Singapore Citizen, PR, Student Pass, Dependant Pass
   c. Document upload: NRIC front photo (use expo-image-picker)
      - If Student Pass: also upload Student Pass photo + Letter of Consent (LOC)
   d. Freelance contractor agreement screen: "I confirm I am an independent contractor. I understand there is no employment relationship, no CPF contributions, and I am responsible for my own IRAS tax filings." + Accept button
   e. Confirmation screen: "Your documents are under review. You'll be notified once verified."
4. After onboarding: status = PENDING_VERIFICATION. Show a "Verification Pending" screen that blocks access to the main tabs until VERIFIED.

API calls needed:
- POST /api/workers/onboarding (residency status, doc URLs)
- POST /api/workers/contractor-agreement (accept)
```

### Prompt 6: Agency Verification Screen
```
Build the Verification page in Agency Portal.

A table of workers with PENDING_VERIFICATION status showing:
- Worker name, phone, residency status
- Uploaded documents (clickable to view full image from Supabase Storage)
- For Student Pass: show school name, LOC expiry date
- "Approve" button (green) and "Reject" button (red, requires reason input)

When approved: worker status → VERIFIED, send notification.
When rejected: worker status → REJECTED with reason, worker can re-upload.

This is a critical compliance screen — MOM requires we verify work eligibility before any gig work.
```

### Prompt 7: Jobs API + Worker Job Screen
```
API routes:
- GET /api/jobs — browse jobs. MUST check worker verificationStatus = VERIFIED. Support filters: category, search query. Return with client name, shift counts.
- GET /api/jobs/[id] — job detail with all shifts
- POST /api/applications — worker applies to job. Check VERIFIED. If student pass, check weekly hours won't exceed cap.
- GET /api/applications?jobId= — list applications for a job (recruiter/agency)
- PATCH /api/applications/[id] — accept/reject (recruiter/agency)

Worker App — Jobs screen matching prototype:
- Search bar + filter chips (All, Logistics, Retail, Events, Delivery, Saved)
- Job cards: company icon, title × slots, company name, tags, pay rate, Apply Now button, heart save
- Apply shows toast "Applied! We're on it."
```

### Prompt 8: Worker Home Screen
```
Build the Worker Home screen matching the prototype exactly:
- Dark greeting band: "Hi there," / "Marcus Lim" / chips: Available Now, 3 Active Shifts
- 3 KPI cards: This Week earnings, Rating (stars), Shifts Done
- Upcoming Shift card with full details + "Clock In with QR" button
- "Jobs For You" section with 2 recommended job cards

All data from GET /api/workers/me (profile, stats) and GET /api/shifts?upcoming=true (next shift).
```

---

## SPRINT 3: Operations (Days 7–9)

### Prompt 9: Shift Management + Assignment
```
Agency Portal — Shift Management page matching prototype:
- Table: Shift, Client, Location, Date, Time, Workers (filled/total), Fill Rate bar, Actions
- "Assign" button opens a drawer/modal to pick from verified workers
- "Create Shift" button in header with form: select job, date, start/end time, slots

API routes:
- POST /api/shifts — create shift for a job
- POST /api/shifts/[id]/assign — assign worker to shift
- GET /api/shifts?jobId= — list shifts for job
```

### Prompt 10: QR Clock-In + Timesheets
```
Build the full clock-in/out flow:

1. API: GET /api/shifts/[id]/qr — generates JWT-signed QR payload (shiftId + date + 1hr expiry)
2. Agency can view/print QR for each shift (show QR code image on shift detail page)
3. Worker App: "Clock In with QR" button opens camera (expo-camera barcode scanner)
4. On scan: POST /api/shifts/[id]/clock-in with QR token
5. Server verifies JWT, checks worker is assigned, creates Timesheet with clockIn timestamp
6. Worker sees "Clocked In" status on shift card, timer starts
7. "Clock Out" button: POST /api/shifts/[id]/clock-out → updates Timesheet with clockOut + calculates totalHours
8. For Student Pass workers: before clock-in, check total approved hours this week. If >= 16, block with message. If >= 12, show warning.

Worker App — Schedule screen matching prototype:
- Calendar strip (day selector with dots for shift days)
- Week earnings summary card (dark)
- Shift cards with time column, title, location, status pills
```

### Prompt 11: Timesheet Review
```
Agency Portal — Timesheets page matching prototype:
- Table: Worker, Shift, Client, Date, Clock In, Clock Out, Total Hrs, Status, Actions
- Pending rows: Approve (green) + Flag (red) buttons
- Approve: PATCH /api/timesheets/[id] with status=APPROVED
- Flag: requires a reason note, sets status=FLAGGED
- Approved rows: just "View" button
- Live-updating via Supabase Realtime subscription on timesheets table
```

---

## SPRINT 4: Recruiter + Money (Days 10–12)

### Prompt 12: Recruiter Portal — Full Build
```
Build the entire Recruiter Portal matching prototype Panel 2.

Layout: Sidebar with Dashboard, Candidates, Placements, Job Orders, Commission.
Brand: "JobHop" with orange dot.

Dashboard:
- 4 stats: Active Candidates, Placements MTD, Commission MTD ($, orange), Open Job Orders
- Recent Placements table with commission per placement

Candidates page:
- Pipeline table: name, skills, rating, show rate, stage (Screening/Ready/Placed)
- "Place" button for Ready candidates → opens modal to select job
- POST /api/placements creates placement with commissionRate

Job Orders page:
- Card grid: job title × slots, client, dates, pay rate, placed count, commission rate
- "Match Candidates" button links to candidates page

Commission page:
- Stats: This Month, Last Month, All Time, Avg per Placement
- Breakdown table by week: placements, hours, rate, earned, status (Processing/Paid)

All data from:
- GET /api/placements (my placements)
- GET /api/commission/summary
- GET /api/jobs?status=OPEN (job orders)
- GET /api/workers?stage=ready (candidates pool)
```

### Prompt 13: Worker Earnings Screen
```
Worker App — Earnings screen matching prototype:

Dark hero section:
- "Total Earned" label
- Large amount: $2,840 (DM Serif Display 48px)
- Period: "March 2026 · 47 shifts completed"
- Tab switcher: This Month / 3 Months / All Time

Breakdown card:
- Base Earnings row
- Bonuses row (+green)
- Net Payout row (accent orange, large)
- NO CPF line — these are freelance contractors

Recent Payslips list:
- Wallet icon, week label, shifts/hours subtitle
- Amount (serif), Paid/Pending badge

Data from GET /api/workers/me/earnings
```

### Prompt 14: Agency Billing + Clients
```
Agency Portal — Billing page:
- 4 stats: Revenue MTD, Outstanding, Collected, Avg Bill Rate
- Invoice table: Invoice #, Client, Period, Hours, Amount, Status
- "Generate Invoice" button: creates invoice from approved timesheets for selected client + period

Clients page:
- 2-column card grid: client name, industry, status badge
- Stats per card: Open Shifts, Workers Deployed, Revenue, Client Since
- "Manage Shifts" and "Client Login" buttons
- "Add Client" form (name, industry, contact info)
```

---

## SPRINT 5: Polish + Deploy (Days 13–14)

### Prompt 15: Worker Profile + Remaining Screens
```
Worker App — Profile screen matching prototype:
- Dark hero: avatar, name, role, stars, rating
- Stat row: Shifts, Earned, Show Rate, Sectors
- Verified Skills section with checkmark badges
- Account menu: My Documents, Bank Account, Notifications (badge), Help & Support, Settings
- All with vector SVG icons, no emojis

Also build: Worker Roster page in Agency portal (table of all workers with skills, ratings, availability).
```

### Prompt 16: Notifications + Realtime
```
Add in-app notifications:
1. Notification model already in schema
2. When key events happen (application accepted, shift confirmed, timesheet approved), create Notification record
3. Worker App: notification bell with unread count badge
4. Notification dropdown/screen listing recent notifications
5. Supabase Realtime subscription on notifications table filtered by userId

Add realtime to Agency dashboard:
- Subscribe to shift_assignments + timesheets changes
- Invalidate React Query cache on change so dashboard stats update live
```

### Prompt 17: Deploy + Demo Mode
```
1. Deploy Agency to Vercel (root: apps/agency)
2. Deploy Recruiter to Vercel (root: apps/recruiter, set NEXT_PUBLIC_API_URL to agency Vercel URL)
3. Build Worker app with EAS: eas build --platform all --profile preview
4. Run database migration on production Supabase
5. Seed demo data

Create a "Demo Mode" toggle that:
- Auto-logs in as Marcus (worker), Priya (recruiter), or Sarah (agency)
- Pre-populates a full shift lifecycle: applied → accepted → assigned → clocked in → approved → paid
- Useful for the IMDA challenge demo
```
