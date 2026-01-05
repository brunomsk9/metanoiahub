import { Lock, CheckCircle, BookOpen, Award } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";

interface JornadaMetanoiaProgressProps {
  trackId: string;
  trackTitle: string;
  completedLessons: number;
  totalLessons: number;
  isCompleted: boolean;
  completedPresencial?: boolean;
}

export function JornadaMetanoiaProgress({
  trackId, 
  trackTitle, 
  completedLessons, 
  totalLessons,
  isCompleted,
  completedPresencial = false
}: JornadaMetanoiaProgressProps) {
  const navigate = useNavigate();
  const progress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  if (isCompleted) {
    return (
      <div className="bg-gradient-to-br from-success/10 to-success/5 rounded-2xl border border-success/20 p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-success" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground">{trackTitle}</p>
            <p className="text-xs text-success">Jornada Metanoia concluída! Todas as trilhas liberadas.</p>
          </div>
          {completedPresencial && (
            <div className="flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-1 rounded-full">
              <Award className="w-3 h-3" />
              <span>Presencial</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => navigate(`/trilha/${trackId}`)}
      className="w-full bg-gradient-to-br from-primary/10 to-accent/5 rounded-2xl border border-primary/20 p-5 text-left hover:border-primary/40 transition-colors"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-foreground">{trackTitle}</p>
          <p className="text-xs text-muted-foreground">Complete a Jornada Metanoia para desbloquear outras trilhas</p>
        </div>
        <Lock className="w-4 h-4 text-muted-foreground" />
      </div>
      
      <div className="space-y-2">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">
            {completedLessons} de {totalLessons} aulas
          </span>
          <span className="text-primary font-medium">
            {Math.round(progress)}%
          </span>
        </div>
      </div>
    </button>
  );
}
