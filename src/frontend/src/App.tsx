import { Toaster } from "@/components/ui/sonner";
import { useActor } from "@caffeineai/core-infrastructure";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { Sun } from "lucide-react";
import { createActor } from "./backend";
import { useAuth } from "./hooks/useAuth";
import Assignments from "./pages/Assignments";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import Login from "./pages/Login";
import Pipeline from "./pages/Pipeline";
import Reports from "./pages/Reports";
import UsersPage from "./pages/Users";

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
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
