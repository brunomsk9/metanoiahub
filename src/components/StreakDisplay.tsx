import { Flame, BookOpen, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakDisplayProps {
  streak: number;
  className?: string;
}

export function StreakDisplay({ streak, className }: StreakDisplayProps) {
  const isActive = streak > 0;
  
  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-300",
      isActive 
        ? "bg-gradient-streak border-accent/30 shadow-glow-accent" 
        : "bg-card border-border",
      className
    )}>
      <div className={cn(
        "relative flex items-center justify-center w-12 h-12 rounded-full",
        isActive ? "bg-accent/20" : "bg-muted"
      )}>
        <Flame className={cn(
          "w-6 h-6 transition-colors",
          isActive ? "text-accent" : "text-muted-foreground"
        )} />
        {isActive && (
          <span className="absolute -top-1 -right-1 text-lg animate-bounce">🔥</span>
        )}
      </div>
      <div>
        <p className={cn(
          "text-2xl font-display font-bold",
          isActive ? "text-accent-foreground" : "text-foreground"
        )}>
          {streak} dias
        </p>
        <p className={cn(
          "text-sm",
          isActive ? "text-accent-foreground/80" : "text-muted-foreground"
        )}>
          Streak de Leitura
        </p>
      </div>
    </div>
  );
}

interface HealthRadialProps {
  percentage: number;
  label: string;
  className?: string;
}

export function HealthRadial({ percentage, label, className }: HealthRadialProps) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  const getColor = () => {
    if (percentage >= 80) return "stroke-success";
    if (percentage >= 50) return "stroke-accent";
    return "stroke-destructive";
  };

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="progress-ring w-28 h-28">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            className="stroke-muted"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            className={cn("transition-all duration-500", getColor())}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-display font-bold text-foreground">
            {percentage}%
          </span>
        </div>
      </div>
      <p className="text-sm text-muted-foreground font-medium">{label}</p>
    </div>
  );
}

interface DailyHabitsProps {
  habits: { id: string; name: string; completed: boolean; icon: 'book' | 'heart' }[];
  onToggle: (id: string) => void;
}

export function DailyHabits({ habits, onToggle }: DailyHabitsProps) {
  const icons = {
    book: BookOpen,
    heart: Heart,
  };

  return (
    <div className="flex gap-3">
      {habits.map((habit) => {
        const Icon = icons[habit.icon];
        return (
          <button
            key={habit.id}
            onClick={() => onToggle(habit.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200",
              habit.completed
                ? "bg-success/20 border-success/30 text-success"
                : "bg-card border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
            )}
          >
            <Icon className="w-4 h-4" />
            <span className="text-sm font-medium">{habit.name}</span>
            {habit.completed && <span className="text-xs">✓</span>}
          </button>
        );
      })}
    </div>
  );
}
