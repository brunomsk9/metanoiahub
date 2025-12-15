import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SearchSOS } from "@/components/SearchSOS";
import { Sidebar } from "@/components/Sidebar";
import { MentorChatButton } from "@/components/MentorChat";
import { PageTransition } from "@/components/PageTransition";
import { supabase } from "@/integrations/supabase/client";

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
      
      <PageTransition>
        <main className="pt-16 lg:pt-20 pb-8">
          <div className="px-4 lg:px-8 max-w-4xl mx-auto">
            {/* Minimal Header */}
            <header className="pt-8 pb-12 text-center">
              <h1 className="text-3xl lg:text-4xl font-display font-bold text-foreground tracking-tight mb-2">
                S.O.S.
              </h1>
              <p className="text-muted-foreground">
                Encontre ajuda para situações específicas
              </p>
            </header>

            {/* Search */}
            <SearchSOS 
              resources={resources}
              onSelect={handleResourceSelect}
              loading={loading}
            />

            {/* Quick Tags */}
            <div className="mt-12 flex flex-wrap gap-2 justify-center">
              {['Crise', 'Dúvidas', 'Relacionamentos', 'Vícios'].map((tag) => (
                <button
                  key={tag}
                  className="px-4 py-2 rounded-full text-sm font-medium bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </main>
      </PageTransition>

      <MentorChatButton />
    </div>
  );
}
