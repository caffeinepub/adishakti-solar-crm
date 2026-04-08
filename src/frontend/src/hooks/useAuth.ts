import { createActorWithConfig } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import type { UserProfile, UserRole } from "../backend";
import { createActor } from "../backend";

const TOKEN_KEY = "crm_session_token";
const USER_KEY = "crm_user_id";
const ROLE_KEY = "crm_user_role";
// Max ms to wait for actor before giving up and showing login
const AUTH_TIMEOUT_MS = 5000;

export interface AuthState {
  sessionToken: string | null;
  userId: string | null;
  userRole: UserRole | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (username: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  setProfile: (profile: UserProfile) => void;
}

// Safe actor hook that bypasses useInternetIdentity entirely.
// useActor() from @caffeineai/core-infrastructure calls useInternetIdentity()
// which throws synchronously when InternetIdentityProvider is absent.
// This custom hook calls createActorWithConfig directly with React Query.
function useSafeActor() {
  const actorQuery = useQuery({
    queryKey: ["crm_actor"],
    queryFn: async () => {
      try {
        // createActorWithConfig throws when env.json has "undefined" canisterId
        // and no CANISTER_ID_BACKEND env var is set. We catch it and return null.
        const actor = await createActorWithConfig(createActor);
        return actor ?? null;
      } catch (err) {
        console.warn("Actor init failed (no canister ID configured):", err);
        // Return null so the app shows Login instead of crashing
        return null;
      }
    },
    staleTime: Number.POSITIVE_INFINITY,
    retry: false, // Don't retry — invalid canister ID won't fix itself
  });

  return {
    actor: actorQuery.data ?? null,
    isFetching: actorQuery.isFetching,
  };
}

export function useAuth(): AuthState {
  // Use safe actor hook that never throws synchronously
  const { actor, isFetching } = useSafeActor();

  const [sessionToken, setSessionToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_KEY),
  );
  const [userId, setUserId] = useState<string | null>(() =>
    localStorage.getItem(USER_KEY),
  );
  const [userRole, setUserRole] = useState<UserRole | null>(() => {
    const r = localStorage.getItem(ROLE_KEY);
    return r ? (r as UserRole) : null;
  });
  const [profile, setProfileState] = useState<UserProfile | null>(null);

  // Start loading only if we have a saved token (otherwise show login immediately)
  const [isLoading, setIsLoading] = useState(!!localStorage.getItem(TOKEN_KEY));
  const timedOutRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const profileLoadedRef = useRef(false);

  // Safety timeout — fires ONCE on mount, never resets (empty deps []).
  // Guarantees isLoading becomes false within AUTH_TIMEOUT_MS regardless of actor state.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (timedOutRef.current) return;
    timeoutRef.current = setTimeout(() => {
      timedOutRef.current = true;
      setIsLoading(false);
    }, AUTH_TIMEOUT_MS);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Load profile once actor is ready and we have a token
  useEffect(() => {
    // No token — clear loading and go to login
    if (!sessionToken) {
      setIsLoading(false);
      return;
    }

    // Actor not ready yet — wait for it (timeout fires eventually)
    if (!actor || isFetching) {
      return;
    }

    // Already loaded profile for this session — skip
    if (profileLoadedRef.current) {
      return;
    }

    // Cancel safety timeout — actor arrived in time
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    actor
      .getMyProfile(sessionToken)
      .then((res) => {
        if (res.__kind__ === "ok") {
          profileLoadedRef.current = true;
          setProfileState(res.ok);
          setUserRole(res.ok.role);
          localStorage.setItem(ROLE_KEY, res.ok.role);
        } else {
          // Invalid/expired token — clear session and show login
          profileLoadedRef.current = false;
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          localStorage.removeItem(ROLE_KEY);
          setSessionToken(null);
          setUserId(null);
          setUserRole(null);
          setProfileState(null);
        }
      })
      .catch(() => {
        // Backend/network error — stop loading, let user retry
      })
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionToken, actor, isFetching]);

  const login = useCallback(
    async (username: string, password: string): Promise<string | null> => {
      if (!actor) {
        return "Not connected to backend. Please wait a moment and try again.";
      }
      try {
        const res = await actor.login(username, password);
        if (res.__kind__ === "err") {
          return res.err;
        }
        const token = res.ok;
        profileLoadedRef.current = false;
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, username);
        setSessionToken(token);
        setUserId(username);
        return null; // null = success
      } catch {
        return "Connection error. Please try again.";
      }
    },
    [actor],
  );

  const logout = useCallback(async () => {
    if (actor && sessionToken) {
      try {
        await actor.logout(sessionToken);
      } catch {
        // ignore
      }
    }
    profileLoadedRef.current = false;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(ROLE_KEY);
    setSessionToken(null);
    setUserId(null);
    setUserRole(null);
    setProfileState(null);
  }, [actor, sessionToken]);

  const setProfile = useCallback((p: UserProfile) => {
    setProfileState(p);
    setUserRole(p.role);
    localStorage.setItem(ROLE_KEY, p.role);
  }, []);

  return {
    sessionToken,
    userId,
    userRole,
    profile,
    isLoading,
    isLoggedIn: !!sessionToken && !!profile,
    login,
    logout,
    setProfile,
  };
}
