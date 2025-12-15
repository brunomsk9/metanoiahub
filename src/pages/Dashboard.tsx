import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { StreakDisplay, HealthRadial, DailyHabits } from "@/components/StreakDisplay";
import { ContinueWatching, TrackCard } from "@/components/ContinueWatching";
import { MentorChatButton } from "@/components/MentorChat";
import { Sidebar } from "@/components/Sidebar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

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
      // Add habit
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
      // Remove habit
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

  const handleCourseSelect = (id: string) => {
    navigate(`/aula/${id}`);
  };

  const handleTrackSelect = (id: string) => {
    navigate(`/trilha/${id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/50 via-white to-orange-50/50">
      <Sidebar onLogout={handleLogout} userName={userName} />
      
      <main className="pt-14 lg:pt-16">
        <div className="p-4 lg:p-8 space-y-8 max-w-7xl mx-auto">
          {/* Header Stats */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-slide-up">
            <StreakDisplay streak={streak} className="md:col-span-1" />
            
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-center md:col-span-1">
              <HealthRadial percentage={healthScore} label="Saúde do Discipulador" />
            </div>
            
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:col-span-1">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Hábitos de Hoje</h3>
              <DailyHabits habits={habits} onToggle={handleHabitToggle} />
            </div>
          </section>

          {/* Tracks */}
          <section className="space-y-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
            <h2 className="text-xl font-display font-semibold text-gray-900">
              Trilhas Disponíveis
            </h2>
            
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
                    <Skeleton className="h-40 w-full rounded-xl bg-gray-100" />
                    <Skeleton className="h-5 w-3/4 bg-gray-100" />
                    <Skeleton className="h-4 w-full bg-gray-100" />
                  </div>
                ))}
              </div>
            ) : (
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
            )}
          </section>
        </div>
      </main>

      <MentorChatButton />
    </div>
  );
}
