import { Toaster } from "@/components/ui/sonner";
import {
  InternetIdentityProvider,
  useActor,
} from "@caffeineai/core-infrastructure";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { AlertTriangle, RefreshCw, Sun } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";
import { createActor } from "./backend";
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
  error: Error | null;
}

class AppErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("App error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen flex items-center justify-center p-6"
          style={{ background: "oklch(0.12 0.022 240)" }}
        >
          <div className="max-w-md w-full text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-destructive/10 border border-destructive/30 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
            </div>
            <h1
              className="text-xl font-bold mb-2"
              style={{ color: "oklch(0.92 0.01 230)" }}
            >
              Adishakti Solar CRM
            </h1>
            <p
              className="text-sm mb-1"
              style={{ color: "oklch(0.6 0.03 230)" }}
            >
              Something went wrong loading the application.
            </p>
            {this.state.error && (
              <p
                className="text-xs mb-6 font-mono"
                style={{ color: "oklch(0.5 0.03 230)" }}
              >
                {this.state.error.message}
              </p>
            )}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium"
              style={{
                background: "oklch(0.75 0.14 68)",
                color: "oklch(0.12 0.022 240)",
              }}
            >
              <RefreshCw className="w-4 h-4" />
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Route Error ──────────────────────────────────────────────────────────────

function RouteError() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "oklch(0.12 0.022 240)" }}
    >
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center mb-4">
          <AlertTriangle className="w-10 h-10 text-destructive" />
        </div>
        <h2
          className="text-lg font-bold mb-2"
          style={{ color: "oklch(0.92 0.01 230)" }}
        >
          Page Error
        </h2>
        <p className="text-sm mb-4" style={{ color: "oklch(0.6 0.03 230)" }}>
          An unexpected error occurred on this page.
        </p>
        <button
          type="button"
          onClick={() => window.location.replace("/")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium"
          style={{
            background: "oklch(0.75 0.14 68)",
            color: "oklch(0.12 0.022 240)",
          }}
        >
          <RefreshCw className="w-4 h-4" />
          Go to Dashboard
        </button>
      </div>
    </div>
  );
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

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isFetching: actorLoading } = useActor(createActor);
  const { sessionToken, profile, isLoading } = useAuth();

  if (actorLoading || isLoading) return <LoadingScreen />;
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
    <AuthGate>
      <Dashboard />
    </AuthGate>
  ),
});

const leadsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/leads",
  component: () => (
    <AuthGate>
      <Leads />
    </AuthGate>
  ),
});

const pipelineRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/pipeline",
  component: () => (
    <AuthGate>
      <Pipeline />
    </AuthGate>
  ),
});

const assignmentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/assignments",
  component: () => (
    <AuthGate>
      <Assignments />
    </AuthGate>
  ),
});

const reportsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/reports",
  component: () => (
    <AuthGate>
      <Reports />
    </AuthGate>
  ),
});

const usersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/users",
  component: () => (
    <AuthGate>
      <UsersPage />
    </AuthGate>
  ),
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: Login,
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

const queryClient = new QueryClient();

export default function App() {
  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <InternetIdentityProvider>
          <RouterProvider router={router} />
        </InternetIdentityProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  );
}
