import { useActor } from "@caffeineai/core-infrastructure";
import { useCallback, useEffect, useState } from "react";
import type { UserProfile, UserRole } from "../backend";
import { createActor } from "../backend";

const TOKEN_KEY = "crm_session_token";
const USER_KEY = "crm_user_id";
const ROLE_KEY = "crm_user_role";

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

export function useAuth(): AuthState {
  const { actor } = useActor(createActor);
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
  const [isLoading, setIsLoading] = useState(!!localStorage.getItem(TOKEN_KEY));

  // On mount (or token change), load profile from backend
  useEffect(() => {
    if (!sessionToken || !actor) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    actor
      .getMyProfile(sessionToken)
      .then((res) => {
        if (res.__kind__ === "ok") {
          setProfileState(res.ok);
          setUserRole(res.ok.role);
          localStorage.setItem(ROLE_KEY, res.ok.role);
        } else {
          // Invalid token — clear
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
        // Network error — keep token, don't clear
      })
      .finally(() => setIsLoading(false));
  }, [sessionToken, actor]);

  const login = useCallback(
    async (username: string, password: string): Promise<string | null> => {
      if (!actor) return "Not connected to backend";
      const res = await actor.login(username, password);
      if (res.__kind__ === "err") {
        return res.err;
      }
      const token = res.ok;
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, username);
      setSessionToken(token);
      setUserId(username);
      return null; // null = success
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
