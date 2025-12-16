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
import { BookOpen, Flame, Play, ChevronRight, Sparkles } from "lucide-react";

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

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
    },
  },
} as const;

const glowVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.6,
    },
  },
} as const;

const slideInLeft = {
  hidden: { opacity: 0, x: -50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
    },
  },
} as const;

const slideInRight = {
  hidden: { opacity: 0, x: 50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
    },
  },
} as const;

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
      
      // Fetch all data in parallel
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

      // Combine reading plans with user progress
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

      // Fetch base track progress
      if (baseTrackRes.data) {
        const baseTrack = baseTrackRes.data;
        const isCompleted = baseCompletedRes.data === true || !!presencialRes.data;
        
        // Get lessons count for base track
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
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-[100px]" />
      </div>

      <Sidebar onLogout={handleLogout} userName={userName} />
      
      <PageTransition>
        <main className="pt-16 lg:pt-20 pb-24 relative z-10">
          <motion.div 
            className="px-4 lg:px-6 max-w-2xl mx-auto space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            
            {/* Greeting with glow effect */}
            <motion.header 
              className="pt-2"
              variants={slideInLeft}
            >
              <motion.p 
                className="text-muted-foreground text-sm flex items-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Sparkles className="w-3 h-3 text-primary animate-pulse" />
                Olá,
              </motion.p>
              <motion.h1 
                className="text-3xl font-display font-bold text-foreground"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
              >
                <span className="text-gradient-primary">{userName}</span>
              </motion.h1>
            </motion.header>

            {/* Daily Verse with entrance animation */}
            <motion.div variants={glowVariants}>
              <DailyVerse />
            </motion.div>

            {/* Streak & Progress Card */}
            <motion.section 
              className="bg-card/80 backdrop-blur-xl rounded-2xl border border-border/50 p-5 relative overflow-hidden"
              variants={itemVariants}
              whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
            >
              {/* Glow effect on card */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-warning/10 rounded-full blur-[60px]" />
              
              <div className="flex items-center justify-between mb-4 relative z-10">
                <motion.div 
                  className="flex items-center gap-3"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <motion.div 
                    className="w-14 h-14 rounded-full bg-gradient-to-br from-warning/20 to-warning/5 flex items-center justify-center border border-warning/30"
                    animate={{ 
                      boxShadow: [
                        "0 0 20px hsl(var(--warning) / 0.2)",
                        "0 0 40px hsl(var(--warning) / 0.4)",
                        "0 0 20px hsl(var(--warning) / 0.2)"
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Flame className="w-7 h-7 text-warning" />
                  </motion.div>
                  <div>
                    <motion.p 
                      className="text-3xl font-bold text-foreground"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                    >
                      {streak}
                    </motion.p>
                    <p className="text-xs text-muted-foreground">dias seguidos</p>
                  </div>
                </motion.div>
                <motion.div 
                  className="text-right"
                  variants={slideInRight}
                >
                  <p className="text-xl font-bold text-gradient-accent">{xpPoints}</p>
                  <p className="text-xs text-muted-foreground">XP total</p>
                </motion.div>
              </div>
              
              {/* Animated progress bar */}
              <div className="space-y-2 relative z-10">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Hábitos de hoje</span>
                  <span className="text-foreground font-medium">{completedHabits}/{totalHabits}</span>
                </div>
                <div className="h-2.5 bg-secondary/50 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full rounded-full relative"
                    style={{ 
                      background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))"
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(completedHabits / totalHabits) * 100}%` }}
                    transition={{ delay: 0.6, duration: 1, ease: "easeOut" }}
                  >
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      animate={{ x: ["-100%", "200%"] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                    />
                  </motion.div>
                </div>
              </div>
            </motion.section>

            {/* Alicerce Progress */}
            {baseTrackProgress && !baseTrackProgress.isCompleted && (
              <motion.section variants={itemVariants}>
                <AlicerceProgress
                  trackId={baseTrackProgress.trackId}
                  trackTitle={baseTrackProgress.trackTitle}
                  completedLessons={baseTrackProgress.completedLessons}
                  totalLessons={baseTrackProgress.totalLessons}
                  isCompleted={baseTrackProgress.isCompleted}
                  completedPresencial={baseTrackProgress.completedPresencial}
                />
              </motion.section>
            )}

            {/* Daily Habits */}
            <motion.section 
              className="bg-card/80 backdrop-blur-xl rounded-2xl border border-border/50 p-5"
              variants={itemVariants}
            >
              <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Seu dia
              </h2>
              <DailyHabits habits={habits} onToggle={handleHabitToggle} />
            </motion.section>

            {/* Reading Plans - YouVersion style */}
            {(loading || readingPlans.length > 0) && (
              <motion.section variants={itemVariants}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-display font-semibold text-foreground">Planos de Leitura</h2>
                </div>
                
                {loading ? (
                  <div className="grid grid-cols-2 gap-3">
                    {[1, 2].map((i) => (
                      <Skeleton key={i} className="h-48 rounded-2xl" />
                    ))}
                  </div>
                ) : (
                  <motion.div 
                    className="grid grid-cols-2 gap-3"
                    variants={containerVariants}
                  >
                    {readingPlans.map((plan, index) => (
                      <motion.div
                        key={plan.id}
                        variants={itemVariants}
                        custom={index}
                        whileHover={{ scale: 1.03, y: -4 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <ReadingPlanCard
                          id={plan.id}
                          titulo={plan.titulo}
                          descricao={plan.descricao}
                          coverImage={plan.cover_image}
                          duracaoDias={plan.duracao_dias}
                          currentDay={plan.currentDay}
                          completedDays={plan.completedDays}
                          onClick={(id) => navigate(`/plano/${id}`)}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </motion.section>
            )}

            {/* Continue Learning - Netflix style */}
            <motion.section variants={itemVariants}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-display font-semibold text-foreground">Trilhas</h2>
                <motion.button 
                  onClick={() => navigate('/trilhas')}
                  className="text-sm text-primary font-medium flex items-center gap-1 hover:gap-2 transition-all"
                  whileHover={{ x: 4 }}
                >
                  Ver todas
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              </div>
              
              {loading ? (
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="flex-shrink-0 w-40 h-52 rounded-2xl" />
                  ))}
                </div>
              ) : tracks.length > 0 ? (
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                  {tracks.map((track, index) => (
                    <motion.button
                      key={track.id}
                      onClick={() => navigate(`/trilha/${track.id}`)}
                      className="flex-shrink-0 w-40 group"
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.1, type: "spring", stiffness: 100 }}
                      whileHover={{ scale: 1.05, y: -8 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden mb-2 border border-border/30">
                        <img 
                          src={track.cover_image || 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=400&auto=format&fit=crop'} 
                          alt={track.titulo}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                        <motion.div 
                          className="absolute bottom-3 left-3 right-3"
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.7 + index * 0.1 }}
                        >
                          <div className="w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center mb-2 group-hover:bg-primary group-hover:scale-110 transition-all shadow-glow">
                            <Play className="w-5 h-5 text-primary-foreground fill-primary-foreground ml-0.5" />
                          </div>
                        </motion.div>
                      </div>
                      <p className="text-sm font-medium text-foreground text-left line-clamp-2">{track.titulo}</p>
                      <p className="text-xs text-muted-foreground text-left">{track.coursesCount} cursos</p>
                    </motion.button>
                  ))}
                </div>
              ) : (
                <div className="bg-card/80 backdrop-blur-xl rounded-2xl border border-border/50 p-8 text-center">
                  <BookOpen className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">Nenhuma trilha disponível</p>
                </div>
              )}
            </motion.section>

            {/* Quick Actions */}
            <motion.section 
              className="grid grid-cols-2 gap-3"
              variants={containerVariants}
            >
              <motion.button 
                onClick={() => navigate('/trilhas')}
                className="bg-card/80 backdrop-blur-xl rounded-2xl border border-border/50 p-5 text-left group relative overflow-hidden"
                variants={itemVariants}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <motion.div 
                  className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 relative z-10 border border-primary/20"
                  whileHover={{ rotate: 5, scale: 1.1 }}
                >
                  <BookOpen className="w-6 h-6 text-primary" />
                </motion.div>
                <p className="font-semibold text-foreground relative z-10">Trilhas</p>
                <p className="text-xs text-muted-foreground relative z-10">Aprendizado guiado</p>
              </motion.button>
              
              <motion.button 
                onClick={() => navigate('/sos')}
                className="bg-card/80 backdrop-blur-xl rounded-2xl border border-border/50 p-5 text-left group relative overflow-hidden"
                variants={itemVariants}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <motion.div 
                  className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-3 relative z-10 border border-accent/20"
                  whileHover={{ rotate: -5, scale: 1.1 }}
                >
                  <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </motion.div>
                <p className="font-semibold text-foreground relative z-10">S.O.S.</p>
                <p className="text-xs text-muted-foreground relative z-10">Ajuda pastoral</p>
              </motion.button>
            </motion.section>

          </motion.div>
        </main>
      </PageTransition>

      <MentorChatButton />
    </div>
  );
}
