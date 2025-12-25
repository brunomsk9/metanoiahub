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
  BookMarked, 
  LifeBuoy,
  LogOut,
  ShieldAlert,
  FolderOpen,
  Users,
  ChevronDown
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
  const [learningOpen, setLearningOpen] = useState(true);

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

  // Learning items (same as desktop)
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
          {/* Hamburger Menu - Left Side */}
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="w-5 h-5 text-foreground" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0">
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
                <nav className="p-3 space-y-1">
                  {/* Home */}
                  <button
                    onClick={() => handleNavigate("/dashboard")}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left",
                      location.pathname === "/dashboard"
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <Home className="w-5 h-5" />
                    <span>Início</span>
                  </button>

                  {/* Learning Section - Collapsible */}
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
                        <button
                          key={item.path}
                          onClick={() => handleNavigate(item.path)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left",
                            location.pathname === item.path
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          )}
                        >
                          <item.icon className="w-5 h-5" />
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Escalas */}
                  <button
                    onClick={() => handleNavigate(isAdmin || isLiderMinisterial ? "/admin?section=escalas" : "/minhas-escalas")}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left",
                      location.pathname === "/minhas-escalas" || (location.pathname === "/admin" && location.search.includes("escalas"))
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <Calendar className="w-5 h-5" />
                    <span>Escalas</span>
                  </button>

                  {/* Perfil */}
                  <button
                    onClick={() => handleNavigate("/perfil")}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left",
                      location.pathname === "/perfil"
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <User className="w-5 h-5" />
                    <span>Meu Perfil</span>
                  </button>

                  {/* Admin Section */}
                  {(isAdmin || isDiscipulador || isLiderMinisterial) && (
                    <div className="pt-4 mt-4 border-t border-border/50">
                      <p className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Gestão
                      </p>

                      {(isAdmin || isDiscipulador) && (
                        <button
                          onClick={() => handleNavigate("/admin?section=recursos")}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left",
                            location.pathname === "/admin" && location.search.includes("recursos")
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          )}
                        >
                          <FolderOpen className="w-5 h-5" />
                          <span>Recursos</span>
                        </button>
                      )}

                      {isDiscipulador && (
                        <button
                          onClick={() => handleNavigate("/admin")}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left",
                            location.pathname === "/admin" && !location.search.includes("recursos") && !location.search.includes("escalas")
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          )}
                        >
                          <Users className="w-5 h-5" />
                          <span>Discipulado</span>
                        </button>
                      )}

                      {isAdmin && (
                        <button
                          onClick={() => handleNavigate("/admin")}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left",
                            location.pathname === "/admin" && !location.search.includes("recursos") && !location.search.includes("escalas")
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          )}
                        >
                          <Settings className="w-5 h-5" />
                          <span>Painel Admin</span>
                        </button>
                      )}

                      {isSuperAdmin && (
                        <button
                          onClick={() => handleNavigate("/super-admin")}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left",
                            location.pathname === "/super-admin"
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          )}
                        >
                          <ShieldAlert className="w-5 h-5" />
                          <span>Super Admin</span>
                        </button>
                      )}
                    </div>
                  )}
                </nav>
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
        </div>
      </div>
    </header>
  );
});
