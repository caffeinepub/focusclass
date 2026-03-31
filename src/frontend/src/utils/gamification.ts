import {
  type FCSelfStudySession,
  type FCUser,
  generateId,
  storage,
} from "./storage";

export const BADGE_DEFS = [
  {
    id: "beginner",
    name: "Beginner",
    description: "Complete your first focus session",
    icon: "🌱",
    requirement: 1,
    color: "from-emerald-500 to-teal-600",
  },
  {
    id: "consistent",
    name: "Consistent Learner",
    description: "Complete 10 focus sessions",
    icon: "📚",
    requirement: 10,
    color: "from-blue-500 to-indigo-600",
  },
  {
    id: "focus_master",
    name: "Focus Master",
    description: "Complete 50 focus sessions",
    icon: "🏆",
    requirement: 50,
    color: "from-yellow-400 to-orange-500",
  },
  {
    id: "streak_3",
    name: "Streak Starter",
    description: "Maintain a 3-day streak",
    icon: "🔥",
    requirement: 0,
    color: "from-red-500 to-orange-500",
  },
  {
    id: "top_scorer",
    name: "Top Scorer",
    description: "Earn 100 XP total",
    icon: "⭐",
    requirement: 0,
    color: "from-purple-500 to-pink-500",
  },
];

export function awardSessionXP(userId: string): { newBadges: string[] } {
  const users = storage.getUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) return { newBadges: [] };

  const user = { ...users[idx] };
  user.xp = (user.xp || 0) + 10;
  user.sessionsCompleted = (user.sessionsCompleted || 0) + 1;

  // Streak logic
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  if (user.lastStudyDate === yesterday) {
    user.streak = (user.streak || 0) + 1;
  } else if (user.lastStudyDate !== today) {
    user.streak = 1;
  }
  user.lastStudyDate = today;

  // Study minutes tracking (last 7 days)
  if (!Array.isArray(user.studyMinutes))
    user.studyMinutes = new Array(7).fill(0);
  const dayOfWeek = new Date().getDay();
  user.studyMinutes[dayOfWeek] = (user.studyMinutes[dayOfWeek] || 0) + 25;

  // Weekly sessions (last 4 weeks)
  if (!Array.isArray(user.weeklySessions))
    user.weeklySessions = new Array(4).fill(0);
  user.weeklySessions[3] = (user.weeklySessions[3] || 0) + 1;

  // Check badges
  const newBadges: string[] = [];
  if (!user.badges) user.badges = [];

  if (user.sessionsCompleted >= 1 && !user.badges.includes("beginner")) {
    user.badges.push("beginner");
    newBadges.push("beginner");
  }
  if (user.sessionsCompleted >= 10 && !user.badges.includes("consistent")) {
    user.badges.push("consistent");
    newBadges.push("consistent");
  }
  if (user.sessionsCompleted >= 50 && !user.badges.includes("focus_master")) {
    user.badges.push("focus_master");
    newBadges.push("focus_master");
  }
  if ((user.streak || 0) >= 3 && !user.badges.includes("streak_3")) {
    user.badges.push("streak_3");
    newBadges.push("streak_3");
  }
  if (user.xp >= 100 && !user.badges.includes("top_scorer")) {
    user.badges.push("top_scorer");
    newBadges.push("top_scorer");
  }

  users[idx] = user;
  storage.saveUsers(users);
  return { newBadges };
}

export function awardSelfStudyXP(
  userId: string,
  minutesStudied: number,
): { newBadges: string[] } {
  const result = awardSessionXP(userId);

  // Save self-study session record
  const sessions = storage.getSelfStudySessions();
  const record: FCSelfStudySession = {
    id: generateId(),
    userId,
    duration: minutesStudied,
    date: new Date().toDateString(),
    points: 10,
    isSelfStudy: true,
  };
  sessions.push(record);
  storage.saveSelfStudySessions(sessions);

  return result;
}

export function getXPToNextBadge(user: FCUser): {
  current: number;
  target: number;
  label: string;
} {
  const sessions = user.sessionsCompleted || 0;
  if (sessions < 1) return { current: sessions, target: 1, label: "Beginner" };
  if (sessions < 10)
    return { current: sessions, target: 10, label: "Consistent Learner" };
  if (sessions < 50)
    return { current: sessions, target: 50, label: "Focus Master" };
  return { current: sessions, target: sessions, label: "Max Level" };
}
