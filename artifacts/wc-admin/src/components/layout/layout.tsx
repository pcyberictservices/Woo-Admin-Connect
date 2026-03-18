import React from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";

export function Layout({ children }: { children: React.ReactNode }) {
  const style = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full bg-background overflow-hidden relative">
        {/* Subtle background ambient light */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />
        
        <AppSidebar />
        
        <div className="flex flex-col flex-1 relative z-10">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border/50 bg-background/50 backdrop-blur-xl px-6 transition-all">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-8 w-8 text-muted-foreground hover:text-white" />
              <div className="h-4 w-px bg-border/50 mx-2" />
              <h1 className="text-sm font-medium text-muted-foreground">Admin Panel</h1>
            </div>
          </header>
          
          <main className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
            <div className="mx-auto w-full max-w-7xl">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
