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

function useCountdown(timerEnd: number) {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    const tick = () =>
      setRemaining(Math.max(0, Math.floor((timerEnd - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [timerEnd]);
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
  const remaining = useCountdown(session.timerEnd);
  const [msgIdx, setMsgIdx] = useState(0);
  const [localDistracted, setLocalDistracted] = useState(false);
  const inactivityRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const studentId = currentUser?.id ?? "";
  const isDistracted = isSelfStudy
    ? localDistracted
    : (sessionStatuses[classroom.id]?.[studentId] ?? "focused") ===
      "distracted";

  // Rotate motivational messages
  useEffect(() => {
    const id = setInterval(
      () => setMsgIdx((i) => (i + 1) % MOTIVATIONAL_MESSAGES.length),
      6000,
    );
    return () => clearInterval(id);
  }, []);

  // Prevent beforeunload
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
  ]);

  // Tab visibility
  useEffect(() => {
    const handler = () => {
      if (document.hidden) flagDistracted();
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [flagDistracted]);

  // Window blur
  useEffect(() => {
    window.addEventListener("blur", flagDistracted);
    return () => window.removeEventListener("blur", flagDistracted);
  }, [flagDistracted]);

  // Inactivity (60s)
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

  // Timer ring
  const totalSecs = session.duration * 60;
  const progress = remaining / totalSecs;
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

      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-lg w-full">
        {/* Status banner */}
        <AnimatePresence mode="wait">
          {isDistracted ? (
            <motion.div
              key="distracted"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              data-ocid="focus.distracted.error_state"
              className="mb-6 px-5 py-2.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 font-semibold text-sm"
            >
              ⚠️ You've been marked as distracted
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
            {/* BG ring */}
            <circle
              cx="140"
              cy="140"
              r="120"
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="8"
            />
            {/* Progress ring */}
            <circle
              cx="140"
              cy="140"
              r="120"
              fill="none"
              stroke={isDistracted ? "#ef4444" : "url(#timerGradient)"}
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
                  : "linear-gradient(135deg,#3b82f6,#10b981)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {formatTime(remaining)}
            </span>
            <span className="text-xs text-muted-foreground mt-1">
              {isSelfStudy ? "self study" : "remaining"}
            </span>
          </div>
        </div>

        {/* Motivational message */}
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

        {/* Stop button for self-study */}
        {isSelfStudy && (
          <button
            type="button"
            data-ocid="focus.self_study.stop_button"
            onClick={() => onStop?.()}
            className="mt-2 mb-4 px-8 py-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 font-semibold text-sm hover:bg-red-500/30 transition-all"
          >
            ⏹ Stop Self Study
          </button>
        )}

        {/* Blocked apps */}
        {blockedAppDefs.length > 0 && (
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
    </motion.div>
  );
}
