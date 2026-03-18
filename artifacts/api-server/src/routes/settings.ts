import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

// In-memory store for custom password (resets on restart)
let customPassword: { username: string; password: string } | null = null;

export function getCustomPassword() {
  return customPassword;
}

router.post("/settings/password", (req: Request, res: Response) => {
  if (!req.session.user) return res.status(401).json({ error: "Not authenticated" });
  const { newPassword } = req.body as { newPassword?: string };
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }
  customPassword = { username: req.session.user.username, password: newPassword };
  res.json({ success: true });
});

export default router;
