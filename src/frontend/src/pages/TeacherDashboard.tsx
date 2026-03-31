import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { useApp } from "../contexts/AppContext";
import type { FCClassroom } from "../utils/storage";

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

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "🏠" },
  { id: "classes", label: "My Classes", icon: "🏫" },
  { id: "leaderboard", label: "Leaderboard", icon: "🏆" },
  { id: "settings", label: "Settings", icon: "⚙️" },
];

function useCountdown(timerEnd: number | null) {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    if (!timerEnd) {
      setRemaining(0);
      return;
    }
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

export default function TeacherDashboard() {
  const {
    currentUser,
    users,
    classrooms,
    sessionStatuses,
    logout,
    createClassroom,
    startSession,
    stopSession,
    recoverStudent,
    recoverAll,
    toggleDarkMode,
    darkMode,
  } = useApp();
  const [activePage, setActivePage] = useState("dashboard");
  const [selectedClassroomId, setSelectedClassroomId] = useState<string | null>(
    null,
  );
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [_sessionDuration, setSessionDuration] = useState(25);
  const [customDuration, setCustomDuration] = useState("30");
  const [durationMode, setDurationMode] = useState<"25" | "50" | "custom">(
    "25",
  );
  const [selectedApps, setSelectedApps] = useState<string[]>([
    "Instagram",
    "WhatsApp",
    "YouTube",
  ]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const myClassrooms = classrooms.filter(
    (c) => c.teacherId === currentUser?.id,
  );
  const selectedClassroom =
    myClassrooms.find((c) => c.id === selectedClassroomId) ??
    myClassrooms[0] ??
    null;
  const activeSession = selectedClassroom?.activeSession ?? null;
  const timerRemaining = useCountdown(activeSession?.timerEnd ?? null);

  useEffect(() => {
    if (myClassrooms.length > 0 && !selectedClassroomId) {
      setSelectedClassroomId(myClassrooms[0].id);
    }
  }, [myClassrooms.length, myClassrooms, selectedClassroomId]);

  const handleDurationChange = useCallback(
    (mode: "25" | "50" | "custom") => {
      setDurationMode(mode);
      if (mode === "25") setSessionDuration(25);
      else if (mode === "50") setSessionDuration(50);
      else setSessionDuration(Number.parseInt(customDuration) || 30);
    },
    [customDuration],
  );

  const handleStartSession = () => {
    if (!selectedClassroom) return;
    const dur =
      durationMode === "custom"
        ? Number.parseInt(customDuration) || 30
        : Number.parseInt(durationMode);
    startSession(selectedClassroom.id, dur, selectedApps);
  };

  const handleStopSession = () => {
    if (!selectedClassroom) return;
    stopSession(selectedClassroom.id);
  };

  const handleCreateClass = () => {
    if (!newClassName.trim()) return;
    const c = createClassroom(newClassName.trim());
    setSelectedClassroomId(c.id);
    setNewClassName("");
    setCreateModalOpen(false);
    setActivePage("dashboard");
  };

  const toggleApp = (appName: string) => {
    setSelectedApps((prev) =>
      prev.includes(appName)
        ? prev.filter((a) => a !== appName)
        : [...prev, appName],
    );
  };

  const studentStatuses = selectedClassroom
    ? (sessionStatuses[selectedClassroom.id] ?? {})
    : {};
  const classStudents = selectedClassroom
    ? users.filter((u) => selectedClassroom.studentIds.includes(u.id))
    : [];

  // Leaderboard
  const leaderboard = [...users]
    .filter((u) => u.role === "student")
    .sort((a, b) => (b.xp || 0) - (a.xp || 0))
    .slice(0, 10);

  const totalSessions = myClassrooms.reduce(
    (acc, c) => acc + (c.activeSession ? 1 : 0),
    0,
  );
  const totalStudents = [...new Set(myClassrooms.flatMap((c) => c.studentIds))]
    .length;

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "#0a0f1e" }}
    >
      {/* Sidebar overlay on mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          role="presentation"
          onClick={() => setSidebarOpen(false)}
          onKeyDown={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 lg:z-auto w-64 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{
          background: "rgba(13,18,40,0.95)",
          borderRight: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {/* Logo */}
        <div className="p-5 flex items-center gap-2 border-b border-white/5">
          <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
            <span className="text-sm">🎯</span>
          </div>
          <span className="font-heading font-bold text-lg gradient-text">
            FocusClass
          </span>
        </div>

        {/* User info */}
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full gradient-bg flex items-center justify-center text-sm font-bold text-white">
              {currentUser?.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">
                {currentUser?.name}
              </p>
              <p className="text-xs text-muted-foreground">Teacher</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              type="button"
              key={item.id}
              data-ocid={`teacher_nav.${item.id}.link`}
              onClick={() => {
                setActivePage(item.id);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
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

        {/* Bottom actions */}
        <div className="p-3 border-t border-white/5 space-y-1">
          <button
            type="button"
            data-ocid="teacher.dark_mode.toggle"
            onClick={toggleDarkMode}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
          >
            <span>{darkMode ? "🌙" : "☀️"}</span>
            {darkMode ? "Dark Mode" : "Light Mode"}
          </button>
          <button
            type="button"
            data-ocid="teacher.logout.button"
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <span>🚪</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-4 lg:px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="lg:hidden p-2 rounded-lg hover:bg-white/5 transition"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="text-xl">☰</span>
            </button>
            <h2 className="font-heading font-semibold text-lg">
              {NAV_ITEMS.find((i) => i.id === activePage)?.label}
            </h2>
          </div>
          {myClassrooms.length > 0 && activePage === "dashboard" && (
            <Select
              value={selectedClassroomId ?? ""}
              onValueChange={setSelectedClassroomId}
            >
              <SelectTrigger
                data-ocid="teacher.classroom.select"
                className="w-44 bg-white/5 border-white/10"
              >
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {myClassrooms.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <AnimatePresence mode="wait">
            {activePage === "dashboard" && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Stats row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {[
                    {
                      label: "My Classes",
                      value: myClassrooms.length,
                      icon: "🏫",
                    },
                    {
                      label: "Total Students",
                      value: totalStudents,
                      icon: "👥",
                    },
                    {
                      label: "Active Sessions",
                      value: totalSessions,
                      icon: "⏱️",
                    },
                    {
                      label: "Focused Now",
                      value: Object.values(studentStatuses).filter(
                        (s) => s === "focused",
                      ).length,
                      icon: "✅",
                    },
                  ].map((stat) => (
                    <div key={stat.label} className="glass rounded-2xl p-4">
                      <div className="text-2xl mb-1">{stat.icon}</div>
                      <div className="text-2xl font-heading font-bold">
                        {stat.value}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>

                {myClassrooms.length === 0 ? (
                  <div
                    data-ocid="teacher.classrooms.empty_state"
                    className="glass rounded-2xl p-10 text-center"
                  >
                    <div className="text-5xl mb-4">🏫</div>
                    <h3 className="font-heading font-bold text-xl mb-2">
                      No Classes Yet
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Create your first classroom to get started
                    </p>
                    <Dialog
                      open={createModalOpen}
                      onOpenChange={setCreateModalOpen}
                    >
                      <DialogTrigger asChild>
                        <Button
                          data-ocid="teacher.create_class.open_modal_button"
                          className="gradient-bg text-white border-0"
                        >
                          + Create Class
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-card border-white/10">
                        <DialogHeader>
                          <DialogTitle>Create New Classroom</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-2">
                          <div>
                            <Label>Class Name</Label>
                            <Input
                              data-ocid="teacher.class_name.input"
                              value={newClassName}
                              onChange={(e) => setNewClassName(e.target.value)}
                              placeholder="e.g. Physics 101"
                              className="mt-1 bg-white/5 border-white/10"
                              onKeyDown={(e) =>
                                e.key === "Enter" && handleCreateClass()
                              }
                            />
                          </div>
                          <Button
                            data-ocid="teacher.create_class.submit_button"
                            onClick={handleCreateClass}
                            className="w-full gradient-bg text-white border-0"
                          >
                            Create Class
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                ) : selectedClassroom ? (
                  <div className="grid lg:grid-cols-5 gap-6">
                    {/* Session control */}
                    <div className="lg:col-span-2 space-y-4">
                      <div className="glass rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-heading font-semibold">
                            Focus Session
                          </h3>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              activeSession
                                ? "bg-green-500/20 text-green-400"
                                : "bg-white/10 text-muted-foreground"
                            }`}
                          >
                            {activeSession ? "● Active" : "○ Inactive"}
                          </span>
                        </div>

                        {activeSession ? (
                          <div className="text-center">
                            <div className="text-5xl font-heading font-bold gradient-text mb-4">
                              {formatTime(timerRemaining)}
                            </div>
                            <p className="text-sm text-muted-foreground mb-4">
                              Blocking: {activeSession.blockedApps.join(", ")}
                            </p>
                            <Button
                              data-ocid="teacher.stop_session.button"
                              onClick={handleStopSession}
                              className="w-full bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
                            >
                              ⏹ Stop Session
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div>
                              <Label className="text-xs text-muted-foreground mb-2 block">
                                Duration
                              </Label>
                              <div className="flex gap-2">
                                {(["25", "50", "custom"] as const).map((d) => (
                                  <button
                                    type="button"
                                    key={d}
                                    data-ocid={`teacher.duration_${d}.toggle`}
                                    onClick={() => handleDurationChange(d)}
                                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                      durationMode === d
                                        ? "gradient-bg text-white"
                                        : "bg-white/5 text-muted-foreground hover:bg-white/10"
                                    }`}
                                  >
                                    {d === "custom" ? "Custom" : `${d}m`}
                                  </button>
                                ))}
                              </div>
                              {durationMode === "custom" && (
                                <Input
                                  data-ocid="teacher.custom_duration.input"
                                  type="number"
                                  value={customDuration}
                                  onChange={(e) =>
                                    setCustomDuration(e.target.value)
                                  }
                                  placeholder="Minutes"
                                  className="mt-2 bg-white/5 border-white/10 text-sm"
                                />
                              )}
                            </div>

                            <div>
                              <Label className="text-xs text-muted-foreground mb-2 block">
                                Block Apps
                              </Label>
                              <div className="grid grid-cols-2 gap-2">
                                {APP_LIST.map((app) => (
                                  <button
                                    type="button"
                                    key={app.name}
                                    data-ocid={`teacher.app_${app.name.toLowerCase()}.toggle`}
                                    onClick={() => toggleApp(app.name)}
                                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all ${
                                      selectedApps.includes(app.name)
                                        ? "bg-primary/20 text-primary border border-primary/30"
                                        : "bg-white/5 text-muted-foreground hover:bg-white/10"
                                    }`}
                                  >
                                    <span>{app.icon}</span>
                                    {app.name}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <Button
                              data-ocid="teacher.start_session.button"
                              onClick={handleStartSession}
                              className="w-full gradient-bg text-white border-0 font-semibold"
                            >
                              ▶ Start Focus Session
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Class info */}
                      <div className="glass rounded-2xl p-5">
                        <h3 className="font-heading font-semibold mb-3">
                          Class Info
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Code</span>
                            <span className="font-mono font-bold gradient-text text-base">
                              {selectedClassroom.code}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Students
                            </span>
                            <span>{selectedClassroom.studentIds.length}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Student grid */}
                    <div className="lg:col-span-3">
                      <div className="glass rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-heading font-semibold">
                            Students
                          </h3>
                          {activeSession && (
                            <Button
                              data-ocid="teacher.recover_all.button"
                              size="sm"
                              onClick={() => recoverAll(selectedClassroom.id)}
                              className="text-xs bg-white/5 hover:bg-white/10 border-white/10"
                            >
                              Recover All
                            </Button>
                          )}
                        </div>

                        {classStudents.length === 0 ? (
                          <div
                            data-ocid="teacher.students.empty_state"
                            className="text-center py-8 text-muted-foreground"
                          >
                            <div className="text-4xl mb-2">👨‍🎓</div>
                            <p className="text-sm">
                              No students yet. Share code:{" "}
                              <strong className="gradient-text">
                                {selectedClassroom.code}
                              </strong>
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {classStudents.map((student, i) => {
                              const status = activeSession
                                ? (studentStatuses[student.id] ?? "focused")
                                : null;
                              return (
                                <motion.div
                                  key={student.id}
                                  data-ocid={`teacher.student.item.${i + 1}`}
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: i * 0.05 }}
                                  className={`p-3 rounded-xl border transition-all ${
                                    status === "focused"
                                      ? "bg-green-500/10 border-green-500/30 glow-green"
                                      : status === "distracted"
                                        ? "bg-red-500/10 border-red-500/30 glow-red"
                                        : "bg-white/5 border-white/10"
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div
                                        className={`w-2 h-2 rounded-full ${
                                          status === "focused"
                                            ? "bg-green-400"
                                            : status === "distracted"
                                              ? "bg-red-400"
                                              : "bg-gray-500"
                                        }`}
                                      />
                                      <span className="text-sm font-medium">
                                        {student.name}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {status && (
                                        <span
                                          className={`text-xs px-1.5 py-0.5 rounded-full ${
                                            status === "focused"
                                              ? "text-green-400"
                                              : "text-red-400"
                                          }`}
                                        >
                                          {status === "focused"
                                            ? "Focused"
                                            : "Distracted"}
                                        </span>
                                      )}
                                      {status === "distracted" && (
                                        <button
                                          type="button"
                                          data-ocid={`teacher.recover.button.${i + 1}`}
                                          onClick={() =>
                                            recoverStudent(
                                              selectedClassroom.id,
                                              student.id,
                                            )
                                          }
                                          className="text-xs px-2 py-1 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition"
                                        >
                                          Recover
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                    <span>⭐ {student.xp || 0} XP</span>
                                    <span>
                                      🔥 {student.streak || 0} day streak
                                    </span>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}
              </motion.div>
            )}

            {activePage === "classes" && (
              <motion.div
                key="classes"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-heading font-semibold text-xl">
                    My Classrooms
                  </h3>
                  <Dialog
                    open={createModalOpen}
                    onOpenChange={setCreateModalOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        data-ocid="teacher.create_class.open_modal_button"
                        className="gradient-bg text-white border-0"
                      >
                        + New Class
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-card border-white/10">
                      <DialogHeader>
                        <DialogTitle>Create New Classroom</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-2">
                        <div>
                          <Label>Class Name</Label>
                          <Input
                            data-ocid="teacher.class_name.input"
                            value={newClassName}
                            onChange={(e) => setNewClassName(e.target.value)}
                            placeholder="e.g. Math 202"
                            className="mt-1 bg-white/5 border-white/10"
                            onKeyDown={(e) =>
                              e.key === "Enter" && handleCreateClass()
                            }
                          />
                        </div>
                        <Button
                          data-ocid="teacher.create_class.submit_button"
                          onClick={handleCreateClass}
                          className="w-full gradient-bg text-white border-0"
                        >
                          Create
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {myClassrooms.length === 0 ? (
                  <div
                    data-ocid="teacher.classrooms.empty_state"
                    className="glass rounded-2xl p-10 text-center"
                  >
                    <div className="text-4xl mb-2">🏫</div>
                    <p className="text-muted-foreground">
                      No classes yet. Create one to get started!
                    </p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {myClassrooms.map((c, i) => (
                      <motion.div
                        key={c.id}
                        data-ocid={`teacher.classroom.item.${i + 1}`}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07 }}
                        className="glass rounded-2xl p-5 hover:border-primary/30 transition-all cursor-pointer"
                        onClick={() => {
                          setSelectedClassroomId(c.id);
                          setActivePage("dashboard");
                        }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
                            <span className="text-lg">🏫</span>
                          </div>
                          {c.activeSession && (
                            <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">
                              ● Live
                            </span>
                          )}
                        </div>
                        <h4 className="font-semibold mb-1">{c.name}</h4>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span>
                            Code:{" "}
                            <strong className="gradient-text">{c.code}</strong>
                          </span>
                          <span>👥 {c.studentIds.length}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activePage === "leaderboard" && (
              <motion.div
                key="leaderboard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <h3 className="font-heading font-semibold text-xl mb-6">
                  🏆 Student Leaderboard
                </h3>
                <div className="glass rounded-2xl overflow-hidden">
                  {leaderboard.length === 0 ? (
                    <div
                      data-ocid="teacher.leaderboard.empty_state"
                      className="p-10 text-center text-muted-foreground"
                    >
                      <div className="text-4xl mb-2">🏆</div>
                      <p>No student data yet</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-white/5">
                      {leaderboard.map((u, i) => (
                        <div
                          key={u.id}
                          data-ocid={`teacher.leaderboard.item.${i + 1}`}
                          className="flex items-center gap-4 p-4"
                        >
                          <span
                            className={`w-8 h-8 flex items-center justify-center rounded-full font-heading font-bold text-sm ${
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
                          <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-sm font-bold text-white">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{u.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {u.sessionsCompleted || 0} sessions
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-heading font-bold gradient-text">
                              {u.xp || 0} XP
                            </p>
                            <p className="text-xs text-muted-foreground">
                              🔥 {u.streak || 0}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activePage === "settings" && (
              <motion.div
                key="settings"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <h3 className="font-heading font-semibold text-xl mb-6">
                  Settings
                </h3>
                <div className="glass rounded-2xl p-6 space-y-5 max-w-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Dark Mode</p>
                      <p className="text-sm text-muted-foreground">
                        Toggle dark/light theme
                      </p>
                    </div>
                    <button
                      type="button"
                      data-ocid="teacher.dark_mode.toggle"
                      onClick={toggleDarkMode}
                      className={`w-12 h-6 rounded-full transition-all relative ${
                        darkMode ? "gradient-bg" : "bg-white/20"
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                          darkMode ? "left-7" : "left-1"
                        }`}
                      />
                    </button>
                  </div>
                  <div className="border-t border-white/10 pt-4">
                    <p className="font-medium mb-1">{currentUser?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {currentUser?.email}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Teacher Account
                    </p>
                  </div>
                  <button
                    type="button"
                    data-ocid="teacher.logout.button"
                    onClick={logout}
                    className="w-full py-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition text-sm font-medium"
                  >
                    Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
