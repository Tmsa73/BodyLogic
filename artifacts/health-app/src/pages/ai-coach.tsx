import { useState, useEffect, useMemo, useRef } from "react";
import { useGetAiMessages, useSendAiMessage, useGetAiInsights, getGetAiMessagesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Send, Dumbbell, Utensils, Moon, Heart, Brain, Zap, TrendingUp, AlertTriangle, Lightbulb, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useLang } from "@/hooks/use-lang";

const PERSONALITY_CONFIG = {
  motivator: { icon: Zap, labelKey: "ai_personality_motivator", color: "text-orange-400 border-orange-400/40 bg-orange-400/10" },
  friendly: { icon: Heart, labelKey: "ai_personality_friendly", color: "text-primary border-primary/40 bg-primary/10" },
  strict: { icon: Dumbbell, labelKey: "ai_personality_strict", color: "text-destructive border-destructive/40 bg-destructive/10" },
  silent: { icon: Moon, labelKey: "ai_personality_silent", color: "text-secondary border-secondary/40 bg-secondary/10" },
};

const TOPIC_CHIPS = [
  { icon: Utensils, tKey: "ai_chip_nutrition" as const, label: "Nutrition tips", color: "text-primary" },
  { icon: Dumbbell, tKey: "ai_chip_workout" as const, label: "Best workout today", color: "text-secondary" },
  { icon: Moon, tKey: "ai_chip_sleep" as const, label: "Improve my sleep", color: "text-purple-400" },
  { icon: Heart, tKey: "ai_chip_balance" as const, label: "My life balance", color: "text-rose-400" },
  { icon: Brain, tKey: "ai_chip_mental" as const, label: "Mental wellness", color: "text-amber-400" },
  { icon: Zap, tKey: "ai_chip_energy" as const, label: "Boost my energy", color: "text-yellow-400" },
  { icon: TrendingUp, tKey: "ai_chip_progress" as const, label: "My progress this week", color: "text-green-400" },
  { icon: AlertTriangle, tKey: "ai_chip_habits" as const, label: "Fix my bad habits", color: "text-orange-400" },
];

function TypingIndicator() {
  return (
    <div className="flex gap-2.5 items-end">
      <div className="w-8 h-8 rounded-2xl overflow-hidden shrink-0 bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
        <Sparkles className="w-4 h-4 text-background" />
      </div>
      <div className="bg-card border border-border/40 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1.5 items-center h-4">
          {[0, 150, 300].map(delay => (
            <span
              key={delay}
              className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function formatMessage(content: string) {
  const lines = content.split('\n');
  return lines.map((line, i) => {
    if (line.startsWith('**') && line.endsWith('**')) {
      return <p key={i} className="font-bold mb-1">{line.slice(2, -2)}</p>;
    }
    if (line.startsWith('• ') || line.startsWith('- ')) {
      return <p key={i} className="pl-2 mb-0.5">• {line.slice(2)}</p>;
    }
    if (line.trim() === '') return <br key={i} />;
    return <p key={i} className="mb-0.5">{line}</p>;
  });
}

function FormattedMessage({ content }: { content: string }) {
  const formatted = useMemo(() => formatMessage(content), [content]);
  return <>{formatted}</>;
}

export default function AiCoach() {
  const [input, setInput] = useState("");
  const [showInsights, setShowInsights] = useState(false);
  const [personality, setPersonality] = useState<keyof typeof PERSONALITY_CONFIG>("motivator");
  const [showPersonalityPicker, setShowPersonalityPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: messages, isLoading } = useGetAiMessages();
  const { data: insights } = useGetAiInsights();
  const qc = useQueryClient();
  const sendMessage = useSendAiMessage();
  const { t, lang } = useLang();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: sendMessage.isPending ? "smooth" : "auto" });
  }, [messages, sendMessage.isPending]);

  const handleSend = (text?: string) => {
    const content = text ?? input;
    if (!content.trim() || sendMessage.isPending) return;
    sendMessage.mutate({ data: { content } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetAiMessagesQueryKey() });
        setInput("");
      }
    });
  };

  if (isLoading) return <AiCoachSkeleton />;

  const hasMessages = messages && messages.length > 0;
  const personalityCfg = PERSONALITY_CONFIG[personality];
  const PersonalityIcon = personalityCfg.icon;
  const personalityLabel = t(personalityCfg.labelKey as any);
  const habits = insights?.tips?.slice(0, 2) ?? [];

  return (
    <div
      className="flex flex-col bg-background bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.08),transparent_34%)]"
      style={{ height: "calc(100dvh - 58px)", marginBottom: "-72px" }}
    >
      {/* Header */}
      <header className="px-4 py-2.5 border-b border-border/40 bg-card/80 backdrop-blur-sm sticky top-0 z-10 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-md">
                <Sparkles className="w-4.5 h-4.5 text-background" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-background rounded-full" />
            </div>
            <div>
              <h1 className="font-black text-sm leading-tight">{t("ai_title")}</h1>
              <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider">{t("ai_online")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPersonalityPicker(!showPersonalityPicker)}
              className={cn("flex items-center gap-1 px-2 py-1 rounded-full border text-[10px] font-bold transition-all", personalityCfg.color)}
            >
              <PersonalityIcon className="w-3 h-3" />
              <span className="hidden sm:inline">{personalityLabel}</span>
            </button>
            {hasMessages && (
              <div className="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-full">
                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-muted-foreground">{messages.length}</span>
              </div>
            )}
          </div>
        </div>

        <AnimatePresence>
          {showPersonalityPicker && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mt-2"
            >
              <div className="grid grid-cols-4 gap-1.5 pb-1">
                {(Object.entries(PERSONALITY_CONFIG) as [keyof typeof PERSONALITY_CONFIG, typeof PERSONALITY_CONFIG[keyof typeof PERSONALITY_CONFIG]][]).map(([key, cfg]) => {
                  const Icon = cfg.icon;
                  return (
                    <button
                      key={key}
                      onClick={() => { setPersonality(key); setShowPersonalityPicker(false); }}
                      className={cn(
                        "flex flex-col items-center gap-0.5 p-2 rounded-xl border transition-all text-[10px] font-bold",
                        personality === key ? cfg.color : "border-border/40 bg-muted/20 text-muted-foreground"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="leading-tight text-center">{t(cfg.labelKey as any).split(" ")[0]}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* AI Insights (collapsible) */}
      {habits.length > 0 && (
        <div className="shrink-0 border-b border-border/30">
          <button
            onClick={() => setShowInsights(!showInsights)}
            className="w-full flex items-center gap-2 px-4 py-2 hover:bg-muted/30 transition-colors"
          >
            <div className="w-5 h-5 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Lightbulb className="w-3 h-3 text-primary" />
            </div>
            <span className="text-xs font-bold text-primary flex-1 text-left">
              {habits.length} {habits.length > 1 ? t("ai_insights_label") : t("ai_insight_label")}
            </span>
            {showInsights ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
          </button>
          <AnimatePresence>
            {showInsights && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-3 space-y-2">
                  {habits.map((tip, i) => {
                    const categoryColors: Record<string, string> = {
                      nutrition: "border-l-primary bg-primary/5",
                      fitness: "border-l-secondary bg-secondary/5",
                      sleep: "border-l-accent bg-accent/5",
                      water: "border-l-blue-400 bg-blue-400/5",
                      general: "border-l-orange-400 bg-orange-400/5",
                    };
                    const color = categoryColors[tip.category] ?? categoryColors.general;
                    return (
                      <div key={i} className={cn("flex items-start gap-2 p-2.5 rounded-xl border-l-2", color)}>
                        <Lightbulb className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-foreground">{tip.title}</p>
                          <p className="text-[10px] text-foreground/70 leading-snug mt-0.5">{tip.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {!hasMessages ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30 flex items-center justify-center shadow-lg">
                <Sparkles className="w-9 h-9 text-primary" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-secondary/20 border border-secondary/30 flex items-center justify-center">
                <Brain className="w-4 h-4 text-secondary" />
              </div>
            </div>
            <div className="space-y-1.5">
              <h2 className="font-black text-lg">{t("ai_coach_title")}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                {t("ai_coach_desc")}
              </p>
              <div className={cn("mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold", personalityCfg.color)}>
                <PersonalityIcon className="w-3.5 h-3.5" />
                <span>{t("ai_mode")} {personalityLabel} {t("ai_mode_suffix")}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 w-full">
              {TOPIC_CHIPS.map(chip => (
                <button
                  key={chip.label}
                  onClick={() => handleSend(t(chip.tKey))}
                  disabled={sendMessage.isPending}
                  className="flex items-center gap-2 p-3 rounded-xl bg-card border border-border/40 text-left hover:border-primary/30 hover:bg-primary/5 transition-all press-scale"
                >
                  <chip.icon className={cn("w-4 h-4 shrink-0", chip.color)} />
                  <span className="text-xs font-semibold text-foreground leading-snug">{t(chip.tKey)}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => {
              const isUser = msg.role === "user";
              const time = new Date(msg.createdAt ?? Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.03, 0.2) }}
                  className={cn("flex gap-2.5", isUser ? "flex-row-reverse" : "flex-row")}
                >
                  {!isUser && (
                    <div className="w-7 h-7 rounded-xl shrink-0 mt-auto bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-sm">
                      <Sparkles className="w-3.5 h-3.5 text-background" />
                    </div>
                  )}
                  <div className="flex flex-col gap-0.5 max-w-[82%]">
                    <div className={cn(
                      "px-3.5 py-2.5 text-sm leading-relaxed",
                      isUser
                        ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-2xl rounded-br-sm shadow-md"
                        : "bg-card border border-border/40 text-foreground rounded-2xl rounded-bl-sm shadow-sm"
                    )}>
                      {isUser ? msg.content : <div className="space-y-0.5 text-[13px]"><FormattedMessage content={msg.content} /></div>}
                    </div>
                    <span className={cn("text-[9px] font-bold text-muted-foreground/50 px-1", isUser ? "text-right" : "text-left")}>{time}</span>
                  </div>
                </motion.div>
              );
            })}
            {sendMessage.isPending && <TypingIndicator />}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick topic chips */}
      <div
        className="px-4 pt-2 pb-1.5 flex gap-1.5 overflow-x-auto shrink-0 border-t border-border/20"
        style={{ scrollbarWidth: "none" }}
      >
        {TOPIC_CHIPS.map(chip => (
          <button
            key={chip.label}
            onClick={() => handleSend(t(chip.tKey))}
            disabled={sendMessage.isPending}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1.5 rounded-full border text-[10px] font-semibold whitespace-nowrap transition-all press-scale shrink-0",
              "bg-card border-border/30 hover:border-primary/30 hover:bg-primary/5"
            )}
          >
            <chip.icon className={cn("w-3 h-3", chip.color)} />
            <span className="text-foreground">{t(chip.tKey)}</span>
          </button>
        ))}
      </div>

      {/* Input area */}
      <div className="px-4 pt-2 pb-3 bg-background border-t border-border/40 shrink-0">
        <div className="flex gap-2 items-center">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
              placeholder={`${t("ai_send_placeholder")} ${personalityLabel.toLowerCase()} ${t("ai_send_placeholder_suffix")}`}
              disabled={sendMessage.isPending}
              className="w-full rounded-full bg-card border border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 h-11 px-4 text-sm outline-none transition-all placeholder:text-muted-foreground/50"
            />
          </div>
          <Button
            onClick={() => handleSend()}
            size="icon"
            disabled={sendMessage.isPending || !input.trim()}
            className="rounded-full h-11 w-11 shrink-0 bg-primary text-background hover:bg-primary/90 transition-all active:scale-95 shadow-md"
          >
            <Send className="w-4 h-4 ms-0.5 rtl-flip" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function AiCoachSkeleton() {
  return (
    <div className="flex flex-col bg-background" style={{ height: "calc(100dvh - 58px)", marginBottom: "-72px" }}>
      <header className="px-4 py-2.5 border-b flex items-center gap-2.5">
        <Skeleton className="w-9 h-9 rounded-xl shimmer" />
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-28 shimmer" />
          <Skeleton className="h-2.5 w-16 shimmer" />
        </div>
      </header>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Skeleton className="w-20 h-20 rounded-3xl mx-auto shimmer" />
          <Skeleton className="h-5 w-44 mx-auto shimmer" />
          <Skeleton className="h-3.5 w-56 mx-auto shimmer" />
        </div>
      </div>
      <div className="p-4 border-t flex gap-2">
        <Skeleton className="h-11 flex-1 rounded-full shimmer" />
        <Skeleton className="h-11 w-11 rounded-full shimmer" />
      </div>
    </div>
  );
}
