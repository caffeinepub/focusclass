export interface FCUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: "teacher" | "student";
  xp: number;
  streak: number;
  lastStudyDate: string | null;
  sessionsCompleted: number;
  badges: string[];
  studyMinutes: number[];
  weeklySessions: number[];
}

export interface FCSession {
  id: string;
  startedAt: number;
  duration: number; // minutes
  blockedApps: string[];
  timerEnd: number; // timestamp
}

export interface FCClassroom {
  id: string;
  code: string;
  name: string;
  teacherId: string;
  studentIds: string[];
  blockedApps: string[];
  activeSession: FCSession | null;
}

export type StudentStatus = "focused" | "distracted";
export type SessionStatuses = Record<string, Record<string, StudentStatus>>;

export interface FCSelfStudySession {
  id: string;
  userId: string;
  duration: number; // minutes actually studied
  date: string; // toDateString()
  points: number;
  isSelfStudy: true;
}

const KEYS = {
  users: "fc_users",
  classrooms: "fc_classrooms",
  sessionStatuses: "fc_session_statuses",
  currentUser: "fc_current_user",
  darkMode: "fc_dark_mode",
  selfStudySessions: "fc_self_study_sessions",
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export const storage = {
  getUsers: () => read<FCUser[]>(KEYS.users, []),
  saveUsers: (users: FCUser[]) => write(KEYS.users, users),

  getClassrooms: () => read<FCClassroom[]>(KEYS.classrooms, []),
  saveClassrooms: (c: FCClassroom[]) => write(KEYS.classrooms, c),

  getSessionStatuses: () => read<SessionStatuses>(KEYS.sessionStatuses, {}),
  saveSessionStatuses: (s: SessionStatuses) => write(KEYS.sessionStatuses, s),

  getCurrentUserId: () => localStorage.getItem(KEYS.currentUser),
  setCurrentUserId: (id: string | null) => {
    if (id) localStorage.setItem(KEYS.currentUser, id);
    else localStorage.removeItem(KEYS.currentUser);
  },

  getDarkMode: () => read<boolean>(KEYS.darkMode, true),
  setDarkMode: (v: boolean) => write(KEYS.darkMode, v),

  getSelfStudySessions: () =>
    read<FCSelfStudySession[]>(KEYS.selfStudySessions, []),
  saveSelfStudySessions: (s: FCSelfStudySession[]) =>
    write(KEYS.selfStudySessions, s),
};

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function generateClassCode(): string {
  const alpha = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const num = "0123456789";
  let code = "FC";
  for (let i = 0; i < 3; i++)
    code += alpha[Math.floor(Math.random() * alpha.length)];
  for (let i = 0; i < 2; i++)
    code += num[Math.floor(Math.random() * num.length)];
  return code;
}
