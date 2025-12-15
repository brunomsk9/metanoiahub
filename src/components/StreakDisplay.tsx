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
      "flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all duration-300",
      isActive 
        ? "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200/60" 
        : "bg-card border-border",
      className
    )}>
      <div className={cn(
        "relative flex items-center justify-center w-14 h-14 rounded-2xl",
        isActive ? "bg-gradient-to-br from-amber-400 to-orange-500" : "bg-muted"
      )}>
        <Flame className={cn(
          "w-7 h-7 transition-colors",
          isActive ? "text-white" : "text-muted-foreground"
        )} />
        {isActive && (
          <span className="absolute -top-1 -right-1 text-lg animate-bounce">🔥</span>
        )}
      </div>
      <div>
        <p className={cn(
          "text-3xl font-display font-bold",
          isActive ? "text-amber-700" : "text-foreground"
        )}>
          {streak} dias
        </p>
        <p className="text-sm text-muted-foreground">
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
    if (percentage >= 80) return "stroke-emerald-500";
    if (percentage >= 50) return "stroke-amber-500";
    return "stroke-red-500";
  };

  const getTextColor = () => {
    if (percentage >= 80) return "text-emerald-600";
    if (percentage >= 50) return "text-amber-600";
    return "text-red-600";
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
            className="stroke-gray-100"
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
          <span className={cn("text-2xl font-display font-bold", getTextColor())}>
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
    <div className="flex flex-col sm:flex-row gap-2">
      {habits.map((habit) => {
        const Icon = icons[habit.icon];
        return (
          <button
            key={habit.id}
            onClick={() => onToggle(habit.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 rounded-xl border transition-all duration-200",
              habit.completed
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-white border-gray-200 text-gray-500 hover:border-amber-300 hover:text-amber-600"
            )}
          >
            <Icon className="w-4 h-4" />
            <span className="text-sm font-medium">{habit.name}</span>
            {habit.completed && <span className="text-emerald-500">✓</span>}
          </button>
        );
      })}
    </div>
  );
}