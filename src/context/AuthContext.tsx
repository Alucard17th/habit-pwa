// src/context/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  login as apiLogin,
  me,
  updateProfile as apiUpdateProfile,
} from "../lib/api";
import { useOnline } from "../hooks/useOnline";

export type User = {
  id: number;
  name: string;
  email: string;
  is_premium: boolean;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  online: boolean;
  refreshUser: () => Promise<void>;
  saveProfile: (payload: { name: string; email: string }) => Promise<void>;
};

const AuthCtx = createContext<AuthContextType>({
  user: null,
  token: null,
  login: async () => {},
  logout: () => {},
  loading: true,
  online: true,
  refreshUser: async () => {},
  saveProfile: async () => {},
});

export const useAuth = () => {
  const ctx = useContext(AuthCtx);
  if (!ctx) {
    throw new Error("useAuth must be used within <AuthProvider>");
  }
  return ctx;
};

const TOKEN_KEY = "token";
const USER_KEY = "user";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const online = useOnline();
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem(USER_KEY);
    try {
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Attach token globally (if you’re using fetch/axios, adjust accordingly)
  const attachToken = useCallback((t: string | null) => {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
    setToken(t);
  }, []);

  // Persist user whenever it changes
  useEffect(() => {
    try {
      if (user) {
        const str = JSON.stringify(user);
        localStorage.setItem(USER_KEY, str);
        console.debug("[Auth] Saved user to localStorage:", {
          len: str.length,
        });
      } else {
        localStorage.removeItem(USER_KEY);
        console.debug("[Auth] Cleared user from localStorage");
      }
    } catch (e) {
      console.error("[Auth] Failed to persist user to localStorage", e, {
        user,
      });
    }
  }, [user]);

  // 👇 add these here
  console.log("[Auth] render", { user }); // runs every render

  useEffect(() => {
    console.log("[Auth] mounted"); // runs once on mount
  }, []);

  // Restore / revalidate session
  useEffect(() => {
    let cancelled = false;

    const restore = async () => {
      // If no token → definitely logged out
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      // If offline but we have a token (and maybe cached user), trust cache for now
      if (!online) {
        setLoading(false);
        return;
      }

      // Online: try to fetch /me
      try {
        const u = await me();
        if (!cancelled) setUser(u);
      } catch (err: any) {
        // Only clear token on an actual 401 from server
        if (err?.status === 401) {
          attachToken(null);
          setUser(null);
        } else {
          // Network/other errors: keep cached user so the app works offline
          console.debug(
            "[Auth] /me failed but keeping cached session (likely offline).",
            err
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    restore();
    return () => {
      cancelled = true;
    };
  }, [token, online, attachToken]);

  const login = async (email: string, password: string) => {
    const { token: newToken } = await apiLogin({ email, password });
    attachToken(newToken);
    const u = await me();
    setUser(u);
  };

  const logout = () => {
    attachToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const u = await me();
      setUser(u);
    } catch (err) {
      console.error("[Auth] refreshUser failed", err);
    }
  };

  // Optionally expose an updater that syncs context after saving
  const saveProfile = async (payload: { name: string; email: string }) => {
    await apiUpdateProfile(payload);
    await refreshUser();
  };

  return (
    <AuthCtx.Provider
      value={{
        user,
        token,
        login,
        logout,
        loading,
        online,
        refreshUser,
        saveProfile,
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
};
