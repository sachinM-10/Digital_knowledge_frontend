import { useState, useEffect, useCallback, useRef } from "react";

export type ViolationType =
  | "tab_switch"
  | "window_blur"
  | "fullscreen_exit"
  | "right_click"
  | "keyboard_shortcut"
  | "devtools";

export interface ViolationEvent {
  type: ViolationType;
  timestamp: string;
  count: number;
}

interface UseProctoringOptions {
  maxViolations?: number;
  onAutoSubmit?: () => void;
  enabled?: boolean;
}

export function useProctor({
  maxViolations = 3,
  onAutoSubmit,
  enabled = true,
}: UseProctoringOptions = {}) {
  const [violations, setViolations] = useState(0);
  const [violationLog, setViolationLog] = useState<ViolationEvent[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [examOver, setExamOver] = useState(false);

  // ── NEW: fullscreen-blocked state ─────────────────────────────────────
  // true  = user is outside fullscreen → exam interactions are BLOCKED
  // false = fullscreen active → exam runs normally
  const [isExamBlocked, setIsExamBlocked] = useState(false);

  const [warningModal, setWarningModal] = useState<{
    open: boolean;
    title: string;
    message: string;
    isFatal: boolean;
    isFullscreenBlock: boolean; // special mode: block modal with re-enter btn
  }>({ open: false, title: "", message: "", isFatal: false, isFullscreenBlock: false });

  const [toastQueue, setToastQueue] = useState<
    { id: number; icon: string; message: string; type: "warn" | "info" }[]
  >([]);

  // Stable refs so event listeners always read latest value
  const violationsRef   = useRef(0);
  const examOverRef     = useRef(false);
  const isBlockedRef    = useRef(false);
  const toastIdRef      = useRef(0);

  violationsRef.current  = violations;
  examOverRef.current    = examOver;
  isBlockedRef.current   = isExamBlocked;

  // ── Toast helper ──────────────────────────────────────────────────────
  const pushToast = useCallback(
    (icon: string, message: string, type: "warn" | "info" = "warn") => {
      const id = ++toastIdRef.current;
      setToastQueue((q) => [...q, { id, icon, message, type }]);
      setTimeout(() => setToastQueue((q) => q.filter((t) => t.id !== id)), 3200);
    },
    []
  );

  // ── Request fullscreen helper ─────────────────────────────────────────
  const requestFS = useCallback((): Promise<void> => {
    const el = document.documentElement;
    const fn =
      el.requestFullscreen ||
      (el as any).webkitRequestFullscreen ||
      (el as any).mozRequestFullScreen;
    if (!fn) return Promise.resolve();
    return fn.call(el) as Promise<void>;
  }, []);

  // ── Public enterFullscreen (used by start button) ─────────────────────
  const enterFullscreen = useCallback(() => {
    requestFS().catch(() => {
      pushToast("⚠️", "Fullscreen blocked by browser. Please allow it.", "info");
    });
  }, [requestFS, pushToast]);

  // ── Re-enter fullscreen (called from the block modal button) ──────────
  const reEnterFullscreen = useCallback(() => {
    requestFS()
      .then(() => {
        // fullscreenchange event will fire and clear the block
      })
      .catch(() => {
        // Browser still won't allow it — keep modal open
        pushToast("⚠️", "Please click the button below to re-enter fullscreen.", "info");
      });
  }, [requestFS, pushToast]);

  // ── Core violation trigger ────────────────────────────────────────────
  const triggerViolation = useCallback(
    (type: ViolationType, title: string, message: string) => {
      if (!enabled || examOverRef.current) return;

      setViolations((prev) => {
        const next = prev + 1;
        setViolationLog((log) => [
          ...log,
          { type, timestamp: new Date().toISOString(), count: next },
        ]);

        const isFatal   = next >= maxViolations;
        const remaining = maxViolations - next;

        if (isFatal) {
          // ── Mark exam over immediately (ref update is synchronous) ──
          examOverRef.current = true;
          setExamOver(true);
          setIsExamBlocked(false);

          // ── Exit fullscreen so the page is no longer locked ──
          const exitFS =
            document.exitFullscreen ||
            (document as any).webkitExitFullscreen ||
            (document as any).mozCancelFullScreen;
          if (exitFS && (
            document.fullscreenElement ||
            (document as any).webkitFullscreenElement ||
            (document as any).mozFullScreenElement
          )) {
            exitFS.call(document).catch(() => {/* ignore */});
          }

          // ── Show fatal modal briefly, then auto-close it ──
          setWarningModal({
            open: true,
            title: "Exam Auto-Submitted!",
            message: `You have reached ${maxViolations} violations.\nYour exam is being submitted now.`,
            isFatal: true,
            isFullscreenBlock: false,
          });

          // Close modal + fire submit after 2.5 s
          setTimeout(() => {
            setWarningModal((m) => ({ ...m, open: false }));
            onAutoSubmit?.();
          }, 2500);
        } else {
          // For fullscreen exits: show a BLOCKING modal (separate from normal warn)
          if (type === "fullscreen_exit") {
            setWarningModal({
              open: true,
              title: "🖥️ Fullscreen Required",
              message: `You exited fullscreen. The exam is paused until you return to fullscreen.\n\nViolation ${next}/${maxViolations} — ${remaining} warning${remaining !== 1 ? "s" : ""} remaining.`,
              isFatal: false,
              isFullscreenBlock: true,
            });
          } else {
            setWarningModal({
              open: true,
              title,
              message: `${message}\n\nViolation ${next}/${maxViolations} — ${remaining} warning${remaining !== 1 ? "s" : ""} remaining.`,
              isFatal: false,
              isFullscreenBlock: false,
            });
          }
        }

        return next;
      });
    },
    [enabled, maxViolations, onAutoSubmit]
  );

  // ── Fullscreen change listener ────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;

    const handleChange = () => {
      const active = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement
      );

      setIsFullscreen(active);

      if (active) {
        // ✅ Fullscreen restored → unblock exam + close fullscreen-block modal
        setIsExamBlocked(false);
        setWarningModal((m) =>
          m.isFullscreenBlock ? { ...m, open: false } : m
        );
      } else {
        // ❌ Fullscreen lost → block exam immediately
        if (!examOverRef.current) {
          setIsExamBlocked(true);

          // Trigger violation (will open the blocking modal)
          triggerViolation(
            "fullscreen_exit",
            "🖥️ Fullscreen Exited",
            "You exited fullscreen mode. Fullscreen is mandatory during the exam."
          );

          // Attempt auto re-entry (works if browser allows programmatic FS)
          setTimeout(() => {
            if (!examOverRef.current) {
              requestFS().catch(() => {
                // Browser blocked auto re-entry — user must click the button
                // Modal is already showing with the "Re-Enter Fullscreen" button
              });
            }
          }, 400);
        }
      }
    };

    document.addEventListener("fullscreenchange", handleChange);
    document.addEventListener("webkitfullscreenchange", handleChange);
    document.addEventListener("mozfullscreenchange", handleChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleChange);
      document.removeEventListener("webkitfullscreenchange", handleChange);
      document.removeEventListener("mozfullscreenchange", handleChange);
    };
  }, [enabled, triggerViolation, requestFS]);

  // ── Tab switch / visibility ───────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;
    const handle = () => {
      if (document.hidden && !examOverRef.current) {
        triggerViolation(
          "tab_switch",
          "🗂️ Tab Switch Detected",
          "You switched to another tab or window during the exam."
        );
      }
    };
    document.addEventListener("visibilitychange", handle);
    return () => document.removeEventListener("visibilitychange", handle);
  }, [enabled, triggerViolation]);

  // ── Window blur ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;
    const handle = () => {
      setTimeout(() => {
        if (!document.hasFocus() && !examOverRef.current && !isBlockedRef.current) {
          triggerViolation(
            "window_blur",
            "🪟 Window Focus Lost",
            "You minimized or switched away from the exam window."
          );
        }
      }, 300);
    };
    window.addEventListener("blur", handle);
    return () => window.removeEventListener("blur", handle);
  }, [enabled, triggerViolation]);

  // ── Right click ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;
    const handle = (e: MouseEvent) => {
      e.preventDefault();
      if (!examOverRef.current)
        pushToast("🚫", "Right click is disabled during the exam.", "warn");
    };
    document.addEventListener("contextmenu", handle);
    return () => document.removeEventListener("contextmenu", handle);
  }, [enabled, pushToast]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;
    const blocked = ["c", "v", "x", "u", "s", "p", "a", "i", "j"];
    const handle = (e: KeyboardEvent) => {
      if (examOverRef.current) return;
      const ctrl = e.ctrlKey || e.metaKey;

      if (
        e.key === "F12" ||
        (ctrl && e.shiftKey && ["i", "j", "c"].includes(e.key.toLowerCase()))
      ) {
        e.preventDefault();
        pushToast("🚫", "Developer tools are disabled during the exam.", "warn");
        return;
      }
      if (e.key === "PrintScreen") {
        e.preventDefault();
        pushToast("🚫", "Screenshots are disabled during the exam.", "warn");
        return;
      }
      if (ctrl && blocked.includes(e.key.toLowerCase())) {
        e.preventDefault();
        pushToast("🚫", "Copy/Paste is not allowed during the exam.", "warn");
      }
    };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [enabled, pushToast]);

  // ── Block text selection & drag ───────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;
    const noSelect = (e: Event) => e.preventDefault();
    const noDrag   = (e: Event) => e.preventDefault();
    document.addEventListener("selectstart", noSelect);
    document.addEventListener("dragstart",   noDrag);
    return () => {
      document.removeEventListener("selectstart", noSelect);
      document.removeEventListener("dragstart",   noDrag);
    };
  }, [enabled]);

  // ── Close warning modal (only for non-fullscreen-block modals) ────────
  const closeWarningModal = useCallback(() => {
    setWarningModal((m) => {
      // Never allow closing the fullscreen-block modal by clicking outside
      if (m.isFullscreenBlock) return m;
      return { ...m, open: false };
    });
  }, []);

  return {
    violations,
    maxViolations,
    violationLog,
    isFullscreen,
    isExamBlocked,   // ← NEW: consume this in quiz pages to disable inputs
    examOver,
    warningModal,
    toastQueue,
    enterFullscreen,
    reEnterFullscreen, // ← NEW: wire to "Re-Enter Fullscreen" button
    triggerViolation,
    closeWarningModal,
  };
}
