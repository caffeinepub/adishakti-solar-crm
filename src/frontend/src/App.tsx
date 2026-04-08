import { Toaster } from "@/components/ui/sonner";
import { useActor, useInternetIdentity } from "@caffeineai/core-infrastructure";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { createActor } from "./backend";
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

// ── Loading Screen ──────────────────────────────────────────────────────────────

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

// ── Auth Gate ───────────────────────────────────────────────────────────────────
// Key fix: only block on identity initialization + actor creation.
// Profile / approval loading happens inside Login, not here.

function AuthGate({ children }: { children: React.ReactNode }) {
  const { identity, isInitializing } = useInternetIdentity();
  const { isFetching: actorLoading } = useActor(createActor);

  // Once we have an actor (anonymous or authenticated), fetch profile & admin
  const { data: profile, isLoading: profileLoading } = useCallerProfile();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: isApproved, isLoading: approvedLoading } = useIsApproved();

  // Timeout fallback: never stay in loading forever
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 8000);
    return () => clearTimeout(t);
  }, []);

  // Phase 1: Wait for identity system to initialize
  if (isInitializing && !timedOut) {
    return <LoadingScreen />;
  }

  // Phase 2: If not logged in, go straight to login (no need to wait for actor)
  if (!identity) {
    return <Login />;
  }

  // Phase 3: Identity exists — wait for actor + profile checks, but cap at timeout
  const profileChecksLoading =
    actorLoading || profileLoading || adminLoading || approvedLoading;
  if (profileChecksLoading && !timedOut) {
    return <LoadingScreen />;
  }

  // Phase 4: Profile missing → new user setup
  // Phase 5: Not approved → pending screen
  // Both handled in Login component
  if (!profile || (!isAdmin && !isApproved)) {
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
