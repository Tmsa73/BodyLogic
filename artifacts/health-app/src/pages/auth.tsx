import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, ChevronRight, Languages, Target, Dumbbell, Activity, Scale, type LucideIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useLang } from "@/contexts/language-context";
import appLogo from "@assets/392c7c4e-518a-4bcf-9754-0d66a29e96dd_Nero_AI_Background_Remove_1776954214286.png";

function clearLocalProgress() {
  try {
    Object.keys(localStorage).forEach((k) => {
      if (k.startsWith("bodylogic-") || k === "userAvatar") {
        localStorage.removeItem(k);
      }
    });
  } catch {}
}

type Mode = "login" | "register";

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
const apiPath = (path: string) => `${BASE_URL}${path}`;

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [age, setAge] = useState("25");
  const [weight, setWeight] = useState("70");
  const [height, setHeight] = useState("170");
  const [goal, setGoal] = useState("improve_fitness");
  const [gender, setGender] = useState("unspecified");

  const { toast } = useToast();
  const { login } = useAuth();
  const { t, lang, setLang } = useLang();

  const GOALS: { value: string; label: string; icon: LucideIcon }[] = [
    { value: "lose_weight", label: t("profile_goal_lose"), icon: Target },
    { value: "build_muscle", label: t("profile_goal_muscle"), icon: Dumbbell },
    { value: "improve_fitness", label: t("profile_goal_fitness"), icon: Activity },
    { value: "maintain", label: t("profile_goal_maintain"), icon: Scale },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      const res = await fetch(apiPath("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      clearLocalProgress();
      login(data);
    } catch (err: any) {
      toast({ title: "Login failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) { setStep(2); return; }
    setLoading(true);
    try {
      const res = await fetch(apiPath("/api/auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email, password, age: Number(age), gender, weight: Number(weight), height: Number(height), goal }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      clearLocalProgress();
      login(data);
      toast({ title: t("auth_signup"), description: `${data.name}!` });
    } catch (err: any) {
      toast({ title: "Registration failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-background flex justify-center">
      <div className="w-full max-w-[430px] min-h-[100dvh] flex flex-col relative overflow-hidden">

        {/* Ambient background blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            className="absolute top-[-80px] left-1/2 -translate-x-1/2 w-80 h-80 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(34,197,94,0.13) 0%, transparent 70%)" }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-[-60px] right-[-40px] w-64 h-64 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(59,130,246,0.10) 0%, transparent 70%)" }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.9, 0.5] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />
        </div>

        {/* Language toggle — top right */}
        <div className="absolute top-4 right-4 z-20">
          <motion.button
            onClick={() => setLang(lang === "en" ? "ar" : "en")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/60 bg-card/80 backdrop-blur-sm text-xs font-bold text-foreground shadow-sm"
            whileTap={{ scale: 0.93 }}
            whileHover={{ scale: 1.04 }}
          >
            <Languages className="w-3.5 h-3.5 text-primary" />
            <span>{lang === "en" ? "العربية" : "English"}</span>
          </motion.button>
        </div>

        <div className="flex-1 flex flex-col justify-center px-6 py-10 relative z-10">

          {/* ── Animated Logo ── */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative flex items-center justify-center mb-4" style={{ width: 180, height: 180 }}>

              {/* Outer slow-rotating gradient ring */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: "conic-gradient(from 0deg, rgba(34,197,94,0.6), rgba(59,130,246,0.5), rgba(16,185,129,0.4), transparent, rgba(34,197,94,0.6))",
                  borderRadius: "50%",
                  padding: 3,
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                <div className="w-full h-full rounded-full bg-background" />
              </motion.div>

              {/* Middle pulsing glow ring */}
              <motion.div
                className="absolute rounded-full"
                style={{
                  width: 148,
                  height: 148,
                  background: "transparent",
                  boxShadow: "0 0 0 0 rgba(34,197,94,0.45)",
                }}
                animate={{
                  boxShadow: [
                    "0 0 0 0px rgba(34,197,94,0.45)",
                    "0 0 0 14px rgba(34,197,94,0.0)",
                    "0 0 0 0px rgba(34,197,94,0.45)",
                  ],
                }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              />

              {/* Inner glow halo */}
              <motion.div
                className="absolute rounded-full"
                style={{ width: 140, height: 140 }}
                animate={{
                  background: [
                    "radial-gradient(circle, rgba(34,197,94,0.15) 0%, transparent 70%)",
                    "radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%)",
                    "radial-gradient(circle, rgba(34,197,94,0.15) 0%, transparent 70%)",
                  ],
                }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              />

              {/* Orbiting dot */}
              <motion.div
                className="absolute"
                style={{ width: 180, height: 180, top: 0, left: 0 }}
                animate={{ rotate: -360 }}
                transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              >
                <div
                  className="absolute rounded-full bg-primary shadow-[0_0_8px_3px_rgba(34,197,94,0.7)]"
                  style={{ width: 10, height: 10, top: 8, left: "50%", transform: "translateX(-50%)" }}
                />
              </motion.div>

              {/* Orbiting dot 2 (opposite, slower) */}
              <motion.div
                className="absolute"
                style={{ width: 160, height: 160, top: 10, left: 10 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
              >
                <div
                  className="absolute rounded-full bg-blue-400 shadow-[0_0_6px_2px_rgba(59,130,246,0.6)]"
                  style={{ width: 7, height: 7, bottom: 6, right: "50%", transform: "translateX(50%)" }}
                />
              </motion.div>

              {/* Logo image — breathing */}
              <motion.img
                src={appLogo}
                alt="BodyLogic"
                className="relative z-10 object-contain select-none"
                style={{
                  width: 120,
                  height: 120,
                  filter: "drop-shadow(0 0 18px rgba(34,197,94,0.55)) drop-shadow(0 4px 20px rgba(0,0,0,0.35))",
                }}
                animate={{ scale: [1, 1.045, 1], filter: [
                  "drop-shadow(0 0 14px rgba(34,197,94,0.5)) drop-shadow(0 4px 16px rgba(0,0,0,0.3))",
                  "drop-shadow(0 0 28px rgba(34,197,94,0.85)) drop-shadow(0 4px 20px rgba(0,0,0,0.35))",
                  "drop-shadow(0 0 14px rgba(34,197,94,0.5)) drop-shadow(0 4px 16px rgba(0,0,0,0.3))",
                ]}}
                transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                initial={{ scale: 0.7, opacity: 0 }}
              />
            </div>

            {/* Brand name with gradient shimmer */}
            <motion.h1
              className="text-3xl font-black tracking-tight"
              style={{
                background: "linear-gradient(90deg, #22c55e, #3b82f6, #10b981, #22c55e)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
              animate={{ backgroundPosition: ["0% center", "200% center"] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
              initial={{ opacity: 0, y: 10 }}
            >
              BodyLogic
            </motion.h1>
            <motion.p
              className="text-sm text-muted-foreground mt-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {t("auth_tagline")}
            </motion.p>
          </div>

          {/* Tab switcher */}
          <div className="flex bg-muted rounded-2xl p-1 mb-6">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setStep(1); }}
                className={cn(
                  "flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200",
                  mode === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                )}
              >
                {m === "login" ? t("auth_signin") : t("auth_signup")}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {mode === "login" ? (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleLogin}
                className="space-y-4"
              >
                <Field icon={<Mail className="w-4 h-4 text-primary" />} label={t("auth_email")} type="email" value={email} onChange={setEmail} placeholder={t("auth_email_placeholder")} />
                <PasswordField value={password} onChange={setPassword} show={showPw} onToggle={() => setShowPw(!showPw)} iconColor="text-secondary" />

                <button
                  type="submit"
                  disabled={loading || !email || !password}
                  className="w-full h-12 bg-gradient-to-r from-primary to-secondary text-background font-bold rounded-2xl flex items-center justify-center gap-2 press-scale disabled:opacity-50 mt-2"
                >
                  {loading ? <LoadingDots /> : <><span>{t("auth_signin_btn")}</span><ArrowRight className="w-4 h-4 rtl-flip" /></>}
                </button>

                <p className="text-center text-xs text-muted-foreground mt-4">
                  {t("auth_no_account")}{" "}
                  <button type="button" onClick={() => setMode("register")} className="text-primary font-bold">
                    {t("auth_signup_free")}
                  </button>
                </p>
              </motion.form>
            ) : (
              <motion.form
                key={`register-${step}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleRegister}
                className="space-y-4"
              >
                {step === 1 ? (
                  <>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{t("auth_step1")}</p>
                    <Field icon={<User className="w-4 h-4 text-primary" />} label={t("auth_name")} type="text" value={name} onChange={setName} placeholder={t("auth_name_placeholder")} />
                    <Field icon={<Mail className="w-4 h-4 text-secondary" />} label={t("auth_email")} type="email" value={email} onChange={setEmail} placeholder={t("auth_email_placeholder")} />
                    <PasswordField value={password} onChange={setPassword} show={showPw} onToggle={() => setShowPw(!showPw)} iconColor="text-yellow-400" />
                    <button
                      type="submit"
                      disabled={!name || !email || !password}
                      className="w-full h-12 bg-gradient-to-r from-primary to-secondary text-background font-bold rounded-2xl flex items-center justify-center gap-2 press-scale disabled:opacity-50"
                    >
                      <span>{t("auth_continue")}</span><ChevronRight className="w-4 h-4 rtl-flip" />
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{t("auth_step2")}</p>

                    {/* Goal */}
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-2 block">{t("auth_goal")}</label>
                      <div className="grid grid-cols-2 gap-2">
                        {GOALS.map(g => {
                          const Icon = g.icon;
                          return (
                            <button
                              key={g.value}
                              type="button"
                              onClick={() => setGoal(g.value)}
                              className={cn(
                                "p-3 rounded-xl border-2 text-sm font-bold flex items-center gap-2 transition-all",
                                goal === g.value ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted/30 text-foreground"
                              )}
                            >
                              <Icon className="w-4 h-4 shrink-0" />
                              <span>{g.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Gender */}
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-2 block">{t("auth_gender")}</label>
                      <div className="flex gap-2">
                        {(["male", "female", "unspecified"] as const).map(g => (
                          <button key={g} type="button" onClick={() => setGender(g)}
                            className={cn("flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all",
                              gender === g ? "border-secondary bg-secondary/10 text-secondary" : "border-border bg-muted/30 text-foreground")}
                          >{g === "male" ? t("auth_male") : g === "female" ? t("auth_female") : t("auth_other")}</button>
                        ))}
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-xs font-semibold text-primary mb-1 block">{t("auth_age")}</label>
                        <input type="number" inputMode="numeric" min={5} max={120} value={age} onChange={e => setAge(e.target.value)} className="w-full h-10 rounded-xl bg-muted border border-primary/30 text-sm text-center font-bold focus:outline-none focus:ring-2 focus:ring-primary text-foreground" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-orange-400 mb-1 block">{t("auth_weight")}</label>
                        <input type="number" inputMode="decimal" min={20} max={400} value={weight} onChange={e => setWeight(e.target.value)} className="w-full h-10 rounded-xl bg-muted border border-orange-400/30 text-sm text-center font-bold focus:outline-none focus:ring-2 focus:ring-orange-400 text-foreground" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-secondary mb-1 block">{t("auth_height")}</label>
                        <input type="number" inputMode="decimal" min={50} max={280} value={height} onChange={e => setHeight(e.target.value)} className="w-full h-10 rounded-xl bg-muted border border-secondary/30 text-sm text-center font-bold focus:outline-none focus:ring-2 focus:ring-secondary text-foreground" />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button type="button" onClick={() => setStep(1)}
                        className="flex-1 h-12 bg-muted text-foreground font-bold rounded-2xl press-scale">
                        {t("auth_back")}
                      </button>
                      <button type="submit" disabled={loading}
                        className="flex-1 h-12 bg-gradient-to-r from-primary to-secondary text-background font-bold rounded-2xl flex items-center justify-center gap-2 press-scale disabled:opacity-50">
                        {loading ? <LoadingDots /> : <><span>{t("auth_create")}</span><ArrowRight className="w-4 h-4 rtl-flip" /></>}
                      </button>
                    </div>
                  </>
                )}

                <p className="text-center text-xs text-muted-foreground">
                  {t("auth_have_account")}{" "}
                  <button type="button" onClick={() => setMode("login")} className="text-primary font-bold">{t("auth_signin_link")}</button>
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function Field({ icon, label, type, value, onChange, placeholder }: {
  icon: React.ReactNode; label: string; type: string; value: string; onChange: (v: string) => void; placeholder: string;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{label}</label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={type === "email" ? "email" : "name"}
          className="w-full h-12 pl-10 pr-4 rounded-2xl bg-card border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
        />
      </div>
    </div>
  );
}

function PasswordField({ value, onChange, show, onToggle, iconColor = "text-primary" }: {
  value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void; iconColor?: string;
}) {
  const { t } = useLang();
  return (
    <div>
      <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{t("auth_password")}</label>
      <div className="relative">
        <span className={cn("absolute left-3.5 top-1/2 -translate-y-1/2", iconColor)}><Lock className="w-4 h-4" /></span>
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={t("auth_pw_placeholder")}
          autoComplete="current-password"
          className="w-full h-12 pl-10 pr-12 rounded-2xl bg-card border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
        />
        <button type="button" onClick={onToggle} className={cn("absolute right-3.5 top-1/2 -translate-y-1/2", iconColor, "opacity-80")}>
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function LoadingDots() {
  return (
    <div className="flex gap-1">
      {[0, 150, 300].map((d) => (
        <span key={d} className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
      ))}
    </div>
  );
}
