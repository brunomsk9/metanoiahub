import { memo, useState } from "react";
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
  User,
  Network,
  CalendarDays,
  Sparkles,
  ClipboardCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
import { useUserRoles } from "@/hooks/useUserRoles";

export const DesktopSidebar = memo(function DesktopSidebar() {
  const location = useLocation();
  const { isCollapsed, setIsCollapsed } = useSidebarState();
  const [learningOpen, setLearningOpen] = useState(true);
  const [ministryOpen, setMinistryOpen] = useState(true);
  
  const { isAdmin, isDiscipulador, isSuperAdmin, isLiderMinisterial } = useUserRoles();

  // Learning items
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

  // Ministry items - for those with ministry-related roles
  const showMinistrySection = isAdmin || isLiderMinisterial;
  const ministryItems = [
    { 
      path: "/ministerio?tab=escalas", 
      label: "Escalas", 
      icon: CalendarDays,
      active: location.pathname === "/ministerio" && (!location.search || location.search.includes("escalas"))
    },
    { 
      path: "/ministerio?tab=rede", 
      label: "Rede Ministerial", 
      icon: Network,
      active: location.pathname === "/ministerio" && location.search.includes("rede")
    },
    { 
      path: "/ministerio?tab=checklist", 
      label: "Checklist do Culto", 
      icon: ClipboardCheck,
      active: location.pathname === "/ministerio" && location.search.includes("checklist")
    },
  ];

  const isMinistryActive = location.pathname === "/ministerio";

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
          "flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200",
          isCollapsed ? "px-3 py-3 justify-center" : "px-4 py-3",
          active
            ? "bg-primary/10 text-primary shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary"
        )}
      >
        <Icon className={cn("w-5 h-5 flex-shrink-0", active && "text-primary")} />
        {!isCollapsed && <span>{label}</span>}
      </NavLink>
    );

    if (isCollapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">{label}</TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  const SectionHeader = ({ label }: { label: string }) => {
    if (isCollapsed) return null;
    return (
      <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {label}
      </p>
    );
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "hidden md:flex fixed left-0 top-16 bottom-0 flex-col bg-card/50 border-r border-border/50 transition-all duration-300 backdrop-blur-sm",
          isCollapsed ? "w-16" : "w-60"
        )}
      >
        {/* Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-6 h-6 w-6 rounded-full border border-border bg-card shadow-sm hover:bg-primary/10 hover:text-primary hover:border-primary/30 z-10 transition-all"
        >
          {isCollapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </Button>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
          {/* Home */}
          <NavItem
            to="/dashboard"
            icon={Home}
            label="Início"
            active={location.pathname === "/dashboard"}
          />

          {/* Learning Section */}
          {isCollapsed ? (
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
            <Collapsible open={learningOpen} onOpenChange={setLearningOpen}>
              <CollapsibleTrigger
                className={cn(
                  "flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                  isLearningActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <div className="flex items-center gap-3">
                  <Sparkles className={cn("w-5 h-5", isLearningActive && "text-primary")} />
                  <span>Aprendizado</span>
                </div>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 transition-transform duration-200",
                    learningOpen && "rotate-180"
                  )}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-4 mt-1 space-y-1">
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

          {/* Ministry Section - for leaders */}
          {showMinistrySection && (
            <>
              {isCollapsed ? (
                <>
                  {ministryItems.map((item) => (
                    <NavItem
                      key={item.path}
                      to={item.path}
                      icon={item.icon}
                      label={item.label}
                      active={item.active}
                    />
                  ))}
                </>
              ) : (
                <Collapsible open={ministryOpen} onOpenChange={setMinistryOpen}>
                  <CollapsibleTrigger
                    className={cn(
                      "flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                      isMinistryActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Network className={cn("w-5 h-5", isMinistryActive && "text-primary")} />
                      <span>Ministério</span>
                    </div>
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 transition-transform duration-200",
                        ministryOpen && "rotate-180"
                      )}
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-4 mt-1 space-y-1">
                    {ministryItems.map((item) => (
                      <NavItem
                        key={item.path}
                        to={item.path}
                        icon={item.icon}
                        label={item.label}
                        active={item.active}
                      />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}
            </>
          )}

          {/* Escalas for regular volunteers */}
          {!showMinistrySection && (
            <NavItem
              to="/minhas-escalas"
              icon={Calendar}
              label="Minhas Escalas"
              active={location.pathname === "/minhas-escalas"}
            />
          )}

          {/* Discipulado for discipuladores */}
          {(isDiscipulador || isAdmin) && (
            <NavItem
              to="/discipulado"
              icon={Users}
              label="Discipulado"
              active={location.pathname === "/discipulado"}
            />
          )}

          {/* Perfil */}
          <NavItem
            to="/perfil"
            icon={User}
            label="Meu Perfil"
            active={location.pathname === "/perfil"}
          />

          {/* Admin Section */}
          {(isAdmin || isDiscipulador || isSuperAdmin) && (
            <div className={cn("pt-4 mt-4 border-t border-border/30", isCollapsed && "pt-3 mt-3")}>
              <SectionHeader label="Gestão" />

              {(isAdmin || isDiscipulador || isLiderMinisterial) && (
                <NavItem
                  to="/recursos"
                  icon={FolderOpen}
                  label="Recursos"
                  active={location.pathname === "/recursos"}
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
                    !location.search.includes("escalas") &&
                    !location.search.includes("ministerios")
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