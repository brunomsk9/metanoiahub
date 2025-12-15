import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SearchSOS } from "@/components/SearchSOS";
import { Sidebar } from "@/components/Sidebar";
import { MentorChatButton } from "@/components/MentorChat";
import { supabase } from "@/integrations/supabase/client";
import { LifeBuoy } from "lucide-react";

// Mock resources data
const mockResources = [
  {
    id: '1',
    titulo: 'Como lidar com o desânimo espiritual',
    descricao: 'Estratégias práticas baseadas na Bíblia para superar momentos de desânimo.',
    type: 'video' as const,
    tags: ['desânimo', 'ânimo', 'motivação', 'esperança'],
    url: '/video/1',
  },
  {
    id: '2',
    titulo: 'Guia de acompanhamento em momentos de luto',
    descricao: 'PDF com orientações para discipuladores sobre como apoiar pessoas em luto.',
    type: 'pdf' as const,
    tags: ['luto', 'perda', 'consolação', 'apoio'],
    url: '/resource/2',
  },
  {
    id: '3',
    titulo: 'Ansiedade: Uma perspectiva bíblica',
    descricao: 'Entenda como a Bíblia nos orienta a lidar com a ansiedade.',
    type: 'video' as const,
    tags: ['ansiedade', 'paz', 'confiança', 'medo'],
    url: '/video/3',
  },
  {
    id: '4',
    titulo: 'Roteiro de conversa sobre pecado',
    descricao: 'Como abordar questões de pecado de forma amorosa e bíblica.',
    type: 'pdf' as const,
    tags: ['pecado', 'arrependimento', 'graça', 'perdão'],
    url: '/resource/4',
  },
  {
    id: '5',
    titulo: 'Restaurando a esperança',
    descricao: 'Série sobre como ajudar pessoas que perderam a esperança.',
    type: 'video' as const,
    tags: ['desânimo', 'esperança', 'fé', 'restauração'],
    url: '/video/5',
  },
  {
    id: '6',
    titulo: 'O poder do perdão',
    descricao: 'Material de apoio sobre o processo de perdão e reconciliação.',
    type: 'pdf' as const,
    tags: ['perdão', 'reconciliação', 'mágoa', 'cura'],
    url: '/resource/6',
  },
];

export default function SOS() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const handleResourceSelect = (resource: any) => {
    if (resource.type === 'video') {
      navigate(`/aula/${resource.id}`);
    } else {
      // Open PDF in new tab
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
                resources={mockResources}
                onSelect={handleResourceSelect}
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
