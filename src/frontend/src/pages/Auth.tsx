import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "motion/react";
import { useState } from "react";
import { useApp } from "../contexts/AppContext";

export default function Auth() {
  const { login, signup } = useApp();
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (tab === "signup" && !name.trim()) {
      setError("Name is required");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    const err =
      tab === "login"
        ? login(email, password)
        : signup(name, email, password, role);
    if (err) setError(err);
    setLoading(false);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #0a0f1e 0%, #0d1529 50%, #0a1a1a 100%)",
      }}
    >
      {/* Background blobs */}
      <div
        className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #3b82f6, transparent)" }}
      />
      <div
        className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #10b981, transparent)" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
              <span className="text-xl">🎯</span>
            </div>
            <h1 className="text-3xl font-heading font-bold gradient-text">
              FocusClass
            </h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Eliminate distractions. Maximize learning.
          </p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8">
          {/* Tabs */}
          <div
            className="flex gap-1 p-1 rounded-xl mb-6"
            style={{ background: "rgba(255,255,255,0.05)" }}
          >
            {(["login", "signup"] as const).map((t) => (
              <button
                type="button"
                key={t}
                data-ocid={`auth.${t}.tab`}
                onClick={() => {
                  setTab(t);
                  setError("");
                }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  tab === t
                    ? "gradient-bg text-white shadow-lg"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === "signup" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Label className="text-sm text-muted-foreground">
                  Full Name
                </Label>
                <Input
                  data-ocid="auth.name.input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Johnson"
                  className="mt-1 bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground"
                />
              </motion.div>
            )}

            <div>
              <Label className="text-sm text-muted-foreground">Email</Label>
              <Input
                data-ocid="auth.email.input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1 bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div>
              <Label className="text-sm text-muted-foreground">Password</Label>
              <Input
                data-ocid="auth.password.input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {tab === "signup" && (
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">
                  I am a...
                </Label>
                <div className="flex gap-3">
                  {(["student", "teacher"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      data-ocid={`auth.role_${r}.toggle`}
                      onClick={() => setRole(r)}
                      className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                        role === r
                          ? "border-transparent gradient-bg text-white"
                          : "border-white/10 text-muted-foreground hover:border-white/25"
                      }`}
                    >
                      <span>{r === "student" ? "🎓" : "👩‍🏫"}</span>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <p
                data-ocid="auth.error_state"
                className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2"
              >
                {error}
              </p>
            )}

            <Button
              data-ocid="auth.submit_button"
              type="submit"
              disabled={loading}
              className="w-full gradient-bg text-white border-0 hover:opacity-90 transition-opacity h-11 font-semibold"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {tab === "login" ? "Signing in..." : "Creating account..."}
                </span>
              ) : tab === "login" ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-4">
            {tab === "login"
              ? "Don't have an account? "
              : "Already have an account? "}
            <button
              type="button"
              onClick={() => {
                setTab(tab === "login" ? "signup" : "login");
                setError("");
              }}
              className="text-primary hover:underline"
            >
              {tab === "login" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>

        {/* Demo hint */}
        <p className="text-center text-xs text-muted-foreground mt-4">
          New here? Sign up as a Teacher to create classes, or as a Student to
          join.
        </p>

        {/* Quick login buttons */}
        <div className="flex gap-2 mt-2">
          <button
            type="button"
            data-ocid="auth.demo_teacher.button"
            onClick={() => {
              setTab("login");
              setEmail("teacher@focusclass.demo");
              setPassword("demo123");
              setError("");
            }}
            className="flex-1 py-2 rounded-xl border border-white/10 text-xs text-muted-foreground hover:border-white/25 hover:text-foreground transition-all"
          >
            👩‍🏫 Try as Teacher
          </button>
          <button
            type="button"
            data-ocid="auth.demo_student.button"
            onClick={() => {
              setTab("login");
              setEmail("student@focusclass.demo");
              setPassword("demo123");
              setError("");
            }}
            className="flex-1 py-2 rounded-xl border border-white/10 text-xs text-muted-foreground hover:border-white/25 hover:text-foreground transition-all"
          >
            🎓 Try as Student
          </button>
        </div>
      </motion.div>
    </div>
  );
}
