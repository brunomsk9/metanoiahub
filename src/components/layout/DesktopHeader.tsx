import { NavLink } from "react-router-dom";
import { 
  UserCircle,
  LogOut,
  Church,
} from "lucide-react";
import { memo } from "react";
import metanoiaLogo from "@/assets/metanoia-hub-logo.png";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useChurch } from "@/contexts/ChurchContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DesktopHeaderProps {
  title?: string;
  onLogout?: () => void;
  userName?: string;
}

export const DesktopHeader = memo(function DesktopHeader({ 
  onLogout, 
  userName 
}: DesktopHeaderProps) {
  const { church } = useChurch();

  return (
    <header className="hidden md:flex fixed top-0 left-0 right-0 h-16 bg-background/95 backdrop-blur-sm border-b border-border/50 z-40">
      <div className="flex items-center justify-between w-full px-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <img
            src={metanoiaLogo}
            alt="Metanoia Hub"
            className="w-9 h-9 object-contain"
          />
          <div>
            <span className="font-display font-semibold text-foreground text-sm tracking-tight">
              Metanoia Hub
            </span>
            {church && (
              <div className="flex items-center gap-1">
                <Church className="w-2.5 h-2.5 text-primary" />
                <span className="text-[10px] font-medium text-primary">
                  {church.nome}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Right Section: Theme + User */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">
                  {userName?.charAt(0).toUpperCase() || "U"}
                </div>
                <span className="text-sm font-medium text-foreground max-w-[120px] truncate">
                  {userName || "Usuário"}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <NavLink to="/perfil" className="cursor-pointer">
                  <UserCircle className="w-4 h-4 mr-2" />
                  Meu Perfil
                </NavLink>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={onLogout}
                className="text-destructive focus:text-destructive cursor-pointer"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
});
