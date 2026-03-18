import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export interface AppSettings {
  title: string;
  logo: string | null;
}

interface AppSettingsContextType {
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const STORAGE_KEY = "wc_admin_settings";
const defaults: AppSettings = { title: "Amabelle Foods Admin", logo: null };

const AppSettingsContext = createContext<AppSettingsContextType | null>(null);

// Standalone fetch — used by login page outside provider
export async function fetchPublicSettings(): Promise<AppSettings> {
  try {
    const res = await fetch("/api/settings");
    if (res.ok) return await res.json();
  } catch {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaults, ...JSON.parse(raw) };
  } catch {}
  return { ...defaults };
}

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return { ...defaults, ...JSON.parse(raw) };
    } catch {}
    return defaults;
  });

  const applySettings = (s: AppSettings) => {
    setSettings(s);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
  };

  const refreshSettings = useCallback(async () => {
    const s = await fetchPublicSettings();
    applySettings(s);
  }, []);

  // Hydrate from server on mount
  useEffect(() => { refreshSettings(); }, []);

  useEffect(() => {
    document.title = settings.title;
  }, [settings.title]);

  const updateSettings = async (partial: Partial<AppSettings>) => {
    const next = { ...settings, ...partial };
    applySettings(next);
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(next),
      });
    } catch {}
  };

  return (
    <AppSettingsContext.Provider value={{ settings, updateSettings, refreshSettings }}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  const ctx = useContext(AppSettingsContext);
  if (!ctx) throw new Error("useAppSettings must be used inside AppSettingsProvider");
  return ctx;
}
