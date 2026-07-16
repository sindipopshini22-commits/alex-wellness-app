"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────

interface RiskReviewItem {
  id: string;
  riskAssessmentId: string;
  sessionId: string;
  overallRisk: string;
  mitigationAction: string;
  createdAt: string;
  reviewedAt: string | null;
  reviewerId: string | null;
  reviewNotes: string | null;
  isAdequate: boolean | null;
  retrainingSignal: boolean;
}

type FilterMode = "all" | "unreviewed" | "adequate" | "inadequate";

// ─── Component ─────────────────────────────────────────────────────────

export default function ClinicalReviewDashboard() {
  const [items, setItems] = useState<RiskReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterMode>("unreviewed");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reviews/queue");
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      } else {
        setError("Failed to load review queue.");
      }
    } catch {
      setError("Network error loading reviews.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const filtered = items.filter((item) => {
    switch (filter) {
      case "unreviewed":
        return item.reviewerId === null;
      case "adequate":
        return item.isAdequate === true;
      case "inadequate":
        return item.isAdequate === false;
      default:
        return true;
    }
  });

  async function submitReview(isAdequate: boolean) {
    if (!selectedId) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/reviews/${selectedId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isAdequate,
          reviewNotes,
          retrainingSignal: !isAdequate,
        }),
      });
      if (res.ok) {
        setSelectedId(null);
        setReviewNotes("");
        loadReviews();
      } else {
        setError("Failed to submit review.");
      }
    } catch {
      setError("Network error submitting review.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔬</span>
            <h2 className="text-sm font-semibold text-zinc-100">
              Clinical Review Dashboard
            </h2>
          </div>
          <button
            onClick={loadReviews}
            className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Refresh
          </button>
        </div>
        <p className="mt-1 text-[11px] text-zinc-500">
          Review flagged risk assessments for clinical appropriateness.
        </p>

        {/* Filter tabs */}
        <div className="mt-3 flex gap-1.5">
          {[
            { id: "unreviewed" as FilterMode, label: "Needs Review", count: items.filter((i) => i.reviewerId === null).length },
            { id: "adequate" as FilterMode, label: "Adequate", count: items.filter((i) => i.isAdequate === true).length },
            { id: "inadequate" as FilterMode, label: "Flagged", count: items.filter((i) => i.isAdequate === false).length },
            { id: "all" as FilterMode, label: "All", count: items.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all ${
                filter === tab.id
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {error && (
          <p className="mt-2 text-xs text-red-400">{error}</p>
        )}
      </div>

      {/* Review list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <span className="mb-2 text-2xl">✅</span>
            <p className="text-sm text-zinc-500">No reviews to display.</p>
            <p className="text-xs text-zinc-600">
              {filter === "unreviewed"
                ? "All risk assessments have been reviewed."
                : `No ${filter} reviews found.`}
            </p>
          </div>
        ) : (
          <div className="space-y-1 p-3">
            {filtered.map((item) => {
              const isSelected = selectedId === item.id;
              const isUnreviewed = item.reviewerId === null;

              return (
                <div
                  key={item.id}
                  className={`rounded-xl border p-4 text-sm transition-all cursor-pointer ${
                    isSelected
                      ? "border-emerald-700/50 bg-zinc-900"
                      : isUnreviewed
                      ? "border-amber-900/30 bg-zinc-900/40 hover:bg-zinc-900"
                      : item.isAdequate
                      ? "border-zinc-800 bg-zinc-900/20"
                      : "border-red-900/30 bg-zinc-900/30"
                  }`}
                  onClick={() => setSelectedId(isSelected ? null : item.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${
                          item.overallRisk === "imminent"
                            ? "bg-red-500"
                            : item.overallRisk === "high"
                            ? "bg-orange-500"
                            : item.overallRisk === "moderate"
                            ? "bg-amber-500"
                            : "bg-zinc-600"
                        }`}
                      />
                      <span className="font-medium text-zinc-200">
                        {item.overallRisk.toUpperCase()}
                      </span>
                    </div>
                    <span className="text-[11px] text-zinc-500">
                      {new Date(item.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center gap-3 text-[11px] text-zinc-500">
                    <span>Action: {item.mitigationAction.replace(/_/g, " ")}</span>
                    {item.reviewerId && (
                      <span className="text-emerald-500">✓ Reviewed</span>
                    )}
                    {item.retrainingSignal && (
                      <span className="text-amber-400">🔄 Retrain signal</span>
                    )}
                  </div>

                  <p className="mt-1 text-xs text-zinc-600">Session: {item.sessionId.slice(0, 8)}...</p>

                  {/* Review form (shown when selected and unreviewed) */}
                  {isSelected && isUnreviewed && (
                    <div
                      className="mt-4 space-y-3 border-t border-zinc-800 pt-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <textarea
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        placeholder="Review notes (optional)..."
                        rows={3}
                        className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-xs text-zinc-300 placeholder-zinc-600 outline-none transition-colors focus:border-emerald-700"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => submitReview(true)}
                          disabled={submitting}
                          className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors"
                        >
                          {submitting ? "Submitting..." : "✓ Approve"}
                        </button>
                        <button
                          onClick={() => submitReview(false)}
                          disabled={submitting}
                          className="flex-1 rounded-xl border border-red-800 px-4 py-2.5 text-xs font-semibold text-red-300 hover:bg-red-950/50 disabled:opacity-50 transition-colors"
                        >
                          {submitting ? "Submitting..." : "✗ Flag for Retraining"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Show existing review notes */}
                  {isSelected && item.reviewNotes && (
                    <div className="mt-3 border-t border-zinc-800 pt-3 text-xs text-zinc-400">
                      <span className="font-medium text-zinc-500">Review notes:</span>
                      <p className="mt-1">{item.reviewNotes}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
