import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { Sun } from "lucide-react";
import { Component, type ReactNode, useEffect, useRef, useState } from "react";
import { useAuth } from "./hooks/useAuth";
import Assignments from "./pages/Assignments";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import Login from "./pages/Login";
import Pipeline from "./pages/Pipeline";
import Reports from "./pages/Reports";
import UsersPage from "./pages/Users";

// ── Error Boundary ──────────────────────────────────────────────────────────

interface ErrorBoundaryState {
  hasError: boolean;
}

class AppErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("App error:", error);
  }

  render() {
    if (this.state.hasError) {
      // Always show Login instead of a black error screen.
      // This ensures auth/actor init failures never block the user.
      return <Login />;
    }
    return this.props.children;
  }
}

// ── Auth Error Boundary ──────────────────────────────────────────────────────
// Catches actor initialization errors (e.g. invalid canisterId "undefined")
// and falls back to Login page instead of showing a crash screen.

class AuthErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.warn("Auth/Actor init error (showing login):", error.message);
  }

  render() {
    if (this.state.hasError) {
      return <Login />;
    }
    return this.props.children;
  }
}

// ── Route Error ──────────────────────────────────────────────────────────────
// Renders on TanStack Router route-level errors.
// Shows Login instead of a black "Page Error" screen so users are never stuck.

function RouteError() {
  return <Login />;
}

// ── Loading Screen ──────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        background: "linear-gradient(135deg, #0A1220 0%, #0E1B2D 100%)",
      }}
      data-ocid="app.loading_state"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center">
            <Sun className="w-8 h-8 text-gold animate-pulse" />
          </div>
          <div className="absolute inset-0 rounded-full border-2 border-gold/30 border-t-gold animate-spin" />
        </div>
        <div className="text-center">
          <p className="text-foreground font-bold text-sm tracking-widest uppercase">
            Adishakti Solar CRM
          </p>
          <p className="text-muted-foreground text-xs mt-1">Loading...</p>
        </div>
      </div>
    </div>
  );
}

// ── Auth Gate ───────────────────────────────────────────────────────────────

// Max time to wait for backend to initialize before showing login anyway
const ACTOR_TIMEOUT_MS = 4000;

function AuthGate({ children }: { children: React.ReactNode }) {
  const { sessionToken, profile, isLoading } = useAuth();
  const [timedOut, setTimedOut] = useState(false);
  const timerFiredRef = useRef(false);

  // Safety timeout — fires ONCE on mount; never resets so loading can't loop
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (timerFiredRef.current) return;
    const timer = setTimeout(() => {
      timerFiredRef.current = true;
      setTimedOut(true);
    }, ACTOR_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);

  // Still loading AND haven't timed out yet → show loading screen
  if (isLoading && !timedOut) return <LoadingScreen />;

  // Not authenticated → show login
  if (!sessionToken || !profile) return <Login />;

  return <>{children}</>;
}

// ── Router ──────────────────────────────────────────────────────────────────

const rootRoute = createRootRoute({
  errorComponent: RouteError,
  component: () => (
    <>
      <Toaster theme="dark" richColors />
      <Outlet />
    </>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => (
    <AuthErrorBoundary>
      <AuthGate>
        <Dashboard />
      </AuthGate>
    </AuthErrorBoundary>
  ),
});

const leadsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/leads",
  component: () => (
    <AuthErrorBoundary>
      <AuthGate>
        <Leads />
      </AuthGate>
    </AuthErrorBoundary>
  ),
});

const pipelineRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/pipeline",
  component: () => (
    <AuthErrorBoundary>
      <AuthGate>
        <Pipeline />
      </AuthGate>
    </AuthErrorBoundary>
  ),
});

const assignmentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/assignments",
  component: () => (
    <AuthErrorBoundary>
      <AuthGate>
        <Assignments />
      </AuthGate>
    </AuthErrorBoundary>
  ),
});

const reportsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/reports",
  component: () => (
    <AuthErrorBoundary>
      <AuthGate>
        <Reports />
      </AuthGate>
    </AuthErrorBoundary>
  ),
});

const usersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/users",
  component: () => (
    <AuthErrorBoundary>
      <AuthGate>
        <UsersPage />
      </AuthGate>
    </AuthErrorBoundary>
  ),
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: () => (
    <AuthErrorBoundary>
      <Login />
    </AuthErrorBoundary>
  ),
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  leadsRoute,
  pipelineRoute,
  assignmentsRoute,
  reportsRoute,
  usersRoute,
  loginRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Disable automatic background refetches that can cause flickering
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      // Don't retry failed queries automatically — invalid config won't fix itself
      retry: false,
    },
  },
});

export default function App() {
  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </AppErrorBoundary>
  );
}
