import { BookOpen, CheckCircle2, Circle, Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReadingPlanCardProps {
  id: string;
  titulo: string;
  descricao?: string | null;
  coverImage?: string | null;
  duracaoDias: number;
  currentDay: number;
  completedDays: number[];
  onClick: (id: string) => void;
}

export function ReadingPlanCard({
  id,
  titulo,
  descricao,
  coverImage,
  duracaoDias,
  currentDay,
  completedDays,
  onClick,
}: ReadingPlanCardProps) {
  const progressPercent = Math.round((completedDays.length / duracaoDias) * 100);
  const isCompleted = completedDays.length >= duracaoDias;

  return (
    <button
      onClick={() => onClick(id)}
      className="w-full text-left bg-card rounded-2xl border border-border overflow-hidden hover:border-primary/30 transition-all group"
    >
      {/* Cover Image */}
      <div className="relative h-28 overflow-hidden">
        <img
          src={coverImage || "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=400&auto=format&fit=crop"}
          alt={titulo}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Progress Badge */}
        <div className="absolute top-3 right-3">
          <span className={cn(
            "px-2 py-1 rounded-full text-xs font-medium",
            isCompleted 
              ? "bg-success/90 text-success-foreground" 
              : "bg-black/50 text-white"
          )}>
            {isCompleted ? "Completo" : `${progressPercent}%`}
          </span>
        </div>

        {/* Play Button */}
        <div className="absolute bottom-3 left-3">
          <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center group-hover:bg-white transition-colors shadow-lg">
            <Play className="w-4 h-4 text-primary fill-primary ml-0.5" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-foreground mb-1 line-clamp-1">{titulo}</h3>
        {descricao && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{descricao}</p>
        )}
        
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Dia {Math.min(currentDay, duracaoDias)} de {duracaoDias}</span>
            <span className="text-foreground font-medium">{completedDays.length}/{duracaoDias}</span>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full rounded-full transition-all duration-500",
                isCompleted ? "bg-success" : "bg-gradient-to-r from-primary to-accent"
              )}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>
    </button>
  );
}

interface ReadingPlanMiniCardProps {
  id: string;
  titulo: string;
  coverImage?: string | null;
  duracaoDias: number;
  completedDays: number[];
  onClick: (id: string) => void;
}

export function ReadingPlanMiniCard({
  id,
  titulo,
  coverImage,
  duracaoDias,
  completedDays,
  onClick,
}: ReadingPlanMiniCardProps) {
  const progressPercent = Math.round((completedDays.length / duracaoDias) * 100);

  return (
    <button
      onClick={() => onClick(id)}
      className="flex items-center gap-3 w-full p-3 bg-card rounded-xl border border-border hover:border-primary/30 transition-all text-left"
    >
      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
        <img
          src={coverImage || "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=100&auto=format&fit=crop"}
          alt={titulo}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-foreground truncate">{titulo}</p>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{progressPercent}%</span>
        </div>
      </div>
    </button>
  );
}

interface DayProgressDotsProps {
  totalDays: number;
  completedDays: number[];
  currentDay: number;
  onDayClick?: (day: number) => void;
}

export function DayProgressDots({ totalDays, completedDays, currentDay, onDayClick }: DayProgressDotsProps) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => {
        const isCompleted = completedDays.includes(day);
        const isCurrent = day === currentDay;
        
        return (
          <button
            key={day}
            onClick={() => onDayClick?.(day)}
            disabled={!onDayClick}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all",
              isCompleted && "bg-success text-success-foreground",
              isCurrent && !isCompleted && "bg-primary text-primary-foreground ring-2 ring-primary/30",
              !isCompleted && !isCurrent && "bg-secondary text-muted-foreground hover:bg-secondary/80",
              onDayClick && "cursor-pointer"
            )}
          >
            {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : day}
          </button>
        );
      })}
    </div>
  );
}
