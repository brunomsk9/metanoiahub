import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow-sm shadow-primary/20 hover:bg-primary/90 hover:shadow-md hover:shadow-primary/30",
        secondary: "border-primary/20 bg-primary/10 text-primary hover:bg-primary/20",
        destructive: "border-transparent bg-destructive text-destructive-foreground shadow-sm shadow-destructive/20 hover:bg-destructive/90",
        outline: "border-primary/30 text-foreground hover:bg-primary/10 hover:border-primary/50",
        success: "border-transparent bg-success text-success-foreground shadow-sm shadow-success/20 hover:bg-success/90",
        warning: "border-transparent bg-warning text-warning-foreground shadow-sm shadow-warning/20 hover:bg-warning/90",
        glass: "border-primary/20 bg-card/60 backdrop-blur-sm text-foreground hover:bg-card/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
