import Link from "next/link";
import { DemoBanner } from "@/components/demo-banner";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/clients", label: "Clients" },
  { href: "/shifts", label: "Shifts" },
  { href: "/timesheets", label: "Timesheets" },
  { href: "/roster", label: "Roster" },
  { href: "/billing", label: "Billing" },
  { href: "/verification", label: "Verification" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <DemoBanner />
      <div className="flex flex-1">
        <aside className="w-60 shrink-0 border-r border-border bg-card px-4 py-6">
          <Link href="/" className="mb-8 block px-3">
            <span className="font-heading text-xl font-bold">
              Job<span className="text-accent2">.</span>Hop
            </span>
            <span className="ml-1.5 text-xs text-muted">Agency</span>
          </Link>

          <nav className="space-y-0.5">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-cream hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
