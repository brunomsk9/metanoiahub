import { NavLink } from "react-router-dom";
import { 
  UserCircle,
  LogOut,
  Church,
} from "lucide-react";
import { memo } from "react";
import { MetanoiaLogo } from "@/components/MetanoiaLogo";
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
    <header className="hidden md:flex fixed top-0 left-0 right-0 h-16 glass z-40">
      <div className="flex items-center justify-between w-full px-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <MetanoiaLogo size="md" />
          <div>
            <span className="font-display font-bold text-foreground text-base tracking-tight">
              Metanoia <span className="text-gradient">Hub</span>
            </span>
            {church && (
              <div className="flex items-center gap-1.5">
                <Church className="w-3 h-3 text-primary" />
                <span className="text-xs font-medium text-muted-foreground">
                  {church.nome}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Right Section: Theme + User */}
        <div className="flex items-center gap-4">
          <ThemeToggle />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-secondary transition-all duration-200 group">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-sm font-bold group-hover:bg-primary/20 transition-colors">
                  {userName?.charAt(0).toUpperCase() || "U"}
                </div>
                <span className="text-sm font-medium text-foreground max-w-[120px] truncate hidden lg:block">
                  {userName || "Usuário"}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <NavLink to="/perfil" className="cursor-pointer">
                  <UserCircle className="w-4 h-4 mr-2" />
                  Meu Perfil
                </NavLink>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={onLogout}
                className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
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