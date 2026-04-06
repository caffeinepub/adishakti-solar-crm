import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import {
  useCallerProfile,
  useIsAdmin,
  useIsApproved,
} from "./hooks/useQueries";
import Assignments from "./pages/Assignments";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import Login from "./pages/Login";
import Pipeline from "./pages/Pipeline";
import Reports from "./pages/Reports";
import UsersPage from "./pages/Users";

// ── Auth gate wrapper ───────────────────────────────────────────────────────────

function AuthGate({ children }: { children: React.ReactNode }) {
  const { identity, isInitializing } = useInternetIdentity();
  const { isFetching: actorLoading } = useActor();
  const { data: profile, isLoading: profileLoading } = useCallerProfile();
  const { data: isApproved, isLoading: approvedLoading } = useIsApproved();
  const { data: isAdmin } = useIsAdmin();

  const loading =
    isInitializing || actorLoading || profileLoading || approvedLoading;

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: "linear-gradient(135deg, #0A1220 0%, #0E1B2D 100%)",
        }}
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-gold" />
          <p className="text-muted-foreground text-sm">Loading CRM...</p>
        </div>
      </div>
    );
  }

  if (!identity || !profile || (!isAdmin && !isApproved)) {
    return <Login />;
  }

  return <>{children}</>;
}

// ── Router setup ─────────────────────────────────────────────────────────────────

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

const routeTree = rootRoute.addChildren([
  indexRoute,
  leadsRoute,
  pipelineRoute,
  assignmentsRoute,
  reportsRoute,
  usersRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
