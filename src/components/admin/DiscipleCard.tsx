import { useState, memo, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  Trash2,
  Eye,
  Flame,
  CheckCircle,
  Award,
  Lock,
  GraduationCap,
  Link,
  ArrowRightLeft,
  ChevronDown,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Profile {
  id: string;
  nome: string;
  current_streak: number;
  xp_points: number;
}

interface Relationship {
  id: string;
  discipulo_id: string;
  discipulador_id: string;
  status: string;
  started_at: string;
  alicerce_completed_presencial: boolean;
  alicerce_completed_at: string | null;
  academia_nivel_1: boolean;
  academia_nivel_2: boolean;
  academia_nivel_3: boolean;
  academia_nivel_4: boolean;
  conexao_inicial_1: boolean;
  conexao_inicial_2: boolean;
  discipulo?: Profile;
  discipulador?: Profile;
}

interface DiscipleProgress {
  lessonsCompleted: number;
  totalLessons: number;
  readingPlansProgress: number;
  habitsThisWeek: number;
  jornadaCompleted: number;
  jornadaTotal: number;
}

interface DiscipleCardProps {
  relationship: Relationship;
  isAdmin: boolean;
  maxDisciplesLimit: number;
  discipuladorDiscipleCount: Record<string, number>;
  discipleProgress: DiscipleProgress | null;
  viewingProgress: string | null;
  onViewProgress: (discipleId: string) => void;
  onToggleConexaoInicial: (relationshipId: string, nivel: 1 | 2, currentValue: boolean) => void;
  onToggleAcademiaNivel: (relationshipId: string, nivel: 1 | 2 | 3 | 4, currentValue: boolean) => void;
  onMarkJornadaComplete: (relationshipId: string, discipleName: string) => void;
  onOpenTransferDialog: (relationship: Relationship) => void;
  onRemoveRelationship: (id: string) => void;
  index: number;
}

// Stat pill component for reuse
const StatPill = memo(({ icon: Icon, value, className }: { icon: typeof Flame; value: string | number; className?: string }) => (
  <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium", className)}>
    <Icon className="w-3 h-3" />
    {value}
  </span>
));
StatPill.displayName = "StatPill";

function DiscipleCardComponent({
  relationship: rel,
  isAdmin,
  maxDisciplesLimit,
  discipuladorDiscipleCount,
  discipleProgress,
  viewingProgress,
  onViewProgress,
  onToggleConexaoInicial,
  onToggleAcademiaNivel,
  onMarkJornadaComplete,
  onOpenTransferDialog,
  onRemoveRelationship,
}: DiscipleCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Memoize calculations
  const { conexaoCount, academiaCount, totalProgress } = useMemo(() => {
    const conexao = [rel.conexao_inicial_1, rel.conexao_inicial_2].filter(Boolean).length;
    const academia = [rel.academia_nivel_1, rel.academia_nivel_2, rel.academia_nivel_3, rel.academia_nivel_4].filter(Boolean).length;
    const progress = ((conexao / 2) + (academia / 4) + (rel.alicerce_completed_presencial ? 1 : 0)) / 3 * 100;
    return { conexaoCount: conexao, academiaCount: academia, totalProgress: progress };
  }, [rel.conexao_inicial_1, rel.conexao_inicial_2, rel.academia_nivel_1, rel.academia_nivel_2, rel.academia_nivel_3, rel.academia_nivel_4, rel.alicerce_completed_presencial]);

  const discipuladorCount = discipuladorDiscipleCount[rel.discipulador_id] || 0;
  const isCompleted = rel.alicerce_completed_presencial;
  const initial = (rel.discipulo?.nome || "D")[0].toUpperCase();

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="group">
      <div className="disciple-card">
        {/* Progress bar */}
        <div className="h-1 bg-muted/20 rounded-t-xl overflow-hidden">
          <div 
            className="h-full bg-primary/70 transition-all"
            style={{ width: `${totalProgress}%` }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center gap-2.5 p-2.5 sm:p-3">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className={cn(
              "w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center font-bold text-base sm:text-lg",
              isCompleted 
                ? "bg-primary/20 text-primary ring-2 ring-primary/25" 
                : "bg-muted/40 text-muted-foreground"
            )}>
              {initial}
            </div>
            <div className={cn(
              "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card flex items-center justify-center",
              isCompleted ? "bg-primary" : "bg-muted-foreground/40"
            )}>
              {isCompleted ? <CheckCircle className="w-2 h-2 text-primary-foreground" /> : <Lock className="w-2 h-2 text-muted" />}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1.5">
              <p className="font-semibold text-sm text-foreground truncate" title={rel.discipulo?.nome}>
                {rel.discipulo?.nome || "Sem nome"}
              </p>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 hover:bg-primary/10 rounded-lg">
                  <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180 text-muted-foreground" />
                </Button>
              </CollapsibleTrigger>
            </div>

            {/* Meta row - optimized for mobile */}
            <div className="flex items-center gap-1 mt-1 overflow-x-auto scrollbar-hide">
              {isAdmin && rel.discipulador && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 shrink-0">
                  <Users className="w-2.5 h-2.5" />
                  <span className="truncate max-w-[50px] sm:max-w-[80px]">{rel.discipulador.nome}</span>
                  <Badge
                    variant={discipuladorCount >= maxDisciplesLimit ? "destructive" : "outline"}
                    className="text-[8px] px-0.5 py-0 h-3 ml-0.5"
                  >
                    {discipuladorCount}/{maxDisciplesLimit}
                  </Badge>
                </span>
              )}
              
              {isCompleted ? (
                <StatPill icon={Award} value="✓" className="bg-primary/15 text-primary shrink-0" />
              ) : (
                <StatPill icon={Lock} value="..." className="bg-muted/40 text-muted-foreground shrink-0" />
              )}
              <StatPill icon={Flame} value={rel.discipulo?.current_streak || 0} className="bg-orange-500/10 text-orange-500 shrink-0" />
              <StatPill icon={Award} value={rel.discipulo?.xp_points || 0} className="bg-amber-500/10 text-amber-500 shrink-0" />
              <StatPill icon={Link} value={`${conexaoCount}/2`} className="bg-accent/10 text-accent-foreground shrink-0" />
              <StatPill icon={GraduationCap} value={`${academiaCount}/4`} className="bg-primary/10 text-primary shrink-0" />
            </div>
          </div>
        </div>
        <CollapsibleContent>
          <div className="px-2.5 pb-2.5 sm:px-3 sm:pb-3 space-y-2.5">
            {/* Progress Rows */}
            <div className="grid grid-cols-2 gap-2">
              {/* Conexão Inicial */}
              <div className="p-2 rounded-lg bg-muted/30 border border-border/50">
                <p className="text-[10px] text-muted-foreground mb-1.5 flex items-center gap-1">
                  <Link className="w-3 h-3" /> Conexão ({conexaoCount}/2)
                </p>
                <div className="flex gap-2">
                  {[1, 2].map((nivel) => {
                    const key = `conexao_inicial_${nivel}` as keyof Relationship;
                    const isChecked = rel[key] as boolean;
                    return (
                      <div key={nivel} className="flex items-center gap-1">
                        <Checkbox
                          id={`conexao-${rel.id}-${nivel}`}
                          checked={isChecked}
                          onCheckedChange={() => onToggleConexaoInicial(rel.id, nivel as 1 | 2, isChecked)}
                          className="h-5 w-5 data-[state=checked]:bg-accent data-[state=checked]:border-accent"
                          animated
                        />
                        <label htmlFor={`conexao-${rel.id}-${nivel}`} className="text-xs">{nivel}</label>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Academia */}
              <div className="p-2 rounded-lg bg-muted/30 border border-border/50">
                <p className="text-[10px] text-muted-foreground mb-1.5 flex items-center gap-1">
                  <GraduationCap className="w-3 h-3" /> Academia ({academiaCount}/4)
                </p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((nivel) => {
                    const key = `academia_nivel_${nivel}` as keyof Relationship;
                    const isChecked = rel[key] as boolean;
                    return (
                      <div key={nivel} className="flex items-center gap-1">
                        <Checkbox
                          id={`academia-${rel.id}-${nivel}`}
                          checked={isChecked}
                          onCheckedChange={() => onToggleAcademiaNivel(rel.id, nivel as 1 | 2 | 3 | 4, isChecked)}
                          className="h-5 w-5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          animated
                        />
                        <label htmlFor={`academia-${rel.id}-${nivel}`} className="text-xs">{nivel}</label>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 pt-1.5 border-t border-border/50">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => onViewProgress(rel.discipulo_id)}>
                    <Eye className="w-3.5 h-3.5 mr-1" /> Progresso
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-primary" />
                      {rel.discipulo?.nome}
                    </DialogTitle>
                  </DialogHeader>
                  {discipleProgress && viewingProgress === rel.discipulo_id && (
                    <div className="space-y-3 pt-2">
                      <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Jornada Metanoia</span>
                          {isCompleted ? (
                            <Badge className="bg-primary/20 text-primary text-[10px]">✓ Concluído</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px]">Em andamento</Badge>
                          )}
                        </div>
                        <Progress value={discipleProgress.jornadaTotal > 0 ? (discipleProgress.jornadaCompleted / discipleProgress.jornadaTotal) * 100 : 0} />
                        <p className="text-xs text-muted-foreground">{discipleProgress.jornadaCompleted}/{discipleProgress.jornadaTotal} aulas</p>
                        {!isCompleted && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" className="w-full h-8 text-xs">
                                <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Marcar Concluído
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar Conclusão</AlertDialogTitle>
                                <AlertDialogDescription>Desbloquear todas as trilhas para {rel.discipulo?.nome}?</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onMarkJornadaComplete(rel.id, rel.discipulo?.nome || "")}>Confirmar</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2.5 rounded-lg bg-muted/50 border border-border">
                          <p className="text-[10px] text-muted-foreground">Aulas</p>
                          <p className="text-sm font-semibold">{discipleProgress.lessonsCompleted}/{discipleProgress.totalLessons}</p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-muted/50 border border-border">
                          <p className="text-[10px] text-muted-foreground">Leituras</p>
                          <p className="text-sm font-semibold">{discipleProgress.readingPlansProgress}</p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-muted/50 border border-border">
                          <p className="text-[10px] text-muted-foreground">Hábitos</p>
                          <p className="text-sm font-semibold">{discipleProgress.habitsThisWeek}</p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20">
                          <p className="text-[10px] text-muted-foreground">Streak</p>
                          <p className="text-sm font-semibold text-primary">{rel.discipulo?.current_streak || 0} 🔥</p>
                        </div>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>

              {isAdmin && (
                <Button variant="outline" size="sm" className="h-8 px-2" onClick={() => onOpenTransferDialog(rel)}>
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                </Button>
              )}

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 px-2 text-destructive border-destructive/30 hover:bg-destructive/10">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remover Relacionamento</AlertDialogTitle>
                    <AlertDialogDescription>Remover {rel.discipulo?.nome} do discipulado?</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onRemoveRelationship(rel.id)} className="bg-destructive hover:bg-destructive/90">Remover</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// Memoized export for performance
export const DiscipleCard = memo(DiscipleCardComponent);
