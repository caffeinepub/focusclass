import { Toaster } from "@/components/ui/sonner";
import { AppProvider, useApp } from "./contexts/AppContext";
import Auth from "./pages/Auth";
import StudentDashboard from "./pages/StudentDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";

function AppInner() {
  const { currentUser } = useApp();

  if (!currentUser) return <Auth />;
  if (currentUser.role === "teacher") return <TeacherDashboard />;
  return <StudentDashboard />;
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
      <Toaster position="top-right" richColors />
    </AppProvider>
  );
}
