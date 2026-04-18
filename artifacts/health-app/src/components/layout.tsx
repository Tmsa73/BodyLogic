import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Home, Utensils, Dumbbell, Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useLang } from "@/contexts/language-context";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] w-full bg-background flex justify-center">
      <div className="w-full max-w-[430px] bg-background min-h-[100dvh] relative flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto scrollbar-thin" style={{ paddingBottom: "72px" }}>
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}

function BottomNav() {
  const [location] = useLocation();
  const { t } = useLang();

  const isActive = (href: string) =>
    href === "/profile"
      ? location === "/profile" || location === "/achievements" || location === "/settings"
      : location === href;

  const tabs = [
    { href: "/fitness", icon: Dumbbell, label: t("nav_fitness") },
    { href: "/ai-coach", icon: Sparkles, label: t("nav_ai") },
    { href: "/", icon: Home, label: t("nav_home") },
    { href: "/nutrition", icon: Utensils, label: t("nav_nutrition") },
    { href: "/profile", icon: User, label: t("nav_profile") },
  ];

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-card/95 backdrop-blur-xl border-t border-border/40 z-50"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-stretch h-[58px]">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 relative press-scale min-w-0"
            >
              {active && (
                <motion.div
                  layoutId="tab-pill"
                  className="absolute top-0 left-1/2 -translate-x-1/2 h-[2.5px] w-7 rounded-b-full bg-primary"
                  transition={{ type: "spring", bounce: 0.3, duration: 0.35 }}
                />
              )}
              <div className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200",
                active ? "bg-primary/12" : ""
              )}>
                <Icon
                  className={cn("transition-all duration-200", active ? "w-[18px] h-[18px] text-primary" : "w-[18px] h-[18px] text-muted-foreground/60")}
                  strokeWidth={active ? 2.5 : 1.8}
                />
              </div>
              <span className={cn(
                "text-[9px] font-semibold leading-none transition-colors truncate max-w-[48px] text-center",
                active ? "text-primary" : "text-muted-foreground/50"
              )}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
