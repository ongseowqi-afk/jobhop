"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import Link from "next/link";

interface Assignment {
  id: string;
  status: string;
  workerName: string;
  workerPhone: string | null;
}

interface TimesheetEntry {
  id: string;
  workerName: string;
  clockIn: string;
  clockOut: string | null;
  totalHours: number | null;
  status: string;
}

interface ShiftData {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  slotsTotal: number;
  jobTitle: string;
  clientName: string;
  location: string;
  assignments: Assignment[];
  timesheets: TimesheetEntry[];
}

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: "bg-blue-50 text-blue-700",
  CLOCKED_IN: "bg-green-50 text-green-700",
  CLOCKED_OUT: "bg-gray-100 text-gray-600",
  NO_SHOW: "bg-red-50 text-red-700",
  CANCELLED: "bg-red-50 text-red-500",
};

export function ShiftQRView({ shift }: { shift: ShiftData }) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-SG", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit" });

  const generateQR = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/shifts/${shift.id}/qr`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to generate QR");
        return;
      }
      const token = json.data.token;
      const payload = JSON.stringify({ shiftId: shift.id, token });
      const url = await QRCode.toDataURL(payload, {
        width: 320,
        margin: 2,
        color: { dark: "#0D0D0D", light: "#FFFFFF" },
      });
      setQrDataUrl(url);
    } catch {
      setError("Failed to generate QR code");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateQR();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <Link
        href="/shifts"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink"
      >
        ← Back to Shifts
      </Link>

      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-ink">{shift.jobTitle}</h1>
        <p className="mt-1 text-sm text-muted">{shift.clientName} · {shift.location}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* QR Code Card */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-bold text-ink">Clock-In QR Code</h2>
          <p className="mt-1 text-sm text-muted">
            {formatDate(shift.date)} · {shift.startTime} – {shift.endTime}
          </p>

          <div className="mt-6 flex flex-col items-center">
            {loading ? (
              <div className="flex h-80 w-80 items-center justify-center rounded-xl bg-cream">
                <span className="text-sm text-muted">Generating QR...</span>
              </div>
            ) : error ? (
              <div className="flex h-80 w-80 flex-col items-center justify-center rounded-xl bg-red-50">
                <span className="text-sm text-red-600">{error}</span>
                <button
                  onClick={generateQR}
                  className="mt-3 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white"
                >
                  Retry
                </button>
              </div>
            ) : qrDataUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrDataUrl} alt="Clock-in QR Code" className="h-80 w-80 rounded-xl" />
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={generateQR}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:bg-cream"
                  >
                    Refresh QR
                  </button>
                  <button
                    onClick={() => {
                      const link = document.createElement("a");
                      link.download = `qr-${shift.id}.png`;
                      link.href = qrDataUrl;
                      link.click();
                    }}
                    className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white"
                  >
                    Download
                  </button>
                </div>
              </>
            ) : null}
          </div>
          <p className="mt-4 text-center text-xs text-muted">QR code expires in 1 hour. Refresh to generate a new one.</p>
        </div>

        {/* Shift Info & Attendance */}
        <div className="space-y-6">
          {/* Assigned Workers */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-lg font-bold text-ink">
              Assigned Workers
              <span className="ml-2 text-sm font-normal text-muted">
                {shift.assignments.length}/{shift.slotsTotal}
              </span>
            </h2>
            {shift.assignments.length === 0 ? (
              <p className="mt-3 text-sm text-muted">No workers assigned yet.</p>
            ) : (
              <div className="mt-3 divide-y divide-border">
                {shift.assignments.map((a) => (
                  <div key={a.id} className="flex items-center justify-between py-3">
                    <div>
                      <span className="font-medium text-ink">{a.workerName}</span>
                      {a.workerPhone && (
                        <span className="ml-2 text-xs text-muted">{a.workerPhone}</span>
                      )}
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_COLORS[a.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {a.status.replace("_", " ")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Timesheets */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-lg font-bold text-ink">Attendance Log</h2>
            {shift.timesheets.length === 0 ? (
              <p className="mt-3 text-sm text-muted">No clock-in records yet.</p>
            ) : (
              <div className="mt-3 divide-y divide-border">
                {shift.timesheets.map((t) => (
                  <div key={t.id} className="py-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-ink">{t.workerName}</span>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        t.status === "APPROVED" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"
                      }`}>
                        {t.status}
                      </span>
                    </div>
                    <div className="mt-1 flex gap-4 text-xs text-muted">
                      <span>In: {formatTime(t.clockIn)}</span>
                      {t.clockOut && <span>Out: {formatTime(t.clockOut)}</span>}
                      {t.totalHours != null && (
                        <span className="font-semibold text-ink">{t.totalHours.toFixed(2)} hrs</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
