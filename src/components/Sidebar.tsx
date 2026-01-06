import { useState, useEffect, memo, useCallback } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  Home, 
  LifeBuoy, 
  LogOut, 
  ChevronDown,
  Menu,
  GraduationCap,
  Calendar,
  CalendarPlus,
  BookMarked,
  Settings,
  Users,
  UserCircle,
  Compass,
  FolderOpen,
  ShieldAlert,
  Church,
  Trophy
} from "lucide-react";
import { MetanoiaLogo } from "@/components/MetanoiaLogo";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useChurch } from "@/contexts/ChurchContext";
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
import { Badge } from "@/components/ui/badge";

interface SidebarProps {
  onLogout: () => void;
  userName?: string;
}

const learningItems = [
  { path: '/trilhas', label: 'Trilhas', icon: Compass, requiresDiscipulador: false },
  { path: '/biblioteca', label: 'Biblioteca', icon: BookMarked, requiresDiscipulador: false },
  { path: '/conquistas', label: 'Conquistas', icon: Trophy, requiresDiscipulador: false },
  { path: '/sos', label: 'S.O.S.', icon: LifeBuoy, requiresDiscipulador: true },
];

// Cache for user roles to avoid repeated fetches
let cachedRoles: { isAdmin: boolean; isDiscipulador: boolean; isSuperAdmin: boolean; isLiderMinisterial: boolean; userId: string | null } = {
  isAdmin: false,
  isDiscipulador: false,
  isSuperAdmin: false,
  isLiderMinisterial: false,
  userId: null
};

export const Sidebar = memo(function Sidebar({ onLogout, userName }: SidebarProps) {
  const [isAdmin, setIsAdmin] = useState(cachedRoles.isAdmin);
  const [isDiscipulador, setIsDiscipulador] = useState(cachedRoles.isDiscipulador);
  const [isSuperAdmin, setIsSuperAdmin] = useState(cachedRoles.isSuperAdmin);
  const [isLiderMinisterial, setIsLiderMinisterial] = useState(cachedRoles.isLiderMinisterial);
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { church } = useChurch();

  useEffect(() => {
    checkRoles();
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const checkRoles = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      // Use cached roles if same user
      if (cachedRoles.userId === session.user.id) {
        setIsAdmin(cachedRoles.isAdmin);
        setIsDiscipulador(cachedRoles.isDiscipulador);
        setIsSuperAdmin(cachedRoles.isSuperAdmin);
        setIsLiderMinisterial(cachedRoles.isLiderMinisterial);
        return;
      }

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id);
      
      const userRoles = roles?.map(r => r.role) || [];
      const admin = userRoles.includes('admin');
      const discipulador = userRoles.includes('discipulador');
      const superAdmin = userRoles.includes('super_admin');
      const liderMinisterial = userRoles.includes('lider_ministerial');
      
      // Cache the roles
      cachedRoles = { isAdmin: admin, isDiscipulador: discipulador, isSuperAdmin: superAdmin, isLiderMinisterial: liderMinisterial, userId: session.user.id };
      
      setIsAdmin(admin);
      setIsDiscipulador(discipulador);
      setIsSuperAdmin(superAdmin);
      setIsLiderMinisterial(liderMinisterial);
    }
  }, []);

  const visibleLearningItems = learningItems.filter(item => 
    !item.requiresDiscipulador || isDiscipulador || isAdmin
  );

  const isLearningActive = visibleLearningItems.some(item => location.pathname === item.path);

  return (
    <>
      {/* Desktop Header */}
      <header className="hidden lg:flex fixed top-0 left-0 right-0 z-40 h-14 bg-background/80 backdrop-blur-sm border-b border-border/50">
        <div className="w-full max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo + Church Tag */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <MetanoiaLogo size="sm" />
              <span className="font-display font-semibold text-foreground text-sm tracking-tight">
                Metanoia Hub
              </span>
            </div>
            {church && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/15 border border-primary/30">
                <Church className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-semibold text-primary">{church.nome}</span>
              </div>
            )}
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

            {/* Recursos (Admin, Discipulador, Líder Ministerial) */}
            {(isAdmin || isDiscipulador || isLiderMinisterial) && (
              <NavLink
                to="/recursos"
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  location.pathname === '/recursos'
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <FolderOpen className="w-4 h-4" />
                <span>Recursos</span>
              </NavLink>
            )}
            
            {/* Admin */}
            {isAdmin && (
              <NavLink
                to="/admin"
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  location.pathname === '/admin' && !location.search.includes('recursos')
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Settings className="w-4 h-4" />
                <span>Admin</span>
              </NavLink>
            )}

            {/* Super Admin */}
            {isSuperAdmin && (
              <NavLink
                to="/super-admin"
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  location.pathname === '/super-admin'
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Super Admin</span>
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

            {/* Escalas - link to MySchedules for regular users, admin section for admins/leaders */}
            <NavLink
              to={isAdmin || isLiderMinisterial ? "/admin?section=escalas" : "/minhas-escalas"}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                (location.pathname === '/admin' && location.search.includes('escalas')) || location.pathname === '/minhas-escalas'
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Calendar className="w-4 h-4" />
              <span>Escalas</span>
            </NavLink>
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
                {isSuperAdmin && (
                  <DropdownMenuItem asChild>
                    <NavLink to="/super-admin" className="flex items-center gap-2 cursor-pointer">
                      <ShieldAlert className="w-4 h-4" />
                      Super Admin
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
        <div className="flex items-center gap-2">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-foreground">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetHeader className="p-4 border-b border-border/50">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2.5">
                    <MetanoiaLogo size="sm" />
                    <SheetTitle className="text-left text-sm font-semibold">
                      Metanoia Hub
                    </SheetTitle>
                  </div>
                  {church && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/15 border border-primary/30 w-fit">
                      <Church className="w-3 h-3 text-primary" />
                      <span className="text-xs font-semibold text-primary">{church.nome}</span>
                    </div>
                  )}
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
                  {/* Recursos for admin, discipulador and lider ministerial */}
                  {(isAdmin || isDiscipulador || isLiderMinisterial) && (
                    <NavLink
                      to="/recursos"
                      className={cn(
                        "flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors",
                        location.pathname === '/recursos'
                          ? "bg-primary/10 text-primary" 
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      <FolderOpen className="w-5 h-5" />
                      <span>Recursos</span>
                    </NavLink>
                  )}
                  
                  {isAdmin && (
                    <NavLink
                      to="/admin"
                      className={cn(
                        "flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors",
                        location.pathname === '/admin' && !location.search.includes('recursos')
                          ? "bg-primary/10 text-primary" 
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      <Settings className="w-5 h-5" />
                      <span>Painel Admin</span>
                    </NavLink>
                  )}

                  {isSuperAdmin && (
                    <NavLink
                      to="/super-admin"
                      className={cn(
                        "flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors",
                        location.pathname === '/super-admin'
                          ? "bg-primary/10 text-primary" 
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      <ShieldAlert className="w-5 h-5" />
                      <span>Super Admin</span>
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

                  {/* Escalas - visible for admin and lider_ministerial in management section */}
                  {(isAdmin || isLiderMinisterial) && (
                    <NavLink
                      to="/admin?section=escalas"
                      className={cn(
                        "flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors",
                        location.pathname === '/admin' && location.search.includes('escalas')
                          ? "bg-primary/10 text-primary" 
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      <Calendar className="w-5 h-5" />
                      <span>Escalas</span>
                    </NavLink>
                  )}
                </div>
              )}

              {/* Escalas for regular users - outside Gestão section */}
              {!isAdmin && !isDiscipulador && !isLiderMinisterial && (
                <div className="pt-2">
                  <NavLink
                    to="/minhas-escalas"
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors",
                      location.pathname === '/minhas-escalas'
                        ? "bg-primary/10 text-primary" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <Calendar className="w-5 h-5" />
                    <span>Minhas Escalas</span>
                  </NavLink>
                </div>
              )}

            </nav>
          </SheetContent>
        </Sheet>
      </div>

        {/* Logo + Church Tag */}
        <div className="flex items-center gap-2">
          <MetanoiaLogo size="sm" />
          {church && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/15 border border-primary/30">
              <Church className="w-2.5 h-2.5 text-primary" />
              <span className="text-[10px] font-semibold text-primary">{church.nome}</span>
            </div>
          )}
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
                  {isSuperAdmin ? 'Super Admin' : isAdmin ? 'Administrador' : isLiderMinisterial ? 'Líder Ministerial' : isDiscipulador ? 'Discipulador' : 'Discípulo'}
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
              {isSuperAdmin && (
                <DropdownMenuItem asChild>
                  <NavLink to="/super-admin" className="flex items-center gap-2 cursor-pointer">
                    <ShieldAlert className="w-4 h-4" />
                    Super Admin
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
});
