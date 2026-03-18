import { useState, useRef } from "react";
import { useAppSettings } from "@/hooks/use-app-settings";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Store, Upload, Lock, Palette, Loader2, CheckCircle2, X, Trash2, RotateCcw, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

export default function Settings() {
  const { settings, updateSettings } = useAppSettings();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(settings.title);
  const [logoPreview, setLogoPreview] = useState<string | null>(settings.logo);
  const [brandingSaving, setBrandingSaving] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Logo must be under 2MB.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const saveBranding = async () => {
    setBrandingSaving(true);
    await updateSettings({ title: title.trim() || "Amabelle Foods Admin", logo: logoPreview });
    setBrandingSaving(false);
    toast({
      title: "Branding updated",
      description: "Changes saved and will appear on all devices.",
      className: "border-emerald-500/30 bg-emerald-950/80 text-emerald-100",
    });
  };

  const savePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast({ title: "Password too short", description: "Must be at least 6 characters.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    setPasswordSaving(true);
    try {
      const res = await fetch("/api/settings/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ newPassword }),
      });
      if (res.ok) {
        setNewPassword(""); setConfirmPassword("");
        toast({
          title: "Password updated",
          description: "Your admin password has been changed.",
          className: "border-emerald-500/30 bg-emerald-950/80 text-emerald-100",
        });
      } else {
        const data = await res.json();
        toast({ title: "Failed", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to update password", variant: "destructive" });
    } finally {
      setPasswordSaving(false);
    }
  };

  const clearCache = async () => {
    setClearingCache(true);
    try {
      queryClient.clear();
      const keys = Object.keys(localStorage);
      keys.forEach((k) => {
        if (!k.startsWith("wc_admin_settings")) localStorage.removeItem(k);
      });
      setTimeout(() => {
        setClearingCache(false);
        toast({
          title: "Cache cleared",
          description: "All cached data has been removed. Fresh data will load on next visit.",
          className: "border-emerald-500/30 bg-emerald-950/80 text-emerald-100",
        });
      }, 600);
    } catch {
      setClearingCache(false);
      toast({ title: "Could not clear cache", variant: "destructive" });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-8">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Settings</h2>
        <p className="text-muted-foreground text-sm mt-1">Customize your admin panel appearance and security.</p>
      </div>

      {/* Branding */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}>
        <Card className="bg-card/40 border-border/50 backdrop-blur-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                <Palette className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-sm">Branding</CardTitle>
                <CardDescription className="text-xs">Logo and title sync across all devices.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Logo */}
            <div className="space-y-2.5">
              <Label className="text-sm">App Logo</Label>
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-secondary/40 border border-border/50 overflow-hidden">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="h-full w-full object-cover" />
                  ) : (
                    <Store className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}
                    className="border-border/50 bg-secondary/20 h-8 text-xs gap-1.5">
                    <Upload className="h-3 w-3" /> Upload logo
                  </Button>
                  {logoPreview && (
                    <Button variant="ghost" size="sm" onClick={() => setLogoPreview(null)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 text-xs gap-1.5">
                      <X className="h-3 w-3" /> Remove
                    </Button>
                  )}
                  <p className="text-[10px] text-muted-foreground">PNG, JPG or SVG · max 2MB</p>
                </div>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </div>

            <Separator className="bg-border/50" />

            <div className="space-y-1.5">
              <Label htmlFor="app-title" className="text-sm">App Title</Label>
              <Input
                id="app-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Amabelle Foods Admin"
                className="bg-background/50 border-border/60 h-9"
              />
              <p className="text-[10px] text-muted-foreground">Displayed in sidebar, login page and browser tab.</p>
            </div>

            <Button onClick={saveBranding} disabled={brandingSaving} className="bg-primary h-8 text-sm">
              {brandingSaving ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Saving...</> : <><CheckCircle2 className="mr-2 h-3.5 w-3.5" /> Save branding</>}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Security */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <Card className="bg-card/40 border-border/50 backdrop-blur-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20">
                <Lock className="h-4 w-4 text-amber-400" />
              </div>
              <div>
                <CardTitle className="text-sm">Security</CardTitle>
                <CardDescription className="text-xs">Change your admin login password.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs text-amber-300/80">
              Logged in as: <span className="font-semibold text-amber-300">{user?.displayName || user?.username}</span>.
              Password change applies to fallback login; WordPress credentials are unchanged.
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-password" className="text-sm">New Password</Label>
              <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 6 characters" className="bg-background/50 border-border/60 h-9" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password" className="text-sm">Confirm Password</Label>
              <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password" className="bg-background/50 border-border/60 h-9" />
            </div>
            <Button onClick={savePassword} disabled={passwordSaving} variant="outline" className="border-border/50 bg-secondary/20 h-8 text-sm">
              {passwordSaving ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Saving...</> : <><Lock className="mr-2 h-3.5 w-3.5" /> Update password</>}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Cache */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
        <Card className="bg-card/40 border-border/50 backdrop-blur-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 border border-rose-500/20">
                <RotateCcw className="h-4 w-4 text-rose-400" />
              </div>
              <div>
                <CardTitle className="text-sm">Cache</CardTitle>
                <CardDescription className="text-xs">Clear locally stored order and stats data.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              If orders or stats look stale, clearing the cache forces a fresh reload of all data from the store.
            </p>
            <Button onClick={clearCache} disabled={clearingCache} variant="outline"
              className="border-rose-500/30 bg-rose-500/5 text-rose-400 hover:bg-rose-500/10 h-8 text-sm gap-1.5">
              {clearingCache ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Clearing...</> : <><Trash2 className="h-3.5 w-3.5" /> Clear cache</>}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* About */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
        <Card className="bg-card/40 border-border/50 backdrop-blur-xl">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground font-medium">{settings.title}</span>
              <span className="text-[10px] font-semibold text-primary/60 bg-primary/10 border border-primary/20 rounded-full px-2 py-0.5">v1.0.0</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              Made by{" "}
              <a href="https://pcyberict.com" target="_blank" rel="noreferrer" className="text-primary hover:text-primary/80 inline-flex items-center gap-0.5 transition-colors">
                Pcyber ICT Services <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
