import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { MentorChatButton } from "@/components/MentorChat";
import { TrackCard } from "@/components/ContinueWatching";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

// Mock tracks data
const mockTracks = [
  {
    id: '1',
    title: 'Jornada Metanoia',
    description: 'Uma transformação completa através do discipulado bíblico. Aprenda os fundamentos e práticas essenciais.',
    thumbnail: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=800&auto=format&fit=crop',
    coursesCount: 12,
    categoria: 'Fundamentos',
  },
  {
    id: '2',
    title: 'Fundamentos Espirituais',
    description: 'Construa uma base sólida para sua vida espiritual através de práticas diárias.',
    thumbnail: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=800&auto=format&fit=crop',
    coursesCount: 8,
    categoria: 'Fundamentos',
  },
  {
    id: '3',
    title: 'Liderança Servidora',
    description: 'Aprenda a liderar como Jesus liderou - com humildade e propósito.',
    thumbnail: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&auto=format&fit=crop',
    coursesCount: 10,
    categoria: 'Liderança',
  },
  {
    id: '4',
    title: 'Comunicação Eficaz',
    description: 'Desenvolva habilidades de comunicação para um discipulado mais efetivo.',
    thumbnail: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&auto=format&fit=crop',
    coursesCount: 6,
    categoria: 'Habilidades',
  },
  {
    id: '5',
    title: 'Aconselhamento Bíblico',
    description: 'Ferramentas e técnicas para aconselhar baseado nas Escrituras.',
    thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop',
    coursesCount: 9,
    categoria: 'Avançado',
  },
  {
    id: '6',
    title: 'Evangelismo Relacional',
    description: 'Como compartilhar o evangelho de forma natural e autêntica.',
    thumbnail: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&auto=format&fit=crop',
    coursesCount: 7,
    categoria: 'Evangelismo',
  },
];

const categories = ['Todos', 'Fundamentos', 'Liderança', 'Habilidades', 'Avançado', 'Evangelismo'];

export default function Tracks() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [tracks, setTracks] = useState(mockTracks);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
      }
    };
    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const filteredTracks = selectedCategory === 'Todos' 
    ? tracks 
    : tracks.filter(t => t.categoria === selectedCategory);

  return (
    <div className="min-h-screen flex w-full bg-background">
      <Sidebar onLogout={handleLogout} />
      
      <main className="flex-1 min-w-0 pt-16 lg:pt-0">
        <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
          {/* Header */}
          <section className="animate-fade-in">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
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
                className="transition-all"
              >
                {category}
              </Button>
            ))}
          </section>

          {/* Tracks Grid */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
            {filteredTracks.map((track, index) => (
              <div 
                key={track.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <TrackCard
                  id={track.id}
                  title={track.title}
                  description={track.description}
                  thumbnail={track.thumbnail}
                  coursesCount={track.coursesCount}
                  onClick={(id) => navigate(`/trilha/${id}`)}
                />
              </div>
            ))}
          </section>

          {filteredTracks.length === 0 && (
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
