import { useState, useRef } from "react";
import { useAppSettings } from "@/hooks/use-app-settings";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Store, Upload, Lock, Palette, Loader2, CheckCircle2, X } from "lucide-react";
import { motion } from "framer-motion";

export default function Settings() {
  const { settings, updateSettings } = useAppSettings();
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Branding state
  const [title, setTitle] = useState(settings.title);
  const [logoPreview, setLogoPreview] = useState<string | null>(settings.logo);
  const [brandingSaving, setBrandingSaving] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Logo must be under 2MB.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setLogoPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const saveBranding = () => {
    setBrandingSaving(true);
    updateSettings({ title: title.trim() || "Amabelle Foods Admin", logo: logoPreview });
    setTimeout(() => {
      setBrandingSaving(false);
      toast({
        title: "Branding updated",
        description: "Your app title and logo have been saved.",
        className: "border-emerald-500/30 bg-emerald-950/80 text-emerald-100",
      });
    }, 400);
  };

  const removeLogo = () => {
    setLogoPreview(null);
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
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
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

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-8">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Settings</h2>
        <p className="text-muted-foreground text-sm mt-1">Customize your admin panel appearance and security.</p>
      </div>

      {/* Branding */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card className="bg-card/40 border-border/50 backdrop-blur-xl">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                <Palette className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Branding</CardTitle>
                <CardDescription className="text-xs">Customize your app title and logo.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Logo */}
            <div className="space-y-3">
              <Label className="text-sm">App Logo</Label>
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-secondary/40 border border-border/50 overflow-hidden">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="h-full w-full object-cover" />
                  ) : (
                    <Store className="h-7 w-7 text-muted-foreground" />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="border-border/50 bg-secondary/20 h-8 text-xs gap-1.5"
                  >
                    <Upload className="h-3 w-3" />
                    Upload logo
                  </Button>
                  {logoPreview && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={removeLogo}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 text-xs gap-1.5"
                    >
                      <X className="h-3 w-3" />
                      Remove logo
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground">PNG, JPG or SVG · max 2MB</p>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
            </div>

            <Separator className="bg-border/50" />

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="app-title" className="text-sm">App Title</Label>
              <Input
                id="app-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Amabelle Foods Admin"
                className="bg-background/50 border-border/60 h-10"
              />
              <p className="text-xs text-muted-foreground">Shown in the sidebar header and browser tab.</p>
            </div>

            <Button onClick={saveBranding} disabled={brandingSaving} className="bg-primary h-9 text-sm">
              {brandingSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : <><CheckCircle2 className="mr-2 h-4 w-4" /> Save branding</>}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Security */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="bg-card/40 border-border/50 backdrop-blur-xl">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20">
                <Lock className="h-4 w-4 text-amber-400" />
              </div>
              <div>
                <CardTitle className="text-base">Security</CardTitle>
                <CardDescription className="text-xs">Change your admin login password.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs text-amber-300/80">
              Logged in as: <span className="font-semibold text-amber-300">{user?.displayName || user?.username}</span>.
              Password change applies to the fallback login. WordPress credentials are unchanged.
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-sm">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className="bg-background/50 border-border/60 h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-sm">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="bg-background/50 border-border/60 h-10"
              />
            </div>

            <Button onClick={savePassword} disabled={passwordSaving} variant="outline" className="border-border/50 bg-secondary/20 h-9 text-sm">
              {passwordSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : <><Lock className="mr-2 h-4 w-4" /> Update password</>}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* About */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card className="bg-card/40 border-border/50 backdrop-blur-xl">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Amabelle Foods Admin Panel</span>
              <span className="font-medium text-primary/60">v1.0.0</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Connected to <span className="text-white/60">amabellefoods.com</span> via WooCommerce REST API
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
