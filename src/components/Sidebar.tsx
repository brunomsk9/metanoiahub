import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  Home, 
  BookOpen, 
  LifeBuoy, 
  User, 
  LogOut, 
  Shield,
  ChevronDown,
  Menu
} from "lucide-react";
import metanoiaLogo from "@/assets/metanoia-hub-logo.png";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

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
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    checkAdminRole();
  }, []);

  // Close drawer on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const checkAdminRole = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      // Check if user has admin role in user_roles table
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin');
      setIsAdmin(roles && roles.length > 0);
    }
  };

  return (
    <>
      {/* Desktop Header */}
      <header className="hidden lg:flex fixed top-0 left-0 right-0 z-40 h-16 bg-card/90 backdrop-blur-md border-b border-border">
        <div className="w-full max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img src={metanoiaLogo} alt="Metanoia Hub" className="w-10 h-10 object-contain" />
            <div>
              <h1 className="font-display font-semibold text-foreground leading-tight">
                Metanoia Hub
              </h1>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
            
            {isAdmin && (
              <NavLink
                to="/admin"
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  location.pathname === '/admin' 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <Shield className="w-4 h-4" />
                <span>Admin</span>
              </NavLink>
            )}
          </nav>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary transition-colors">
              <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                {userName?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="text-sm font-medium text-foreground max-w-[120px] truncate">
                {userName || 'Usuário'}
              </span>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-card">
              <DropdownMenuItem asChild>
                <NavLink to="/perfil" className="flex items-center gap-2 cursor-pointer">
                  <User className="w-4 h-4" />
                  Meu Perfil
                </NavLink>
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem asChild>
                  <NavLink to="/admin" className="flex items-center gap-2 cursor-pointer">
                    <Shield className="w-4 h-4" />
                    Painel Admin
                  </NavLink>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={onLogout}
                className="flex items-center gap-2 text-destructive cursor-pointer focus:text-destructive focus:bg-destructive/10"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-card/95 backdrop-blur-md border-b border-border flex items-center justify-between px-4">
        {/* Hamburger Menu */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-foreground">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 bg-card p-0">
            <SheetHeader className="p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <img src={metanoiaLogo} alt="Metanoia Hub" className="w-10 h-10 object-contain" />
                <SheetTitle className="text-left text-foreground">
                  Metanoia Hub
                </SheetTitle>
              </div>
            </SheetHeader>
            
            <nav className="p-4 space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                      isActive 
                        ? "bg-primary/10 text-primary" 
                        : "text-muted-foreground hover:bg-secondary"
                    )}
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
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                    location.pathname === '/admin' 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:bg-secondary"
                  )}
                >
                  <Shield className="w-5 h-5" />
                  <span>Painel Admin</span>
                </NavLink>
              )}
            </nav>

            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-medium">
                  {userName?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{userName || 'Usuário'}</p>
                  <p className="text-xs text-muted-foreground">Discípulo</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                onClick={onLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <div className="flex items-center gap-2">
          <img src={metanoiaLogo} alt="Metanoia Hub" className="w-8 h-8 object-contain" />
          <span className="font-display font-semibold text-foreground text-sm">Metanoia</span>
        </div>

        {/* User Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground text-xs font-medium">
          {userName?.charAt(0).toUpperCase() || 'U'}
        </div>
      </header>
    </>
  );
}