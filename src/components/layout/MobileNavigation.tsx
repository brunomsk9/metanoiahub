import { memo, useCallback, useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Home, GraduationCap, Trophy, User, Settings, Calendar, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

interface MobileNavigationProps {
  className?: string;
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

export const MobileNavigation = memo(function MobileNavigation({
  className,
}: MobileNavigationProps) {
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(cachedRoles.isAdmin);
  const [isDiscipulador, setIsDiscipulador] = useState(cachedRoles.isDiscipulador);
  const [isSuperAdmin, setIsSuperAdmin] = useState(cachedRoles.isSuperAdmin);
  const [isLiderMinisterial, setIsLiderMinisterial] = useState(cachedRoles.isLiderMinisterial);

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

  const navItems = [
    { path: "/dashboard", label: "Início", icon: Home },
    { path: "/trilhas", label: "Aprender", icon: GraduationCap },
    { path: "/conquistas", label: "Conquistas", icon: Trophy },
    { path: "/minhas-escalas", label: "Escalas", icon: Calendar },
    { path: "/perfil", label: "Perfil", icon: User },
  ];

  // Replace escalas/profile with appropriate links based on role
  const displayItems = navItems.map((item) => {
    // Super Admin gets Super Admin link instead of Profile
    if (item.path === "/perfil" && isSuperAdmin) {
      return { path: "/super-admin", label: "Super Admin", icon: ShieldAlert };
    }
    // Admin/Lider Ministerial gets Admin link instead of Escalas
    if (item.path === "/minhas-escalas" && (isAdmin || isLiderMinisterial)) {
      return { path: "/admin", label: "Admin", icon: Settings };
    }
    return item;
  });

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 lg:hidden",
        "bg-background/80 backdrop-blur-xl border-t border-border/50",
        "safe-area-bottom",
        className
      )}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {displayItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path === "/trilhas" &&
              ["/trilhas", "/biblioteca", "/sos"].includes(location.pathname)) ||
            (item.path === "/admin" && location.pathname.startsWith("/admin")) ||
            (item.path === "/super-admin" && location.pathname === "/super-admin");

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center justify-center w-16 h-full"
            >
              <motion.div
                className={cn(
                  "flex flex-col items-center gap-0.5 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
                whileTap={{ scale: 0.9 }}
              >
                <div className="relative">
                  <item.icon className="w-5 h-5" />
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                      />
                    )}
                  </AnimatePresence>
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </motion.div>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
});
