import { ReactNode, useState, useEffect, createContext, useContext } from "react";
import { cn } from "@/lib/utils";
import { AppHeader } from "./AppHeader";
import { DesktopHeader } from "./DesktopHeader";
import { DesktopSidebar } from "./DesktopSidebar";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

// Context for sidebar state
interface SidebarContextType {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType>({
  isCollapsed: false,
  setIsCollapsed: () => {},
});

export const useSidebarState = () => useContext(SidebarContext);

interface AppShellProps {
  children: ReactNode;
  headerTitle?: string;
  showBack?: boolean;
  backTo?: string;
  hideNavigation?: boolean;
  className?: string;
  onLogout?: () => void;
  userName?: string;
}

export function AppShell({
  children,
  headerTitle,
  showBack = false,
  backTo,
  hideNavigation = false,
  className,
  onLogout,
  userName: propUserName,
}: AppShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [userName, setUserName] = useState(propUserName || "");
  const navigate = useNavigate();

  // Fetch user name if not provided via prop
  useEffect(() => {
    if (propUserName) {
      setUserName(propUserName);
      return;
    }

    const fetchUserName = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;

      const { data } = await supabase
        .from("profiles")
        .select("nome")
        .eq("id", session.user.id)
        .single();

      setUserName(data?.nome || "");
    };

    fetchUserName();
  }, [propUserName]);

  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
    } else {
      await supabase.auth.signOut();
      navigate("/auth");
    }
  };

  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed }}>
      <div className="min-h-screen bg-background">
        {/* Desktop Header with logo + user */}
        <DesktopHeader title={headerTitle} onLogout={handleLogout} userName={userName} />

        {/* Desktop Sidebar - below header, on the left */}
        <DesktopSidebar />

        {/* Mobile Header with hamburger menu */}
        <div className="md:hidden">
          <AppHeader title={headerTitle} showBack={showBack} backTo={backTo} />
        </div>

        {/* Main Content */}
        <main
          className={cn(
            "pt-14 md:pt-16 pb-6 transition-all duration-300",
            isCollapsed ? "md:ml-16" : "md:ml-56",
            className
          )}
        >
          <div className="px-4 md:px-6 max-w-2xl mx-auto md:max-w-5xl md:py-6">
            {children}
          </div>
        </main>
      </div>
    </SidebarContext.Provider>
  );
}
