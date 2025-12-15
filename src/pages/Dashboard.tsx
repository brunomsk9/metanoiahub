import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { HealthRadial, DailyHabits } from "@/components/StreakDisplay";
import { TrackCard } from "@/components/ContinueWatching";
import { MentorChatButton } from "@/components/MentorChat";
import { Sidebar } from "@/components/Sidebar";
import { PageTransition } from "@/components/PageTransition";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, ArrowRight, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Track {
  id: string;
  titulo: string;
  descricao: string | null;
  cover_image: string | null;
  coursesCount: number;
}

export default function Dashboard() {
  const [streak, setStreak] = useState(0);
  const [healthScore, setHealthScore] = useState(0);
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
        const healthFromXP = Math.min(50, (profile.xp_points || 0) / 10);
        const healthFromStreak = Math.min(50, (profile.current_streak || 0) * 5);
        setHealthScore(Math.round(healthFromXP + healthFromStreak));
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
        .limit(3);

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
          description: `${habit.name} concluído para hoje.`,
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

  const handleTrackSelect = (id: string) => {
    navigate(`/trilha/${id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar onLogout={handleLogout} userName={userName} />
      
      <PageTransition>
        <main className="pt-16 lg:pt-20 pb-8">
          <div className="px-4 lg:px-8 max-w-6xl mx-auto space-y-8">
            {/* Minimal Header */}
            <header className="pt-4">
              <h1 className="text-3xl lg:text-4xl font-display font-bold text-foreground tracking-tight">
                Olá, {userName}
              </h1>
              <p className="text-muted-foreground mt-1">Continue sua jornada de transformação</p>
            </header>

            {/* Stats Row - Minimal */}
            <section className="flex flex-wrap gap-6 items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Flame className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{streak}</p>
                  <p className="text-xs text-muted-foreground">dias seguidos</p>
                </div>
              </div>
              
              <div className="h-8 w-px bg-border hidden sm:block" />
              
              <div>
                <p className="text-2xl font-bold text-foreground">{xpPoints} <span className="text-sm font-normal text-muted-foreground">XP</span></p>
              </div>
              
              <div className="h-8 w-px bg-border hidden sm:block" />
              
              <HealthRadial percentage={healthScore} label="Saúde" className="scale-75" />
            </section>

            {/* Daily Habits - Compact */}
            <section className="bg-card border border-border rounded-2xl p-5">
              <h2 className="text-sm font-medium text-muted-foreground mb-4">Hábitos de hoje</h2>
              <DailyHabits habits={habits} onToggle={handleHabitToggle} />
            </section>

            {/* Quick Actions - Minimal */}
            <section className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => navigate('/trilhas')}
                className="text-left p-5 rounded-2xl bg-primary/5 hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-all group"
              >
                <BookOpen className="w-5 h-5 text-primary mb-3" />
                <p className="font-medium text-foreground">Trilhas</p>
                <p className="text-xs text-muted-foreground">Aprendizado estruturado</p>
              </button>
              
              <button 
                onClick={() => navigate('/sos')}
                className="text-left p-5 rounded-2xl bg-accent/5 hover:bg-accent/10 border border-transparent hover:border-accent/20 transition-all group"
              >
                <svg className="w-5 h-5 text-accent mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <p className="font-medium text-foreground">S.O.S.</p>
                <p className="text-xs text-muted-foreground">Ajuda rápida</p>
              </button>
            </section>

            {/* Tracks - Clean Grid */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-display font-semibold text-foreground">Trilhas</h2>
                <Button variant="ghost" size="sm" onClick={() => navigate('/trilhas')} className="text-primary hover:text-primary/80">
                  Ver todas
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
              
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-2xl overflow-hidden">
                      <Skeleton className="h-44 w-full" />
                    </div>
                  ))}
                </div>
              ) : tracks.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tracks.map((track) => (
                    <TrackCard
                      key={track.id}
                      id={track.id}
                      title={track.titulo}
                      description={track.descricao || ''}
                      thumbnail={track.cover_image || 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=800&auto=format&fit=crop'}
                      coursesCount={track.coursesCount}
                      onClick={handleTrackSelect}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BookOpen className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">Nenhuma trilha disponível ainda</p>
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
