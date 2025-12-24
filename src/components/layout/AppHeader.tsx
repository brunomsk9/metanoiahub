import { memo } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronLeft, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import metanoiaLogo from "@/assets/metanoia-hub-logo.png";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useChurch } from "@/contexts/ChurchContext";

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
  const isHome = location.pathname === "/dashboard";

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
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="icon" className="h-9 w-9 relative">
            <Bell className="w-5 h-5 text-muted-foreground" />
            {/* Notification badge placeholder */}
            {/* <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" /> */}
          </Button>
        </div>
      </div>
    </header>
  );
});
