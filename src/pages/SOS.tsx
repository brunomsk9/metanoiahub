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
  type: 'video' | 'pdf' | 'aula';
  tags: string[];
  url: string;
  source: 'resource' | 'lesson';
  courseName?: string;
}

export default function SOS() {
  const navigate = useNavigate();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllContent = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      // Fetch resources and lessons in parallel
      const [resourcesRes, lessonsRes] = await Promise.all([
        supabase
          .from('resources')
          .select('*')
          .eq('categoria', 'sos'),
        supabase
          .from('lessons')
          .select('*, courses(titulo)')
          .order('ordem')
      ]);

      const formattedResources: Resource[] = [];

      // Add resources
      if (resourcesRes.data) {
        resourcesRes.data.forEach(r => {
          formattedResources.push({
            id: r.id,
            titulo: r.titulo,
            descricao: r.descricao,
            type: r.video_url ? 'video' : 'pdf',
            tags: r.tags || [],
            url: r.video_url || r.url_pdf || '',
            source: 'resource'
          });
        });
      }

      // Add lessons
      if (lessonsRes.data) {
        lessonsRes.data.forEach(l => {
          const tags: string[] = [];
          const titleLower = l.titulo.toLowerCase();
          
          if (l.tipo === 'video') tags.push('vídeo');
          if (l.tipo === 'checklist_interativo') tags.push('checklist', 'prático');
          
          const keywords = ['encontro', 'oração', 'identidade', 'maldição', 'restauração', 'propósito', 'célula', 'multiplicação', 'discipulado'];
          keywords.forEach(kw => {
            if (titleLower.includes(kw)) tags.push(kw);
          });

          formattedResources.push({
            id: l.id,
            titulo: l.titulo,
            descricao: l.texto_apoio ? l.texto_apoio.replace(/<[^>]*>/g, '').substring(0, 150) + '...' : null,
            type: 'aula',
            tags,
            url: '',
            source: 'lesson',
            courseName: (l.courses as any)?.titulo || undefined
          });
        });
      }

      setResources(formattedResources);
      setLoading(false);
    };

    fetchAllContent();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const handleResourceSelect = (resource: Resource) => {
    if (resource.source === 'lesson') {
      navigate(`/lesson/${resource.id}`);
    } else if (resource.type === 'video') {
      navigate(`/aula/${resource.id}`);
    } else if (resource.url) {
      window.open(resource.url, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar onLogout={handleLogout} />
      
      <main className="pt-14 lg:pt-16">
        <div className="min-h-[calc(100vh-56px)] lg:min-h-[calc(100vh-64px)] flex flex-col">
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
                Encontre recursos e aulas para situações específicas do discipulado
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
          <section className="p-4 lg:p-8 border-t border-border bg-card/50">
            <h2 className="text-lg font-display font-semibold text-foreground mb-4 text-center">
              Categorias de Apoio
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
              {[
                { label: 'Crise Emocional', emoji: '💔', color: 'bg-destructive/10 border-destructive/20 hover:bg-destructive/20' },
                { label: 'Dúvidas de Fé', emoji: '❓', color: 'bg-warning/10 border-warning/20 hover:bg-warning/20' },
                { label: 'Relacionamentos', emoji: '🤝', color: 'bg-success/10 border-success/20 hover:bg-success/20' },
                { label: 'Vícios', emoji: '⛓️', color: 'bg-primary/10 border-primary/20 hover:bg-primary/20' },
              ].map((category) => (
                <button
                  key={category.label}
                  className={`p-4 rounded-2xl border text-center transition-all hover:scale-105 ${category.color}`}
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