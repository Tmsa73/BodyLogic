import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, ChevronRight, BookOpen, Target, Lightbulb } from "lucide-react";
import { Link } from "wouter";
import { useLang } from "@/contexts/language-context";
import { cn } from "@/lib/utils";

interface MorningBrief {
  recap: string;
  recapAr: string;
  plan: string;
  planAr: string;
  insight: string;
  insightAr: string;
  userName: string;
  generatedAt: string;
}

function getTodayKey() {
  return `bodylogic-morning-brief-${new Date().toISOString().split("T")[0]}`;
}

async function fetchMorningBrief(): Promise<MorningBrief> {
  const res = await fetch("/api/ai/morning-brief");
  if (!res.ok) throw new Error("Failed to fetch morning brief");
  return res.json();
}

export function MorningBriefCard() {
  const { t, lang } = useLang();
  const [dismissed, setDismissed] = useState(() => {
    try { return !!localStorage.getItem(getTodayKey()); } catch { return false; }
  });
  const [expanded, setExpanded] = useState(false);

  const { data, isLoading } = useQuery<MorningBrief>({
    queryKey: ["morning-brief"],
    queryFn: fetchMorningBrief,
    staleTime: 1000 * 60 * 30,
    enabled: !dismissed,
  });

  const dismiss = () => {
    try { localStorage.setItem(getTodayKey(), "1"); } catch {}
    setDismissed(true);
  };

  if (dismissed) return null;

  const isAr = lang === "ar";
  const recap = isAr ? (data?.recapAr ?? data?.recap) : data?.recap;
  const plan = isAr ? (data?.planAr ?? data?.plan) : data?.plan;
  const insight = isAr ? (data?.insightAr ?? data?.insight) : data?.insight;

  const sections = [
    {
      icon: BookOpen,
      label: t("morning_brief_recap"),
      text: recap,
      color: "text-orange-400",
      bg: "bg-orange-400/10",
    },
    {
      icon: Target,
      label: t("morning_brief_plan"),
      text: plan,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      icon: Lightbulb,
      label: t("morning_brief_insight"),
      text: insight,
      color: "text-accent",
      bg: "bg-accent/10",
    },
  ];

  return (
    <AnimatePresence>
      <motion.div
        key="morning-brief"
        initial={{ opacity: 0, y: -16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -12, scale: 0.96 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className="relative rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm"
      >
        {/* Top gradient accent */}
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary via-accent to-secondary rounded-t-2xl" />

        <div className="p-4">
          {/* Header row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-black text-foreground leading-none">{t("morning_brief_title")}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{t("morning_brief_subtitle")}</p>
              </div>
            </div>
            <button
              onClick={dismiss}
              className="w-6 h-6 rounded-full bg-muted/60 flex items-center justify-center hover:bg-muted active:scale-90 transition-all press-scale"
              aria-label="Dismiss"
            >
              <X className="w-3 h-3 text-muted-foreground" />
            </button>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 rounded-xl bg-muted/40 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {sections.map((section, idx) => {
                const Icon = section.icon;
                const isFirst = idx === 0;
                const show = expanded || isFirst;
                return (
                  <AnimatePresence key={section.label}>
                    {show && (
                      <motion.div
                        initial={isFirst ? false : { opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                        className={cn("flex items-start gap-2.5 rounded-xl p-2.5", section.bg)}
                      >
                        <div className={cn("w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5", section.bg)}>
                          <Icon className={cn("w-3 h-3", section.color)} />
                        </div>
                        <div>
                          <p className={cn("text-[10px] font-bold uppercase tracking-wider mb-0.5", section.color)}>
                            {section.label}
                          </p>
                          <p className="text-xs text-foreground leading-snug">{section.text}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                );
              })}

              {/* Expand / collapse */}
              <button
                onClick={() => setExpanded((v) => !v)}
                className="w-full flex items-center justify-center gap-1 py-1.5 text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors"
              >
                {expanded ? "Show less" : "See today's focus & insight"}
                <motion.span animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronRight className={cn("w-3 h-3", isAr && "rtl-flip")} />
                </motion.span>
              </button>

              {/* Footer CTA */}
              {expanded && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.15 }}
                >
                  <Link
                    href="/ai-coach"
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/15 transition-colors press-scale"
                  >
                    <Sparkles className="w-3 h-3 text-primary" />
                    <span className="text-xs font-bold text-primary">{t("morning_brief_open_coach")}</span>
                  </Link>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
