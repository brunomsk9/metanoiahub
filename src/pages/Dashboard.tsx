import { useState, useCallback, memo, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { MentorChatButton } from "@/components/MentorChat";
import { AppShell } from "@/components/layout";
import { PageTransition } from "@/components/PageTransition";
import { ReadingPlanCard } from "@/components/ReadingPlanCard";
import { AlicerceProgress } from "@/components/AlicerceProgress";
import { DailyVerse } from "@/components/DailyVerse";
import { StartPlanModal } from "@/components/StartPlanModal";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { DailyHabitsCard } from "@/components/DailyHabitsCard";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Leaderboard } from "@/components/Leaderboard";
import { BookOpen, Flame, ChevronRight, BookMarked, Play, Users, Trophy, CalendarDays, FileText, Heart, Sparkles, GraduationCap } from "lucide-react";
import { VolunteerSchedules } from "@/components/VolunteerSchedules";
import { VolunteerPlaybooks } from "@/components/VolunteerPlaybooks";
import { cn } from "@/lib/utils";
import { useDashboardData } from "@/hooks/useDashboardData";
import { DashboardSkeleton } from "@/components/skeletons/PageSkeletons";

// Lazy load heavy components
const DiscipuladorDashboardCards = lazy(() => import("@/components/DiscipuladorDashboardCards").then(m => ({ default: m.DiscipuladorDashboardCards })));
const MeetingsManager = lazy(() => import("@/components/MeetingsManager").then(m => ({ default: m.MeetingsManager })));
const WeeklyChecklist = lazy(() => import("@/components/WeeklyChecklist").then(m => ({ default: m.WeeklyChecklist })));
const AchievementBadges = lazy(() => import("@/components/AchievementBadges").then(m => ({ default: m.AchievementBadges })));

interface ReadingPlanWithProgress {
  id: string;
  titulo: string;
  descricao: string | null;
  duracao_dias: number;
  cover_image: string | null;
  categoria: string;
  currentDay: number;
  completedDays: number[];
  hasProgress: boolean;
}

// Block section header component
const BlockHeader = memo(({ icon, title, accent = false }: { icon: React.ReactNode; title: string; accent?: boolean }) => (
  <div className={cn(
    "flex items-center gap-2 mb-4 pb-2 border-b",
    accent ? "border-primary/30" : "border-border/50"
  )}>
    <div className={cn(
      "w-8 h-8 rounded-lg flex items-center justify-center",
      accent ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
    )}>
      {icon}
    </div>
    <h2 className={cn(
      "text-sm font-semibold uppercase tracking-wider",
      accent ? "text-primary" : "text-muted-foreground"
    )}>{title}</h2>
  </div>
));
BlockHeader.displayName = "BlockHeader";

export default function Dashboard() {
  const {
    userId,
    userName,
    streak,
    xpPoints,
    tracks,
    baseTrackProgress,
    isDiscipulador,
    loading,
    annualPlans,
    semesterPlans,
    otherPlans,
    plansInProgress,
    getDurationLabel,
    churchId,
  } = useDashboardData();

  const [selectedPlanForModal, setSelectedPlanForModal] = useState<ReadingPlanWithProgress | null>(null);
  const [showStartModal, setShowStartModal] = useState(false);
  const [completedHabits, setCompletedHabits] = useState(0);
  const [totalHabits, setTotalHabits] = useState(2);
  const navigate = useNavigate();

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  }, [navigate]);

  const handleHabitsChange = useCallback((completed: number, total: number) => {
    setCompletedHabits(completed);
    setTotalHabits(total);
  }, []);

  const handleOpenStartModal = useCallback((plan: ReadingPlanWithProgress) => {
    setSelectedPlanForModal(plan);
    setShowStartModal(true);
  }, []);

  const handlePlanStarted = useCallback(() => {
    window.location.reload();
  }, []);

  if (loading) {
    return (
      <AppShell onLogout={handleLogout} userName="">
        <DashboardSkeleton />
      </AppShell>
    );
  }

  const allPlans = [...annualPlans, ...semesterPlans, ...otherPlans];

  return (
    <>
      <AppShell onLogout={handleLogout} userName={userName}>
        <PageTransition>
          <div className="space-y-8 max-w-2xl mx-auto lg:max-w-none pb-8">
            {/* Header com saudação e stats */}
            <header className="pt-2 space-y-4">
              <div>
                <p className="text-muted-foreground text-sm">Olá,</p>
                <h1 className="text-xl font-semibold text-foreground">{userName}</h1>
              </div>
              
              {/* Stats Cards */}
              <div className="flex gap-3">
                <div className="flex-1 p-3 rounded-lg bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/20 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-orange-500/20 flex items-center justify-center">
                    <Flame className="w-4 h-4 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-foreground">{streak}</p>
                    <p className="text-[10px] text-muted-foreground">dias seguidos</p>
                  </div>
                </div>
                <div className="flex-1 p-3 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-foreground">{xpPoints}</p>
                    <p className="text-[10px] text-muted-foreground">XP total</p>
                  </div>
                </div>
              </div>
            </header>

            {/* ====================== BLOCO: FÉ & DEVOCIONAIS ====================== */}
            <section className="space-y-4 p-4 rounded-xl bg-gradient-to-br from-primary/5 via-transparent to-transparent border border-primary/10">
              <BlockHeader icon={<Heart className="w-4 h-4" />} title="Fé & Devocionais" accent />
              
              {/* Versículo do Dia - Destaque */}
              <DailyVerse />

              {/* Hábitos Diários */}
              <div className="space-y-3 p-4 rounded-lg bg-card border border-border/50">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium text-foreground">Hábitos de hoje</h3>
                  <span className="text-xs text-muted-foreground">{completedHabits}/{totalHabits}</span>
                </div>
                {userId && (
                  <DailyHabitsCard userId={userId} onHabitsChange={handleHabitsChange} />
                )}
                {totalHabits > 0 && (
                  <div className="progress-bar">
                    <div 
                      className="progress-bar-fill"
                      style={{ width: `${(completedHabits / totalHabits) * 100}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Leitura Bíblica - Continue ou Explore */}
              <div className="space-y-3">
                {/* Continue Reading - Destaque se tiver em progresso */}
                {plansInProgress.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Continue sua leitura</h3>
                    {plansInProgress.slice(0, 2).map((plan) => {
                      const progress = Math.round((plan.completedDays.length / plan.duracao_dias) * 100);
                      return (
                        <button
                          key={plan.id}
                          onClick={() => navigate(`/plano/${plan.id}`)}
                          className="w-full flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/30 hover:bg-primary/15 transition-colors text-left"
                        >
                          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                            <Play className="w-4 h-4 text-primary fill-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{plan.titulo}</p>
                            <p className="text-xs text-muted-foreground">Dia {plan.currentDay} de {plan.duracao_dias}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-primary">{progress}%</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Explore Plans - Collapsible */}
                {allPlans.length > 0 && (
                  <CollapsibleSection 
                    title="Explorar Planos" 
                    icon={<BookMarked className="w-4 h-4" />}
                    badge={allPlans.length}
                    defaultOpen={plansInProgress.length === 0}
                  >
                    <div className="space-y-4">
                      {/* Annual Plans */}
                      {annualPlans.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-xs text-muted-foreground">Planos Anuais</h4>
                          {annualPlans.map((plan) => {
                            const progress = Math.round((plan.completedDays.length / plan.duracao_dias) * 100);
                            const isStarted = plan.hasProgress;
                            return (
                              <div key={plan.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50 hover:border-primary/30 transition-colors">
                                <img
                                  src={plan.cover_image || "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=200&auto=format&fit=crop"}
                                  alt={plan.titulo}
                                  className="w-12 h-12 rounded-lg object-cover"
                                  loading="lazy"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate">{plan.titulo}</p>
                                  <p className="text-xs text-muted-foreground">{getDurationLabel(plan.duracao_dias)}</p>
                                </div>
                                {isStarted ? (
                                  <button onClick={() => navigate(`/plano/${plan.id}`)} className="px-3 py-1 text-xs font-medium text-primary hover:underline">
                                    {progress}% - Continuar
                                  </button>
                                ) : (
                                  <button onClick={() => handleOpenStartModal(plan)} className="px-3 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors">
                                    Iniciar
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Semester Plans */}
                      {semesterPlans.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-xs text-muted-foreground">Planos de 6 Meses</h4>
                          {semesterPlans.map((plan) => {
                            const progress = Math.round((plan.completedDays.length / plan.duracao_dias) * 100);
                            const isStarted = plan.hasProgress;
                            return (
                              <div key={plan.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50 hover:border-primary/30 transition-colors">
                                <img src={plan.cover_image || "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=200&auto=format&fit=crop"} alt={plan.titulo} className="w-10 h-10 rounded-lg object-cover" loading="lazy" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate">{plan.titulo}</p>
                                  <p className="text-xs text-muted-foreground">{getDurationLabel(plan.duracao_dias)}</p>
                                </div>
                                {isStarted ? (
                                  <button onClick={() => navigate(`/plano/${plan.id}`)} className="text-xs text-primary font-medium">{progress}%</button>
                                ) : (
                                  <button onClick={() => handleOpenStartModal(plan)} className="px-3 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-full hover:bg-primary/90">Iniciar</button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Short Plans */}
                      {otherPlans.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-xs text-muted-foreground">Planos Curtos</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {otherPlans.map((plan) => (
                              <ReadingPlanCard
                                key={plan.id}
                                id={plan.id}
                                titulo={plan.titulo}
                                descricao={plan.descricao}
                                coverImage={plan.cover_image}
                                duracaoDias={plan.duracao_dias}
                                currentDay={plan.currentDay}
                                completedDays={plan.completedDays}
                                onClick={(id) => plan.hasProgress ? navigate(`/plano/${id}`) : handleOpenStartModal(plan)}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CollapsibleSection>
                )}
              </div>
            </section>

            {/* ====================== BLOCO: MEU DISCIPULADO (para discipuladores) ====================== */}
            {isDiscipulador && userId && (
              <section className="space-y-4 p-4 rounded-xl bg-gradient-to-br from-rose-500/5 via-transparent to-transparent border border-rose-500/10">
                <BlockHeader icon={<Heart className="w-4 h-4" />} title="Meu Discipulado" accent />
                
                {/* Checklist Semanal - Sempre visível */}
                <div className="p-4 rounded-lg border border-border/50 bg-card">
                  <Suspense fallback={<Skeleton className="h-20" />}>
                    <WeeklyChecklist userId={userId} />
                  </Suspense>
                </div>

                {/* Cards de Métricas dos Discípulos */}
                <Suspense fallback={<Skeleton className="h-32" />}>
                  <DiscipuladorDashboardCards />
                </Suspense>

                {/* Encontros */}
                <CollapsibleSection 
                  title="Encontros" 
                  icon={<Users className="w-4 h-4" />}
                  defaultOpen={false}
                >
                  <Suspense fallback={<Skeleton className="h-20" />}>
                    <MeetingsManager />
                  </Suspense>
                </CollapsibleSection>
              </section>
            )}

            {/* ====================== BLOCO: CRESCIMENTO ====================== */}
            <section className="space-y-4 p-4 rounded-xl bg-card border border-border/50">
              <BlockHeader icon={<GraduationCap className="w-4 h-4" />} title="Crescimento" />

              {/* Conquistas */}
              <Suspense fallback={<Skeleton className="h-24" />}>
                <AchievementBadges compact />
              </Suspense>

              {/* Alicerce Progress - Destaque se não completou */}
              {baseTrackProgress && !baseTrackProgress.isCompleted && (
                <div className="p-4 rounded-lg bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20">
                  <AlicerceProgress
                    trackId={baseTrackProgress.trackId}
                    trackTitle={baseTrackProgress.trackTitle}
                    completedLessons={baseTrackProgress.completedLessons}
                    totalLessons={baseTrackProgress.totalLessons}
                    isCompleted={baseTrackProgress.isCompleted}
                    completedPresencial={baseTrackProgress.completedPresencial}
                  />
                </div>
              )}

              {/* Trilhas */}
              {tracks.length > 0 && (
                <CollapsibleSection 
                  title="Trilhas de Aprendizado" 
                  icon={<BookOpen className="w-4 h-4" />}
                  badge={tracks.length}
                  defaultOpen={true}
                >
                  <div className="space-y-2">
                    {tracks.slice(0, 3).map((track) => (
                      <div
                        key={track.id}
                        onClick={() => navigate(`/trilhas`)}
                        className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-muted/30 hover:border-primary/30 transition-colors cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-foreground truncate">{track.titulo}</h3>
                          <p className="text-xs text-muted-foreground">{track.coursesCount} cursos</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      </div>
                    ))}
                    {tracks.length > 3 && (
                      <button 
                        onClick={() => navigate('/trilhas')}
                        className="w-full text-xs text-primary font-medium flex items-center justify-center gap-1 py-2"
                      >
                        Ver todas ({tracks.length})
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </CollapsibleSection>
              )}
            </section>

            {/* ====================== BLOCO: COMUNIDADE ====================== */}
            <section className="space-y-4 p-4 rounded-xl bg-card border border-border/50">
              <BlockHeader icon={<Users className="w-4 h-4" />} title="Comunidade" />

              {/* Ranking */}
              <CollapsibleSection 
                title="Ranking de XP" 
                icon={<Trophy className="w-4 h-4" />}
                defaultOpen={false}
              >
                <Leaderboard />
              </CollapsibleSection>

              {/* Escalas */}
              {userId && (
                <CollapsibleSection 
                  title="Minhas Escalas" 
                  icon={<CalendarDays className="w-4 h-4" />}
                  defaultOpen={false}
                >
                  <VolunteerSchedules userId={userId} churchId={churchId} />
                </CollapsibleSection>
              )}

              {/* Playbooks */}
              {userId && churchId && (
                <CollapsibleSection 
                  title="Playbooks do Ministério" 
                  icon={<FileText className="w-4 h-4" />}
                  defaultOpen={false}
                >
                  <VolunteerPlaybooks userId={userId} churchId={churchId} />
                </CollapsibleSection>
              )}
            </section>

          </div>
        </PageTransition>
      </AppShell>

      <MentorChatButton />

      <StartPlanModal
        open={showStartModal}
        onOpenChange={setShowStartModal}
        plan={selectedPlanForModal}
        onPlanStarted={handlePlanStarted}
      />
    </>
  );
}
