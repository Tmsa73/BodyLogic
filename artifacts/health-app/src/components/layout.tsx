import { ReactNode, memo, useMemo } from "react";
import { Link, useLocation } from "wouter";

const HIDE_FOOTER_ON = new Set<string>(["/ai-coach"]);
import { Home, Utensils, Dumbbell, Sparkles, User, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useLang } from "@/hooks/use-lang";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const showFooter = !HIDE_FOOTER_ON.has(location);
  return (
    <div className="min-h-[100dvh] w-full bg-background flex justify-center">
      <div className="w-full max-w-[430px] bg-background min-h-[100dvh] relative flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto scrollbar-thin" style={{ paddingBottom: "72px" }}>
          {children}
          {showFooter && <AppFooter />}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}

const AppFooter = memo(function AppFooter() {
  const year = new Date().getFullYear();
  return (
    <div className="px-5 pt-3 pb-1">
      <div className="relative flex items-center justify-center gap-2 py-1.5">
        <span aria-hidden className="h-px w-8 bg-gradient-to-r from-transparent to-primary/40" />
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-md bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-sm">
            <Heart className="w-2 h-2 text-background" fill="currentColor" />
          </div>
          <span className="text-[10px] font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent tracking-wide">
            BodyLogic
          </span>
          <span className="text-[9px] text-muted-foreground/70 font-medium">
            © {year}
          </span>
        </div>
        <span aria-hidden className="h-px w-8 bg-gradient-to-l from-transparent to-secondary/40" />
      </div>
    </div>
  );
});

const BottomNav = memo(function BottomNav() {
  const [location] = useLocation();
  const { t } = useLang();

  const isActive = (href: string) =>
    href === "/profile"
      ? location === "/profile" || location === "/achievements" || location === "/settings"
      : location === href;

  const tabs = useMemo(() => [
    { href: "/fitness", icon: Dumbbell, label: t("nav_fitness") },
    { href: "/ai-coach", icon: Sparkles, label: t("nav_ai") },
    { href: "/", icon: Home, label: t("nav_home") },
    { href: "/nutrition", icon: Utensils, label: t("nav_nutrition") },
    { href: "/profile", icon: User, label: t("nav_profile") },
  ], [t]);

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
});
