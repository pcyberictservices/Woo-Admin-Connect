import React from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { NotificationBell } from "./notification-bell";
import { useOrderNotifications } from "@/hooks/use-order-notifications";
import { useAuth } from "@/hooks/use-auth";
import { useAppSettings } from "@/hooks/use-app-settings";
import { useTheme } from "@/hooks/use-theme";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { settings } = useAppSettings();
  const { notifications, dismiss, dismissAll } = useOrderNotifications(!!user);
  const { theme, toggleTheme } = useTheme();

  const style = {
    "--sidebar-width": "17rem",
    "--sidebar-width-icon": "3.5rem",
  };

  return (
    <SidebarProvider defaultOpen style={style as React.CSSProperties}>
      <div className="flex h-screen w-full bg-background overflow-hidden relative">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />

        <AppSidebar />

        <div className="flex flex-col flex-1 min-w-0 relative z-10">
          {/* Header */}
          <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border/50 bg-background/50 backdrop-blur-xl px-3 sm:px-5">
            <div className="flex items-center gap-2 min-w-0">
              <SidebarTrigger className="h-8 w-8 shrink-0 text-muted-foreground hover:text-white" />
              <div className="h-4 w-px bg-border/50 mx-1 shrink-0" />
              <span className="text-sm font-medium text-muted-foreground truncate hidden xs:block">
                {settings.title}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {/* Dark/Light mode toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
              <NotificationBell
                notifications={notifications}
                onDismiss={dismiss}
                onDismissAll={dismissAll}
              />
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6">
            <div className="mx-auto w-full max-w-7xl">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
