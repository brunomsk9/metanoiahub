import * as React from "react";
import { Button, ButtonProps } from "./button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ActionButtonConfig {
  id: string;
  label: string;
  shortLabel?: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: ButtonProps["variant"];
  className?: string;
}

interface ActionButtonsProps {
  buttons: ActionButtonConfig[];
  className?: string;
  size?: "sm" | "default" | "lg";
  /** Layout direction: 'row' keeps buttons inline with wrap, 'stack' stacks on mobile */
  layout?: "row" | "stack";
}

/**
 * Responsive action buttons component that automatically handles
 * mobile-friendly layouts with proper wrapping and sizing.
 */
export function ActionButtons({ 
  buttons, 
  className, 
  size = "sm",
  layout = "row" 
}: ActionButtonsProps) {
  const sizeClasses = {
    sm: "h-7 px-2 gap-1 text-xs",
    default: "h-9 px-3 gap-1.5 text-sm",
    lg: "h-10 px-4 gap-2 text-sm"
  };

  const iconSizes = {
    sm: "h-3.5 w-3.5",
    default: "h-4 w-4",
    lg: "h-4 w-4"
  };

  return (
    <div 
      className={cn(
        "flex items-center gap-1.5 flex-wrap",
        layout === "stack" && "flex-col sm:flex-row w-full sm:w-auto",
        className
      )}
    >
      {buttons.map((button) => (
        <Button
          key={button.id}
          variant={button.variant || "outline"}
          onClick={button.onClick}
          disabled={button.disabled || button.loading}
          className={cn(
            sizeClasses[size],
            layout === "stack" && "w-full sm:w-auto",
            button.className
          )}
        >
          {button.loading ? (
            <Loader2 className={cn(iconSizes[size], "animate-spin")} />
          ) : (
            button.icon && (
              <span className={iconSizes[size]}>
                {React.cloneElement(button.icon as React.ReactElement, {
                  className: iconSizes[size]
                })}
              </span>
            )
          )}
          {button.shortLabel ? (
            <>
              <span className="hidden sm:inline">{button.label}</span>
              <span className="sm:hidden">{button.shortLabel}</span>
            </>
          ) : (
            <span>{button.label}</span>
          )}
        </Button>
      ))}
    </div>
  );
}

/**
 * Responsive navigation with action buttons - combines navigation controls
 * with action buttons in a mobile-friendly layout.
 */
interface NavigationWithActionsProps {
  navigation: React.ReactNode;
  actions: React.ReactNode;
  className?: string;
}

export function NavigationWithActions({ 
  navigation, 
  actions, 
  className 
}: NavigationWithActionsProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center gap-1 w-full">
        {navigation}
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        {actions}
      </div>
    </div>
  );
}
