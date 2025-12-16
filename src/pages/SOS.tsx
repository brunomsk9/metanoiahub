import { useState, useEffect, useMemo } from "react";
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
  const [selectedTag, setSelectedTag] = useState('');

  useEffect(() => {
    const fetchAllContent = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      // Check if user is discipulador or admin
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id);
      
      const userRoles = roles?.map(r => r.role) || [];
      const hasAccess = userRoles.includes('discipulador') || userRoles.includes('admin');
      
      if (!hasAccess) {
        navigate('/dashboard');
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

  const quickTags = useMemo(() => {
    const tagCounts = new Map<string, number>();
    resources.forEach(r => {
      r.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });
    return Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([tag]) => tag);
  }, [resources]);

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

  const handleQuickTagClick = (tag: string) => {
    setSelectedTag(tag);
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar onLogout={handleLogout} />
      
      <PageTransition>
        <main className="pt-14 lg:pt-16 pb-8">
          <div className="px-4 lg:px-6 max-w-3xl mx-auto">
            {/* Header */}
            <header className="pt-8 pb-8 text-center">
              <h1 className="text-2xl lg:text-3xl font-display font-semibold text-foreground mb-1">
                S.O.S. do Discipulador
              </h1>
              <p className="text-sm text-muted-foreground">
                Recursos e orientações para ajudar seus discípulos em situações difíceis
              </p>
            </header>

            {/* Search */}
            <SearchSOS 
              resources={resources}
              onSelect={handleResourceSelect}
              loading={loading}
              initialQuery={selectedTag}
            />

            {/* Quick Tags */}
            {!loading && quickTags.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-1.5 justify-center">
                {quickTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleQuickTagClick(tag)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        </main>
      </PageTransition>

      <MentorChatButton />
    </div>
  );
}
