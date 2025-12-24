import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AppHeader } from "./AppHeader";
import { DesktopHeader } from "./DesktopHeader";
import { DesktopSidebar } from "./DesktopSidebar";

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
  userName,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Header with logo + user */}
      <DesktopHeader title={headerTitle} onLogout={onLogout} userName={userName} />

      {/* Desktop Sidebar - below header, on the left */}
      <DesktopSidebar />

      {/* Mobile Header with hamburger menu */}
      <div className="lg:hidden">
        <AppHeader title={headerTitle} showBack={showBack} backTo={backTo} />
      </div>

      {/* Main Content */}
      <main
        className={cn(
          "pt-14 lg:pt-16 pb-6",
          "lg:ml-56", // Space for desktop sidebar on left
          className
        )}
      >
        <div className="px-4 lg:px-6 max-w-2xl mx-auto lg:max-w-5xl lg:py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
