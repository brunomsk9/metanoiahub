import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, BookOpen } from "lucide-react";
import { AppShell } from "@/components/layout";
import { MentorChatButton } from "@/components/MentorChat";
import { TrackCard } from "@/components/ContinueWatching";
import { PageTransition } from "@/components/PageTransition";
import { CelebrationModal } from "@/components/CelebrationModal";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { supabase } from "@/integrations/supabase/client";
import { TracksSkeleton } from "@/components/skeletons/PageSkeletons";

interface Track {
  id: string;
  titulo: string;
  descricao: string | null;
  categoria: string;
  cover_image: string | null;
  coursesCount: number;
  is_base: boolean;
}

export default function Tracks() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [categories, setCategories] = useState<string[]>(['Todos']);
  const [loading, setLoading] = useState(true);
  const [completedBaseTrack, setCompletedBaseTrack] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [baseTrackTitle, setBaseTrackTitle] = useState('Alicerce');

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      const { data: tracksData, error } = await supabase
        .from('tracks')
        .select(`id, titulo, descricao, categoria, cover_image, is_base, courses(count)`)
        .order('ordem');

      if (error) {
        console.error('Error fetching tracks:', error);
        setLoading(false);
        return;
      }

      const formattedTracks = tracksData?.map(track => ({
        id: track.id,
        titulo: track.titulo,
        descricao: track.descricao,
        categoria: track.categoria,
        cover_image: track.cover_image,
        coursesCount: track.courses?.[0]?.count || 0,
        is_base: track.is_base || false,
      })) || [];

      setTracks(formattedTracks);
      
      const baseTrack = formattedTracks.find(t => t.is_base);
      if (baseTrack) {
        setBaseTrackTitle(baseTrack.titulo);
      }

      const uniqueCategories = ['Todos', ...new Set(formattedTracks.map(t => t.categoria))];
      setCategories(uniqueCategories);

      const [completedData, presencialData] = await Promise.all([
        supabase.rpc('user_completed_base_track', { _user_id: session.user.id }),
        supabase
          .from('discipleship_relationships')
          .select('alicerce_completed_presencial')
          .eq('discipulo_id', session.user.id)
          .eq('alicerce_completed_presencial', true)
          .maybeSingle()
      ]);
      
      const isCompleted = completedData.data === true || !!presencialData.data;
      setCompletedBaseTrack(isCompleted);

      const celebrationKey = `alicerce_celebration_shown:${session.user.id}`;
      let celebrationShown: string | null = null;
      try {
        celebrationShown = localStorage.getItem(celebrationKey);
      } catch {
        celebrationShown = sessionStorage.getItem(celebrationKey);
      }

      if (isCompleted && !celebrationShown) {
        setShowCelebration(true);
        try {
          localStorage.setItem(celebrationKey, 'true');
        } catch {
          sessionStorage.setItem(celebrationKey, 'true');
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

  const filteredTracks = selectedCategory === 'Todos' 
    ? tracks 
    : tracks.filter(t => t.categoria === selectedCategory);

  return (
    <AppShell headerTitle="Trilhas" onLogout={handleLogout}>
      <PageTransition>
        <div className="space-y-6">
          {/* Breadcrumb */}
          <PageBreadcrumb items={[{ label: 'Trilhas' }]} />

          {/* Header */}
          <header className="hidden lg:block section-pattern rounded-2xl p-6 border border-border/50">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-display font-bold">
                  <span className="text-gradient">Trilhas</span>
                </h1>
                <p className="text-sm text-muted-foreground">Sua jornada de aprendizado</p>
              </div>
            </div>
          </header>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedCategory === category 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                    : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary border border-border/50"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Loading */}
          {loading && <TracksSkeleton />}

          {/* Grid */}
          {!loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredTracks.map((track) => {
                const hasBaseTrack = tracks.some(t => t.is_base);
                const isLocked = hasBaseTrack && !track.is_base && !completedBaseTrack;
                
                return (
                  <TrackCard
                    key={track.id}
                    id={track.id}
                    title={track.titulo}
                    description={track.descricao || ''}
                    thumbnail={track.cover_image || 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=800&auto=format&fit=crop'}
                    coursesCount={track.coursesCount}
                    onClick={(id) => navigate(`/trilha/${id}`)}
                    isBase={track.is_base}
                    isLocked={isLocked}
                  />
                );
              })}
            </div>
          )}

          {!loading && filteredTracks.length === 0 && (
            <div className="text-center py-16 section-pattern rounded-2xl border border-border/50">
              <Sparkles className="w-12 h-12 mx-auto text-primary/50 mb-3" />
              <p className="text-muted-foreground">Nenhuma trilha encontrada</p>
            </div>
          )}
        </div>
      </PageTransition>

      <MentorChatButton />
      
      <CelebrationModal
        isOpen={showCelebration}
        onClose={() => setShowCelebration(false)}
        trackTitle={baseTrackTitle}
      />
    </AppShell>
  );
}
