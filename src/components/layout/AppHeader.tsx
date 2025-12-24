import { memo, useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  ChevronLeft, 
  Bell, 
  Menu, 
  X, 
  Home, 
  GraduationCap, 
  Trophy, 
  User, 
  Settings, 
  Calendar, 
  BookOpen, 
  Library, 
  AlertCircle,
  LogOut,
  ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import metanoiaLogo from "@/assets/metanoia-hub-logo.png";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useChurch } from "@/contexts/ChurchContext";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
  backTo?: string;
  className?: string;
  transparent?: boolean;
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

export const AppHeader = memo(function AppHeader({
  title,
  showBack = false,
  backTo = "/dashboard",
  className,
  transparent = false,
}: AppHeaderProps) {
  const { church } = useChurch();
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/dashboard";
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(cachedRoles.isAdmin);
  const [isDiscipulador, setIsDiscipulador] = useState(cachedRoles.isDiscipulador);
  const [isSuperAdmin, setIsSuperAdmin] = useState(cachedRoles.isSuperAdmin);
  const [isLiderMinisterial, setIsLiderMinisterial] = useState(cachedRoles.isLiderMinisterial);
  const [userName, setUserName] = useState("");

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
      } else {
        const [rolesRes, profileRes] = await Promise.all([
          supabase.from("user_roles").select("role").eq("user_id", session.user.id),
          supabase.from("profiles").select("nome").eq("id", session.user.id).single()
        ]);

        const userRoles = rolesRes.data?.map((r) => r.role) || [];
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
        setUserName(profileRes.data?.nome || "");
      }
    }
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleNavigate = (path: string) => {
    setIsMenuOpen(false);
    navigate(path);
  };

  const mainNavItems = [
    { path: "/dashboard", label: "Início", icon: Home },
    { path: "/trilhas", label: "Trilhas", icon: GraduationCap },
    { path: "/biblioteca", label: "Biblioteca", icon: Library },
    { path: "/conquistas", label: "Conquistas", icon: Trophy },
    { path: "/minhas-escalas", label: "Minhas Escalas", icon: Calendar },
    { path: "/perfil", label: "Meu Perfil", icon: User },
  ];

  const discipuladorItems = [
    { path: "/sos", label: "S.O.S. Discipulador", icon: AlertCircle },
  ];

  const adminItems = [
    { path: "/admin", label: "Painel Admin", icon: Settings },
  ];

  const superAdminItems = [
    { path: "/super-admin", label: "Super Admin", icon: ShieldCheck },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-40 h-14",
        transparent
          ? "bg-transparent"
          : "bg-background/80 backdrop-blur-xl border-b border-border/30",
        className
      )}
    >
      <div className="flex items-center justify-between h-full px-4 max-w-2xl mx-auto lg:max-w-7xl lg:px-6">
        {/* Left side */}
        <div className="flex items-center gap-3">
          {showBack ? (
            <Link
              to={backTo}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm font-medium hidden sm:inline">Voltar</span>
            </Link>
          ) : isHome ? (
            <div className="flex items-center gap-2.5">
              <img
                src={metanoiaLogo}
                alt="Metanoia Hub"
                className="w-8 h-8 object-contain"
              />
              <div className="hidden sm:block">
                <span className="font-display font-semibold text-foreground text-sm tracking-tight">
                  Metanoia Hub
                </span>
                {church && (
                  <p className="text-[10px] text-primary font-medium">
                    {church.nome}
                  </p>
                )}
              </div>
            </div>
          ) : null}

          {title && (
            <h1 className="text-base font-semibold text-foreground truncate max-w-[200px]">
              {title}
            </h1>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button variant="ghost" size="icon" className="h-9 w-9 relative">
            <Bell className="w-5 h-5 text-muted-foreground" />
          </Button>

          {/* Hamburger Menu for Mobile */}
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 lg:hidden">
                <Menu className="w-5 h-5 text-foreground" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] p-0">
              <SheetHeader className="p-4 pb-2 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <img
                    src={metanoiaLogo}
                    alt="Metanoia Hub"
                    className="w-10 h-10 object-contain"
                  />
                  <div>
                    <SheetTitle className="text-left text-base">Metanoia Hub</SheetTitle>
                    {userName && (
                      <p className="text-xs text-muted-foreground">Olá, {userName.split(' ')[0]}</p>
                    )}
                  </div>
                </div>
              </SheetHeader>

              <ScrollArea className="flex-1 h-[calc(100vh-140px)]">
                <div className="p-2">
                  {/* Main Navigation */}
                  <div className="space-y-1">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-3 py-2">
                      Navegação
                    </p>
                    {mainNavItems.map((item) => {
                      const isActive = location.pathname === item.path;
                      return (
                        <button
                          key={item.path}
                          onClick={() => handleNavigate(item.path)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                            isActive 
                              ? "bg-primary/10 text-primary font-medium" 
                              : "text-foreground hover:bg-muted"
                          )}
                        >
                          <item.icon className="w-5 h-5" />
                          <span className="text-sm">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Discipulador Section */}
                  {isDiscipulador && (
                    <>
                      <Separator className="my-3" />
                      <div className="space-y-1">
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-3 py-2">
                          Discipulador
                        </p>
                        {discipuladorItems.map((item) => {
                          const isActive = location.pathname === item.path;
                          return (
                            <button
                              key={item.path}
                              onClick={() => handleNavigate(item.path)}
                              className={cn(
                                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                                isActive 
                                  ? "bg-primary/10 text-primary font-medium" 
                                  : "text-foreground hover:bg-muted"
                              )}
                            >
                              <item.icon className="w-5 h-5" />
                              <span className="text-sm">{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {/* Admin Section */}
                  {(isAdmin || isLiderMinisterial) && (
                    <>
                      <Separator className="my-3" />
                      <div className="space-y-1">
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-3 py-2">
                          Administração
                        </p>
                        {adminItems.map((item) => {
                          const isActive = location.pathname.startsWith(item.path);
                          return (
                            <button
                              key={item.path}
                              onClick={() => handleNavigate(item.path)}
                              className={cn(
                                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                                isActive 
                                  ? "bg-primary/10 text-primary font-medium" 
                                  : "text-foreground hover:bg-muted"
                              )}
                            >
                              <item.icon className="w-5 h-5" />
                              <span className="text-sm">{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {/* Super Admin Section */}
                  {isSuperAdmin && (
                    <>
                      <Separator className="my-3" />
                      <div className="space-y-1">
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-3 py-2">
                          Super Admin
                        </p>
                        {superAdminItems.map((item) => {
                          const isActive = location.pathname === item.path;
                          return (
                            <button
                              key={item.path}
                              onClick={() => handleNavigate(item.path)}
                              className={cn(
                                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                                isActive 
                                  ? "bg-primary/10 text-primary font-medium" 
                                  : "text-foreground hover:bg-muted"
                              )}
                            >
                              <item.icon className="w-5 h-5" />
                              <span className="text-sm">{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </ScrollArea>

              {/* Footer */}
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border/50 bg-background">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm font-medium">Sair da conta</span>
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
});
