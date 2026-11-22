import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { storage } from "./storage";
import { ApiError, api, setToken } from "./api";
import type { User } from "./types";

type Ctx = {
  user: User | null;
  loading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  register: (full_name: string, phone: string, password: string, email?: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<Ctx>(null as unknown as Ctx);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const start = async (access_token: string) => {
    setToken(access_token);
    await storage.setItem("token", access_token);
    const me = await api<User>("/auth/me");
    setUser(me);
  };

  useEffect(() => {
    (async () => {
      try {
        const t = await storage.getItem("token");
        if (t) {
          setToken(t);
          const me = await api<User>("/auth/me");
          setUser(me);
        }
      } catch (e) {
        setToken(null);
        if (e instanceof ApiError && e.status === 401) {
          await storage.deleteItem("token");
        } else {
          console.warn("Failed to restore session:", e);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const value: Ctx = {
    user,
    loading,
    login: async (phone, password) => {
      const res = await api<{ access_token: string }>("/auth/login", { body: { phone, password } });
      await start(res.access_token);
    },
    register: async (full_name, phone, password, email) => {
      const res = await api<{ access_token: string }>("/auth/register", {
        body: { full_name, phone, password, email: email || null },
      });
      await start(res.access_token);
    },
    logout: async () => {
      setToken(null);
      await storage.deleteItem("token");
      setUser(null);
    },
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
