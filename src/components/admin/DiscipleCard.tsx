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
  Check,
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
  compactMode?: boolean;
  onViewProgress: (discipleId: string) => void;
  onToggleConexaoInicial: (relationshipId: string, nivel: 1 | 2, currentValue: boolean) => void;
  onToggleAcademiaNivel: (relationshipId: string, nivel: 1 | 2 | 3 | 4, currentValue: boolean) => void;
  onMarkJornadaComplete: (relationshipId: string, discipleName: string) => void;
  onOpenTransferDialog: (relationship: Relationship) => void;
  onRemoveRelationship: (id: string) => void;
  index: number;
}

// Stat pill component for reuse - improved visual hierarchy
const StatPill = memo(({ icon: Icon, value, className, label }: { icon: typeof Flame; value: string | number; className?: string; label?: string }) => (
  <span className={cn("inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-medium backdrop-blur-sm", className)}>
    <Icon className="w-3 h-3 shrink-0" />
    <span className="font-semibold">{value}</span>
    {label && <span className="text-[9px] opacity-70 hidden xs:inline">{label}</span>}
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
  compactMode = false,
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
      <div className="disciple-card overflow-hidden">
        {/* Progress bar - more prominent */}
        <div className="h-1.5 bg-muted/30">
          <div 
            className={cn(
              "h-full transition-all duration-300",
              totalProgress >= 100 ? "bg-primary" : totalProgress >= 50 ? "bg-accent" : "bg-warning/70"
            )}
            style={{ width: `${totalProgress}%` }}
          />
        </div>

        {/* Header - Clickable to expand */}
        <CollapsibleTrigger asChild>
          <div className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/20 transition-colors">
            {/* Avatar with status ring */}
            <div className="relative shrink-0">
              <div className={cn(
                "w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-sm",
                isCompleted 
                  ? "bg-gradient-to-br from-primary/25 to-primary/10 text-primary ring-2 ring-primary/30" 
                  : "bg-gradient-to-br from-muted/60 to-muted/30 text-muted-foreground"
              )}>
                {initial}
              </div>
              <div className={cn(
                "absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-card flex items-center justify-center shadow-sm",
                isCompleted ? "bg-primary" : "bg-muted-foreground/50"
              )}>
                {isCompleted ? <CheckCircle className="w-2.5 h-2.5 text-primary-foreground" /> : <Lock className="w-2 h-2 text-muted" />}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-sm sm:text-base text-foreground truncate" title={rel.discipulo?.nome}>
                  {rel.discipulo?.nome || "Sem nome"}
                </p>
                <ChevronDown className="h-5 w-5 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180 text-muted-foreground/60" />
              </div>

              {/* Stats row - always visible, responsive */}
              <div className="flex items-center gap-1.5 mt-1.5">
                {/* Streak - always prominent */}
                <StatPill 
                  icon={Flame} 
                  value={rel.discipulo?.current_streak || 0} 
                  className="bg-gradient-to-r from-orange-500/20 to-amber-500/15 text-orange-500 border border-orange-500/20" 
                />
                
                {/* Compact mode: show minimal info */}
                {compactMode ? (
                  <>
                    {/* Progress summary as percentage */}
                    <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded-md bg-muted/30">
                      {Math.round(totalProgress)}%
                    </span>
                    {isCompleted && (
                      <StatPill icon={Award} value="✓" className="bg-primary/20 text-primary border border-primary/30" />
                    )}
                  </>
                ) : (
                  <>
                    {/* Full stats */}
                    <StatPill 
                      icon={Award} 
                      value={rel.discipulo?.xp_points || 0} 
                      className="bg-accent/15 text-accent border border-accent/20 hidden xs:inline-flex" 
                    />
                    <StatPill 
                      icon={Link} 
                      value={`${conexaoCount}/2`} 
                      className={cn(
                        "border",
                        conexaoCount === 2 
                          ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/25" 
                          : "bg-sky-500/10 text-sky-500 border-sky-500/20"
                      )} 
                    />
                    <StatPill 
                      icon={GraduationCap} 
                      value={`${academiaCount}/4`} 
                      className={cn(
                        "border",
                        academiaCount === 4 
                          ? "bg-primary/20 text-primary border-primary/30" 
                          : "bg-violet-500/10 text-violet-500 border-violet-500/20"
                      )} 
                    />
                  </>
                )}
              </div>
              
              {/* Discipulador info - admin only, desktop */}
              {isAdmin && rel.discipulador && (
                <div className="hidden sm:flex items-center gap-1.5 mt-1.5">
                  <Users className="w-3 h-3 text-muted-foreground shrink-0" />
                  <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">{rel.discipulador.nome}</span>
                  <Badge
                    variant={discipuladorCount >= maxDisciplesLimit ? "destructive" : "outline"}
                    className="text-[8px] px-1.5 py-0 h-4"
                  >
                    {discipuladorCount}/{maxDisciplesLimit}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-2.5 pb-2.5 sm:px-3 sm:pb-3 space-y-2.5">
            {/* Progress Rows */}
            <div className="grid grid-cols-2 gap-2">
              {/* Conexão Inicial */}
              <div className="p-2.5 rounded-lg bg-muted/30 border border-border/50">
                <p className="text-[10px] text-muted-foreground mb-2 flex items-center gap-1">
                  <Link className="w-3 h-3 shrink-0" /> Conexão ({conexaoCount}/2)
                </p>
                <div className="flex items-center gap-2">
                  {[1, 2].map((nivel) => {
                    const key = `conexao_inicial_${nivel}` as keyof Relationship;
                    const isChecked = rel[key] as boolean;
                    return (
                      <button
                        key={nivel}
                        onClick={() => onToggleConexaoInicial(rel.id, nivel as 1 | 2, isChecked)}
                        className={`
                          flex-1 h-9 px-3 rounded-full text-xs font-semibold
                          transition-all duration-200 ease-out
                          border-2 flex items-center justify-center gap-1.5
                          ${isChecked 
                            ? 'bg-accent text-accent-foreground border-accent shadow-sm' 
                            : 'bg-background/50 text-muted-foreground border-border/60 hover:border-accent/50 hover:bg-accent/10'
                          }
                        `}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5" />}
                        <span>Nível {nivel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Academia */}
              <div className="p-2.5 rounded-lg bg-muted/30 border border-border/50">
                <p className="text-[10px] text-muted-foreground mb-2 flex items-center gap-1">
                  <GraduationCap className="w-3 h-3 shrink-0" /> Academia ({academiaCount}/4)
                </p>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4].map((nivel) => {
                    const key = `academia_nivel_${nivel}` as keyof Relationship;
                    const isChecked = rel[key] as boolean;
                    return (
                      <button
                        key={nivel}
                        onClick={() => onToggleAcademiaNivel(rel.id, nivel as 1 | 2 | 3 | 4, isChecked)}
                        className={`
                          flex-1 h-8 min-w-0 rounded-full text-[11px] font-bold
                          transition-all duration-200 ease-out
                          border-2 flex items-center justify-center
                          ${isChecked 
                            ? 'bg-primary text-primary-foreground border-primary shadow-sm' 
                            : 'bg-background/50 text-muted-foreground border-border/60 hover:border-primary/50 hover:bg-primary/10'
                          }
                        `}
                      >
                        {isChecked ? <Check className="w-3.5 h-3.5" /> : nivel}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Actions - improved UX */}
            <div className="flex items-center gap-2 pt-2 border-t border-border/40">
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="flex-1 h-10 text-xs font-medium bg-muted/50 hover:bg-muted/80 border border-border/50"
                    onClick={() => onViewProgress(rel.discipulo_id)}
                  >
                    <Eye className="w-4 h-4 mr-1.5" /> Progresso
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
                              <Button size="sm" className="w-full h-9 text-xs">
                                <CheckCircle className="w-4 h-4 mr-1.5" /> Marcar Concluído
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
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-10 w-10 shrink-0 hover:bg-accent/10 hover:border-accent/50 hover:text-accent transition-colors"
                  onClick={() => onOpenTransferDialog(rel)}
                  title="Transferir discípulo"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                </Button>
              )}

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-10 w-10 shrink-0 text-destructive/70 border-destructive/20 hover:bg-destructive/10 hover:border-destructive/40 hover:text-destructive transition-colors"
                    title="Remover relacionamento"
                  >
                    <Trash2 className="w-4 h-4" />
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
