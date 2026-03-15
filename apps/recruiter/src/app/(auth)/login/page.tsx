"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-heading text-4xl font-bold">
            Job<span className="text-accent">.</span>Hop
          </h1>
          <p className="mt-2 text-sm text-muted">Recruiter Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-bold text-ink">Sign in</h2>
          <p className="mt-1 text-sm text-muted">Use your recruiter email and password.</p>

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-600">{error}</div>
          )}

          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-accent/30"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-accent/30"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent/90 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
