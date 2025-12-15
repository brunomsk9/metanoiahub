import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DailyHabits } from "@/components/StreakDisplay";
import { MentorChatButton } from "@/components/MentorChat";
import { Sidebar } from "@/components/Sidebar";
import { PageTransition } from "@/components/PageTransition";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, ArrowRight, Flame, Play, ChevronRight } from "lucide-react";

interface Track {
  id: string;
  titulo: string;
  descricao: string | null;
  cover_image: string | null;
  coursesCount: number;
}

// Versículo do dia (pode ser dinâmico futuramente)
const verseOfDay = {
  text: "Ensina-me, Senhor, o teu caminho, e andarei na tua verdade; une o meu coração ao temor do teu nome.",
  reference: "Salmos 86:11"
};

export default function Dashboard() {
  const [streak, setStreak] = useState(0);
  const [userName, setUserName] = useState<string>('');
  const [xpPoints, setXpPoints] = useState(0);
  const [tracks, setTracks] = useState<Track[]>([]);
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
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('nome, current_streak, xp_points')
        .eq('id', session.user.id)
        .maybeSingle();
      
      if (profile) {
        setUserName(profile.nome || session.user.email?.split('@')[0] || 'Discípulo');
        setStreak(profile.current_streak || 0);
        setXpPoints(profile.xp_points || 0);
      }

      const today = new Date().toISOString().split('T')[0];
      const { data: todayHabits } = await supabase
        .from('daily_habits')
        .select('habit_type')
        .eq('user_id', session.user.id)
        .eq('completed_date', today);

      if (todayHabits) {
        setHabits(prev => prev.map(h => ({
          ...h,
          completed: todayHabits.some(th => th.habit_type === h.id)
        })));
      }

      const { data: tracksData } = await supabase
        .from('tracks')
        .select(`id, titulo, descricao, cover_image, courses(count)`)
        .order('ordem')
        .limit(4);

      if (tracksData) {
        const formattedTracks = tracksData.map(track => ({
          id: track.id,
          titulo: track.titulo,
          descricao: track.descricao,
          cover_image: track.cover_image,
          coursesCount: track.courses?.[0]?.count || 0,
        }));
        setTracks(formattedTracks);
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
              <h1 className="text-2xl font-display font-bold text-foreground">
                {userName}
              </h1>
            </header>

            {/* Verse of the Day Card */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-primary/80 p-6 text-primary-foreground">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
              
              <p className="text-xs uppercase tracking-wider opacity-80 mb-3">Versículo do Dia</p>
              <p className="text-lg font-serif italic leading-relaxed mb-4 relative z-10">
                "{verseOfDay.text}"
              </p>
              <p className="text-sm font-medium opacity-90">{verseOfDay.reference}</p>
            </section>

            {/* Streak & Progress */}
            <section className="bg-card rounded-2xl border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
                    <Flame className="w-6 h-6 text-warning" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{streak}</p>
                    <p className="text-xs text-muted-foreground">dias seguidos</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-foreground">{xpPoints}</p>
                  <p className="text-xs text-muted-foreground">XP total</p>
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Hábitos de hoje</span>
                  <span className="text-foreground font-medium">{completedHabits}/{totalHabits}</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                    style={{ width: `${(completedHabits / totalHabits) * 100}%` }}
                  />
                </div>
              </div>
            </section>

            {/* Daily Habits */}
            <section className="bg-card rounded-2xl border border-border p-5">
              <h2 className="text-sm font-semibold text-foreground mb-4">Seu dia</h2>
              <DailyHabits habits={habits} onToggle={handleHabitToggle} />
            </section>

            {/* Continue Learning - Netflix style */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-display font-semibold text-foreground">Continuar aprendendo</h2>
                <button 
                  onClick={() => navigate('/trilhas')}
                  className="text-sm text-primary font-medium flex items-center gap-1 hover:underline"
                >
                  Ver todas
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              
              {loading ? (
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="flex-shrink-0 w-40 h-52 rounded-2xl" />
                  ))}
                </div>
              ) : tracks.length > 0 ? (
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                  {tracks.map((track) => (
                    <button
                      key={track.id}
                      onClick={() => navigate(`/trilha/${track.id}`)}
                      className="flex-shrink-0 w-40 group"
                    >
                      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden mb-2">
                        <img 
                          src={track.cover_image || 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=400&auto=format&fit=crop'} 
                          alt={track.titulo}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <div className="absolute bottom-3 left-3 right-3">
                          <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center mb-2 group-hover:bg-white transition-colors">
                            <Play className="w-4 h-4 text-primary fill-primary ml-0.5" />
                          </div>
                        </div>
                      </div>
                      <p className="text-sm font-medium text-foreground text-left line-clamp-2">{track.titulo}</p>
                      <p className="text-xs text-muted-foreground text-left">{track.coursesCount} cursos</p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="bg-card rounded-2xl border border-border p-8 text-center">
                  <BookOpen className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">Nenhuma trilha disponível</p>
                </div>
              )}
            </section>

            {/* Quick Actions */}
            <section className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => navigate('/trilhas')}
                className="bg-card rounded-2xl border border-border p-4 text-left hover:border-primary/30 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <p className="font-medium text-foreground text-sm">Trilhas</p>
                <p className="text-xs text-muted-foreground">Aprendizado guiado</p>
              </button>
              
              <button 
                onClick={() => navigate('/sos')}
                className="bg-card rounded-2xl border border-border p-4 text-left hover:border-accent/30 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-3 group-hover:bg-accent/20 transition-colors">
                  <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <p className="font-medium text-foreground text-sm">S.O.S.</p>
                <p className="text-xs text-muted-foreground">Ajuda pastoral</p>
              </button>
            </section>

          </div>
        </main>
      </PageTransition>

      <MentorChatButton />
    </div>
  );
}
