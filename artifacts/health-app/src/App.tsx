import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import NotFound from "@/pages/not-found";
import { ThemeProvider } from "@/components/theme-provider";
import AuthPage from "@/pages/auth";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { useLang } from "@/hooks/use-lang";
import { LanguageProvider } from "@/contexts/language-context";

const Home = lazy(() => import("@/pages/home"));
const Nutrition = lazy(() => import("@/pages/nutrition"));
const Fitness = lazy(() => import("@/pages/fitness"));
const AiCoach = lazy(() => import("@/pages/ai-coach"));
const History = lazy(() => import("@/pages/history"));
const Profile = lazy(() => import("@/pages/profile"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
      gcTime: 5 * 60_000,
    },
  },
});

function AppLoader() {
  const { t } = useLang();
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <img
          src={`${import.meta.env.BASE_URL.replace(/\/$/, "")}/bodylogic-logo.png`}
          alt="BodyLogic"
          className="w-20 h-20 object-contain animate-pulse drop-shadow-[0_8px_24px_rgba(34,197,94,0.45)]"
        />
        <p className="text-sm text-muted-foreground">{t("common_loading")}</p>
      </div>
    </div>
  );
}

function Router() {
  const { user, loading } = useAuth();

  if (loading) {
    return <AppLoader />;
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <Layout>
      <Suspense fallback={<AppLoader />}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/nutrition" component={Nutrition} />
          <Route path="/fitness" component={Fitness} />
          <Route path="/ai-coach" component={AiCoach} />
          <Route path="/history" component={History} />
          <Route path="/profile" component={Profile} />
          <Route path="/achievements"><Redirect to="/profile" /></Route>
          <Route path="/settings"><Redirect to="/profile" /></Route>
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </Layout>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="bodylogic-theme">
      <LanguageProvider>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                <Router />
              </WouterRouter>
              <Toaster />
            </TooltipProvider>
          </QueryClientProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
