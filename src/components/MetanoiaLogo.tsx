import { memo } from "react";
import { cn } from "@/lib/utils";

interface MetanoiaLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const MetanoiaLogo = memo(function MetanoiaLogo({ 
  className, 
  size = "md" 
}: MetanoiaLogoProps) {
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
      {/* Background glow effect */}
      <defs>
        <radialGradient id="logoGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="primaryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="100%" stopColor="hsl(var(--primary) / 0.7)" />
        </linearGradient>
      </defs>

      {/* Glow background */}
      <circle cx="32" cy="32" r="30" fill="url(#logoGlow)" />

      {/* Network connection lines */}
      <g stroke="hsl(var(--primary) / 0.4)" strokeWidth="1" strokeLinecap="round">
        {/* Top connections */}
        <line x1="32" y1="8" x2="20" y2="20" />
        <line x1="32" y1="8" x2="44" y2="20" />
        
        {/* Side connections */}
        <line x1="10" y1="32" x2="20" y2="26" />
        <line x1="54" y1="32" x2="44" y2="26" />
        
        {/* Bottom connections */}
        <line x1="20" y1="44" x2="32" y2="56" />
        <line x1="44" y1="44" x2="32" y2="56" />
        
        {/* Cross connections */}
        <line x1="20" y1="20" x2="44" y2="44" opacity="0.3" />
        <line x1="44" y1="20" x2="20" y2="44" opacity="0.3" />
      </g>

      {/* Network nodes (small dots) */}
      <g fill="hsl(var(--primary))">
        <circle cx="32" cy="8" r="2.5" opacity="0.8" />
        <circle cx="10" cy="32" r="2" opacity="0.6" />
        <circle cx="54" cy="32" r="2" opacity="0.6" />
        <circle cx="32" cy="56" r="2.5" opacity="0.8" />
        <circle cx="20" cy="20" r="1.5" opacity="0.5" />
        <circle cx="44" cy="20" r="1.5" opacity="0.5" />
        <circle cx="20" cy="44" r="1.5" opacity="0.5" />
        <circle cx="44" cy="44" r="1.5" opacity="0.5" />
      </g>

      {/* Central MH text */}
      <text
        x="32"
        y="37"
        textAnchor="middle"
        fontFamily="var(--font-display), system-ui, sans-serif"
        fontWeight="700"
        fontSize="18"
        fill="hsl(var(--foreground))"
        letterSpacing="-0.5"
      >
        MH
      </text>

      {/* Accent underline */}
      <rect
        x="19"
        y="42"
        width="26"
        height="2"
        rx="1"
        fill="url(#primaryGradient)"
      />
    </svg>
  );
});

export default MetanoiaLogo;
