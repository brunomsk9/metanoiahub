import { memo, useState, useEffect, useCallback } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Home,
  GraduationCap,
  BookMarked,
  Trophy,
  LifeBuoy,
  Settings,
  Users,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSidebarState } from "./AppShell";

// Cache for user roles
let cachedRoles: {
  isAdmin: boolean;
  isDiscipulador: boolean;
  isSuperAdmin: boolean;
  isLiderMinisterial: boolean;
  userId: string | null;
} = {
  isAdmin: false,
  isDiscipulador: false,
  isSuperAdmin: false,
  isLiderMinisterial: false,
  userId: null,
};

export const DesktopSidebar = memo(function DesktopSidebar() {
  const location = useLocation();
  const { isCollapsed, setIsCollapsed } = useSidebarState();
  const [isAdmin, setIsAdmin] = useState(cachedRoles.isAdmin);
  const [isDiscipulador, setIsDiscipulador] = useState(cachedRoles.isDiscipulador);
  const [isSuperAdmin, setIsSuperAdmin] = useState(cachedRoles.isSuperAdmin);
  const [isLiderMinisterial, setIsLiderMinisterial] = useState(cachedRoles.isLiderMinisterial);
  const [learningOpen, setLearningOpen] = useState(true);

  useEffect(() => {
    checkRoles();
  }, []);

  const checkRoles = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) {
      if (cachedRoles.userId === session.user.id) {
        setIsAdmin(cachedRoles.isAdmin);
        setIsDiscipulador(cachedRoles.isDiscipulador);
        setIsSuperAdmin(cachedRoles.isSuperAdmin);
        setIsLiderMinisterial(cachedRoles.isLiderMinisterial);
        return;
      }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      const userRoles = roles?.map((r) => r.role) || [];
      const admin = userRoles.includes("admin");
      const discipulador = userRoles.includes("discipulador");
      const superAdmin = userRoles.includes("super_admin");
      const liderMinisterial = userRoles.includes("lider_ministerial");

      cachedRoles = {
        isAdmin: admin,
        isDiscipulador: discipulador,
        isSuperAdmin: superAdmin,
        isLiderMinisterial: liderMinisterial,
        userId: session.user.id,
      };

      setIsAdmin(admin);
      setIsDiscipulador(discipulador);
      setIsSuperAdmin(superAdmin);
      setIsLiderMinisterial(liderMinisterial);
    }
  }, []);

  const learningItems = [
    { path: "/trilhas", label: "Trilhas", icon: GraduationCap },
    { path: "/biblioteca", label: "Biblioteca", icon: BookMarked },
    { path: "/conquistas", label: "Conquistas", icon: Trophy },
  ];

  if (isDiscipulador || isAdmin) {
    learningItems.push({ path: "/sos", label: "S.O.S.", icon: LifeBuoy });
  }

  const isLearningActive = learningItems.some(
    (item) => location.pathname === item.path
  );

  const NavItem = ({
    to,
    icon: Icon,
    label,
    active,
  }: {
    to: string;
    icon: any;
    label: string;
    active?: boolean;
  }) => {
    const content = (
      <NavLink
        to={to}
        className={cn(
          "flex items-center gap-3 rounded-xl text-sm font-medium transition-all",
          isCollapsed ? "px-2 py-2.5 justify-center" : "px-3 py-2.5",
          active
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        )}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        {!isCollapsed && <span>{label}</span>}
      </NavLink>
    );

    if (isCollapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "hidden md:flex fixed left-0 top-16 bottom-0 flex-col bg-card border-r border-border/50 transition-all duration-300",
          isCollapsed ? "w-16" : "w-56"
        )}
      >
        {/* Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-4 h-6 w-6 rounded-full border bg-background shadow-sm hover:bg-muted z-10"
        >
          {isCollapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </Button>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <NavItem
            to="/dashboard"
            icon={Home}
            label="Início"
            active={location.pathname === "/dashboard"}
          />

          {/* Learning Section */}
          {isCollapsed ? (
            // Collapsed: show just icons
            <>
              {learningItems.map((item) => (
                <NavItem
                  key={item.path}
                  to={item.path}
                  icon={item.icon}
                  label={item.label}
                  active={location.pathname === item.path}
                />
              ))}
            </>
          ) : (
            // Expanded: show collapsible group
            <Collapsible open={learningOpen} onOpenChange={setLearningOpen}>
              <CollapsibleTrigger
                className={cn(
                  "flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  isLearningActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <div className="flex items-center gap-3">
                  <GraduationCap className="w-5 h-5" />
                  <span>Aprendizado</span>
                </div>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 transition-transform",
                    learningOpen && "rotate-180"
                  )}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-6 mt-1 space-y-1">
                {learningItems.map((item) => (
                  <NavItem
                    key={item.path}
                    to={item.path}
                    icon={item.icon}
                    label={item.label}
                    active={location.pathname === item.path}
                  />
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Escalas */}
          <NavItem
            to={isAdmin || isLiderMinisterial ? "/admin?section=escalas" : "/minhas-escalas"}
            icon={Calendar}
            label="Escalas"
            active={location.pathname === "/minhas-escalas" || (location.pathname === "/admin" && location.search.includes("escalas"))}
          />

          {/* Admin Section */}
          {(isAdmin || isDiscipulador || isLiderMinisterial) && (
            <div className={cn("pt-4 mt-4 border-t border-border/50", isCollapsed && "pt-2 mt-2")}>
              {!isCollapsed && (
                <p className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Gestão
                </p>
              )}

              {(isAdmin || isDiscipulador) && (
                <NavItem
                  to="/admin?section=recursos"
                  icon={FolderOpen}
                  label="Recursos"
                  active={
                    location.pathname === "/admin" &&
                    location.search.includes("recursos")
                  }
                />
              )}

              {isDiscipulador && (
                <NavItem
                  to="/admin"
                  icon={Users}
                  label="Discipulado"
                  active={
                    location.pathname === "/admin" &&
                    !location.search.includes("recursos") &&
                    !location.search.includes("escalas")
                  }
                />
              )}

              {isAdmin && (
                <NavItem
                  to="/admin"
                  icon={Settings}
                  label="Painel Admin"
                  active={
                    location.pathname === "/admin" &&
                    !location.search.includes("recursos") &&
                    !location.search.includes("escalas")
                  }
                />
              )}

              {isSuperAdmin && (
                <NavItem
                  to="/super-admin"
                  icon={ShieldAlert}
                  label="Super Admin"
                  active={location.pathname === "/super-admin"}
                />
              )}
            </div>
          )}
        </nav>
      </aside>
    </TooltipProvider>
  );
});
