import { LayoutDashboard, ShoppingCart, Store, LogOut, ExternalLink, Settings, BarChart3 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useAppSettings } from "@/hooks/use-app-settings";
import { useSidebar } from "@/components/ui/sidebar";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const mainNavItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Orders", url: "/orders", icon: ShoppingCart },
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Settings", url: "/settings", icon: Settings },
];

function NavItem({ item, isActive }: { item: typeof mainNavItems[0]; isActive: boolean }) {
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        className={`mb-0.5 transition-all duration-150 rounded-lg h-10 ${
          isActive
            ? "bg-primary/10 text-primary font-semibold"
            : "text-muted-foreground hover:bg-white/5 hover:text-white"
        }`}
      >
        <Link
          href={item.url}
          className="flex items-center gap-3 px-3"
          onClick={() => { if (isMobile) setOpenMobile(false); }}
        >
          <item.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : ""}`} />
          <span className="text-sm">{item.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { settings } = useAppSettings();
  const { isMobile, setOpenMobile } = useSidebar();

  const titleWords = settings.title.split(" ");
  const lastName = titleWords.length > 1 ? titleWords.pop()! : "";
  const firstName = titleWords.join(" ") || "Admin";

  return (
    <Sidebar className="border-r border-border/50 bg-background/50 backdrop-blur-xl">
      <SidebarHeader className="p-4 pb-3">
        <div className="flex items-center gap-3 px-1">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20 overflow-hidden">
            {settings.logo ? (
              <img src={settings.logo} alt="logo" className="h-full w-full object-cover" />
            ) : (
              <Store className="h-5 w-5 text-white" />
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold tracking-tight text-white leading-none truncate">
              {firstName} {lastName}
            </h2>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Admin Panel</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 mt-1">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 px-2">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <NavItem
                  key={item.title}
                  item={item}
                  isActive={item.url === "/" ? location === "/" : location.startsWith(item.url)}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 px-2">
            External
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="text-muted-foreground hover:bg-white/5 hover:text-white rounded-lg h-10">
                  <a href="https://amabellefoods.com/shop/" target="_blank" rel="noreferrer"
                    className="flex items-center gap-3 px-3"
                    onClick={() => { if (isMobile) setOpenMobile(false); }}>
                    <ExternalLink className="h-4 w-4 shrink-0" />
                    <span className="text-sm">View Store</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="text-muted-foreground hover:bg-white/5 hover:text-white rounded-lg h-10">
                  <a href="https://amabellefoods.com/wp-admin" target="_blank" rel="noreferrer"
                    className="flex items-center gap-3 px-3"
                    onClick={() => { if (isMobile) setOpenMobile(false); }}>
                    <Store className="h-4 w-4 shrink-0" />
                    <span className="text-sm">WP Admin</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-border/50">
        {user && (
          <div className="flex items-center gap-2.5 px-1 py-1">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-sm">
              {(user.displayName || user.username).charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.displayName || user.username}</p>
              <p className="text-xs text-muted-foreground">Administrator</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              title="Logout"
              className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
