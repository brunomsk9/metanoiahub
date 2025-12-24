import { NavLink, useLocation } from "react-router-dom";
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
  LogOut,
  Church,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { memo, useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import metanoiaLogo from "@/assets/metanoia-hub-logo.png";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useChurch } from "@/contexts/ChurchContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DesktopHeaderProps {
  title?: string;
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

export const DesktopHeader = memo(function DesktopHeader({ 
  title, 
  onLogout, 
  userName 
}: DesktopHeaderProps) {
  const location = useLocation();
  const { church } = useChurch();
  const [isAdmin, setIsAdmin] = useState(cachedRoles.isAdmin);
  const [isDiscipulador, setIsDiscipulador] = useState(cachedRoles.isDiscipulador);
  const [isSuperAdmin, setIsSuperAdmin] = useState(cachedRoles.isSuperAdmin);
  const [isLiderMinisterial, setIsLiderMinisterial] = useState(cachedRoles.isLiderMinisterial);

  useEffect(() => {
    checkRoles();
  }, []);

  const checkRoles = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
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

  const navItems = [
    { path: "/dashboard", label: "Início", icon: Home },
    { path: "/trilhas", label: "Trilhas", icon: GraduationCap },
    { path: "/biblioteca", label: "Biblioteca", icon: BookMarked },
    { path: "/conquistas", label: "Conquistas", icon: Trophy },
    { path: "/minhas-escalas", label: "Escalas", icon: Calendar },
  ];

  // Add conditional items
  if (isDiscipulador || isAdmin) {
    navItems.push({ path: "/sos", label: "S.O.S.", icon: LifeBuoy });
  }

  return (
    <header className="hidden lg:flex fixed top-0 left-0 right-0 h-16 bg-background/95 backdrop-blur-sm border-b border-border/50 z-40">
      <div className="flex items-center justify-between w-full px-6">
        {/* Logo + Navigation */}
        <div className="flex items-center gap-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img
              src={metanoiaLogo}
              alt="Metanoia Hub"
              className="w-9 h-9 object-contain"
            />
            <div>
              <span className="font-display font-semibold text-foreground text-sm tracking-tight">
                Metanoia Hub
              </span>
              {church && (
                <div className="flex items-center gap-1">
                  <Church className="w-2.5 h-2.5 text-primary" />
                  <span className="text-[10px] font-medium text-primary">
                    {church.nome}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Main Navigation */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                  location.pathname === item.path
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            ))}

            {/* Admin Dropdown */}
            {(isAdmin || isDiscipulador || isLiderMinisterial) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                      location.pathname === "/admin" || location.pathname === "/super-admin"
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <Settings className="w-4 h-4" />
                    <span>Admin</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {(isAdmin || isDiscipulador) && (
                    <DropdownMenuItem asChild>
                      <NavLink to="/admin" className="cursor-pointer">
                        <Settings className="w-4 h-4 mr-2" />
                        Painel Admin
                      </NavLink>
                    </DropdownMenuItem>
                  )}
                  {isSuperAdmin && (
                    <DropdownMenuItem asChild>
                      <NavLink to="/super-admin" className="cursor-pointer">
                        <ShieldAlert className="w-4 h-4 mr-2" />
                        Super Admin
                      </NavLink>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </nav>
        </div>
        
        {/* Right Section: User + Theme */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">
                  {userName?.charAt(0).toUpperCase() || "U"}
                </div>
                <span className="text-sm font-medium text-foreground max-w-[120px] truncate">
                  {userName || "Usuário"}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <NavLink to="/perfil" className="cursor-pointer">
                  <UserCircle className="w-4 h-4 mr-2" />
                  Meu Perfil
                </NavLink>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={onLogout}
                className="text-destructive focus:text-destructive cursor-pointer"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
});
