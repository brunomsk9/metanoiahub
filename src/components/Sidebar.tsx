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
  Menu,
  Heart
} from "lucide-react";
import metanoiaLogo from "@/assets/metanoia-hub-logo.png";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";
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
  const [isDiscipulador, setIsDiscipulador] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    checkRoles();
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const checkRoles = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id);
      
      const userRoles = roles?.map(r => r.role) || [];
      setIsAdmin(userRoles.includes('admin'));
      setIsDiscipulador(userRoles.includes('discipulador'));
    }
  };

  const NavItem = ({ item, isActive, isMobile = false }: { item: typeof navItems[0], isActive: boolean, isMobile?: boolean }) => (
    <NavLink
      to={item.path}
      className={cn(
        "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors",
        isMobile && "gap-3 px-4 py-2.5",
        isActive 
          ? "bg-primary/8 text-primary" 
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
      )}
    >
      <item.icon className={cn("w-4 h-4", isMobile && "w-5 h-5")} />
      <span>{item.label}</span>
    </NavLink>
  );

  return (
    <>
      {/* Desktop Header */}
      <header className="hidden lg:flex fixed top-0 left-0 right-0 z-40 h-14 bg-background/80 backdrop-blur-sm border-b border-border/50">
        <div className="w-full max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <img src={metanoiaLogo} alt="Metanoia Hub" className="w-8 h-8 object-contain" />
            <span className="font-display font-semibold text-foreground text-sm tracking-tight">
              Metanoia Hub
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="flex items-center gap-0.5">
            {navItems.map((item) => (
              <NavItem 
                key={item.path} 
                item={item} 
                isActive={location.pathname === item.path} 
              />
            ))}
            
            {isAdmin && (
              <NavLink
                to="/admin"
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  location.pathname === '/admin' 
                    ? "bg-primary/8 text-primary" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Shield className="w-4 h-4" />
                <span>Admin</span>
              </NavLink>
            )}
            
            {isDiscipulador && !isAdmin && (
              <NavLink
                to="/admin"
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  location.pathname === '/admin' 
                    ? "bg-primary/8 text-primary" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Heart className="w-4 h-4" />
                <span>Discípulos</span>
              </NavLink>
            )}
          </nav>

          {/* Right side: Theme Toggle + User Menu */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors outline-none">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-medium">
                  {userName?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="text-sm text-foreground max-w-[100px] truncate">
                  {userName || 'Usuário'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
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
                {isDiscipulador && !isAdmin && (
                  <DropdownMenuItem asChild>
                    <NavLink to="/admin" className="flex items-center gap-2 cursor-pointer">
                      <Heart className="w-4 h-4" />
                      Meus Discípulos
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
        </div>
      </header>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-12 bg-background/80 backdrop-blur-sm border-b border-border/50 flex items-center justify-between px-3">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-foreground">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetHeader className="p-4 border-b border-border/50">
              <div className="flex items-center gap-2.5">
                <img src={metanoiaLogo} alt="Metanoia Hub" className="w-8 h-8 object-contain" />
                <SheetTitle className="text-left text-sm font-semibold">
                  Metanoia Hub
                </SheetTitle>
              </div>
            </SheetHeader>
            
            <nav className="p-3 space-y-0.5">
              {navItems.map((item) => (
                <NavItem 
                  key={item.path} 
                  item={item} 
                  isActive={location.pathname === item.path}
                  isMobile
                />
              ))}
              
              {isAdmin && (
                <NavLink
                  to="/admin"
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors",
                    location.pathname === '/admin' 
                      ? "bg-primary/8 text-primary" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <Shield className="w-5 h-5" />
                  <span>Painel Admin</span>
                </NavLink>
              )}
              
              {isDiscipulador && !isAdmin && (
                <NavLink
                  to="/admin"
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors",
                    location.pathname === '/admin' 
                      ? "bg-primary/8 text-primary" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <Heart className="w-5 h-5" />
                  <span>Meus Discípulos</span>
                </NavLink>
              )}
            </nav>

            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">
                    {userName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{userName || 'Usuário'}</p>
                    <p className="text-xs text-muted-foreground">Discípulo</p>
                  </div>
                </div>
                <ThemeToggle />
              </div>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
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
          <img src={metanoiaLogo} alt="Metanoia Hub" className="w-7 h-7 object-contain" />
          <span className="font-display font-semibold text-foreground text-sm">Metanoia</span>
        </div>

        {/* Theme Toggle + Avatar */}
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-medium">
            {userName?.charAt(0).toUpperCase() || 'U'}
          </div>
        </div>
      </header>
    </>
  );
}
