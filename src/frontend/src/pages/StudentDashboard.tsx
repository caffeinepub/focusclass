import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import FocusModeOverlay from "../components/FocusModeOverlay";
import { useApp } from "../contexts/AppContext";
import { BADGE_DEFS, getXPToNextBadge } from "../utils/gamification";
import { type FCClassroom, storage } from "../utils/storage";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKS = ["Wk 1", "Wk 2", "Wk 3", "Wk 4"];

const NAV_ITEMS = [
  { id: "home", label: "Home", icon: "🏠" },
  { id: "analytics", label: "Analytics", icon: "📊" },
  { id: "rewards", label: "Rewards", icon: "🏅" },
];

export default function StudentDashboard() {
  const {
    currentUser,
    users,
    logout,
    joinClassroom,
    getStudentClassroom,
    toggleDarkMode,
    darkMode,
    recordSelfStudySession,
  } = useApp();
  const [activePage, setActivePage] = useState("home");
  const [classCode, setClassCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joining, setJoining] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Self-study state
  const [selfStudyActive, setSelfStudyActive] = useState(false);
  const [selfStudyTimerEnd, setSelfStudyTimerEnd] = useState<number>(0);
  const [selfStudyDuration, setSelfStudyDuration] = useState<number>(25);
  const [showSelfStudyPicker, setShowSelfStudyPicker] = useState(false);
  const [customMinutes, setCustomMinutes] = useState("");

  const classroom = getStudentClassroom();
  const session = classroom?.activeSession ?? null;

  // Self-study mock classroom for FocusModeOverlay
  const selfStudyMockClassroom: FCClassroom = {
    id: "self-study",
    code: "SELF",
    name: "Self Study",
    teacherId: "",
    studentIds: currentUser ? [currentUser.id] : [],
    blockedApps: ["Instagram", "WhatsApp", "YouTube", "TikTok"],
    activeSession: selfStudyActive
      ? {
          id: "self-study-session",
          startedAt: selfStudyTimerEnd - selfStudyDuration * 60 * 1000,
          duration: selfStudyDuration,
          blockedApps: ["Instagram", "WhatsApp", "YouTube", "TikTok"],
          timerEnd: selfStudyTimerEnd,
        }
      : null,
  };

  const handleStartSelfStudy = (minutes: number) => {
    setSelfStudyDuration(minutes);
    setSelfStudyTimerEnd(Date.now() + minutes * 60 * 1000);
    setSelfStudyActive(true);
    setShowSelfStudyPicker(false);
  };

  const handleStopSelfStudy = () => {
    const elapsedMs =
      Date.now() - (selfStudyTimerEnd - selfStudyDuration * 60 * 1000);
    const minutesStudied = Math.max(1, Math.floor(elapsedMs / 60000));
    if (currentUser) {
      const { newBadges } = recordSelfStudySession(
        currentUser.id,
        minutesStudied,
      );
      toast.success("Self-study complete! +10 XP earned 🎯");
      for (const badgeId of newBadges) {
        const badge = BADGE_DEFS.find((b) => b.id === badgeId);
        if (badge) toast.success(`Badge unlocked: ${badge.name} ${badge.icon}`);
      }
    }
    setSelfStudyActive(false);
  };

  const handleJoin = async () => {
    if (!classCode.trim()) {
      setJoinError("Enter a class code");
      return;
    }
    setJoining(true);
    await new Promise((r) => setTimeout(r, 400));
    const err = joinClassroom(classCode.trim());
    if (err) setJoinError(err);
    else {
      setClassCode("");
      setJoinError("");
    }
    setJoining(false);
  };

  const xpProgress = currentUser
    ? getXPToNextBadge(currentUser)
    : { current: 0, target: 1, label: "Beginner" };
  const progressPct = Math.min(
    100,
    (xpProgress.current / xpProgress.target) * 100,
  );

  const studyData = DAYS.map((day, i) => ({
    day,
    minutes:
      currentUser?.studyMinutes?.[i] ?? Math.floor(Math.random() * 45 + 10),
  }));

  const weeklyData = WEEKS.map((week, i) => ({
    week,
    sessions:
      currentUser?.weeklySessions?.[i] ?? Math.floor(Math.random() * 5 + 1),
  }));

  const leaderboard = [...users]
    .filter((u) => u.role === "student")
    .sort((a, b) => (b.xp || 0) - (a.xp || 0))
    .slice(0, 10);

  // Self-study sessions count for display
  const selfStudySessions = storage
    .getSelfStudySessions()
    .filter((s) => s.userId === currentUser?.id);

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "#0a0f1e" }}
    >
      {/* Focus mode overlays */}
      <AnimatePresence>
        {session && classroom && <FocusModeOverlay classroom={classroom} />}
      </AnimatePresence>
      <AnimatePresence>
        {selfStudyActive && !session && (
          <FocusModeOverlay
            classroom={selfStudyMockClassroom}
            isSelfStudy
            onStop={handleStopSelfStudy}
          />
        )}
      </AnimatePresence>

      {/* Sidebar overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          role="presentation"
          onClick={() => setSidebarOpen(false)}
          onKeyDown={() => setSidebarOpen(false)}
        />
      )}

      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex flex-col w-60 transition-all"
        style={{
          background: "rgba(13,18,40,0.95)",
          borderRight: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div className="p-5 flex items-center gap-2 border-b border-white/5">
          <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
            <span className="text-sm">🎯</span>
          </div>
          <span className="font-heading font-bold text-lg gradient-text">
            FocusClass
          </span>
        </div>
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full gradient-bg flex items-center justify-center text-sm font-bold text-white">
              {currentUser?.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">
                {currentUser?.name}
              </p>
              <p className="text-xs text-muted-foreground">Student</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              type="button"
              key={item.id}
              data-ocid={`student_nav.${item.id}.link`}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activePage === item.id
                  ? "gradient-bg text-white"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-white/5 space-y-1">
          <button
            type="button"
            data-ocid="student.dark_mode.toggle"
            onClick={toggleDarkMode}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
          >
            <span>{darkMode ? "🌙" : "☀️"}</span>
            {darkMode ? "Dark" : "Light"}
          </button>
          <button
            type="button"
            data-ocid="student.logout.button"
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <span>🚪</span>Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-4 lg:px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="lg:hidden p-2 rounded-lg hover:bg-white/5"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="text-xl">☰</span>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg gradient-bg flex items-center justify-center lg:hidden">
                <span className="text-sm">🎯</span>
              </div>
              <h2 className="font-heading font-semibold text-lg">
                {NAV_ITEMS.find((i) => i.id === activePage)?.label}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {session && (
              <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                ● Focus Active
              </span>
            )}
            {selfStudyActive && !session && (
              <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                📖 Self Study
              </span>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <AnimatePresence mode="wait">
            {activePage === "home" && (
              <motion.div
                key="home"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-5"
              >
                {/* Session banner */}
                {session ? (
                  <motion.div
                    initial={{ scale: 0.97 }}
                    animate={{ scale: 1 }}
                    className="rounded-2xl p-4 border border-green-500/30 bg-green-500/10 glow-green flex items-center gap-3"
                  >
                    <span className="text-2xl">🎯</span>
                    <div>
                      <p className="font-semibold text-green-400">
                        Focus Session Active
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Stay focused – you've got this!
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <div className="glass rounded-2xl p-4 flex items-center gap-3">
                    <span className="text-2xl">😴</span>
                    <div>
                      <p className="font-medium">No Active Session</p>
                      <p className="text-sm text-muted-foreground">
                        Wait for your teacher to start a session
                      </p>
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      label: "Streak",
                      value: `${currentUser?.streak || 0}🔥`,
                      sub: "days",
                    },
                    {
                      label: "Points",
                      value: `${currentUser?.xp || 0}⭐`,
                      sub: "XP",
                    },
                    {
                      label: "Sessions",
                      value: currentUser?.sessionsCompleted || 0,
                      sub: `${selfStudySessions.length > 0 ? `(${selfStudySessions.length} self)` : "completed"}`,
                    },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="glass rounded-2xl p-4 text-center"
                    >
                      <p className="text-xl font-heading font-bold gradient-text">
                        {String(s.value)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {s.sub}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Join class */}
                {!classroom && (
                  <div className="glass rounded-2xl p-5">
                    <h3 className="font-heading font-semibold mb-3">
                      Join a Class
                    </h3>
                    <div className="flex gap-2">
                      <Input
                        data-ocid="student.join_code.input"
                        value={classCode}
                        onChange={(e) => {
                          setClassCode(e.target.value.toUpperCase());
                          setJoinError("");
                        }}
                        placeholder="Enter class code (e.g. FC3A2B)"
                        className="bg-white/5 border-white/10 font-mono tracking-wide"
                        onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                      />
                      <Button
                        data-ocid="student.join_class.button"
                        onClick={handleJoin}
                        disabled={joining}
                        className="gradient-bg text-white border-0 whitespace-nowrap"
                      >
                        {joining ? (
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          "Join"
                        )}
                      </Button>
                    </div>
                    {joinError && (
                      <p
                        data-ocid="student.join.error_state"
                        className="text-sm text-red-400 mt-2"
                      >
                        {joinError}
                      </p>
                    )}
                  </div>
                )}

                {/* Classroom info */}
                {classroom && (
                  <div className="glass rounded-2xl p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-heading font-semibold">
                          {classroom.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Code:{" "}
                          <strong className="gradient-text">
                            {classroom.code}
                          </strong>
                        </p>
                      </div>
                      <span className="text-3xl">🏫</span>
                    </div>
                  </div>
                )}

                {/* Self Study section – only when no class session */}
                {!session && !selfStudyActive && (
                  <div className="glass rounded-2xl p-5">
                    <h3 className="font-heading font-semibold mb-3">
                      📖 Self Study
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Start a personal focus session without a class.
                    </p>
                    {!showSelfStudyPicker ? (
                      <Button
                        data-ocid="student.self_study.primary_button"
                        onClick={() => setShowSelfStudyPicker(true)}
                        className="gradient-bg text-white border-0 w-full"
                      >
                        📖 Start Self Study
                      </Button>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          Choose duration:
                        </p>
                        <div className="flex gap-2">
                          {[25, 50].map((min) => (
                            <Button
                              key={min}
                              data-ocid="student.self_study_duration.button"
                              onClick={() => handleStartSelfStudy(min)}
                              className="flex-1 gradient-bg text-white border-0"
                            >
                              {min} min
                            </Button>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            data-ocid="student.self_study_custom.input"
                            value={customMinutes}
                            onChange={(e) => setCustomMinutes(e.target.value)}
                            placeholder="Custom (minutes)"
                            type="number"
                            min="1"
                            max="180"
                            className="bg-white/5 border-white/10"
                          />
                          <Button
                            data-ocid="student.self_study_custom.submit_button"
                            onClick={() => {
                              const mins = Number.parseInt(customMinutes);
                              if (mins > 0 && mins <= 180)
                                handleStartSelfStudy(mins);
                            }}
                            disabled={
                              !customMinutes ||
                              Number.parseInt(customMinutes) <= 0
                            }
                            className="gradient-bg text-white border-0"
                          >
                            Start
                          </Button>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowSelfStudyPicker(false)}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Study summary */}
                <div className="glass rounded-2xl p-5">
                  <h3 className="font-heading font-semibold mb-3">
                    Today's Summary
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        Study Time
                      </p>
                      <p className="font-heading font-bold text-lg gradient-text">
                        {currentUser?.studyMinutes?.[new Date().getDay()] ?? 0}{" "}
                        min
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">XP Earned</p>
                      <p className="font-heading font-bold text-lg gradient-text">
                        {currentUser?.xp || 0} XP
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activePage === "analytics" && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="glass rounded-2xl p-5">
                  <h3 className="font-heading font-semibold mb-4">
                    Daily Study Time (minutes)
                  </h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={studyData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.05)"
                      />
                      <XAxis
                        dataKey="day"
                        tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "rgba(13,18,40,0.9)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "8px",
                          color: "white",
                        }}
                      />
                      <Bar
                        dataKey="minutes"
                        fill="url(#barGrad)"
                        radius={[4, 4, 0, 0]}
                      />
                      <defs>
                        <linearGradient
                          id="barGrad"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#10b981" />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="glass rounded-2xl p-5">
                  <h3 className="font-heading font-semibold mb-4">
                    Weekly Sessions Completed
                  </h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={weeklyData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.05)"
                      />
                      <XAxis
                        dataKey="week"
                        tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "rgba(13,18,40,0.9)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "8px",
                          color: "white",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="sessions"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={{ fill: "#3b82f6", strokeWidth: 2, r: 5 }}
                        activeDot={{ r: 7, fill: "#10b981" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}

            {activePage === "rewards" && (
              <motion.div
                key="rewards"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* XP Progress */}
                <div className="glass rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-heading font-semibold">XP Progress</h3>
                    <span className="text-sm text-muted-foreground">
                      {xpProgress.current} / {xpProgress.target} sessions
                    </span>
                  </div>
                  <Progress
                    data-ocid="student.xp.progress"
                    value={progressPct}
                    className="h-3 bg-white/10"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Next: {xpProgress.label}
                  </p>
                </div>

                {/* Badges */}
                <div>
                  <h3 className="font-heading font-semibold mb-4">Badges</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {BADGE_DEFS.map((badge, i) => {
                      const earned =
                        currentUser?.badges?.includes(badge.id) ?? false;
                      return (
                        <motion.div
                          key={badge.id}
                          data-ocid={`student.badge.item.${i + 1}`}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.07 }}
                          className={`rounded-2xl p-5 border transition-all ${
                            earned
                              ? `bg-gradient-to-br ${badge.color} border-transparent glow-blue`
                              : "glass border-white/5 opacity-50 grayscale"
                          }`}
                        >
                          <div className="text-3xl mb-2">{badge.icon}</div>
                          <h4 className="font-semibold text-sm mb-1">
                            {badge.name}
                          </h4>
                          <p className="text-xs opacity-80">
                            {badge.description}
                          </p>
                          {earned && (
                            <span className="mt-2 inline-block text-xs px-2 py-0.5 rounded-full bg-white/20 font-medium">
                              Earned ✓
                            </span>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Leaderboard */}
                <div>
                  <h3 className="font-heading font-semibold mb-4">
                    🏆 Leaderboard
                  </h3>
                  <div className="glass rounded-2xl overflow-hidden">
                    {leaderboard.length === 0 ? (
                      <div
                        data-ocid="student.leaderboard.empty_state"
                        className="p-8 text-center text-muted-foreground"
                      >
                        <div className="text-3xl mb-2">🏆</div>
                        <p className="text-sm">No students yet</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-white/5">
                        {leaderboard.map((u, i) => (
                          <div
                            key={u.id}
                            data-ocid={`student.leaderboard.item.${i + 1}`}
                            className={`flex items-center gap-3 p-4 ${
                              u.id === currentUser?.id ? "bg-primary/10" : ""
                            }`}
                          >
                            <span
                              className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold ${
                                i === 0
                                  ? "bg-yellow-400/20 text-yellow-400"
                                  : i === 1
                                    ? "bg-gray-400/20 text-gray-300"
                                    : i === 2
                                      ? "bg-orange-400/20 text-orange-400"
                                      : "bg-white/5 text-muted-foreground"
                              }`}
                            >
                              {i + 1}
                            </span>
                            <div className="w-7 h-7 rounded-full gradient-bg flex items-center justify-center text-xs font-bold text-white">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">
                                {u.name} {u.id === currentUser?.id && "(You)"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {u.sessionsCompleted || 0} sessions
                              </p>
                            </div>
                            <span className="font-heading font-bold text-sm gradient-text">
                              {u.xp || 0} XP
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Mobile bottom nav */}
        <nav
          className="lg:hidden border-t border-white/5 flex"
          style={{ background: "rgba(13,18,40,0.95)" }}
        >
          {NAV_ITEMS.map((item) => (
            <button
              type="button"
              key={item.id}
              data-ocid={`student_mobile_nav.${item.id}.link`}
              onClick={() => setActivePage(item.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-all ${
                activePage === item.id
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
