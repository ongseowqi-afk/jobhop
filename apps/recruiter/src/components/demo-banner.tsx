"use client";

export function DemoBanner() {
  return (
    <div className="flex items-center justify-center gap-2 bg-accent px-4 py-1.5 text-xs font-semibold text-white">
      <span className="rounded bg-white/20 px-1.5 py-0.5 font-mono text-[10px] tracking-widest">
        DEMO
      </span>
      <span>
        Demo mode — Login: <strong>priya@mci.com.sg</strong> / Password:{" "}
        <strong>051199</strong>
      </span>
    </div>
  );
}
