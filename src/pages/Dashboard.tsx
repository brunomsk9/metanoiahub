import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { StreakDisplay, HealthRadial, DailyHabits } from "@/components/StreakDisplay";
import { TrackCard } from "@/components/ContinueWatching";
import { MentorChatButton } from "@/components/MentorChat";
import { Sidebar } from "@/components/Sidebar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Target, TrendingUp, Calendar, ArrowRight } from "lucide-react";
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
      
      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('nome, current_streak, xp_points')
        .eq('id', session.user.id)
        .maybeSingle();
      
      if (profile) {
        setUserName(profile.nome || session.user.email?.split('@')[0] || 'Discípulo');
        setStreak(profile.current_streak || 0);
        setXpPoints(profile.xp_points || 0);
        // Calculate health score based on XP and streak
        const healthFromXP = Math.min(50, (profile.xp_points || 0) / 10);
        const healthFromStreak = Math.min(50, (profile.current_streak || 0) * 5);
        setHealthScore(Math.round(healthFromXP + healthFromStreak));
      }

      // Check today's habits
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

      // Fetch tracks with course count
      const { data: tracksData } = await supabase
        .from('tracks')
        .select(`
          id,
          titulo,
          descricao,
          cover_image,
          courses(count)
        `)
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
          title: "Hábito registrado! 🎉",
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

  const currentDate = new Date().toLocaleDateString('pt-BR', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });

  return (
    <div className="min-h-screen bg-background">
      <Sidebar onLogout={handleLogout} userName={userName} />
      
      <main className="pt-14 lg:pt-16">
        <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
          {/* Welcome Header */}
          <section className="animate-fade-in">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
                  Olá, {userName}! 👋
                </h1>
                <p className="text-muted-foreground capitalize">{currentDate}</p>
              </div>
              <Button onClick={() => navigate('/trilhas')} className="bg-gradient-primary hover:opacity-90 shadow-glow">
                Continuar Jornada
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </section>

          {/* Stats Overview */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up">
            {/* Streak Card */}
            <div className="card-premium p-5 col-span-1">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
                  <Target className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold text-foreground">{streak}</p>
                  <p className="text-xs text-muted-foreground">Dias de Streak</p>
                </div>
              </div>
            </div>

            {/* XP Card */}
            <div className="card-premium p-5 col-span-1">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-accent flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold text-foreground">{xpPoints}</p>
                  <p className="text-xs text-muted-foreground">Pontos XP</p>
                </div>
              </div>
            </div>

            {/* Health Radial */}
            <div className="card-premium p-4 col-span-1 flex items-center justify-center">
              <HealthRadial percentage={healthScore} label="Saúde Espiritual" />
            </div>

            {/* Habits Card */}
            <div className="card-premium p-5 col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-medium text-foreground">Hábitos de Hoje</h3>
              </div>
              <DailyHabits habits={habits} onToggle={handleHabitToggle} />
            </div>
          </section>

          {/* Quick Actions */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div 
              onClick={() => navigate('/trilhas')}
              className="card-premium p-6 cursor-pointer group hover:border-primary/30 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-foreground mb-1">Trilhas de Aprendizado</h3>
              <p className="text-sm text-muted-foreground">Continue sua jornada de discipulado</p>
            </div>

            <div 
              onClick={() => navigate('/sos')}
              className="card-premium p-6 cursor-pointer group hover:border-accent/30 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="font-display font-semibold text-foreground mb-1">S.O.S. Discipulador</h3>
              <p className="text-sm text-muted-foreground">Recursos para situações específicas</p>
            </div>

            <div 
              onClick={() => navigate('/perfil')}
              className="card-premium p-6 cursor-pointer group hover:border-success/30 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center mb-4 group-hover:bg-success/20 transition-colors">
                <svg className="w-6 h-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="font-display font-semibold text-foreground mb-1">Meu Perfil</h3>
              <p className="text-sm text-muted-foreground">Veja seu progresso e conquistas</p>
            </div>
          </section>

          {/* Tracks */}
          <section className="space-y-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-display font-semibold text-foreground">
                Trilhas Disponíveis
              </h2>
              <Button variant="ghost" size="sm" onClick={() => navigate('/trilhas')} className="text-primary">
                Ver todas
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="card-premium p-4 space-y-3">
                    <Skeleton className="h-40 w-full rounded-xl bg-secondary" />
                    <Skeleton className="h-5 w-3/4 bg-secondary" />
                    <Skeleton className="h-4 w-full bg-secondary" />
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
              <div className="card-premium p-8 text-center">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-display font-semibold text-foreground mb-2">Nenhuma trilha disponível</h3>
                <p className="text-sm text-muted-foreground">Em breve novas trilhas serão adicionadas.</p>
              </div>
            )}
          </section>
        </div>
      </main>

      <MentorChatButton />
    </div>
  );
}