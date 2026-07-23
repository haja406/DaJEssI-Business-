import * as React from "react";
import { api, ApiError } from "@/lib/api";

export type UserRole = "ADMINISTRATOR" | "EMPLOYEE";

export interface AuthUser {
  id: string;
  fullName: string;
  username: string;
  role: UserRole;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  error: string | null;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(() => {
    const raw = localStorage.getItem("dajessi_user");
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function verify() {
      const token = localStorage.getItem("dajessi_token");
      if (!token) { setLoading(false); return; }
      try {
        const me = await api.get<AuthUser>("/auth/me");
        setUser(me);
        localStorage.setItem("dajessi_user", JSON.stringify(me));
      } catch {
        localStorage.removeItem("dajessi_token");
        localStorage.removeItem("dajessi_user");
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    verify();
  }, []);

  async function login(username: string, password: string) {
    setError(null);
    try {
      const res = await api.post<{ token: string; user: AuthUser }>("/auth/login", { username, password });
      localStorage.setItem("dajessi_token", res.token);
      localStorage.setItem("dajessi_user", JSON.stringify(res.user));
      setUser(res.user);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Connexion impossible.");
      throw err;
    }
  }

  function logout() {
    localStorage.removeItem("dajessi_token");
    localStorage.removeItem("dajessi_user");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function canDelete(role: UserRole | undefined | null): boolean {
  return role === "ADMINISTRATOR";
}
export function canEditSettings(role: UserRole | undefined | null): boolean {
  return role === "ADMINISTRATOR";
}
export const ROLE_LABELS: Record<UserRole, string> = {
  ADMINISTRATOR: "Administrateur",
  EMPLOYEE: "Employé",
};
