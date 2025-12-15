import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { MentorChatButton } from "@/components/MentorChat";
import { TrackCard } from "@/components/ContinueWatching";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface Track {
  id: string;
  titulo: string;
  descricao: string | null;
  categoria: string;
  cover_image: string | null;
  coursesCount: number;
}

export default function Tracks() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [categories, setCategories] = useState<string[]>(['Todos']);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      const { data: tracksData, error } = await supabase
        .from('tracks')
        .select(`
          id,
          titulo,
          descricao,
          categoria,
          cover_image,
          courses(count)
        `)
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
      })) || [];

      setTracks(formattedTracks);

      const uniqueCategories = ['Todos', ...new Set(formattedTracks.map(t => t.categoria))];
      setCategories(uniqueCategories);
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
      
      <main className="pt-14 lg:pt-16">
        <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
          {/* Header */}
          <section className="animate-fade-in">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
                <BookOpen className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
                Trilhas de Aprendizado
              </h1>
            </div>
            <p className="text-muted-foreground">
              Explore nossas trilhas e avance em sua jornada de discipulado
            </p>
          </section>

          {/* Filters */}
          <section className="flex flex-wrap gap-2 animate-slide-up" style={{ animationDelay: '50ms' }}>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={selectedCategory === category 
                  ? "bg-gradient-primary hover:opacity-90 text-primary-foreground" 
                  : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
                }
              >
                {category}
              </Button>
            ))}
          </section>

          {/* Loading State */}
          {loading && (
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card-premium p-4 space-y-3">
                  <Skeleton className="h-40 w-full rounded-xl bg-secondary" />
                  <Skeleton className="h-5 w-3/4 bg-secondary" />
                  <Skeleton className="h-4 w-full bg-secondary" />
                </div>
              ))}
            </section>
          )}

          {/* Tracks Grid */}
          {!loading && (
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
              {filteredTracks.map((track, index) => (
                <div 
                  key={track.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <TrackCard
                    id={track.id}
                    title={track.titulo}
                    description={track.descricao || ''}
                    thumbnail={track.cover_image || 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=800&auto=format&fit=crop'}
                    coursesCount={track.coursesCount}
                    onClick={(id) => navigate(`/trilha/${id}`)}
                  />
                </div>
              ))}
            </section>
          )}

          {!loading && filteredTracks.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Nenhuma trilha encontrada nesta categoria.
              </p>
            </div>
          )}
        </div>
      </main>

      <MentorChatButton />
    </div>
  );
}