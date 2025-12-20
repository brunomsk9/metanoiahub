import { useState, useCallback, memo, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { MentorChatButton } from "@/components/MentorChat";
import { Sidebar } from "@/components/Sidebar";
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
import { BookOpen, Flame, ChevronRight, BookMarked, Play, Users, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboardData } from "@/hooks/useDashboardData";

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

const SectionSkeleton = memo(() => (
  <div className="space-y-2">
    <Skeleton className="h-4 w-24" />
    <Skeleton className="h-20 rounded-lg" />
  </div>
));

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
      <div className="min-h-screen bg-background">
        <Sidebar onLogout={handleLogout} userName="" />
        <main className="pt-14 lg:pt-16 pb-24">
          <div className="px-4 lg:px-6 max-w-2xl mx-auto space-y-6">
            <SectionSkeleton />
            <SectionSkeleton />
            <SectionSkeleton />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar onLogout={handleLogout} userName={userName} />
      
      <PageTransition>
        <main className="pt-14 lg:pt-16 pb-24">
          <div className="px-4 lg:px-6 max-w-2xl mx-auto space-y-6">
            
            {/* Greeting */}
            <header className="pt-4">
              <p className="text-muted-foreground text-sm">Olá,</p>
              <h1 className="text-xl font-semibold text-foreground">{userName}</h1>
            </header>

            {/* Versículo do Dia */}
            <section className="space-y-2">
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Versículo do Dia</h2>
              <DailyVerse />
            </section>

            {/* Seu Dia - Stats e Hábitos */}
            <section className="space-y-4">
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Seu Dia</h2>
              
              {/* Stats Cards */}
              <div className="flex gap-3">
                <div className="flex-1 p-3 rounded-lg bg-muted/50 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <Flame className="w-4 h-4 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-foreground">{streak}</p>
                    <p className="text-[10px] text-muted-foreground">dias seguidos</p>
                  </div>
                </div>
                <div className="flex-1 p-3 rounded-lg bg-muted/50">
                  <p className="text-lg font-semibold text-foreground">{xpPoints}</p>
                  <p className="text-[10px] text-muted-foreground">XP total</p>
                </div>
              </div>

              {/* Hábitos de Hoje */}
              <div className="space-y-3">
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

              {/* Conquistas */}
              <Suspense fallback={<Skeleton className="h-32" />}>
                <AchievementBadges compact />
              </Suspense>

              {/* Alicerce Progress */}
              {baseTrackProgress && !baseTrackProgress.isCompleted && (
                <AlicerceProgress
                  trackId={baseTrackProgress.trackId}
                  trackTitle={baseTrackProgress.trackTitle}
                  completedLessons={baseTrackProgress.completedLessons}
                  totalLessons={baseTrackProgress.totalLessons}
                  isCompleted={baseTrackProgress.isCompleted}
                  completedPresencial={baseTrackProgress.completedPresencial}
                />
              )}
            </section>

            {/* Meu Discipulado - apenas para discipuladores */}
            {isDiscipulador && userId && (
              <section className="space-y-4">
                <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Meu Discipulado</h2>
                
                {/* Checklist Semanal */}
                <div className="p-4 rounded-lg border border-border/50 bg-card">
                  <Suspense fallback={<Skeleton className="h-20" />}>
                    <WeeklyChecklist userId={userId} />
                  </Suspense>
                </div>

                {/* Cards de Discípulos */}
                <Suspense fallback={<Skeleton className="h-32" />}>
                  <DiscipuladorDashboardCards />
                </Suspense>

                {/* Gerenciador de Encontros */}
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

            {/* Ranking de XP */}
            <CollapsibleSection 
              title="Ranking" 
              icon={<Trophy className="w-4 h-4" />}
              defaultOpen={false}
            >
              <Leaderboard />
            </CollapsibleSection>

            {/* Leitura Bíblica */}
            <CollapsibleSection 
              title="Leitura Bíblica" 
              icon={<BookMarked className="w-4 h-4" />}
              badge={plansInProgress.length > 0 ? `${plansInProgress.length} em andamento` : undefined}
            >
              <div className="space-y-6">
                {/* Continue Reading */}
                {plansInProgress.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Continue sua leitura</h3>
                    {plansInProgress.slice(0, 2).map((plan) => {
                      const progress = Math.round((plan.completedDays.length / plan.duracao_dias) * 100);
                      return (
                        <button
                          key={plan.id}
                          onClick={() => navigate(`/plano/${plan.id}`)}
                          className="w-full flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors text-left"
                        >
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
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

                {/* Annual Plans */}
                {annualPlans.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Planos Anuais</h3>
                    {annualPlans.map((plan, index) => {
                      const progress = Math.round((plan.completedDays.length / plan.duracao_dias) * 100);
                      const isStarted = plan.hasProgress;
                      return (
                        <div
                          key={plan.id}
                          className={cn(
                            "relative overflow-hidden rounded-xl transition-all",
                            index === 0 ? "bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30" : "bg-card border border-border hover:border-primary/30"
                          )}
                        >
                          <div className="flex items-start gap-4 p-4">
                            <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                              <img
                                src={plan.cover_image || "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=200&auto=format&fit=crop"}
                                alt={plan.titulo}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h4 className="font-medium text-foreground mb-0.5">{plan.titulo}</h4>
                                  <p className="text-xs text-muted-foreground line-clamp-2">{plan.descricao}</p>
                                </div>
                                {isStarted && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/20 text-primary flex-shrink-0">
                                    {progress}%
                                  </span>
                                )}
                              </div>
                              <div className="mt-3 flex items-center gap-3">
                                {isStarted ? (
                                  <>
                                    <div className="flex-1">
                                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
                                      </div>
                                    </div>
                                    <button onClick={() => navigate(`/plano/${plan.id}`)} className="text-xs text-primary font-medium hover:underline">
                                      Continuar
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <span className="text-[10px] text-muted-foreground flex-shrink-0">{getDurationLabel(plan.duracao_dias)}</span>
                                    <button onClick={() => handleOpenStartModal(plan)} className="ml-auto px-3 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors">
                                      Iniciar
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Semester Plans */}
                {semesterPlans.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Planos de 6 Meses</h3>
                    {semesterPlans.map((plan) => {
                      const progress = Math.round((plan.completedDays.length / plan.duracao_dias) * 100);
                      const isStarted = plan.hasProgress;
                      return (
                        <div key={plan.id} className="relative overflow-hidden rounded-xl bg-card border border-border hover:border-primary/30 transition-all">
                          <div className="flex items-start gap-4 p-4">
                            <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                              <img src={plan.cover_image || "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=200&auto=format&fit=crop"} alt={plan.titulo} className="w-full h-full object-cover" loading="lazy" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-foreground text-sm mb-0.5">{plan.titulo}</h4>
                              <div className="flex items-center gap-3">
                                {isStarted ? (
                                  <>
                                    <div className="flex-1">
                                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
                                      </div>
                                    </div>
                                    <span className="text-xs text-primary font-medium">{progress}%</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="text-[10px] text-muted-foreground">{getDurationLabel(plan.duracao_dias)}</span>
                                    <button onClick={() => handleOpenStartModal(plan)} className="ml-auto px-3 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors">
                                      Iniciar
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Other Plans */}
                {otherPlans.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Planos Curtos</h3>
                    <div className="grid grid-cols-2 gap-3">
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

            {/* Trilhas */}
            <CollapsibleSection 
              title="Trilhas" 
              icon={<BookOpen className="w-4 h-4" />}
              badge={tracks.length}
            >
              <div className="space-y-2">
                {tracks.map((track) => (
                  <div
                    key={track.id}
                    onClick={() => navigate(`/trilhas`)}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-card hover:border-primary/30 transition-colors cursor-pointer"
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
                <button 
                  onClick={() => navigate('/trilhas')}
                  className="w-full text-xs text-primary font-medium flex items-center justify-center gap-1 py-2"
                >
                  Ver todas
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </CollapsibleSection>

          </div>
        </main>
      </PageTransition>

      <MentorChatButton />

      <StartPlanModal
        open={showStartModal}
        onOpenChange={setShowStartModal}
        plan={selectedPlanForModal}
        onPlanStarted={handlePlanStarted}
      />
    </div>
  );
}
