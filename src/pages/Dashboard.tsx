import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { DailyHabits } from "@/components/StreakDisplay";
import { MentorChatButton } from "@/components/MentorChat";
import { Sidebar } from "@/components/Sidebar";
import { PageTransition } from "@/components/PageTransition";
import { ReadingPlanCard } from "@/components/ReadingPlanCard";
import { AlicerceProgress } from "@/components/AlicerceProgress";
import { DailyVerse } from "@/components/DailyVerse";
import { StartPlanModal } from "@/components/StartPlanModal";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Flame, ChevronRight, Calendar, BookMarked, Play, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
interface Track {
  id: string;
  titulo: string;
  descricao: string | null;
  cover_image: string | null;
  coursesCount: number;
}

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

interface BaseTrackProgress {
  trackId: string;
  trackTitle: string;
  completedLessons: number;
  totalLessons: number;
  isCompleted: boolean;
  completedPresencial: boolean;
}

export default function Dashboard() {
  const [streak, setStreak] = useState(0);
  const [userName, setUserName] = useState<string>('');
  const [xpPoints, setXpPoints] = useState(0);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [readingPlans, setReadingPlans] = useState<ReadingPlanWithProgress[]>([]);
  const [baseTrackProgress, setBaseTrackProgress] = useState<BaseTrackProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlanForModal, setSelectedPlanForModal] = useState<ReadingPlanWithProgress | null>(null);
  const [showStartModal, setShowStartModal] = useState(false);
  const [habits, setHabits] = useState([
    { id: 'leitura', name: 'Leitura Bíblica', completed: false, icon: 'book' as const },
    { id: 'oracao', name: 'Oração', completed: false, icon: 'heart' as const },
  ]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      
      const [profileRes, habitsRes, tracksRes, plansRes, progressRes, baseTrackRes, baseCompletedRes, presencialRes] = await Promise.all([
        supabase.from('profiles').select('nome, current_streak, xp_points').eq('id', session.user.id).maybeSingle(),
        supabase.from('daily_habits').select('habit_type').eq('user_id', session.user.id).eq('completed_date', new Date().toISOString().split('T')[0]),
        supabase.from('tracks').select(`id, titulo, descricao, cover_image, courses(count)`).order('ordem').limit(4),
        supabase.from('reading_plans').select('*').order('duracao_dias', { ascending: false }),
        supabase.from('user_reading_progress').select('*').eq('user_id', session.user.id),
        supabase.from('tracks').select('id, titulo').eq('is_base', true).maybeSingle(),
        supabase.rpc('user_completed_base_track', { _user_id: session.user.id }),
        supabase.from('discipleship_relationships').select('alicerce_completed_presencial').eq('discipulo_id', session.user.id).eq('alicerce_completed_presencial', true).maybeSingle()
      ]);
      
      if (profileRes.data) {
        setUserName(profileRes.data.nome || session.user.email?.split('@')[0] || 'Discípulo');
        setStreak(profileRes.data.current_streak || 0);
        setXpPoints(profileRes.data.xp_points || 0);
      }

      if (habitsRes.data) {
        setHabits(prev => prev.map(h => ({
          ...h,
          completed: habitsRes.data.some(th => th.habit_type === h.id)
        })));
      }

      if (tracksRes.data) {
        const formattedTracks = tracksRes.data.map(track => ({
          id: track.id,
          titulo: track.titulo,
          descricao: track.descricao,
          cover_image: track.cover_image,
          coursesCount: track.courses?.[0]?.count || 0,
        }));
        setTracks(formattedTracks);
      }

      if (plansRes.data) {
        const plansWithProgress = plansRes.data.map(plan => {
          const userProgress = progressRes.data?.find(p => p.plan_id === plan.id);
          return {
            id: plan.id,
            titulo: plan.titulo,
            descricao: plan.descricao,
            duracao_dias: plan.duracao_dias,
            cover_image: plan.cover_image,
            categoria: plan.categoria || 'leitura bíblica',
            currentDay: userProgress?.current_day || 1,
            completedDays: userProgress?.completed_days || [],
            hasProgress: !!userProgress
          };
        });
        setReadingPlans(plansWithProgress);
      }

      if (baseTrackRes.data) {
        const baseTrack = baseTrackRes.data;
        const isCompleted = baseCompletedRes.data === true || !!presencialRes.data;
        
        const { data: lessonsData } = await supabase
          .from('courses')
          .select('id')
          .eq('track_id', baseTrack.id);
        
        if (lessonsData && lessonsData.length > 0) {
          const courseIds = lessonsData.map(c => c.id);
          const [totalLessonsRes, completedLessonsRes] = await Promise.all([
            supabase.from('lessons').select('id', { count: 'exact' }).in('course_id', courseIds),
            supabase.from('user_progress').select('id', { count: 'exact' }).eq('user_id', session.user.id).eq('completed', true).in('lesson_id', 
              (await supabase.from('lessons').select('id').in('course_id', courseIds)).data?.map(l => l.id) || []
            )
          ]);
          
          setBaseTrackProgress({
            trackId: baseTrack.id,
            trackTitle: baseTrack.titulo,
            completedLessons: completedLessonsRes.count || 0,
            totalLessons: totalLessonsRes.count || 0,
            isCompleted,
            completedPresencial: !!presencialRes.data
          });
        }
      }

      setLoading(false);
    };

    checkAuthAndFetchData();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const handleHabitToggle = async (id: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const habit = habits.find(h => h.id === id);
    if (!habit) return;

    const today = new Date().toISOString().split('T')[0];

    if (!habit.completed) {
      const { error } = await supabase
        .from('daily_habits')
        .insert({
          user_id: session.user.id,
          habit_type: id,
          completed_date: today,
        });

      if (!error) {
        setHabits(prev => prev.map(h => 
          h.id === id ? { ...h, completed: true } : h
        ));
        toast({
          title: "Hábito registrado!",
          description: `${habit.name} concluído.`,
        });
      }
    } else {
      const { error } = await supabase
        .from('daily_habits')
        .delete()
        .eq('user_id', session.user.id)
        .eq('habit_type', id)
        .eq('completed_date', today);

      if (!error) {
        setHabits(prev => prev.map(h => 
          h.id === id ? { ...h, completed: false } : h
        ));
      }
    }
  };

  const completedHabits = habits.filter(h => h.completed).length;
  const totalHabits = habits.length;

  // Separate plans by duration
  const annualPlans = readingPlans.filter(p => p.duracao_dias >= 365);
  const semesterPlans = readingPlans.filter(p => p.duracao_dias >= 180 && p.duracao_dias < 365);
  const otherPlans = readingPlans.filter(p => p.duracao_dias < 180);
  const plansInProgress = readingPlans.filter(p => p.hasProgress && p.completedDays.length > 0 && p.completedDays.length < p.duracao_dias);

  const handleOpenStartModal = (plan: ReadingPlanWithProgress) => {
    setSelectedPlanForModal(plan);
    setShowStartModal(true);
  };

  const handlePlanStarted = () => {
    // Refresh plans data
    window.location.reload();
  };

  const getDurationLabel = (days: number) => {
    if (days >= 365) return `${Math.round(days / 365)} ano`;
    if (days >= 180) return `${Math.round(days / 30)} meses`;
    if (days >= 30) return `${Math.round(days / 7)} semanas`;
    return `${days} dias`;
  };

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

            {/* Daily Verse */}
            <DailyVerse />

            {/* Stats Row */}
            <section className="flex gap-3">
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
            </section>

            {/* Progress Bar */}
            <section className="p-3 rounded-lg border border-border/50 bg-card">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-muted-foreground">Hábitos de hoje</span>
                <span className="text-foreground">{completedHabits}/{totalHabits}</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-bar-fill"
                  style={{ width: `${(completedHabits / totalHabits) * 100}%` }}
                />
              </div>
            </section>

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

            {/* Daily Habits */}
            <section className="p-4 rounded-lg border border-border/50 bg-card">
              <h2 className="text-sm font-medium text-foreground mb-3">Seu dia</h2>
              <DailyHabits habits={habits} onToggle={handleHabitToggle} />
            </section>

            {/* Continue Reading - Plans in Progress */}
            {plansInProgress.length > 0 && (
              <section>
                <h2 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                  <BookMarked className="w-4 h-4 text-primary" />
                  Continue sua leitura
                </h2>
                <div className="space-y-2">
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
              </section>
            )}

            {/* Annual Reading Plans - Featured Section */}
            {(loading || annualPlans.length > 0) && (
              <section className="pt-2">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-primary" />
                  <h2 className="text-sm font-medium text-foreground">Planos Anuais de Leitura Bíblica</h2>
                </div>
                
                {loading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-32 rounded-xl" />
                  </div>
                ) : (
                  <div className="space-y-3">
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
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h3 className="font-medium text-foreground mb-0.5">{plan.titulo}</h3>
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
                                        <div 
                                          className="h-full bg-primary rounded-full transition-all"
                                          style={{ width: `${progress}%` }}
                                        />
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => navigate(`/plano/${plan.id}`)}
                                      className="text-xs text-primary font-medium hover:underline"
                                    >
                                      Continuar
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <span className="text-[10px] text-muted-foreground flex-shrink-0">
                                      {getDurationLabel(plan.duracao_dias)}
                                    </span>
                                    <button
                                      onClick={() => handleOpenStartModal(plan)}
                                      className="ml-auto px-3 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors"
                                    >
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
              </section>
            )}

            {/* Semester Reading Plans */}
            {(loading || semesterPlans.length > 0) && (
              <section className="pt-2">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-primary" />
                  <h2 className="text-sm font-medium text-foreground">Planos de 6 Meses</h2>
                </div>
                
                {loading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-28 rounded-xl" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {semesterPlans.map((plan) => {
                      const progress = Math.round((plan.completedDays.length / plan.duracao_dias) * 100);
                      const isStarted = plan.hasProgress;
                      
                      return (
                        <div
                          key={plan.id}
                          className="relative overflow-hidden rounded-xl bg-card border border-border hover:border-primary/30 transition-all"
                        >
                          <div className="flex items-start gap-4 p-4">
                            <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                              <img
                                src={plan.cover_image || "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=200&auto=format&fit=crop"}
                                alt={plan.titulo}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-foreground text-sm mb-0.5">{plan.titulo}</h3>
                              <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{plan.descricao}</p>
                              <div className="flex items-center gap-2">
                                {isStarted ? (
                                  <>
                                    <div className="flex-1">
                                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                        <div 
                                          className="h-full bg-primary rounded-full transition-all"
                                          style={{ width: `${progress}%` }}
                                        />
                                      </div>
                                    </div>
                                    <span className="text-[10px] text-primary font-medium">{progress}%</span>
                                    <button
                                      onClick={() => navigate(`/plano/${plan.id}`)}
                                      className="text-xs text-primary font-medium hover:underline"
                                    >
                                      Continuar
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <span className="text-[10px] text-muted-foreground">{getDurationLabel(plan.duracao_dias)}</span>
                                    <button
                                      onClick={() => handleOpenStartModal(plan)}
                                      className="ml-auto px-3 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors"
                                    >
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
              </section>
            )}

            {/* Other Reading Plans */}
            {(loading || otherPlans.length > 0) && (
              <section>
                <h2 className="text-sm font-medium text-foreground mb-3">Planos Curtos</h2>
                
                {loading ? (
                  <div className="grid grid-cols-2 gap-3">
                    {[1, 2].map((i) => (
                      <Skeleton key={i} className="h-40 rounded-xl" />
                    ))}
                  </div>
                ) : (
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
                )}
              </section>
            )}

            {/* Tracks */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-medium text-foreground">Trilhas</h2>
                <button 
                  onClick={() => navigate('/trilhas')}
                  className="text-xs text-primary font-medium flex items-center gap-1"
                >
                  Ver todas
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 rounded-lg" />
                  ))}
                </div>
              ) : (
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
                </div>
              )}
            </section>

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
