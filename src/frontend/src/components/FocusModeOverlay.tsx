import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "../contexts/AppContext";
import type { FCClassroom } from "../utils/storage";

const MOTIVATIONAL_MESSAGES = [
  "You've got this! Stay focused. 💪",
  "Every minute of focus is a step toward success. 🚀",
  "Great minds require great focus. 🧠",
  "The best investment: your learning time. 📚",
  "Stay in the zone – your future self thanks you. ✨",
  "Champions focus when others distract. 🏆",
];

const APP_LIST = [
  { name: "Instagram", icon: "📸" },
  { name: "WhatsApp", icon: "💬" },
  { name: "YouTube", icon: "▶️" },
  { name: "TikTok", icon: "🎵" },
  { name: "Twitter", icon: "🐦" },
  { name: "Facebook", icon: "👥" },
  { name: "Snapchat", icon: "👻" },
  { name: "Netflix", icon: "🎬" },
];

const RECOVERY_KEY = "fc_recovery_session";

function useCountdown(timerEnd: number, isPaused: boolean) {
  const [remaining, setRemaining] = useState(
    Math.max(0, Math.floor((timerEnd - Date.now()) / 1000)),
  );

  useEffect(() => {
    if (isPaused) return;
    const tick = () =>
      setRemaining(Math.max(0, Math.floor((timerEnd - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [timerEnd, isPaused]);

  return remaining;
}

function formatTime(secs: number) {
  const m = Math.floor(secs / 60)
    .toString()
    .padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

interface Props {
  classroom: FCClassroom;
  isSelfStudy?: boolean;
  onStop?: () => void;
}

export default function FocusModeOverlay({
  classroom,
  isSelfStudy,
  onStop,
}: Props) {
  const { currentUser, sessionStatuses, markDistracted } = useApp();
  const session = classroom.activeSession!;

  // Pause support (self-study only)
  const [isPaused, setIsPaused] = useState(false);
  const [effectiveTimerEnd, setEffectiveTimerEnd] = useState(session.timerEnd);
  const [pausedRemaining, setPausedRemaining] = useState(0);

  const remaining = useCountdown(effectiveTimerEnd, isPaused);
  const displayRemaining = isPaused ? pausedRemaining : remaining;

  const [msgIdx, setMsgIdx] = useState(0);
  const [localDistracted, setLocalDistracted] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const inactivityRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerEndedRef = useRef(false);

  const studentId = currentUser?.id ?? "";
  const isDistracted = isSelfStudy
    ? localDistracted
    : (sessionStatuses[classroom.id]?.[studentId] ?? "focused") ===
      "distracted";

  // Auto-save recovery state to localStorage
  useEffect(() => {
    if (!isSelfStudy) return;
    localStorage.setItem(
      RECOVERY_KEY,
      JSON.stringify({
        timerEnd: session.timerEnd,
        duration: session.duration,
        startedAt: session.startedAt,
        blockedApps: session.blockedApps,
        userId: currentUser?.id,
        savedAt: Date.now(),
      }),
    );
    return () => {
      localStorage.removeItem(RECOVERY_KEY);
    };
  }, [isSelfStudy, session, currentUser?.id]);

  // Auto-complete when timer hits 0
  useEffect(() => {
    if (remaining === 0 && !timerEndedRef.current && !isPaused) {
      timerEndedRef.current = true;
      setTimeout(() => onStop?.(), 800);
    }
  }, [remaining, isPaused, onStop]);

  // Rotate motivational messages
  useEffect(() => {
    const id = setInterval(
      () => setMsgIdx((i) => (i + 1) % MOTIVATIONAL_MESSAGES.length),
      6000,
    );
    return () => clearInterval(id);
  }, []);

  // Safe beforeunload — show browser prompt
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  // Distraction detection
  const flagDistracted = useCallback(() => {
    if (isPaused) return;
    if (isSelfStudy) {
      if (!localDistracted) setLocalDistracted(true);
    } else {
      if (studentId && !isDistracted) {
        markDistracted(classroom.id, studentId);
      }
    }
  }, [
    classroom.id,
    studentId,
    isDistracted,
    markDistracted,
    isSelfStudy,
    localDistracted,
    isPaused,
  ]);

  useEffect(() => {
    const handler = () => {
      if (document.hidden) flagDistracted();
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [flagDistracted]);

  useEffect(() => {
    window.addEventListener("blur", flagDistracted);
    return () => window.removeEventListener("blur", flagDistracted);
  }, [flagDistracted]);

  const resetInactivity = useCallback(() => {
    if (inactivityRef.current) clearTimeout(inactivityRef.current);
    inactivityRef.current = setTimeout(flagDistracted, 60000);
  }, [flagDistracted]);

  useEffect(() => {
    const events = ["mousemove", "keydown", "click", "touchstart"];
    for (const e of events) document.addEventListener(e, resetInactivity);
    resetInactivity();
    return () => {
      for (const e of events) document.removeEventListener(e, resetInactivity);
      if (inactivityRef.current) clearTimeout(inactivityRef.current);
    };
  }, [resetInactivity]);

  // Pause handler (self-study only)
  const handlePause = () => {
    setPausedRemaining(remaining);
    setIsPaused(true);
  };

  const handleResume = () => {
    // Recalculate timerEnd based on remaining seconds
    setEffectiveTimerEnd(Date.now() + pausedRemaining * 1000);
    setIsPaused(false);
    setLocalDistracted(false);
  };

  const handleReturnToFocus = () => {
    setLocalDistracted(false);
    if (!isSelfStudy && studentId) {
      // Clear distracted state via optimistic UI (teacher will see update next poll)
      markDistracted(classroom.id, studentId); // resets via teacher recovery
    }
  };

  const handleStopConfirmed = () => {
    localStorage.removeItem(RECOVERY_KEY);
    setShowExitConfirm(false);
    onStop?.();
  };

  // Timer ring
  const totalSecs = session.duration * 60;
  const progress = displayRemaining / totalSecs;
  const circumference = 2 * Math.PI * 120;
  const strokeDash = circumference * progress;

  const blockedApps = session.blockedApps;
  const blockedAppDefs = APP_LIST.filter((a) => blockedApps.includes(a.name));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: isDistracted
          ? "linear-gradient(135deg, #1a0505 0%, #2a0808 100%)"
          : isPaused
            ? "linear-gradient(135deg, #0d1a0d 0%, #0a1a1a 100%)"
            : "linear-gradient(135deg, #0a0f1e 0%, #0d1529 50%, #0a1a1a 100%)",
      }}
    >
      {/* Animated bg blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl opacity-30"
          style={{
            background: isDistracted
              ? "radial-gradient(circle, #ef4444, transparent)"
              : "radial-gradient(circle, #3b82f6, transparent)",
          }}
        />
        <div
          className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full blur-3xl opacity-30"
          style={{
            background: isDistracted
              ? "radial-gradient(circle, #dc2626, transparent)"
              : "radial-gradient(circle, #10b981, transparent)",
          }}
        />
      </div>

      {/* Top-right controls */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
        {/* Pause (self-study only, when not distracted and not paused) */}
        {isSelfStudy && !isPaused && !isDistracted && (
          <button
            type="button"
            onClick={handlePause}
            className="px-4 py-2 rounded-xl bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 font-semibold text-sm hover:bg-yellow-500/30 transition-all"
          >
            ⏸ Pause
          </button>
        )}
        {/* Stop session (self-study only) */}
        {isSelfStudy && (
          <button
            type="button"
            data-ocid="focus.stop_session.button"
            onClick={() => setShowExitConfirm(true)}
            className="px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 font-semibold text-sm hover:bg-red-500/30 transition-all"
          >
            ⏹ Stop Session
          </button>
        )}
        {/* Classroom exit (shows confirm) */}
        {!isSelfStudy && (
          <button
            type="button"
            onClick={() => setShowExitConfirm(true)}
            className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white/70 font-semibold text-sm hover:bg-white/15 transition-all"
          >
            🚪 Exit
          </button>
        )}
      </div>

      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-lg w-full">
        {/* Status banner */}
        <AnimatePresence mode="wait">
          {isDistracted ? (
            <motion.div
              key="distracted"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 w-full"
            >
              <div
                data-ocid="focus.distracted.error_state"
                className="px-5 py-3 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-300"
              >
                <p className="font-semibold text-sm mb-1">
                  ⚠️ Distraction Detected
                </p>
                <p className="text-xs opacity-80 mb-3">
                  You left the focus zone. Points have been reduced. Click below
                  to return.
                </p>
                <button
                  type="button"
                  data-ocid="focus.return_to_focus.button"
                  onClick={handleReturnToFocus}
                  className="w-full py-2 rounded-xl bg-green-500/20 border border-green-500/40 text-green-300 font-semibold text-sm hover:bg-green-500/30 transition-all"
                >
                  ✅ Return to Focus
                </button>
              </div>
            </motion.div>
          ) : isPaused ? (
            <motion.div
              key="paused"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 w-full"
            >
              <div className="px-5 py-3 rounded-2xl bg-yellow-500/20 border border-yellow-500/40 text-yellow-300">
                <p className="font-semibold text-sm mb-1">⏸ Session Paused</p>
                <p className="text-xs opacity-80 mb-3">
                  Your timer is frozen. Resume when you're ready.
                </p>
                <button
                  type="button"
                  data-ocid="focus.resume_session.button"
                  onClick={handleResume}
                  className="w-full py-2 rounded-xl bg-green-500/20 border border-green-500/40 text-green-300 font-semibold text-sm hover:bg-green-500/30 transition-all"
                >
                  ▶️ Resume Session
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="focused"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 px-5 py-2.5 rounded-full bg-green-500/20 border border-green-500/40 text-green-400 font-semibold text-sm"
            >
              ✅ Focus Mode Active – Social Media Blocked
            </motion.div>
          )}
        </AnimatePresence>

        {/* Timer ring */}
        <div className="relative mb-6" data-ocid="focus.timer.panel">
          <svg
            width="280"
            height="280"
            className="timer-ring"
            role="img"
            aria-label="Countdown timer"
          >
            <circle
              cx="140"
              cy="140"
              r="120"
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="8"
            />
            <circle
              cx="140"
              cy="140"
              r="120"
              fill="none"
              stroke={
                isDistracted
                  ? "#ef4444"
                  : isPaused
                    ? "#eab308"
                    : "url(#timerGradient)"
              }
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${strokeDash} ${circumference}`}
              transform="rotate(-90 140 140)"
              style={{ transition: "stroke-dasharray 0.5s ease" }}
            />
            <defs>
              <linearGradient
                id="timerGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-5xl font-heading font-bold"
              style={{
                background: isDistracted
                  ? "#ef4444"
                  : isPaused
                    ? "#eab308"
                    : "linear-gradient(135deg,#3b82f6,#10b981)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {formatTime(displayRemaining)}
            </span>
            <span className="text-xs text-muted-foreground mt-1">
              {isPaused ? "paused" : isSelfStudy ? "self study" : "remaining"}
            </span>
          </div>
        </div>

        {/* Motivational message (hide when distracted/paused) */}
        {!isDistracted && !isPaused && (
          <AnimatePresence mode="wait">
            <motion.p
              key={msgIdx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4 }}
              className="text-base text-muted-foreground mb-6 italic"
            >
              {MOTIVATIONAL_MESSAGES[msgIdx]}
            </motion.p>
          </AnimatePresence>
        )}

        {/* Blocked apps */}
        {blockedAppDefs.length > 0 && !isPaused && (
          <div className="glass rounded-2xl p-4 w-full">
            <p className="text-sm text-muted-foreground mb-3 font-medium">
              🚫 Blocked During Session
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {blockedAppDefs.map((app) => (
                <span
                  key={app.name}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-red-500/10 border border-red-500/20 text-red-400"
                >
                  {app.icon} {app.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Exit confirmation popup */}
      <AnimatePresence>
        {showExitConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-60 flex items-center justify-center px-4"
            style={{ background: "rgba(0,0,0,0.7)" }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="rounded-2xl p-6 w-full max-w-sm text-center"
              style={{
                background: "rgba(13,18,40,0.98)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <div className="text-4xl mb-3">🚪</div>
              <h3 className="font-heading font-bold text-lg mb-2">
                {isSelfStudy ? "Stop Session?" : "Leave Focus Mode?"}
              </h3>
              <p className="text-sm text-muted-foreground mb-5">
                {isSelfStudy
                  ? "Your session data will be saved and you'll return to the dashboard."
                  : "Are you sure you want to leave focus mode? This may be flagged as a distraction."}
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowExitConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-green-500/20 border border-green-500/40 text-green-300 font-semibold text-sm hover:bg-green-500/30 transition-all"
                >
                  ✅ Resume
                </button>
                <button
                  type="button"
                  data-ocid="focus.confirm_exit.button"
                  onClick={handleStopConfirmed}
                  className="flex-1 py-2.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 font-semibold text-sm hover:bg-red-500/30 transition-all"
                >
                  {isSelfStudy ? "⏹ Stop Session" : "🚪 Exit Session"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
