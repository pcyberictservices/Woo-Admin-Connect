import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

declare module "express-session" {
  interface SessionData {
    user?: { username: string; displayName: string };
  }
}

async function validateWordPressCredentials(username: string, password: string): Promise<{ valid: boolean; displayName: string }> {
  try {
    const res = await fetch("https://amabellefoods.com/wp-json/wp/v2/users/me", {
      headers: {
        Authorization: "Basic " + Buffer.from(`${username}:${password}`).toString("base64"),
      },
    });
    if (res.ok) {
      const user = await res.json() as { name?: string };
      return { valid: true, displayName: user.name || username };
    }
  } catch {
    // ignore
  }

  // fallback: env vars
  const envUser = process.env.ADMIN_USERNAME ?? "";
  const envPass = process.env.ADMIN_PASSWORD ?? "";
  if (envUser && envPass && username === envUser && password === envPass) {
    return { valid: true, displayName: username };
  }

  return { valid: false, displayName: "" };
}

router.post("/auth/login", async (req: Request, res: Response) => {
  const { username, password } = req.body as { username?: string; password?: string };
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  const result = await validateWordPressCredentials(username, password);
  if (!result.valid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  req.session.user = { username, displayName: result.displayName };
  req.session.save((err) => {
    if (err) return res.status(500).json({ error: "Session error" });
    res.json({ success: true, user: req.session.user });
  });
});

router.post("/auth/logout", (req: Request, res: Response) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ success: true });
  });
});

router.get("/auth/me", (req: Request, res: Response) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  res.json({ user: req.session.user });
});

export default router;
