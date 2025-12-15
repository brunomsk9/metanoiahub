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
    <div className="min-h-screen flex w-full bg-gradient-to-br from-amber-50/50 via-white to-orange-50/50">
      <Sidebar onLogout={handleLogout} />
      
      <main className="flex-1 min-w-0 pt-16 lg:pt-0">
        <div className="min-h-screen flex flex-col">
          {/* Hero Section */}
          <section className="flex-1 flex flex-col items-center justify-center p-4 lg:p-8">
            <div className="text-center mb-8 animate-fade-in">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 shadow-lg mb-4">
                <LifeBuoy className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl lg:text-4xl font-display font-bold text-gray-900 mb-2">
                S.O.S. Discipulador
              </h1>
              <p className="text-lg text-gray-500 max-w-md mx-auto">
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
          <section className="p-4 lg:p-8 border-t border-gray-100 bg-white/50">
            <h2 className="text-lg font-display font-semibold text-gray-900 mb-4 text-center">
              Categorias de Apoio
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
              {[
                { label: 'Crise Emocional', emoji: '💔', color: 'bg-red-50 border-red-200 hover:bg-red-100' },
                { label: 'Dúvidas de Fé', emoji: '❓', color: 'bg-amber-50 border-amber-200 hover:bg-amber-100' },
                { label: 'Relacionamentos', emoji: '🤝', color: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100' },
                { label: 'Vícios', emoji: '⛓️', color: 'bg-purple-50 border-purple-200 hover:bg-purple-100' },
              ].map((category) => (
                <button
                  key={category.label}
                  className={`p-4 rounded-2xl border text-center transition-all hover:scale-105 ${category.color}`}
                >
                  <span className="text-2xl mb-2 block">{category.emoji}</span>
                  <span className="text-sm font-medium text-gray-700">{category.label}</span>
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