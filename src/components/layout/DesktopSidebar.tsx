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
  LogOut,
  ChevronDown,
  ShieldAlert,
  UserCircle,
  FolderOpen,
  Church,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import metanoiaLogo from "@/assets/metanoia-hub-logo.png";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useChurch } from "@/contexts/ChurchContext";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface DesktopSidebarProps {
  onLogout?: () => void;
  userName?: string;
}

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

export const DesktopSidebar = memo(function DesktopSidebar({
  onLogout,
  userName,
}: DesktopSidebarProps) {
  const location = useLocation();
  const { church } = useChurch();
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
  }) => (
    <NavLink
      to={to}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
      )}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </NavLink>
  );

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 flex-col bg-card border-r border-border/50">
      {/* Logo */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <img
            src={metanoiaLogo}
            alt="Metanoia Hub"
            className="w-10 h-10 object-contain"
          />
          <div>
            <span className="font-display font-semibold text-foreground text-base tracking-tight">
              Metanoia Hub
            </span>
            {church && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <Church className="w-3 h-3 text-primary" />
                <span className="text-xs font-medium text-primary">
                  {church.nome}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <NavItem
          to="/dashboard"
          icon={Home}
          label="Início"
          active={location.pathname === "/dashboard"}
        />

        {/* Learning Section */}
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

        {/* Escalas */}
        <NavItem
          to={isAdmin || isLiderMinisterial ? "/admin?section=escalas" : "/minhas-escalas"}
          icon={Calendar}
          label="Escalas"
          active={location.pathname === "/minhas-escalas" || (location.pathname === "/admin" && location.search.includes("escalas"))}
        />

        {/* Admin Section */}
        {(isAdmin || isDiscipulador || isLiderMinisterial) && (
          <div className="pt-4 mt-4 border-t border-border/50">
            <p className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Gestão
            </p>

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

      {/* User Section */}
      <div className="p-3 border-t border-border/50">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
            {userName?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {userName || "Usuário"}
            </p>
            <NavLink
              to="/perfil"
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Ver perfil
            </NavLink>
          </div>
          <ThemeToggle />
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onLogout}
          className="w-full mt-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </Button>
      </div>
    </aside>
  );
});
