import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const inputVariants = cva(
  "flex w-full rounded-xl text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground transition-all duration-base focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
  {
    variants: {
      variant: {
        default: "border border-border bg-input hover:border-primary/30 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/40",
        ghost: "border-transparent bg-transparent hover:bg-muted focus-visible:bg-muted focus-visible:ring-0",
        filled: "border border-transparent bg-muted hover:bg-muted/80 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:bg-input",
        glass: "border border-primary/15 bg-card/60 backdrop-blur-sm hover:border-primary/25 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/35",
      },
      inputSize: {
        default: "h-11 px-4 py-2",
        sm: "h-9 px-3 py-1 text-sm",
        lg: "h-12 px-5 py-3",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "default",
    },
  }
);

export interface InputProps extends Omit<React.ComponentProps<"input">, "size">, VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, inputSize, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ variant, inputSize }), className)}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input, inputVariants };
