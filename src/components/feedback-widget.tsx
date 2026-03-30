"use client";

import { useState, useEffect, useCallback } from "react";

type WidgetPhase = "idle" | "nps" | "followup" | "thanks";

const NPS_SHOWN_KEY = "supascanner_nps_shown";

interface FeedbackWidgetProps {
  readonly scanJobId: string;
  readonly scanGrade: string;
  readonly findingCount: number;
}

export function FeedbackWidget({
  scanJobId,
  scanGrade,
  findingCount,
}: FeedbackWidgetProps) {
  const [phase, setPhase] = useState<WidgetPhase>("idle");
  const [npsScore, setNpsScore] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [testimonialConsent, setTestimonialConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [autoShowNps, setAutoShowNps] = useState(false);

  useEffect(() => {
    // Show the feedback button after a short delay
    const timer = setTimeout(() => setShowButton(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Check if NPS has been shown before; if not, auto-show after scan
    const shown = localStorage.getItem(NPS_SHOWN_KEY);
    if (!shown) {
      setAutoShowNps(true);
      const timer = setTimeout(() => {
        setPhase("nps");
        localStorage.setItem(NPS_SHOWN_KEY, "1");
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, []);

  const submitFeedback = useCallback(
    async (type: "nps" | "feedback", extraComment?: string) => {
      setSubmitting(true);
      try {
        await fetch("/api/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scanJobId,
            responseType: type,
            npsScore: type === "nps" ? npsScore : undefined,
            comment: extraComment ?? comment,
            testimonialConsent,
            scanGrade,
            findingCount,
          }),
        });
      } catch {
        // Fail silently - feedback is non-critical
      } finally {
        setSubmitting(false);
      }
    },
    [scanJobId, npsScore, comment, testimonialConsent, scanGrade, findingCount],
  );

  const handleNpsSelect = useCallback(
    async (score: number) => {
      setNpsScore(score);
      // Submit NPS score immediately
      setSubmitting(true);
      try {
        await fetch("/api/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scanJobId,
            responseType: "nps",
            npsScore: score,
            scanGrade,
            findingCount,
          }),
        });
      } catch {
        // Fail silently
      } finally {
        setSubmitting(false);
      }

      // Show follow-up based on score
      if (score <= 6 || score >= 9) {
        setPhase("followup");
      } else {
        setPhase("thanks");
      }
    },
    [scanJobId, scanGrade, findingCount],
  );

  const handleFollowupSubmit = useCallback(async () => {
    await submitFeedback("feedback");
    setPhase("thanks");
  }, [submitFeedback]);

  const handleClose = useCallback(() => {
    setPhase("idle");
  }, []);

  const handleOpen = useCallback(() => {
    setPhase("nps");
  }, []);

  if (!showButton && phase === "idle") return null;

  return (
    <>
      {/* Floating feedback button */}
      {phase === "idle" && showButton && (
        <button
          onClick={handleOpen}
          className="fixed bottom-6 right-6 w-12 h-12 bg-sand-900 hover:bg-sand-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 z-50"
          aria-label="Give feedback"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
        </button>
      )}

      {/* NPS Survey */}
      {phase === "nps" && (
        <FeedbackPanel onClose={handleClose}>
          <h3 className="text-sm font-semibold text-sand-900 mb-1">
            How likely are you to recommend SupaScanner?
          </h3>
          <p className="text-xs text-sand-400 mb-4">
            0 = Not at all likely, 10 = Extremely likely
          </p>
          <div className="flex gap-1.5 mb-2">
            {Array.from({ length: 11 }, (_, i) => (
              <button
                key={i}
                onClick={() => handleNpsSelect(i)}
                disabled={submitting}
                className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                  npsScore === i
                    ? "bg-sand-900 text-white"
                    : "bg-sand-100 text-sand-600 hover:bg-sand-200"
                } disabled:opacity-50`}
              >
                {i}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-sand-400">
            <span>Not likely</span>
            <span>Very likely</span>
          </div>
        </FeedbackPanel>
      )}

      {/* Follow-up for detractors or promoters */}
      {phase === "followup" && npsScore != null && (
        <FeedbackPanel onClose={handleClose}>
          {npsScore <= 6 ? (
            <>
              <h3 className="text-sm font-semibold text-sand-900 mb-1">
                What could we do better?
              </h3>
              <p className="text-xs text-sand-400 mb-3">
                Your feedback helps us improve SupaScanner.
              </p>
            </>
          ) : (
            <>
              <h3 className="text-sm font-semibold text-sand-900 mb-1">
                Thanks for the high score!
              </h3>
              <p className="text-xs text-sand-400 mb-3">
                Would you be willing to share a short testimonial?
              </p>
            </>
          )}
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={
              npsScore <= 6
                ? "What would make SupaScanner better for you?"
                : "What do you like most about SupaScanner?"
            }
            rows={3}
            className="w-full px-3 py-2 bg-white border border-sand-200 rounded-lg text-sm text-sand-900 placeholder-sand-400 focus:outline-none focus:ring-2 focus:ring-sand-900/10 focus:border-sand-300 resize-none mb-3"
          />
          {npsScore >= 9 && (
            <label className="flex items-center gap-2 text-xs text-sand-600 mb-3 cursor-pointer">
              <input
                type="checkbox"
                checked={testimonialConsent}
                onChange={(e) => setTestimonialConsent(e.target.checked)}
                className="rounded border-sand-300"
              />
              I consent to having my feedback used as a testimonial
            </label>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleFollowupSubmit}
              disabled={submitting || !comment.trim()}
              className="flex-1 py-2 px-4 bg-sand-900 hover:bg-sand-700 disabled:bg-sand-200 disabled:text-sand-400 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {submitting ? "Sending..." : "Submit"}
            </button>
            <button
              onClick={() => setPhase("thanks")}
              className="py-2 px-4 text-sm text-sand-400 hover:text-sand-600 transition-colors"
            >
              Skip
            </button>
          </div>
        </FeedbackPanel>
      )}

      {/* Thank you state */}
      {phase === "thanks" && (
        <FeedbackPanel onClose={handleClose}>
          <div className="flex flex-col items-center text-center py-2">
            <div className="w-10 h-10 mb-3 rounded-full bg-emerald-100 flex items-center justify-center">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-emerald-600"
              >
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <path d="M22 4L12 14.01l-3-3" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-sand-900 mb-1">
              Thanks for your feedback!
            </h3>
            <p className="text-xs text-sand-400">
              It helps us make SupaScanner better for everyone.
            </p>
          </div>
        </FeedbackPanel>
      )}
    </>
  );
}

function FeedbackPanel({
  children,
  onClose,
}: {
  readonly children: React.ReactNode;
  readonly onClose: () => void;
}) {
  return (
    <div className="fixed bottom-6 right-6 w-80 bg-white border border-sand-200 rounded-xl shadow-xl p-5 z-50 animate-in slide-in-from-bottom-4 fade-in duration-200">
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-sand-400 hover:text-sand-600 transition-colors"
        aria-label="Close feedback"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M4 4l8 8M12 4l-8 8" />
        </svg>
      </button>
      {children}
    </div>
  );
}
