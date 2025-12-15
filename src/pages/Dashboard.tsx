import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { StreakDisplay, HealthRadial, DailyHabits } from "@/components/StreakDisplay";
import { ContinueWatching, TrackCard } from "@/components/ContinueWatching";
import { MentorChatButton } from "@/components/MentorChat";
import { Sidebar } from "@/components/Sidebar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Mock data for demonstration
const mockContinueWatching = [
  {
    id: '1',
    title: 'Como conduzir o primeiro encontro com seu discípulo',
    thumbnail: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&auto=format&fit=crop',
    trackTitle: 'Jornada Metanoia',
    progress: 45,
    duration: '12 min',
  },
  {
    id: '2',
    title: 'Estabelecendo uma rotina de oração',
    thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop',
    trackTitle: 'Fundamentos Espirituais',
    progress: 70,
    duration: '8 min',
  },
  {
    id: '3',
    title: 'Escuta ativa no discipulado',
    thumbnail: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&auto=format&fit=crop',
    trackTitle: 'Comunicação Eficaz',
    progress: 20,
    duration: '15 min',
  },
];

const mockTracks = [
  {
    id: '1',
    title: 'Jornada Metanoia',
    description: 'Uma transformação completa através do discipulado bíblico',
    thumbnail: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=800&auto=format&fit=crop',
    coursesCount: 12,
  },
  {
    id: '2',
    title: 'Fundamentos Espirituais',
    description: 'Construa uma base sólida para sua vida espiritual',
    thumbnail: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=800&auto=format&fit=crop',
    coursesCount: 8,
  },
  {
    id: '3',
    title: 'Liderança Servidora',
    description: 'Aprenda a liderar como Jesus liderou',
    thumbnail: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&auto=format&fit=crop',
    coursesCount: 10,
  },
];

export default function Dashboard() {
  const [streak, setStreak] = useState(7);
  const [healthScore, setHealthScore] = useState(75);
  const [userName, setUserName] = useState<string>('');
  const [habits, setHabits] = useState([
    { id: 'leitura', name: 'Leitura Bíblica', completed: true, icon: 'book' as const },
    { id: 'oracao', name: 'Oração', completed: false, icon: 'heart' as const },
  ]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
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
      }
    };

    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const handleHabitToggle = async (id: string) => {
    setHabits(prev => prev.map(h => 
      h.id === id ? { ...h, completed: !h.completed } : h
    ));
    
    const habit = habits.find(h => h.id === id);
    if (!habit?.completed) {
      toast({
        title: "Hábito registrado! 🎉",
        description: `${habit?.name} concluído para hoje.`,
      });
    }
  };

  const handleCourseSelect = (id: string) => {
    navigate(`/aula/${id}`);
  };

  const handleTrackSelect = (id: string) => {
    navigate(`/trilha/${id}`);
  };

  return (
    <div className="min-h-screen flex w-full bg-background">
      <Sidebar onLogout={handleLogout} userName={userName} />
      
      <main className="flex-1 min-w-0 pt-16 lg:pt-0">
        <div className="p-4 lg:p-8 space-y-8 max-w-7xl mx-auto">
          {/* Header Stats */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-slide-up">
            <StreakDisplay streak={streak} className="md:col-span-1" />
            
            <div className="card-premium p-4 flex items-center justify-center md:col-span-1">
              <HealthRadial percentage={healthScore} label="Saúde do Discipulador" />
            </div>
            
            <div className="card-premium p-4 md:col-span-1">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Hábitos de Hoje</h3>
              <DailyHabits habits={habits} onToggle={handleHabitToggle} />
            </div>
          </section>

          {/* Continue Watching */}
          <section className="animate-slide-up" style={{ animationDelay: '100ms' }}>
            <ContinueWatching 
              courses={mockContinueWatching} 
              onSelect={handleCourseSelect}
            />
          </section>

          {/* Tracks */}
          <section className="space-y-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
            <h2 className="text-xl font-display font-semibold text-foreground">
              Trilhas Disponíveis
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockTracks.map((track) => (
                <TrackCard
                  key={track.id}
                  {...track}
                  onClick={handleTrackSelect}
                />
              ))}
            </div>
          </section>
        </div>
      </main>

      <MentorChatButton />
    </div>
  );
}
