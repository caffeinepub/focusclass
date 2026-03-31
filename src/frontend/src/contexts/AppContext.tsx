import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import {
  BADGE_DEFS,
  awardSelfStudyXP,
  awardSessionXP,
} from "../utils/gamification";
import {
  type FCClassroom,
  type FCUser,
  type SessionStatuses,
  type StudentStatus,
  generateClassCode,
  generateId,
  storage,
} from "../utils/storage";

interface AppContextValue {
  currentUser: FCUser | null;
  users: FCUser[];
  classrooms: FCClassroom[];
  sessionStatuses: SessionStatuses;
  darkMode: boolean;
  toggleDarkMode: () => void;
  login: (email: string, password: string) => string | null;
  signup: (
    name: string,
    email: string,
    password: string,
    role: "teacher" | "student",
  ) => string | null;
  logout: () => void;
  createClassroom: (name: string) => FCClassroom;
  joinClassroom: (code: string) => string | null;
  startSession: (
    classroomId: string,
    duration: number,
    blockedApps: string[],
  ) => void;
  stopSession: (classroomId: string) => void;
  markDistracted: (classroomId: string, studentId: string) => void;
  recoverStudent: (classroomId: string, studentId: string) => void;
  recoverAll: (classroomId: string) => void;
  getStudentClassroom: () => FCClassroom | null;
  refreshData: () => void;
  recordSelfStudySession: (
    userId: string,
    minutesStudied: number,
  ) => { newBadges: string[] };
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<FCUser[]>(() => storage.getUsers());
  const [classrooms, setClassrooms] = useState<FCClassroom[]>(() =>
    storage.getClassrooms(),
  );
  const [sessionStatuses, setSessionStatuses] = useState<SessionStatuses>(() =>
    storage.getSessionStatuses(),
  );
  const [currentUserId, setCurrentUserId] = useState<string | null>(() =>
    storage.getCurrentUserId(),
  );
  const [darkMode, setDarkMode] = useState<boolean>(() =>
    storage.getDarkMode(),
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentUser = users.find((u) => u.id === currentUserId) ?? null;

  // Seed demo users on first load
  useEffect(() => {
    const existing = storage.getUsers();
    if (!existing.find((u) => u.email === "teacher@focusclass.demo")) {
      const teacher: FCUser = {
        id: "demo-teacher",
        name: "Demo Teacher",
        email: "teacher@focusclass.demo",
        password: "demo123",
        role: "teacher",
        xp: 0,
        streak: 0,
        lastStudyDate: null,
        sessionsCompleted: 0,
        badges: [],
        studyMinutes: new Array(7).fill(0),
        weeklySessions: new Array(4).fill(0),
      };
      const student: FCUser = {
        id: "demo-student",
        name: "Demo Student",
        email: "student@focusclass.demo",
        password: "demo123",
        role: "student",
        xp: 0,
        streak: 0,
        lastStudyDate: null,
        sessionsCompleted: 0,
        badges: [],
        studyMinutes: new Array(7).fill(0),
        weeklySessions: new Array(4).fill(0),
      };
      const updated = [...existing, teacher, student];
      storage.saveUsers(updated);
      setUsers(updated);
    }
  }, []);

  // Apply dark mode class
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    storage.setDarkMode(darkMode);
  }, [darkMode]);

  // Apply dark mode on mount
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const refreshData = useCallback(() => {
    setUsers(storage.getUsers());
    setClassrooms(storage.getClassrooms());
    setSessionStatuses(storage.getSessionStatuses());
  }, []);

  // Polling every 3s
  useEffect(() => {
    intervalRef.current = setInterval(refreshData, 3000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refreshData]);

  const toggleDarkMode = () => setDarkMode((v) => !v);

  const login = (email: string, password: string): string | null => {
    const allUsers = storage.getUsers();
    const user = allUsers.find(
      (u) =>
        u.email.toLowerCase() === email.toLowerCase() &&
        u.password === password,
    );
    if (!user) return "Invalid email or password";
    storage.setCurrentUserId(user.id);
    setCurrentUserId(user.id);
    setUsers(allUsers);
    toast.success(`Welcome back, ${user.name}!`);
    return null;
  };

  const signup = (
    name: string,
    email: string,
    password: string,
    role: "teacher" | "student",
  ): string | null => {
    const allUsers = storage.getUsers();
    if (allUsers.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return "Email already registered";
    }
    const newUser: FCUser = {
      id: generateId(),
      name,
      email,
      password,
      role,
      xp: 0,
      streak: 0,
      lastStudyDate: null,
      sessionsCompleted: 0,
      badges: [],
      studyMinutes: new Array(7).fill(0),
      weeklySessions: new Array(4).fill(0),
    };
    allUsers.push(newUser);
    storage.saveUsers(allUsers);
    storage.setCurrentUserId(newUser.id);
    setUsers(allUsers);
    setCurrentUserId(newUser.id);
    toast.success(`Account created! Welcome, ${name}!`);
    return null;
  };

  const logout = () => {
    storage.setCurrentUserId(null);
    setCurrentUserId(null);
  };

  const createClassroom = (name: string): FCClassroom => {
    if (!currentUser) throw new Error("Not logged in");
    const classroom: FCClassroom = {
      id: generateId(),
      code: generateClassCode(),
      name,
      teacherId: currentUser.id,
      studentIds: [],
      blockedApps: ["Instagram", "WhatsApp", "YouTube"],
      activeSession: null,
    };
    const all = storage.getClassrooms();
    all.push(classroom);
    storage.saveClassrooms(all);
    setClassrooms([...all]);
    toast.success(`Classroom "${name}" created! Code: ${classroom.code}`);
    return classroom;
  };

  const joinClassroom = (code: string): string | null => {
    if (!currentUser) return "Not logged in";
    const all = storage.getClassrooms();
    const idx = all.findIndex(
      (c) => c.code.toUpperCase() === code.toUpperCase(),
    );
    if (idx === -1) return "Class not found. Check the code and try again.";
    const classroom = all[idx];
    if (classroom.studentIds.includes(currentUser.id))
      return "You are already in this class";
    classroom.studentIds.push(currentUser.id);
    all[idx] = classroom;
    storage.saveClassrooms(all);
    setClassrooms([...all]);
    toast.success(`Joined class: ${classroom.name}`);
    return null;
  };

  const startSession = (
    classroomId: string,
    duration: number,
    blockedApps: string[],
  ) => {
    const all = storage.getClassrooms();
    const idx = all.findIndex((c) => c.id === classroomId);
    if (idx === -1) return;
    const now = Date.now();
    all[idx].activeSession = {
      id: generateId(),
      startedAt: now,
      duration,
      blockedApps,
      timerEnd: now + duration * 60 * 1000,
    };
    all[idx].blockedApps = blockedApps;
    // Initialize all students as focused
    const statuses = storage.getSessionStatuses();
    statuses[classroomId] = {};
    for (const sid of all[idx].studentIds) {
      statuses[classroomId][sid] = "focused";
    }
    storage.saveSessionStatuses(statuses);
    storage.saveClassrooms(all);
    setClassrooms([...all]);
    setSessionStatuses({ ...statuses });
    toast.success(`Focus session started! ${duration} minutes`);
  };

  const stopSession = (classroomId: string) => {
    const all = storage.getClassrooms();
    const idx = all.findIndex((c) => c.id === classroomId);
    if (idx === -1) return;
    const statuses = storage.getSessionStatuses();
    const studentStatuses = statuses[classroomId] || {};
    // Award XP to focused students
    for (const [sid, status] of Object.entries(studentStatuses)) {
      if (status === "focused") {
        const { newBadges } = awardSessionXP(sid);
        const student = storage.getUsers().find((u) => u.id === sid);
        if (student) {
          toast.success(`${student.name} earned +10 XP!`);
        }
        for (const badgeId of newBadges) {
          const badge = BADGE_DEFS.find((b) => b.id === badgeId);
          if (badge && student)
            toast.success(
              `${student.name} unlocked ${badge.name} ${badge.icon}`,
            );
        }
      }
    }
    all[idx].activeSession = null;
    delete statuses[classroomId];
    storage.saveClassrooms(all);
    storage.saveSessionStatuses(statuses);
    setUsers(storage.getUsers());
    setClassrooms([...all]);
    setSessionStatuses({ ...statuses });
    toast.success("Focus session ended!");
  };

  const markDistracted = (classroomId: string, studentId: string) => {
    const statuses = storage.getSessionStatuses();
    if (!statuses[classroomId]) statuses[classroomId] = {};
    statuses[classroomId][studentId] = "distracted" as StudentStatus;
    storage.saveSessionStatuses(statuses);
    setSessionStatuses({ ...statuses });
  };

  const recoverStudent = (classroomId: string, studentId: string) => {
    const statuses = storage.getSessionStatuses();
    if (!statuses[classroomId]) statuses[classroomId] = {};
    statuses[classroomId][studentId] = "focused" as StudentStatus;
    storage.saveSessionStatuses(statuses);
    setSessionStatuses({ ...statuses });
    const user = users.find((u) => u.id === studentId);
    if (user) toast.success(`${user.name} recovered to focused`);
  };

  const recoverAll = (classroomId: string) => {
    const all = storage.getClassrooms();
    const classroom = all.find((c) => c.id === classroomId);
    if (!classroom) return;
    const statuses = storage.getSessionStatuses();
    statuses[classroomId] = {};
    for (const sid of classroom.studentIds) {
      statuses[classroomId][sid] = "focused" as StudentStatus;
    }
    storage.saveSessionStatuses(statuses);
    setSessionStatuses({ ...statuses });
    toast.success("All students recovered!");
  };

  const getStudentClassroom = (): FCClassroom | null => {
    if (!currentUser || currentUser.role !== "student") return null;
    const all = storage.getClassrooms();
    return all.find((c) => c.studentIds.includes(currentUser.id)) ?? null;
  };

  const recordSelfStudySession = (
    userId: string,
    minutesStudied: number,
  ): { newBadges: string[] } => {
    const result = awardSelfStudyXP(userId, minutesStudied);
    setUsers(storage.getUsers());
    return result;
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        classrooms,
        sessionStatuses,
        darkMode,
        toggleDarkMode,
        login,
        signup,
        logout,
        createClassroom,
        joinClassroom,
        startSession,
        stopSession,
        markDistracted,
        recoverStudent,
        recoverAll,
        getStudentClassroom,
        refreshData,
        recordSelfStudySession,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
