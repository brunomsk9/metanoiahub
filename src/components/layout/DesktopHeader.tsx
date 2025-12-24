import { useLocation } from "react-router-dom";
import { 
  Home, 
  GraduationCap, 
  BookMarked, 
  Trophy, 
  LifeBuoy, 
  Calendar, 
  Settings, 
  ShieldAlert,
  UserCircle,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const routeConfig: Record<string, { label: string; icon: any; parent?: string }> = {
  "/dashboard": { label: "Início", icon: Home },
  "/trilhas": { label: "Trilhas", icon: GraduationCap, parent: "/dashboard" },
  "/biblioteca": { label: "Biblioteca", icon: BookMarked, parent: "/dashboard" },
  "/conquistas": { label: "Conquistas", icon: Trophy, parent: "/dashboard" },
  "/sos": { label: "S.O.S.", icon: LifeBuoy, parent: "/dashboard" },
  "/minhas-escalas": { label: "Minhas Escalas", icon: Calendar, parent: "/dashboard" },
  "/admin": { label: "Painel Admin", icon: Settings, parent: "/dashboard" },
  "/super-admin": { label: "Super Admin", icon: ShieldAlert, parent: "/dashboard" },
  "/perfil": { label: "Perfil", icon: UserCircle, parent: "/dashboard" },
};

interface DesktopHeaderProps {
  title?: string;
}

export function DesktopHeader({ title }: DesktopHeaderProps) {
  const location = useLocation();
  const pathname = location.pathname;
  
  // Get current route config or use dynamic title
  const currentRoute = routeConfig[pathname];
  const pageTitle = title || currentRoute?.label || "Página";
  const PageIcon = currentRoute?.icon || Home;
  
  // Build breadcrumb trail
  const breadcrumbs: { label: string; path: string }[] = [];
  
  if (currentRoute?.parent) {
    const parentRoute = routeConfig[currentRoute.parent];
    if (parentRoute) {
      breadcrumbs.push({ label: parentRoute.label, path: currentRoute.parent });
    }
  }
  breadcrumbs.push({ label: pageTitle, path: pathname });

  return (
    <header className="hidden lg:flex fixed top-0 left-0 right-64 h-16 bg-background/95 backdrop-blur-sm border-b border-border/50 z-40">
      <div className="flex items-center justify-between w-full px-6">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2">
          <PageIcon className="w-5 h-5 text-primary" />
          <nav className="flex items-center gap-1 text-sm">
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.path} className="flex items-center gap-1">
                {index > 0 && (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
                <span
                  className={cn(
                    index === breadcrumbs.length - 1
                      ? "font-semibold text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {crumb.label}
                </span>
              </div>
            ))}
          </nav>
        </div>
        
        {/* Optional: Add actions here */}
        <div className="flex items-center gap-2">
          {/* Future: notifications, quick actions */}
        </div>
      </div>
    </header>
  );
}
