import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AppHeader } from "./AppHeader";
import { DesktopHeader } from "./DesktopHeader";

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
      {/* Desktop Header with logo + navigation */}
      <DesktopHeader title={headerTitle} onLogout={onLogout} userName={userName} />

      {/* Mobile Header with hamburger menu */}
      <div className="lg:hidden">
        <AppHeader title={headerTitle} showBack={showBack} backTo={backTo} />
      </div>

      {/* Main Content */}
      <main
        className={cn(
          "pt-14 lg:pt-16 pb-6",
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
