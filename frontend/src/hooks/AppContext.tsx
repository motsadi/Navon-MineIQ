import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { AlertStatus, Role } from "@/types";

interface AppState {
  role: Role | null;
  setRole: (role: Role | null) => void;
  alertOverrides: Record<string, AlertStatus>;
  setAlertStatus: (id: string, status: AlertStatus) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

const ROLE_KEY = "navon.role";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<Role | null>(() => {
    const stored = localStorage.getItem(ROLE_KEY);
    return (stored as Role) || null;
  });
  const [alertOverrides, setAlertOverrides] = useState<Record<string, AlertStatus>>({});

  const setRole = useCallback((r: Role | null) => {
    setRoleState(r);
    if (r) localStorage.setItem(ROLE_KEY, r);
    else localStorage.removeItem(ROLE_KEY);
  }, []);

  const setAlertStatus = useCallback((id: string, status: AlertStatus) => {
    setAlertOverrides((prev) => ({ ...prev, [id]: status }));
  }, []);

  useEffect(() => {
    document.title = "Navon MineIQ";
  }, []);

  const value = useMemo(
    () => ({ role, setRole, alertOverrides, setAlertStatus }),
    [role, setRole, alertOverrides, setAlertStatus],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
