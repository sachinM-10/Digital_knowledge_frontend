import { useEffect } from "react";

/* ─────────────────────────────────────────────────────────────
   ProctoringOverlay  v2
   Renders:
     • Pre-exam fullscreen gate
     • Fullscreen-BLOCK modal (exam paused, forces re-entry)
     • Violation warning modal
     • Screen flash on every violation
     • Toast notification stack
     • Live violation HUD badge
───────────────────────────────────────────────────────────── */

interface ProctoringOverlayProps {
  examStarted: boolean;
  examOver: boolean;
  isExamBlocked: boolean;        // NEW – exam paused due to fullscreen exit
  violations: number;
  maxViolations: number;
  warningModal: {
    open: boolean;
    title: string;
    message: string;
    isFatal: boolean;
    isFullscreenBlock: boolean;  // NEW – renders the "Re-Enter Fullscreen" variant
  };
  toastQueue: { id: number; icon: string; message: string; type: "warn" | "info" }[];
  onStartExam: () => void;
  onCloseModal: () => void;
  onReEnterFullscreen: () => void; // NEW – wired to the re-enter button
}

export default function ProctoringOverlay({
  examStarted,
  examOver,
  isExamBlocked,
  violations,
  maxViolations,
  warningModal,
  toastQueue,
  onStartExam,
  onCloseModal,
  onReEnterFullscreen,
}: ProctoringOverlayProps) {

  // Flash screen red on each new violation
  useEffect(() => {
    if (violations === 0) return;
    const flash = document.getElementById("__proctor_flash__");
    if (!flash) return;
    flash.style.opacity = "1";
    const t = setTimeout(() => { flash.style.opacity = "0"; }, 220);
    return () => clearTimeout(t);
  }, [violations]);

  return (
    <>
      {/* ── Screen flash ────────────────────────────────── */}
      <div
        id="__proctor_flash__"
        style={{
          position: "fixed", inset: 0,
          background: "rgba(239,68,68,0.22)",
          pointerEvents: "none",
          zIndex: 99990,
          opacity: 0,
          transition: "opacity 0.15s ease",
        }}
      />

      {/* ── Pre-exam fullscreen gate ─────────────────────── */}
      {!examStarted && !examOver && (
        <div style={S.overlay}>
          <div style={S.card}>
            <div style={S.shield}>🛡️</div>
            <h2 style={S.cardTitle}>Secure Exam Environment</h2>
            <p style={S.cardSub}>
              This exam uses anti-cheating proctoring. Review the rules below.
            </p>
            <div style={S.ruleList}>
              {[
                ["🖥️", "Fullscreen mode is mandatory throughout the exam"],
                ["🗂️", "Tab switching & window changes are monitored"],
                ["📋", "Copy, paste & right-click are fully disabled"],
                ["⚠️", `${maxViolations} violations will auto-submit your exam`],
              ].map(([icon, text]) => (
                <div key={String(text)} style={S.ruleItem}>
                  <span style={{ fontSize: 18 }}>{icon}</span>
                  <span style={{ color: "#94a3b8", fontSize: 13 }}>{text}</span>
                </div>
              ))}
            </div>
            <button style={S.startBtn} onClick={onStartExam}>
              🚀 &nbsp; Enter Fullscreen &amp; Start Exam
            </button>
          </div>
        </div>
      )}

      {/* ── Fullscreen-BLOCK modal (exam paused) ─────────── */}
      {/* This is a hard block — no X button, no dismiss on backdrop */}
      {isExamBlocked && examStarted && !examOver && (
        <div style={{ ...S.overlay, zIndex: 99998 }}>
          <div style={{ ...S.card, borderColor: "rgba(245,158,11,0.5)", boxShadow: "0 40px 80px rgba(0,0,0,0.8), 0 0 60px rgba(245,158,11,0.2)" }}>

            {/* Animated warning icon */}
            <div style={{
              width: 88,
              height: 88,
              borderRadius: "50%",
              background: "rgba(245,158,11,0.15)",
              border: "2px solid rgba(245,158,11,0.5)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 40,
              margin: "0 auto 24px",
              boxShadow: "0 0 60px rgba(245,158,11,0.3)",
              animation: "fsBlockPulse 1.2s ease-in-out infinite",
            }}>
              🖥️
            </div>

            <h2 style={{ ...S.cardTitle, color: "#fbbf24" }}>Exam Paused</h2>
            <p style={{ ...S.cardSub, marginBottom: 10 }}>
              <strong style={{ color: "#f1f5f9" }}>Fullscreen mode is mandatory.</strong>
            </p>
            <p style={{ ...S.cardSub, marginBottom: 28 }}>
              Your exam has been paused and all interactions are disabled until you
              return to fullscreen. This exit has been counted as a violation.
            </p>

            {/* Violation progress */}
            <div style={{ ...S.dotRow, marginBottom: 28 }}>
              {Array.from({ length: maxViolations }).map((_, i) => (
                <div key={i} style={{
                  width: 13, height: 13, borderRadius: "50%",
                  border: "1.5px solid",
                  borderColor: i < violations ? "#ef4444" : "rgba(255,255,255,0.2)",
                  background: i < violations ? "#ef4444" : "rgba(255,255,255,0.06)",
                  boxShadow: i < violations ? "0 0 10px rgba(239,68,68,0.5)" : "none",
                  transition: "all 0.35s ease",
                }} />
              ))}
            </div>

            <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 20 }}>
              Violations: <strong style={{ color: violations >= 2 ? "#ef4444" : "#f59e0b" }}>{violations}/{maxViolations}</strong>
              &nbsp;— {maxViolations - violations} remaining before auto-submit
            </p>

            {/* PRIMARY: re-enter fullscreen button */}
            <button
              style={S.reEnterBtn}
              onClick={onReEnterFullscreen}
            >
              🖥️ &nbsp; Re-Enter Fullscreen to Continue
            </button>

            <p style={{ fontSize: 11, color: "#475569", marginTop: 14 }}>
              You cannot continue the exam outside fullscreen mode.
            </p>
          </div>
        </div>
      )}

      {/* ── Violation warning modal ──────────────────────── */}
      {warningModal.open && !warningModal.isFullscreenBlock && (
        <div
          style={{ ...S.overlay, zIndex: 99996 }}
          onClick={warningModal.isFatal ? undefined : onCloseModal}
        >
          <div
            style={{
              ...S.modalBox,
              borderColor: warningModal.isFatal ? "rgba(239,68,68,0.6)" : "rgba(255,255,255,0.08)",
              boxShadow: warningModal.isFatal
                ? "0 40px 80px rgba(0,0,0,0.8), 0 0 60px rgba(239,68,68,0.25)"
                : "0 40px 80px rgba(0,0,0,0.7)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              ...S.modalIcon,
              background: warningModal.isFatal ? "rgba(239,68,68,0.2)" : "rgba(239,68,68,0.1)",
              border: warningModal.isFatal ? "2px solid #ef4444" : "2px solid rgba(239,68,68,0.35)",
              boxShadow: warningModal.isFatal ? "0 0 60px rgba(239,68,68,0.4)" : "0 0 30px rgba(239,68,68,0.2)",
              animation: warningModal.isFatal ? "fatalPulse 0.8s ease-in-out infinite" : "none",
            }}>
              <span style={{ fontSize: 32 }}>{warningModal.isFatal ? "🚫" : "⚠️"}</span>
              <span style={S.modalBadge}>{violations}</span>
            </div>

            <h3 style={S.modalTitle}>{warningModal.title}</h3>

            <p style={S.modalMsg}>
              {warningModal.message.split("\n").map((line, i) => (
                <span key={i}>
                  {line.includes("Violation") ? (
                    <strong style={{ color: "#f1f5f9" }}>{line}</strong>
                  ) : line}
                  <br />
                </span>
              ))}
            </p>

            <div style={S.dotRow}>
              {Array.from({ length: maxViolations }).map((_, i) => (
                <div key={i} style={{
                  ...S.dot,
                  background: i < violations ? "#ef4444" : "rgba(255,255,255,0.1)",
                  boxShadow: i < violations ? "0 0 8px rgba(239,68,68,0.5)" : "none",
                  borderColor: i < violations ? "#ef4444" : "rgba(255,255,255,0.2)",
                }} />
              ))}
            </div>

            {!warningModal.isFatal && (
              <button style={S.dismissBtn} onClick={onCloseModal}>
                I Understand — Resume Exam
              </button>
            )}
            {warningModal.isFatal && (
              <p style={{ color: "#ef4444", fontSize: 13, fontWeight: 600, marginTop: 8 }}>
                Submitting exam…
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Toast stack ──────────────────────────────────── */}
      <div style={S.toastContainer}>
        {toastQueue.map((t) => (
          <div key={t.id} style={{
            ...S.toast,
            background:  t.type === "warn" ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.12)",
            borderColor: t.type === "warn" ? "rgba(239,68,68,0.4)"  : "rgba(245,158,11,0.35)",
          }}>
            <span style={{ fontSize: 17 }}>{t.icon}</span>
            <span style={{ fontSize: 13, color: "#f1f5f9", fontWeight: 500 }}>{t.message}</span>
          </div>
        ))}
      </div>

      {/* ── Live violation HUD ───────────────────────────── */}
      {examStarted && !examOver && (
        <div style={{
          ...S.hud,
          borderColor: isExamBlocked ? "rgba(245,158,11,0.5)" : "rgba(239,68,68,0.2)",
          background: isExamBlocked ? "rgba(30,20,0,0.9)" : "rgba(10,14,26,0.88)",
        }}>
          {isExamBlocked && (
            <span style={{ fontSize: 11, color: "#fbbf24", fontWeight: 700 }}>⏸ PAUSED</span>
          )}
          <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600,
            textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Violations
          </span>
          <div style={{ display: "flex", gap: 5 }}>
            {Array.from({ length: maxViolations }).map((_, i) => (
              <div key={i} style={{
                width: 20, height: 20, borderRadius: "50%",
                border: "2px solid rgba(239,68,68,0.4)",
                background: i < violations ? "#ef4444" : "transparent",
                boxShadow: i < violations ? "0 0 8px rgba(239,68,68,0.6)" : "none",
                transition: "all 0.35s ease",
                transform: i < violations ? "scale(1.1)" : "scale(1)",
              }} />
            ))}
          </div>
          <span style={{
            fontSize: 12, fontWeight: 700,
            color: violations >= 2 ? "#ef4444" : violations === 1 ? "#f59e0b" : "#94a3b8",
          }}>
            {violations}/{maxViolations}
          </span>
        </div>
      )}

      {/* ── CSS keyframes ────────────────────────────────── */}
      <style>{`
        @keyframes fatalPulse {
          0%, 100% { box-shadow: 0 0 40px rgba(239,68,68,0.35); }
          50%       { box-shadow: 0 0 80px rgba(239,68,68,0.7); }
        }
        @keyframes fsBlockPulse {
          0%, 100% { box-shadow: 0 0 40px rgba(245,158,11,0.25); transform: scale(1); }
          50%       { box-shadow: 0 0 70px rgba(245,158,11,0.5);  transform: scale(1.04); }
        }
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(40px) scale(0.92); }
          to   { opacity: 1; transform: translateX(0)    scale(1); }
        }
      `}</style>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────
   Styles
───────────────────────────────────────────────────────────── */
const S: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed", inset: 0,
    background: "rgba(0,0,0,0.82)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 99995,
  },
  card: {
    background: "linear-gradient(135deg,#111827,#0f172a)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 24,
    padding: "48px 44px",
    maxWidth: 480, width: "90%",
    textAlign: "center",
    boxShadow: "0 40px 80px rgba(0,0,0,0.7), 0 0 40px rgba(99,102,241,0.12)",
  },
  shield: {
    width: 80, height: 80,
    background: "linear-gradient(135deg,#6366f1,#818cf8)",
    borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 38,
    margin: "0 auto 24px",
    boxShadow: "0 0 50px rgba(99,102,241,0.35)",
  },
  cardTitle: {
    fontSize: 24, fontWeight: 800, color: "#f1f5f9",
    letterSpacing: "-0.5px", marginBottom: 10,
  },
  cardSub: {
    fontSize: 14, color: "#94a3b8", lineHeight: 1.7, marginBottom: 28,
  },
  ruleList: {
    display: "flex", flexDirection: "column",
    gap: 10, marginBottom: 30, textAlign: "left",
  },
  ruleItem: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "10px 14px",
    background: "rgba(255,255,255,0.03)",
    borderRadius: 9, border: "1px solid rgba(255,255,255,0.06)",
  },
  startBtn: {
    width: "100%", padding: "15px 24px",
    background: "linear-gradient(135deg,#6366f1,#818cf8)",
    color: "white", border: "none", borderRadius: 10,
    fontSize: 15, fontWeight: 700, cursor: "pointer",
    boxShadow: "0 6px 24px rgba(99,102,241,0.4)",
    transition: "all 0.2s ease", fontFamily: "inherit",
  },
  reEnterBtn: {
    width: "100%", padding: "15px 24px",
    background: "linear-gradient(135deg,#f59e0b,#d97706)",
    color: "white", border: "none", borderRadius: 10,
    fontSize: 15, fontWeight: 700, cursor: "pointer",
    boxShadow: "0 6px 24px rgba(245,158,11,0.4)",
    transition: "all 0.2s ease", fontFamily: "inherit",
  },
  modalBox: {
    background: "linear-gradient(135deg,#111827,#0f172a)",
    border: "1px solid",
    borderRadius: 22,
    padding: "40px 36px",
    maxWidth: 440, width: "90%",
    textAlign: "center", position: "relative",
  },
  modalIcon: {
    width: 70, height: 70, borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
    margin: "0 auto 20px", position: "relative",
  },
  modalBadge: {
    position: "absolute", top: -4, right: -4,
    width: 20, height: 20,
    background: "#ef4444", borderRadius: "50%",
    fontSize: 11, color: "white", fontWeight: 800,
    display: "flex", alignItems: "center", justifyContent: "center",
    border: "2px solid #0a0e1a",
  },
  modalTitle: {
    fontSize: 20, fontWeight: 800, color: "#f1f5f9",
    marginBottom: 10, letterSpacing: "-0.4px",
  },
  modalMsg: {
    fontSize: 14, color: "#94a3b8", lineHeight: 1.7, marginBottom: 22,
  },
  dotRow: {
    display: "flex", justifyContent: "center", gap: 8, marginBottom: 24,
  },
  dot: {
    width: 11, height: 11, borderRadius: "50%",
    border: "1.5px solid", transition: "all 0.35s ease",
  },
  dismissBtn: {
    padding: "12px 24px",
    background: "linear-gradient(135deg,#ef4444,#dc2626)",
    color: "white", border: "none", borderRadius: 9,
    fontSize: 13, fontWeight: 700, cursor: "pointer",
    fontFamily: "inherit", boxShadow: "0 4px 16px rgba(239,68,68,0.35)",
  },
  toastContainer: {
    position: "fixed", top: 72, right: 16,
    zIndex: 99994,
    display: "flex", flexDirection: "column",
    gap: 10, pointerEvents: "none",
  },
  toast: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "12px 16px", borderRadius: 12,
    border: "1px solid",
    backdropFilter: "blur(16px)",
    minWidth: 260, maxWidth: 340,
    boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
    animation: "toastIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards",
  },
  hud: {
    position: "fixed", top: 14, right: 16,
    zIndex: 99993,
    display: "flex", alignItems: "center", gap: 8,
    padding: "7px 14px",
    borderRadius: 100,
    backdropFilter: "blur(12px)",
    border: "1px solid",
    transition: "all 0.4s ease",
  },
};
