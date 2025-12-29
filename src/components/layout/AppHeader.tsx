import { memo, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  ChevronLeft, 
  Bell, 
  Menu, 
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
  ChevronDown,
  Network,
  CalendarDays,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import metanoiaLogo from "@/assets/metanoia-hub-logo.png";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useChurch } from "@/contexts/ChurchContext";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useUserRoles } from "@/hooks/useUserRoles";

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
  backTo?: string;
  className?: string;
  transparent?: boolean;
}

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
  const [userName, setUserName] = useState("");
  const [learningOpen, setLearningOpen] = useState(true);
  const [ministryOpen, setMinistryOpen] = useState(true);
  
  const { isAdmin, isDiscipulador, isSuperAdmin, isLiderMinisterial, userId } = useUserRoles();

  useEffect(() => {
    const fetchUserName = async () => {
      if (!userId) return;
      const { data } = await supabase
        .from("profiles")
        .select("nome")
        .eq("id", userId)
        .single();
      setUserName(data?.nome || "");
    };
    fetchUserName();
  }, [userId]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleNavigate = (path: string) => {
    setIsMenuOpen(false);
    navigate(path);
  };

  // Learning items
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

  // Ministry items - for leaders
  const showMinistrySection = isAdmin || isLiderMinisterial;
  const ministryItems = [
    { 
      path: "/ministerio?tab=escalas", 
      label: "Escalas", 
      icon: CalendarDays,
      active: location.pathname === "/ministerio" && (!location.search || location.search.includes("escalas"))
    },
    { 
      path: "/ministerio?tab=rede", 
      label: "Rede Ministerial", 
      icon: Network,
      active: location.pathname === "/ministerio" && location.search.includes("rede")
    },
  ];

  const isMinistryActive = location.pathname === "/ministerio";

  const NavButton = ({ 
    onClick, 
    active, 
    icon: Icon, 
    label, 
    delay 
  }: { 
    onClick: () => void; 
    active: boolean; 
    icon: any; 
    label: string; 
    delay?: string;
  }) => (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-left hover:translate-x-1 animate-fade-in",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
      )}
      style={delay ? { animationDelay: delay } : undefined}
    >
      <Icon className="w-5 h-5 transition-transform duration-200" />
      <span>{label}</span>
    </button>
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
          {/* Hamburger Menu */}
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="w-5 h-5 text-foreground" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0 [&>button]:transition-all [&>button]:duration-200 [&>button]:hover:rotate-90">
              <SheetHeader className="p-4 pb-2 border-b border-border/50 animate-fade-in">
                <div className="flex items-center gap-3">
                  <img
                    src={metanoiaLogo}
                    alt="Metanoia Hub"
                    className="w-10 h-10 object-contain transition-transform duration-300 hover:scale-110"
                  />
                  <div className="animate-fade-in" style={{ animationDelay: '50ms' }}>
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
                  <NavButton
                    onClick={() => handleNavigate("/dashboard")}
                    active={location.pathname === "/dashboard"}
                    icon={Home}
                    label="Início"
                    delay="75ms"
                  />

                  {/* Learning Section */}
                  <Collapsible open={learningOpen} onOpenChange={setLearningOpen}>
                    <CollapsibleTrigger
                      className={cn(
                        "flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:translate-x-1 animate-fade-in",
                        isLearningActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                      style={{ animationDelay: '100ms' }}
                    >
                      <div className="flex items-center gap-3">
                        <Sparkles className="w-5 h-5" />
                        <span>Aprendizado</span>
                      </div>
                      <ChevronDown
                        className={cn(
                          "w-4 h-4 transition-transform duration-300",
                          learningOpen && "rotate-180"
                        )}
                      />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pl-6 mt-1 space-y-1 data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up overflow-hidden">
                      {learningItems.map((item, index) => (
                        <NavButton
                          key={item.path}
                          onClick={() => handleNavigate(item.path)}
                          active={location.pathname === item.path}
                          icon={item.icon}
                          label={item.label}
                          delay={`${(index + 1) * 50}ms`}
                        />
                      ))}
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Ministry Section - for leaders */}
                  {showMinistrySection && (
                    <Collapsible open={ministryOpen} onOpenChange={setMinistryOpen}>
                      <CollapsibleTrigger
                        className={cn(
                          "flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:translate-x-1 animate-fade-in",
                          isMinistryActive
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                        style={{ animationDelay: '125ms' }}
                      >
                        <div className="flex items-center gap-3">
                          <Network className="w-5 h-5" />
                          <span>Ministério</span>
                        </div>
                        <ChevronDown
                          className={cn(
                            "w-4 h-4 transition-transform duration-300",
                            ministryOpen && "rotate-180"
                          )}
                        />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pl-6 mt-1 space-y-1 data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up overflow-hidden">
                        {ministryItems.map((item, index) => (
                          <NavButton
                            key={item.path}
                            onClick={() => handleNavigate(item.path)}
                            active={item.active}
                            icon={item.icon}
                            label={item.label}
                            delay={`${(index + 1) * 50}ms`}
                          />
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* Escalas for regular volunteers */}
                  {!showMinistrySection && (
                    <NavButton
                      onClick={() => handleNavigate("/minhas-escalas")}
                      active={location.pathname === "/minhas-escalas"}
                      icon={Calendar}
                      label="Minhas Escalas"
                      delay="125ms"
                    />
                  )}

                  {/* Discipulado for discipuladores */}
                  {(isDiscipulador || isAdmin) && (
                    <NavButton
                      onClick={() => handleNavigate("/discipulado")}
                      active={location.pathname === "/discipulado"}
                      icon={Users}
                      label="Discipulado"
                      delay="150ms"
                    />
                  )}

                  {/* Perfil */}
                  <NavButton
                    onClick={() => handleNavigate("/perfil")}
                    active={location.pathname === "/perfil"}
                    icon={User}
                    label="Meu Perfil"
                    delay="175ms"
                  />

                  {/* Admin Section */}
                  {(isAdmin || isDiscipulador || isSuperAdmin) && (
                    <div className="pt-4 mt-4 border-t border-border/50 animate-fade-in" style={{ animationDelay: '200ms' }}>
                      <p className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Gestão
                      </p>

                      {(isAdmin || isDiscipulador) && (
                        <NavButton
                          onClick={() => handleNavigate("/admin?section=recursos")}
                          active={location.pathname === "/admin" && location.search.includes("recursos")}
                          icon={FolderOpen}
                          label="Recursos"
                        />
                      )}

                      {isAdmin && (
                        <NavButton
                          onClick={() => handleNavigate("/admin")}
                          active={
                            location.pathname === "/admin" && 
                            !location.search.includes("recursos") && 
                            !location.search.includes("escalas") &&
                            !location.search.includes("ministerios")
                          }
                          icon={Settings}
                          label="Painel Admin"
                        />
                      )}

                      {isSuperAdmin && (
                        <NavButton
                          onClick={() => handleNavigate("/super-admin")}
                          active={location.pathname === "/super-admin"}
                          icon={ShieldAlert}
                          label="Super Admin"
                        />
                      )}
                    </div>
                  )}
                </nav>
              </ScrollArea>

              {/* Footer */}
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border/50 bg-background animate-fade-in" style={{ animationDelay: '225ms' }}>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-destructive hover:bg-destructive/10 transition-all duration-200 hover:translate-x-1"
                >
                  <LogOut className="w-5 h-5 transition-transform duration-200" />
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
