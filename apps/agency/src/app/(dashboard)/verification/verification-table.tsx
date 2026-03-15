"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface DocumentInfo {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadedAt: string;
}

interface PendingWorker {
  id: string;
  userId: string;
  name: string;
  phone: string;
  email: string;
  residencyStatus: string;
  isStudentPass: boolean;
  schoolName: string | null;
  locExpiryDate: string | null;
  createdAt: string;
  documents: DocumentInfo[];
}

const RESIDENCY_LABELS: Record<string, string> = {
  CITIZEN: "Singapore Citizen",
  PR: "Permanent Resident",
  STUDENT_PASS: "Student Pass",
  DEPENDANT_PASS: "Dependant Pass",
};

export function VerificationTable({ workers }: { workers: PendingWorker[] }) {
  const router = useRouter();
  const [viewingDoc, setViewingDoc] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<PendingWorker | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleApprove(worker: PendingWorker) {
    if (!confirm(`Approve ${worker.name}? This will grant them access to browse and apply for jobs.`)) return;

    setLoadingId(worker.id);
    const res = await fetch(`/api/verification/${worker.id}/approve`, {
      method: "POST",
    });

    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Failed to approve");
    }

    setLoadingId(null);
    router.refresh();
  }

  async function handleReject() {
    if (!rejectTarget || !rejectReason.trim()) return;

    setLoadingId(rejectTarget.id);
    const res = await fetch(`/api/verification/${rejectTarget.id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: rejectReason.trim() }),
    });

    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Failed to reject");
    }

    setLoadingId(null);
    setRejectTarget(null);
    setRejectReason("");
    router.refresh();
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-SG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function docLabel(type: string) {
    const labels: Record<string, string> = {
      NRIC_FRONT: "NRIC Front",
      NRIC_BACK: "NRIC Back",
      STUDENT_PASS: "Student Pass",
      LETTER_OF_CONSENT: "Letter of Consent",
      DEPENDANT_PASS: "Dependant Pass",
      OTHER_CERT: "Other Certificate",
    };
    return labels[type] || type;
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-cream/50">
              <th className="px-5 py-3 font-semibold text-muted">Worker</th>
              <th className="px-5 py-3 font-semibold text-muted">Residency</th>
              <th className="px-5 py-3 font-semibold text-muted">Documents</th>
              <th className="px-5 py-3 font-semibold text-muted">Submitted</th>
              <th className="px-5 py-3 text-right font-semibold text-muted">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {workers.map((w) => (
              <tr key={w.id} className="transition-colors hover:bg-cream/30">
                <td className="px-5 py-4">
                  <div className="font-semibold text-ink">{w.name}</div>
                  <div className="mt-0.5 text-xs text-muted">{w.phone || w.email}</div>
                </td>

                <td className="px-5 py-4">
                  <span className="inline-flex items-center rounded-full bg-accent2/10 px-2.5 py-0.5 text-xs font-semibold text-accent2">
                    {RESIDENCY_LABELS[w.residencyStatus] || w.residencyStatus}
                  </span>
                  {w.isStudentPass && (
                    <div className="mt-1.5 space-y-0.5 text-xs text-muted">
                      {w.schoolName && <div>School: {w.schoolName}</div>}
                      {w.locExpiryDate && <div>LOC expires: {formatDate(w.locExpiryDate)}</div>}
                    </div>
                  )}
                </td>

                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-1.5">
                    {w.documents.length === 0 ? (
                      <span className="text-xs text-muted">No documents</span>
                    ) : (
                      w.documents.map((doc) => (
                        <button
                          key={doc.id}
                          onClick={() => setViewingDoc(doc.url)}
                          className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium text-ink transition-colors hover:border-accent2 hover:text-accent2"
                        >
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                          </svg>
                          {docLabel(doc.type)}
                        </button>
                      ))
                    )}
                  </div>
                </td>

                <td className="px-5 py-4 text-xs text-muted">
                  {formatDate(w.createdAt)}
                </td>

                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleApprove(w)}
                      disabled={loadingId === w.id}
                      className="rounded-lg bg-green px-3.5 py-1.5 text-xs font-semibold text-ink shadow-sm transition-colors hover:bg-green/80 disabled:opacity-50"
                    >
                      {loadingId === w.id ? "..." : "Approve"}
                    </button>
                    <button
                      onClick={() => { setRejectTarget(w); setRejectReason(""); }}
                      disabled={loadingId === w.id}
                      className="rounded-lg border border-red-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-red-600 shadow-sm transition-colors hover:bg-red-50 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Document Viewer Modal */}
      {viewingDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
          onClick={() => setViewingDoc(null)}
        >
          <div
            className="relative max-h-[85vh] max-w-2xl overflow-hidden rounded-2xl bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setViewingDoc(null)}
              className="absolute right-3 top-3 z-10 rounded-full bg-black/50 p-1.5 text-white transition-colors hover:bg-black/70"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={viewingDoc}
              alt="Document"
              className="max-h-[85vh] w-full object-contain"
            />
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
          onClick={() => setRejectTarget(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-ink">
              Reject {rejectTarget.name}
            </h3>
            <p className="mt-1 text-sm text-muted">
              Provide a reason so the worker knows what to fix.
            </p>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. NRIC photo is blurry, please re-upload a clearer image."
              rows={3}
              className="mt-4 w-full rounded-lg border border-border bg-paper px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400"
              autoFocus
            />

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setRejectTarget(null)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-cream"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || loadingId === rejectTarget.id}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {loadingId === rejectTarget.id ? "Rejecting..." : "Reject Worker"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
