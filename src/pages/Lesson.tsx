import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ChevronRight, BookOpen } from "lucide-react";
import { VideoPlayer } from "@/components/VideoPlayer";
import { ChecklistInterativo } from "@/components/ChecklistInterativo";
import { MentorChatButton } from "@/components/MentorChat";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

// Mock lesson data
const mockLesson = {
  id: '1',
  title: 'Como conduzir o primeiro encontro com seu discípulo',
  videoUrl: '',
  thumbnail: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&auto=format&fit=crop',
  textoApoio: `O primeiro encontro é fundamental para estabelecer uma base sólida no relacionamento de discipulado. 
  
Este momento inicial define o tom de toda a jornada que vocês terão juntos. É importante criar um ambiente acolhedor e seguro, onde seu discípulo se sinta à vontade para compartilhar e crescer.

**Pontos importantes:**
- Escolha um local tranquilo e apropriado
- Reserve tempo suficiente sem pressa
- Prepare-se em oração antes do encontro
- Tenha um roteiro básico, mas seja flexível`,
  trackTitle: 'Jornada Metanoia',
  checklist: [
    { id: '1', text: 'Marquei um local seguro e apropriado', completed: false },
    { id: '2', text: 'Orei antes do encontro', completed: false },
    { id: '3', text: 'Preparei perguntas para conhecer melhor meu discípulo', completed: false },
    { id: '4', text: 'Defini expectativas e combinados iniciais', completed: false },
    { id: '5', text: 'Agendei o próximo encontro', completed: false },
  ],
};

export default function Lesson() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(mockLesson);
  const [checklistItems, setChecklistItems] = useState(mockLesson.checklist);
  const [showTexto, setShowTexto] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
      }
    };
    checkAuth();
  }, [navigate]);

  const handleChecklistToggle = (itemId: string) => {
    setChecklistItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    ));
  };

  return (
    <PageTransition>
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-primary font-medium">{lesson.trackTitle}</p>
            <h1 className="text-sm font-display font-semibold text-foreground truncate">
              {lesson.title}
            </h1>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
            <ChevronRight className="w-4 h-4 mr-1" />
            Próxima Aula
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Video Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="animate-fade-in">
              <VideoPlayer
                title={lesson.title}
                thumbnail={lesson.thumbnail}
                videoUrl={lesson.videoUrl}
              />
            </div>

            {/* Lesson Info */}
            <div className="card-premium p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
              <h2 className="text-xl font-display font-semibold text-foreground mb-4">
                {lesson.title}
              </h2>
              
              {/* Toggle Text Support */}
              <button
                onClick={() => setShowTexto(!showTexto)}
                className="flex items-center gap-2 text-primary hover:underline mb-4"
              >
                <BookOpen className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {showTexto ? 'Ocultar texto de apoio' : 'Ver texto de apoio'}
                </span>
              </button>

              {showTexto && (
                <div className="prose prose-invert max-w-none animate-slide-up">
                  <div className="text-muted-foreground whitespace-pre-wrap text-sm leading-relaxed">
                    {lesson.textoApoio}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Checklist */}
          <div className="lg:col-span-1 animate-slide-up" style={{ animationDelay: '200ms' }}>
            <div className="sticky top-24">
              <ChecklistInterativo
                title="Aplicação Prática"
                items={checklistItems}
                onToggle={handleChecklistToggle}
              />
              
              {/* XP Info */}
              <div className="mt-4 p-4 rounded-xl bg-gradient-primary text-primary-foreground">
                <p className="text-sm font-medium">Complete o checklist para ganhar</p>
                <p className="text-2xl font-display font-bold">+50 XP</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <MentorChatButton />
    </div>
    </PageTransition>
  );
}
