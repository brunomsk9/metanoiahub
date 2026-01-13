import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  Trash2,
  Eye,
  BookOpen,
  Flame,
  CheckCircle,
  Award,
  Lock,
  GraduationCap,
  Link,
  ArrowRightLeft,
  ChevronDown,
  Sparkles,
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
import { motion } from "framer-motion";

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

export function DiscipleCard({
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
  index,
}: DiscipleCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const conexaoCount = [rel.conexao_inicial_1, rel.conexao_inicial_2].filter(Boolean).length;
  const academiaCount = [rel.academia_nivel_1, rel.academia_nivel_2, rel.academia_nivel_3, rel.academia_nivel_4].filter(Boolean).length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="status-badge-success">
            <Sparkles className="w-3 h-3" />
            Ativo
          </Badge>
        );
      case "paused":
        return (
          <Badge className="status-badge-warning">Pausado</Badge>
        );
      case "completed":
        return (
          <Badge className="status-badge-info">Concluído</Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Calculate total progress percentage
  const totalProgress = ((conexaoCount / 2) + (academiaCount / 4) + (rel.alicerce_completed_presencial ? 1 : 0)) / 3 * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.25 }}
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="group">
        <div className="disciple-card relative">
          {/* Progress indicator bar at top */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-muted/30 rounded-t-xl overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary/60 to-primary transition-all duration-500"
              style={{ width: `${totalProgress}%` }}
            />
          </div>

          {/* Card Header - Optimized for mobile */}
          <div className="flex items-center gap-3 p-3 sm:p-4 pt-4 sm:pt-5">
            {/* Avatar with status ring */}
            <div className="relative shrink-0">
              <div className={cn(
                "w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center font-bold text-lg sm:text-xl transition-all",
                rel.alicerce_completed_presencial 
                  ? "bg-gradient-to-br from-primary/25 to-primary/10 text-primary ring-2 ring-primary/30" 
                  : "bg-gradient-to-br from-muted/50 to-muted/30 text-muted-foreground"
              )}>
                {(rel.discipulo?.nome || "D")[0].toUpperCase()}
              </div>
              {/* Status dot */}
              <div className={cn(
                "absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-card flex items-center justify-center",
                rel.alicerce_completed_presencial ? "bg-primary" : "bg-muted-foreground/50"
              )}>
                {rel.alicerce_completed_presencial ? (
                  <CheckCircle className="w-2.5 h-2.5 text-primary-foreground" />
                ) : (
                  <Lock className="w-2 h-2 text-muted" />
                )}
              </div>
            </div>

            {/* Info section */}
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm sm:text-base text-foreground truncate leading-tight" title={rel.discipulo?.nome || "Sem nome"}>
                    {rel.discipulo?.nome || "Sem nome"}
                  </p>
                  {isAdmin && rel.discipulador && (
                    <p className="text-[11px] sm:text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Users className="w-3 h-3 shrink-0" />
                      <span className="truncate">{rel.discipulador.nome}</span>
                      <Badge
                        variant={
                          (discipuladorDiscipleCount[rel.discipulador_id] || 0) >= maxDisciplesLimit
                            ? "destructive"
                            : "outline"
                        }
                        className="text-[9px] px-1 py-0 h-3.5 shrink-0 ml-0.5"
                      >
                        {discipuladorDiscipleCount[rel.discipulador_id] || 0}/{maxDisciplesLimit}
                      </Badge>
                    </p>
                  )}
                </div>
                
                {/* Expand button */}
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 hover:bg-primary/10 transition-colors rounded-lg"
                  >
                    <ChevronDown className="h-4 w-4 transition-transform duration-300 group-data-[state=open]:rotate-180 text-muted-foreground" />
                  </Button>
                </CollapsibleTrigger>
              </div>
              
              {/* Stats row - Always visible */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Status badge */}
                {rel.alicerce_completed_presencial ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-medium bg-primary/15 text-primary border border-primary/20">
                    <Award className="w-3 h-3" />
                    <span>Concluído</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-medium bg-muted/50 text-muted-foreground border border-border/50">
                    <Lock className="w-3 h-3" />
                    <span>Em Jornada</span>
                  </span>
                )}
                
                {/* Streak */}
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] sm:text-xs font-medium bg-orange-500/10 text-orange-600 dark:text-orange-400">
                  <Flame className="w-3 h-3" />
                  {rel.discipulo?.current_streak || 0}
                </span>
                
                {/* XP */}
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] sm:text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Award className="w-3 h-3" />
                  {rel.discipulo?.xp_points || 0}
                </span>
                
                {/* Quick progress indicators */}
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] sm:text-xs font-medium bg-accent/10 text-accent-foreground">
                  <Link className="w-3 h-3" />
                  {conexaoCount}/2
                </span>
                
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] sm:text-xs font-medium bg-primary/10 text-primary">
                  <GraduationCap className="w-3 h-3" />
                  {academiaCount}/4
                </span>
              </div>
            </div>
          </div>

          {/* Expandable Content */}
          <CollapsibleContent>
            <div className="disciple-card-body">
              {/* Progress Rows */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Conexão Inicial */}
                <div className="disciple-progress-row">
                  <div className="disciple-progress-icon bg-accent/15">
                    <Link className="w-4 h-4 text-accent" />
                  </div>
                  <div className="disciple-progress-content">
                    <p className="disciple-progress-label">Conexão Inicial ({conexaoCount}/2)</p>
                    <div className="disciple-progress-checkboxes">
                      {[1, 2].map((nivel) => {
                        const key = `conexao_inicial_${nivel}` as keyof Relationship;
                        const isChecked = rel[key] as boolean;
                        return (
                          <div key={nivel} className="flex items-center gap-1.5">
                            <Checkbox
                              id={`conexao-${rel.id}-${nivel}`}
                              checked={isChecked}
                              onCheckedChange={() =>
                                onToggleConexaoInicial(rel.id, nivel as 1 | 2, isChecked)
                              }
                              className="h-5 w-5 data-[state=checked]:bg-accent data-[state=checked]:border-accent"
                              animated
                            />
                            <label
                              htmlFor={`conexao-${rel.id}-${nivel}`}
                              className="text-xs cursor-pointer text-foreground"
                            >
                              {nivel}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Academia das Nações */}
                <div className="disciple-progress-row">
                  <div className="disciple-progress-icon bg-primary/15">
                    <GraduationCap className="w-4 h-4 text-primary" />
                  </div>
                  <div className="disciple-progress-content">
                    <p className="disciple-progress-label">Academia ({academiaCount}/4)</p>
                    <div className="disciple-progress-checkboxes">
                      {[1, 2, 3, 4].map((nivel) => {
                        const key = `academia_nivel_${nivel}` as keyof Relationship;
                        const isChecked = rel[key] as boolean;
                        return (
                          <div key={nivel} className="flex items-center gap-1.5">
                            <Checkbox
                              id={`academia-${rel.id}-${nivel}`}
                              checked={isChecked}
                              onCheckedChange={() =>
                                onToggleAcademiaNivel(rel.id, nivel as 1 | 2 | 3 | 4, isChecked)
                              }
                              className="h-5 w-5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                              animated
                            />
                            <label
                              htmlFor={`academia-${rel.id}-${nivel}`}
                              className="text-xs cursor-pointer text-foreground"
                            >
                              {nivel}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="disciple-card-actions">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-8 sm:h-9 text-xs sm:text-sm"
                      onClick={() => onViewProgress(rel.discipulo_id)}
                    >
                      <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                      <span className="hidden xs:inline">Ver </span>Progresso
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-primary" />
                        Progresso de {rel.discipulo?.nome}
                      </DialogTitle>
                    </DialogHeader>
                    {discipleProgress && viewingProgress === rel.discipulo_id && (
                      <div className="space-y-4 pt-2">
                        {/* Jornada Metanoia */}
                        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm flex items-center gap-2">
                              <Award className="w-4 h-4 text-primary" />
                              Jornada Metanoia
                            </span>
                            {rel.alicerce_completed_presencial ? (
                              <Badge className="status-badge-success">Concluído ✓</Badge>
                            ) : (
                              <Badge variant="outline">Em andamento</Badge>
                            )}
                          </div>
                          <Progress
                            value={
                              discipleProgress.jornadaTotal > 0
                                ? (discipleProgress.jornadaCompleted / discipleProgress.jornadaTotal) * 100
                                : 0
                            }
                          />
                          <p className="text-xs text-muted-foreground">
                            {discipleProgress.jornadaCompleted}/{discipleProgress.jornadaTotal} aulas
                          </p>
                          {!rel.alicerce_completed_presencial && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" className="w-full">
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Marcar como Concluído
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirmar Conclusão</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Isso desbloqueará todas as trilhas para{" "}
                                    {rel.discipulo?.nome}.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      onMarkJornadaComplete(rel.id, rel.discipulo?.nome || "")
                                    }
                                  >
                                    Confirmar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 rounded-lg bg-muted/50 border border-border">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                              <BookOpen className="w-3.5 h-3.5" />
                              Aulas Concluídas
                            </div>
                            <p className="text-lg font-semibold">
                              {discipleProgress.lessonsCompleted}
                              <span className="text-sm text-muted-foreground font-normal">
                                /{discipleProgress.totalLessons}
                              </span>
                            </p>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/50 border border-border">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                              <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                              Dias de Leitura
                            </div>
                            <p className="text-lg font-semibold">
                              {discipleProgress.readingPlansProgress}
                            </p>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/50 border border-border">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                              <Flame className="w-3.5 h-3.5 text-orange-500" />
                              Hábitos na Semana
                            </div>
                            <p className="text-lg font-semibold">{discipleProgress.habitsThisWeek}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                              <Flame className="w-3.5 h-3.5 text-primary" />
                              Streak Atual
                            </div>
                            <p className="text-lg font-semibold text-primary">
                              {rel.discipulo?.current_streak || 0} 🔥
                            </p>
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
                    className="h-8 sm:h-9 text-xs sm:text-sm text-blue-600 border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-950"
                    onClick={() => onOpenTransferDialog(rel)}
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-1.5" />
                    <span className="hidden sm:inline">Transferir</span>
                  </Button>
                )}

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 sm:h-9 text-xs sm:text-sm text-destructive border-destructive/30 hover:bg-destructive/10"
                    >
                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-1.5" />
                      <span className="hidden sm:inline">Remover</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remover Relacionamento</AlertDialogTitle>
                      <AlertDialogDescription>
                        Deseja remover {rel.discipulo?.nome} do discipulado? Esta ação não pode ser
                        desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onRemoveRelationship(rel.id)}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Remover
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </motion.div>
  );
}
