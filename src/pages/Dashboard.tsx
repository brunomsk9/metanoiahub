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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Flame, ChevronRight } from "lucide-react";

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
  currentDay: number;
  completedDays: number[];
}

interface BaseTrackProgress {
  trackId: string;
  trackTitle: string;
  completedLessons: number;
  totalLessons: number;
  isCompleted: boolean;
  completedPresencial: boolean;
}

const fadeIn = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 }
};

export default function Dashboard() {
  const [streak, setStreak] = useState(0);
  const [userName, setUserName] = useState<string>('');
  const [xpPoints, setXpPoints] = useState(0);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [readingPlans, setReadingPlans] = useState<ReadingPlanWithProgress[]>([]);
  const [baseTrackProgress, setBaseTrackProgress] = useState<BaseTrackProgress | null>(null);
  const [loading, setLoading] = useState(true);
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
        supabase.from('reading_plans').select('*').order('created_at').limit(4),
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
            currentDay: userProgress?.current_day || 1,
            completedDays: userProgress?.completed_days || []
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

  return (
    <div className="min-h-screen bg-background">
      <Sidebar onLogout={handleLogout} userName={userName} />
      
      <PageTransition>
        <main className="pt-16 lg:pt-20 pb-24">
          <div className="px-4 lg:px-6 max-w-2xl mx-auto space-y-6">
            
            {/* Greeting */}
            <header className="pt-2">
              <p className="text-muted-foreground text-sm">Olá,</p>
              <h1 className="text-2xl font-semibold text-foreground">{userName}</h1>
            </header>

            {/* Daily Verse */}
            <DailyVerse />

            {/* Stats Row */}
            <section className="flex gap-4">
              <div className="flex-1 stats-card flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Flame className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-xl font-semibold text-foreground">{streak}</p>
                  <p className="text-xs text-muted-foreground">dias seguidos</p>
                </div>
              </div>
              <div className="flex-1 stats-card">
                <p className="text-xl font-semibold text-foreground">{xpPoints}</p>
                <p className="text-xs text-muted-foreground">XP total</p>
              </div>
            </section>

            {/* Progress Bar */}
            <section className="card-elevated p-4">
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
            <section className="card-elevated p-4">
              <h2 className="text-sm font-medium text-foreground mb-3">Seu dia</h2>
              <DailyHabits habits={habits} onToggle={handleHabitToggle} />
            </section>

            {/* Reading Plans */}
            {(loading || readingPlans.length > 0) && (
              <section>
                <h2 className="text-base font-semibold text-foreground mb-3">Planos de Leitura</h2>
                
                {loading ? (
                  <div className="grid grid-cols-2 gap-3">
                    {[1, 2].map((i) => (
                      <Skeleton key={i} className="h-40 rounded-xl" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {readingPlans.map((plan) => (
                      <ReadingPlanCard
                        key={plan.id}
                        id={plan.id}
                        titulo={plan.titulo}
                        descricao={plan.descricao}
                        coverImage={plan.cover_image}
                        duracaoDias={plan.duracao_dias}
                        currentDay={plan.currentDay}
                        completedDays={plan.completedDays}
                        onClick={(id) => navigate(`/plano/${id}`)}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Tracks */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-foreground">Trilhas</h2>
                <button 
                  onClick={() => navigate('/trilhas')}
                  className="text-sm text-primary font-medium flex items-center gap-1"
                >
                  Ver todas
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 rounded-xl" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {tracks.map((track) => (
                    <div
                      key={track.id}
                      onClick={() => navigate(`/trilhas`)}
                      className="track-card flex items-center gap-4 cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground truncate">{track.titulo}</h3>
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
    </div>
  );
}
