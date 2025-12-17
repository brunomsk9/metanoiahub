import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ChevronRight, BookOpen, Loader2, FileText, Book, Download, Eye } from "lucide-react";
import { VideoPlayer } from "@/components/VideoPlayer";
import { ChecklistInterativo } from "@/components/ChecklistInterativo";
import { MentorChatButton } from "@/components/MentorChat";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

interface LessonData {
  id: string;
  titulo: string;
  video_url: string | null;
  texto_apoio: string | null;
  checklist_items: { id: string; label: string }[] | null;
  url_pdf: string | null;
  tipo_material: string | null;
  materiais: string[] | null;
  course: {
    titulo: string;
    track: {
      titulo: string;
    } | null;
  } | null;
}

export default function Lesson() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [showTexto, setShowTexto] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchLesson = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      
      setUserId(session.user.id);

      if (!id) {
        navigate('/trilhas');
        return;
      }

      // Fetch lesson data
      const { data: lessonData, error } = await supabase
        .from('lessons')
        .select(`
          id,
          titulo,
          video_url,
          texto_apoio,
          checklist_items,
          url_pdf,
          tipo_material,
          materiais,
          course:courses(
            titulo,
            track:tracks(titulo)
          )
        `)
        .eq('id', id)
        .single();

      if (error || !lessonData) {
        navigate('/trilhas');
        return;
      }

      setLesson(lessonData as unknown as LessonData);

      // Parse checklist items and fetch user progress
      const items = lessonData.checklist_items as { id: string; label: string }[] | null;
      if (items && Array.isArray(items)) {
        // Fetch user progress for this lesson
        const { data: progressData } = await supabase
          .from('user_progress')
          .select('checklist_progress')
          .eq('user_id', session.user.id)
          .eq('lesson_id', id)
          .maybeSingle();

        const completedIds = (progressData?.checklist_progress as string[] | null) || [];

        setChecklistItems(items.map(item => ({
          id: item.id,
          text: item.label,
          completed: completedIds.includes(item.id)
        })));
      }

      setLoading(false);
    };

    fetchLesson();
  }, [id, navigate]);

  const handleChecklistToggle = async (itemId: string) => {
    if (!userId || !id) return;

    const newItems = checklistItems.map(item =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    setChecklistItems(newItems);

    const completedIds = newItems.filter(i => i.completed).map(i => i.id);

    // Upsert progress
    await supabase
      .from('user_progress')
      .upsert({
        user_id: userId,
        lesson_id: id,
        checklist_progress: completedIds,
        completed: completedIds.length === checklistItems.length
      }, {
        onConflict: 'user_id,lesson_id'
      });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Aula não encontrada</p>
        <Button onClick={() => navigate('/trilhas')}>Voltar às trilhas</Button>
      </div>
    );
  }

  const trackTitle = lesson.course?.track?.titulo || lesson.course?.titulo || '';

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
            {trackTitle && <p className="text-xs text-primary font-medium">{trackTitle}</p>}
            <h1 className="text-sm font-display font-semibold text-foreground truncate">
              {lesson.titulo}
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
            {lesson.video_url && (
              <div className="animate-fade-in">
                <VideoPlayer
                  title={lesson.titulo}
                  videoUrl={lesson.video_url}
                />
              </div>
            )}

            {/* Lesson Info */}
            <div className="card-premium p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
              <h2 className="text-xl font-display font-semibold text-foreground mb-4">
                {lesson.titulo}
              </h2>

              {/* Material Principal (PDF/Ebook/Livro) */}
              {lesson.url_pdf && (
                <div className="mb-4 p-4 rounded-lg bg-muted/50 border border-border">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      {lesson.tipo_material === 'livro' ? (
                        <Book className="w-5 h-5 text-amber-500" />
                      ) : (
                        <FileText className="w-5 h-5 text-red-500" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {lesson.tipo_material === 'pdf' && 'PDF da Aula'}
                          {lesson.tipo_material === 'ebook' && 'Ebook'}
                          {lesson.tipo_material === 'livro' && 'Livro'}
                          {!lesson.tipo_material && 'Material'}
                        </p>
                        <p className="text-xs text-muted-foreground">Visualize ou baixe o material</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Convert Google Drive view link to preview/embed
                          let viewUrl = lesson.url_pdf!;
                          if (viewUrl.includes('drive.google.com/file/d/')) {
                            const fileId = viewUrl.match(/\/d\/([^\/]+)/)?.[1];
                            if (fileId) {
                              viewUrl = `https://drive.google.com/file/d/${fileId}/preview`;
                            }
                          }
                          window.open(viewUrl, '_blank');
                        }}
                        className="gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Visualizar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Convert Google Drive to direct download link
                          let downloadUrl = lesson.url_pdf!;
                          if (downloadUrl.includes('drive.google.com/file/d/')) {
                            const fileId = downloadUrl.match(/\/d\/([^\/]+)/)?.[1];
                            if (fileId) {
                              downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
                            }
                          }
                          window.open(downloadUrl, '_blank');
                        }}
                        className="gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Baixar
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {lesson.texto_apoio && (
                <>
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
                    <div className="prose max-w-none animate-slide-up">
                      <div 
                        className="text-muted-foreground text-sm leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: lesson.texto_apoio }}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Sidebar - Checklist */}
          {checklistItems.length > 0 && (
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
          )}
        </div>
      </main>

      <MentorChatButton />
    </div>
    </PageTransition>
  );
}
