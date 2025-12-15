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
  Shield,
  X
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
  const [collapsed, setCollapsed] = useState(true);
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
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-gray-900">UDisc</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="text-gray-600"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </header>

      {/* Mobile Overlay */}
      {!collapsed && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          onClick={() => setCollapsed(true)}
        />
      )}

      {/* Mobile Slide-out Menu */}
      <div className={cn(
        "lg:hidden fixed top-0 right-0 z-50 h-full w-72 bg-white shadow-2xl transition-transform duration-300",
        collapsed ? "translate-x-full" : "translate-x-0"
      )}>
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <span className="font-display font-semibold text-gray-900">Menu</span>
          <Button variant="ghost" size="icon" onClick={() => setCollapsed(true)}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                  isActive 
                    ? "bg-amber-50 text-amber-700 font-medium" 
                    : "text-gray-600 hover:bg-gray-50"
                )}
                onClick={() => setCollapsed(true)}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
          
          {isAdmin && (
            <NavLink
              to="/admin"
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                location.pathname === '/admin' 
                  ? "bg-amber-50 text-amber-700 font-medium" 
                  : "text-gray-600 hover:bg-gray-50"
              )}
              onClick={() => setCollapsed(true)}
            >
              <Shield className="w-5 h-5" />
              <span>Admin</span>
            </NavLink>
          )}
        </nav>
        
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
          {userName && (
            <div className="px-4 py-3 mb-2 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500">Bem-vindo,</p>
              <p className="font-medium text-gray-900 truncate">{userName}</p>
            </div>
          )}
          <button
            onClick={onLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Sair</span>
          </button>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:flex fixed top-0 left-0 z-50 h-screen bg-white border-r border-gray-100 transition-all duration-300 flex-col",
        collapsed ? "w-20" : "w-64"
      )}>
        {/* Logo */}
        <div className={cn(
          "h-16 flex items-center border-b border-gray-100 px-4",
          collapsed && "justify-center"
        )}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <h1 className="font-display font-bold text-gray-900 whitespace-nowrap">
                  Universidade
                </h1>
                <p className="text-xs text-gray-500 whitespace-nowrap">
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
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                  isActive 
                    ? "bg-amber-50 text-amber-700 font-medium" 
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900",
                  collapsed && "justify-center px-3"
                )}
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
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                location.pathname === '/admin' 
                  ? "bg-amber-50 text-amber-700 font-medium" 
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900",
                collapsed && "justify-center px-3"
              )}
            >
              <Shield className="w-5 h-5 shrink-0" />
              {!collapsed && <span>Admin</span>}
            </NavLink>
          )}
        </nav>

        {/* User Section */}
        <div className="p-3 border-t border-gray-100">
          {!collapsed && userName && (
            <div className="px-4 py-3 mb-2 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500">Bem-vindo,</p>
              <p className="font-medium text-gray-900 truncate">{userName}</p>
            </div>
          )}
          <button
            onClick={onLogout}
            className={cn(
              "flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-500 hover:bg-red-50 transition-colors",
              collapsed && "justify-center px-3"
            )}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && <span>Sair</span>}
          </button>
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
        >
          <ChevronLeft className={cn(
            "w-4 h-4 text-gray-400 transition-transform",
            collapsed && "rotate-180"
          )} />
        </button>
      </aside>

      {/* Desktop Content Offset */}
      <div className={cn(
        "hidden lg:block shrink-0 transition-all duration-300",
        collapsed ? "w-20" : "w-64"
      )} />
    </>
  );
}