import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  Home, 
  LifeBuoy, 
  LogOut, 
  ChevronDown,
  Menu,
  GraduationCap,
  CalendarPlus,
  BookMarked,
  Settings,
  Users,
  UserCircle,
  Compass
} from "lucide-react";
import metanoiaLogo from "@/assets/metanoia-hub-logo.png";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  onLogout: () => void;
  userName?: string;
}

const learningItems = [
  { path: '/trilhas', label: 'Trilhas', icon: Compass, requiresDiscipulador: false },
  { path: '/biblioteca', label: 'Biblioteca', icon: BookMarked, requiresDiscipulador: false },
  { path: '/sos', label: 'S.O.S.', icon: LifeBuoy, requiresDiscipulador: true },
];

export function Sidebar({ onLogout, userName }: SidebarProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDiscipulador, setIsDiscipulador] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
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
      const [{ data: roles }, { data: profile }] = await Promise.all([
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id),
        supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', session.user.id)
          .single()
      ]);
      
      const userRoles = roles?.map(r => r.role) || [];
      setIsAdmin(userRoles.includes('admin'));
      setIsDiscipulador(userRoles.includes('discipulador'));
      setAvatarUrl(profile?.avatar_url || null);
    }
  };

  const visibleLearningItems = learningItems.filter(item => 
    !item.requiresDiscipulador || isDiscipulador || isAdmin
  );

  const isLearningActive = visibleLearningItems.some(item => location.pathname === item.path);

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
          <nav className="flex items-center gap-1">
            {/* Início */}
            <NavLink
              to="/dashboard"
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                location.pathname === '/dashboard' 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Home className="w-4 h-4" />
              <span>Início</span>
            </NavLink>

            {/* Aprendizado Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors outline-none",
                isLearningActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}>
                <GraduationCap className="w-4 h-4" />
                <span>Aprendizado</span>
                <ChevronDown className="w-3 h-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 bg-popover border border-border">
                {visibleLearningItems.map((item) => (
                  <DropdownMenuItem key={item.path} asChild>
                    <NavLink
                      to={item.path}
                      className={cn(
                        "flex items-center gap-2 cursor-pointer w-full",
                        location.pathname === item.path && "bg-primary/10 text-primary"
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </NavLink>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Admin/Discipulado */}
            {isAdmin && (
              <NavLink
                to="/admin"
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  location.pathname === '/admin' 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Settings className="w-4 h-4" />
                <span>Admin</span>
              </NavLink>
            )}
            
            {isDiscipulador && !isAdmin && (
              <NavLink
                to="/admin"
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  location.pathname === '/admin' 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Users className="w-4 h-4" />
                <span>Discipulado</span>
              </NavLink>
            )}

            {isDiscipulador && (
              <NavLink
                to="/dashboard?novoEncontro=true"
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-muted/50"
              >
                <CalendarPlus className="w-4 h-4" />
                <span>Novo Encontro</span>
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
              <DropdownMenuContent align="end" className="w-44 bg-popover border border-border">
                <DropdownMenuItem asChild>
                  <NavLink to="/perfil" className="flex items-center gap-2 cursor-pointer">
                    <UserCircle className="w-4 h-4" />
                    Meu Perfil
                  </NavLink>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <NavLink to="/admin" className="flex items-center gap-2 cursor-pointer">
                      <Settings className="w-4 h-4" />
                      Painel Admin
                    </NavLink>
                  </DropdownMenuItem>
                )}
                {isDiscipulador && !isAdmin && (
                  <DropdownMenuItem asChild>
                    <NavLink to="/admin" className="flex items-center gap-2 cursor-pointer">
                      <Users className="w-4 h-4" />
                      Discipulado
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
            
            <nav className="p-3 space-y-1">
              {/* Início */}
              <NavLink
                to="/dashboard"
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors",
                  location.pathname === '/dashboard' 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Home className="w-5 h-5" />
                <span>Início</span>
              </NavLink>

              {/* Aprendizado Section */}
              <div className="pt-2">
                <p className="px-4 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Aprendizado
                </p>
                {visibleLearningItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors",
                      location.pathname === item.path 
                        ? "bg-primary/10 text-primary" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>

              {/* Gestão Section */}
              {(isAdmin || isDiscipulador) && (
                <div className="pt-2">
                  <p className="px-4 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Gestão
                  </p>
                  {isAdmin && (
                    <NavLink
                      to="/admin"
                      className={cn(
                        "flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors",
                        location.pathname === '/admin' 
                          ? "bg-primary/10 text-primary" 
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      <Settings className="w-5 h-5" />
                      <span>Painel Admin</span>
                    </NavLink>
                  )}
                  
                  {isDiscipulador && !isAdmin && (
                    <NavLink
                      to="/admin"
                      className={cn(
                        "flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors",
                        location.pathname === '/admin' 
                          ? "bg-primary/10 text-primary" 
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      <Users className="w-5 h-5" />
                      <span>Discipulado</span>
                    </NavLink>
                  )}
                  
                  {isDiscipulador && (
                    <NavLink
                      to="/dashboard?novoEncontro=true"
                      className="flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    >
                      <CalendarPlus className="w-5 h-5" />
                      <span>Novo Encontro</span>
                    </NavLink>
                  )}
                </div>
              )}

            </nav>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <div className="flex items-center gap-2">
          <img src={metanoiaLogo} alt="Metanoia Hub" className="w-7 h-7 object-contain" />
          <span className="font-display font-semibold text-foreground text-sm">Metanoia</span>
        </div>

        {/* Theme Toggle + User Menu */}
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold hover:bg-primary/20 transition-colors">
                {userName?.charAt(0).toUpperCase() || 'U'}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-popover border border-border">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-sm font-medium text-foreground truncate">{userName || 'Usuário'}</p>
                <p className="text-xs text-muted-foreground">
                  {isAdmin ? 'Administrador' : isDiscipulador ? 'Discipulador' : 'Discípulo'}
                </p>
              </div>
              <DropdownMenuItem asChild>
                <NavLink to="/perfil" className="flex items-center gap-2 cursor-pointer">
                  <UserCircle className="w-4 h-4" />
                  Meu Perfil
                </NavLink>
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem asChild>
                  <NavLink to="/admin" className="flex items-center gap-2 cursor-pointer">
                    <Settings className="w-4 h-4" />
                    Painel Admin
                  </NavLink>
                </DropdownMenuItem>
              )}
              {isDiscipulador && !isAdmin && (
                <DropdownMenuItem asChild>
                  <NavLink to="/admin" className="flex items-center gap-2 cursor-pointer">
                    <Users className="w-4 h-4" />
                    Discipulado
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
    </>
  );
}
