import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SearchSOS } from "@/components/SearchSOS";
import { Sidebar } from "@/components/Sidebar";
import { MentorChatButton } from "@/components/MentorChat";
import { supabase } from "@/integrations/supabase/client";
import { LifeBuoy } from "lucide-react";

interface Resource {
  id: string;
  titulo: string;
  descricao: string | null;
  type: 'video' | 'pdf';
  tags: string[];
  url: string;
}

export default function SOS() {
  const navigate = useNavigate();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResources = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .eq('categoria', 'sos');

      if (error) {
        console.error('Error fetching resources:', error);
        setLoading(false);
        return;
      }

      const formattedResources: Resource[] = data?.map(r => ({
        id: r.id,
        titulo: r.titulo,
        descricao: r.descricao,
        type: r.video_url ? 'video' : 'pdf',
        tags: r.tags || [],
        url: r.video_url || r.url_pdf || '',
      })) || [];

      setResources(formattedResources);
      setLoading(false);
    };

    fetchResources();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const handleResourceSelect = (resource: Resource) => {
    if (resource.type === 'video') {
      navigate(`/aula/${resource.id}`);
    } else if (resource.url) {
      window.open(resource.url, '_blank');
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-background">
      <Sidebar onLogout={handleLogout} />
      
      <main className="flex-1 min-w-0 pt-16 lg:pt-0">
        <div className="min-h-screen flex flex-col">
          {/* Hero Section */}
          <section className="flex-1 flex flex-col items-center justify-center p-4 lg:p-8">
            <div className="text-center mb-8 animate-fade-in">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-accent shadow-glow-accent mb-4">
                <LifeBuoy className="w-8 h-8 text-accent-foreground" />
              </div>
              <h1 className="text-3xl lg:text-4xl font-display font-bold text-foreground mb-2">
                S.O.S. Discipulador
              </h1>
              <p className="text-lg text-muted-foreground max-w-md mx-auto">
                Encontre recursos de apoio para situações específicas do discipulado
              </p>
            </div>

            <div className="w-full animate-slide-up" style={{ animationDelay: '100ms' }}>
              <SearchSOS 
                resources={resources}
                onSelect={handleResourceSelect}
                loading={loading}
              />
            </div>
          </section>

          {/* Quick Access Categories */}
          <section className="p-4 lg:p-8 border-t border-border">
            <h2 className="text-lg font-display font-semibold text-foreground mb-4 text-center">
              Categorias de Apoio
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
              {[
                { label: 'Crise Emocional', emoji: '💔', color: 'bg-destructive/10 border-destructive/30' },
                { label: 'Dúvidas de Fé', emoji: '❓', color: 'bg-primary/10 border-primary/30' },
                { label: 'Relacionamentos', emoji: '🤝', color: 'bg-success/10 border-success/30' },
                { label: 'Vícios', emoji: '⛓️', color: 'bg-accent/10 border-accent/30' },
              ].map((category) => (
                <button
                  key={category.label}
                  className={`card-premium p-4 text-center transition-all hover:scale-105 ${category.color}`}
                >
                  <span className="text-2xl mb-2 block">{category.emoji}</span>
                  <span className="text-sm font-medium text-foreground">{category.label}</span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </main>

      <MentorChatButton />
    </div>
  );
}
