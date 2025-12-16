import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { MentorChatButton } from "@/components/MentorChat";
import { TrackCard } from "@/components/ContinueWatching";
import { PageTransition } from "@/components/PageTransition";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

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

      const uniqueCategories = ['Todos', ...new Set(formattedTracks.map(t => t.categoria))];
      setCategories(uniqueCategories);

      // Check if user completed the base track
      const { data: completedData } = await supabase.rpc('user_completed_base_track', {
        _user_id: session.user.id
      });
      setCompletedBaseTrack(completedData || false);

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
    <div className="min-h-screen bg-background">
      <Sidebar onLogout={handleLogout} />
      
      <PageTransition>
        <main className="pt-16 lg:pt-20 pb-8">
          <div className="px-4 lg:px-8 max-w-6xl mx-auto space-y-8">
            {/* Minimal Header */}
            <header className="pt-4">
              <h1 className="text-3xl lg:text-4xl font-display font-bold text-foreground tracking-tight">
                Trilhas
              </h1>
              <p className="text-muted-foreground mt-1">Sua jornada de aprendizado</p>
            </header>

            {/* Filters - Minimal pills */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Loading */}
            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-56 rounded-2xl" />
                ))}
              </div>
            )}

            {/* Grid */}
            {!loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTracks.map((track) => {
                  // Check if track should be locked (not base and base track not completed)
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
              <div className="text-center py-16">
                <p className="text-muted-foreground">Nenhuma trilha encontrada</p>
              </div>
            )}
          </div>
        </main>
      </PageTransition>

      <MentorChatButton />
    </div>
  );
}
