import { Router, type IRouter, type Request, type Response } from "express";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const router: IRouter = Router();

const DATA_DIR = join(process.cwd(), ".admin-data");
const SETTINGS_FILE = join(DATA_DIR, "settings.json");

interface AdminSettings {
  title: string;
  logo: string | null;
}

const defaultSettings: AdminSettings = { title: "Amabelle Foods Admin", logo: null };

function loadSettings(): AdminSettings {
  try {
    if (existsSync(SETTINGS_FILE)) {
      return { ...defaultSettings, ...JSON.parse(readFileSync(SETTINGS_FILE, "utf-8")) };
    }
  } catch {}
  return { ...defaultSettings };
}

function saveSettings(s: AdminSettings) {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(SETTINGS_FILE, JSON.stringify(s), "utf-8");
  } catch (e) {
    console.error("Failed to save settings:", e);
  }
}

// In-memory password store (resets on restart; fallback only)
let customPassword: string | null = null;
export function getCustomPassword() { return customPassword; }

// GET /api/settings — public, used by login page too
router.get("/settings", (_req: Request, res: Response) => {
  res.json(loadSettings());
});

// POST /api/settings — save branding (auth required)
router.post("/settings", (req: Request, res: Response) => {
  if (!req.session.user) return res.status(401).json({ error: "Not authenticated" });
  const { title, logo } = req.body as Partial<AdminSettings>;
  const current = loadSettings();
  const next: AdminSettings = {
    title: (typeof title === "string" && title.trim()) ? title.trim() : current.title,
    logo: logo !== undefined ? logo : current.logo,
  };
  saveSettings(next);
  res.json({ success: true, settings: next });
});

// POST /api/settings/password
router.post("/settings/password", (req: Request, res: Response) => {
  if (!req.session.user) return res.status(401).json({ error: "Not authenticated" });
  const { newPassword } = req.body as { newPassword?: string };
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }
  customPassword = newPassword;
  res.json({ success: true });
});

export default router;
