import { memo, useId } from "react";
import { cn } from "@/lib/utils";

interface MetanoiaLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const MetanoiaLogo = memo(function MetanoiaLogo({ 
  className, 
  size = "md" 
}: MetanoiaLogoProps) {
  const id = useId();
  
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14"
  };

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(sizeClasses[size], className)}
      aria-label="Metanoia Hub Logo"
    >
      <defs>
        {/* Background gradient - adapts to theme */}
        <radialGradient id={`${id}-bg`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsl(var(--card))" />
          <stop offset="100%" stopColor="hsl(var(--background))" />
        </radialGradient>
        
        {/* Glow effect */}
        <radialGradient id={`${id}-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.25" />
          <stop offset="70%" stopColor="hsl(var(--primary))" stopOpacity="0.05" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </radialGradient>
        
        {/* Primary gradient for accent */}
        <linearGradient id={`${id}-primary`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="100%" stopColor="hsl(var(--primary) / 0.7)" />
        </linearGradient>
      </defs>

      {/* Solid background circle */}
      <circle 
        cx="32" 
        cy="32" 
        r="30" 
        fill={`url(#${id}-bg)`}
        stroke="hsl(var(--border))"
        strokeWidth="1"
        strokeOpacity="0.3"
      />
      
      {/* Glow overlay */}
      <circle cx="32" cy="32" r="28" fill={`url(#${id}-glow)`} />

      {/* Network connection lines */}
      <g stroke="hsl(var(--primary))" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.5">
        {/* Top connections */}
        <line x1="32" y1="10" x2="22" y2="20" />
        <line x1="32" y1="10" x2="42" y2="20" />
        
        {/* Side connections */}
        <line x1="12" y1="32" x2="22" y2="26" />
        <line x1="52" y1="32" x2="42" y2="26" />
        
        {/* Bottom connections */}
        <line x1="22" y1="44" x2="32" y2="54" />
        <line x1="42" y1="44" x2="32" y2="54" />
        
        {/* Cross connections */}
        <line x1="22" y1="20" x2="42" y2="44" opacity="0.25" />
        <line x1="42" y1="20" x2="22" y2="44" opacity="0.25" />
      </g>

      {/* Network nodes (small dots) */}
      <g fill="hsl(var(--primary))">
        <circle cx="32" cy="10" r="2.5" />
        <circle cx="12" cy="32" r="2" opacity="0.8" />
        <circle cx="52" cy="32" r="2" opacity="0.8" />
        <circle cx="32" cy="54" r="2.5" />
        <circle cx="22" cy="20" r="1.8" opacity="0.7" />
        <circle cx="42" cy="20" r="1.8" opacity="0.7" />
        <circle cx="22" cy="44" r="1.8" opacity="0.7" />
        <circle cx="42" cy="44" r="1.8" opacity="0.7" />
      </g>

      {/* Central MH text */}
      <text
        x="32"
        y="37"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="800"
        fontSize="17"
        fill="hsl(var(--foreground))"
        letterSpacing="-0.5"
      >
        MH
      </text>

      {/* Accent underline */}
      <rect
        x="20"
        y="41"
        width="24"
        height="2.5"
        rx="1.25"
        fill={`url(#${id}-primary)`}
      />
    </svg>
  );
});

export default MetanoiaLogo;
