import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  Home, 
  BookOpen, 
  LifeBuoy, 
  User, 
  LogOut, 
  ChevronLeft,
  GraduationCap,
  Menu,
  Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface SidebarProps {
  onLogout: () => void;
  userName?: string;
}

const navItems = [
  { path: '/dashboard', label: 'Início', icon: Home },
  { path: '/trilhas', label: 'Trilhas', icon: BookOpen },
  { path: '/sos', label: 'S.O.S.', icon: LifeBuoy },
  { path: '/perfil', label: 'Perfil', icon: User },
];

export function Sidebar({ onLogout, userName }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();

  useEffect(() => {
    checkAdminRole();
  }, []);

  const checkAdminRole = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
      setIsAdmin(profile?.role === 'admin');
    }
  };

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-16 bg-sidebar border-b border-sidebar-border flex items-center px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
        >
          <Menu className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2 ml-3">
          <GraduationCap className="w-6 h-6 text-primary" />
          <span className="font-display font-bold text-foreground">UDisc</span>
        </div>
      </header>

      {/* Mobile Overlay */}
      {!collapsed && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
          onClick={() => setCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:sticky top-0 left-0 z-50 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col",
        collapsed ? "w-0 lg:w-20 -translate-x-full lg:translate-x-0" : "w-64"
      )}>
        {/* Logo */}
        <div className={cn(
          "h-16 flex items-center border-b border-sidebar-border px-4",
          collapsed && "lg:justify-center"
        )}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <h1 className="font-display font-bold text-foreground whitespace-nowrap">
                  Universidade
                </h1>
                <p className="text-xs text-muted-foreground whitespace-nowrap">
                  do Discipulador
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  "nav-item",
                  isActive && "nav-item-active",
                  collapsed && "lg:justify-center lg:px-3"
                )}
                onClick={() => setCollapsed(true)}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
          
          {isAdmin && (
            <NavLink
              to="/admin"
              className={cn(
                "nav-item",
                location.pathname === '/admin' && "nav-item-active",
                collapsed && "lg:justify-center lg:px-3"
              )}
              onClick={() => setCollapsed(true)}
            >
              <Shield className="w-5 h-5 shrink-0" />
              {!collapsed && <span>Admin</span>}
            </NavLink>
          )}
        </nav>

        {/* User Section */}
        <div className="p-3 border-t border-sidebar-border">
          {!collapsed && userName && (
            <div className="px-4 py-3 mb-2">
              <p className="text-sm text-muted-foreground">Bem-vindo,</p>
              <p className="font-medium text-foreground truncate">{userName}</p>
            </div>
          )}
          <button
            onClick={onLogout}
            className={cn(
              "nav-item w-full text-destructive hover:bg-destructive/10 hover:text-destructive",
              collapsed && "lg:justify-center lg:px-3"
            )}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && <span>Sair</span>}
          </button>
        </div>

        {/* Collapse Toggle (Desktop) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 rounded-full bg-sidebar border border-sidebar-border items-center justify-center hover:bg-sidebar-accent transition-colors"
        >
          <ChevronLeft className={cn(
            "w-4 h-4 text-muted-foreground transition-transform",
            collapsed && "rotate-180"
          )} />
        </button>
      </aside>
    </>
  );
}
