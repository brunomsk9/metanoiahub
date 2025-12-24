import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ChevronRight, BookOpen, Loader2, FileText, Book, Download, Eye, X, Maximize2, CheckCircle2, Circle, List, Play, ChevronDown, ChevronUp } from "lucide-react";
import { VideoPlayer } from "@/components/VideoPlayer";
import { ChecklistInterativo } from "@/components/ChecklistInterativo";
import { MentorChatButton } from "@/components/MentorChat";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import { CelebrationModal } from "@/components/CelebrationModal";
import { ScrollArea } from "@/components/ui/scroll-area";
import { XPGainToast } from "@/components/XPGainToast";
import { MobileNavigation } from "@/components/layout";

const XP_PER_LESSON = 10;

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
  course_id: string;
  ordem: number;
  course: {
    id: string;
    titulo: string;
    track_id: string;
    track: {
      titulo: string;
    } | null;
  } | null;
}

interface NextLesson {
  id: string;
  titulo: string;
}

interface CourseLesson {
  id: string;
  titulo: string;
  ordem: number;
  completed: boolean;
}

export default function Lesson() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [showTexto, setShowTexto] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [nextLesson, setNextLesson] = useState<NextLesson | null>(null);
  const [isLastLesson, setIsLastLesson] = useState(false);
  const [showCourseComplete, setShowCourseComplete] = useState(false);
  const [savingProgress, setSavingProgress] = useState(false);
  const [courseProgress, setCourseProgress] = useState({ completed: 0, total: 0 });
  const [courseLessonsList, setCourseLessonsList] = useState<CourseLesson[]>([]);
  const [showLessonsList, setShowLessonsList] = useState(false);
  const [showXPGain, setShowXPGain] = useState(false);

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
          course_id,
          ordem,
          course:courses(
            id,
            titulo,
            track_id,
            track:tracks(titulo)
          )
        `)
        .eq('id', id)
        .single();

      if (error || !lessonData) {
        navigate('/trilhas');
        return;
      }

      const lessonInfo = lessonData as unknown as LessonData;
      setLesson(lessonInfo);

      // Fetch user progress for this lesson (completion status)
      const { data: progressData } = await supabase
        .from('user_progress')
        .select('completed, checklist_progress')
        .eq('user_id', session.user.id)
        .eq('lesson_id', id)
        .maybeSingle();

      setIsCompleted(progressData?.completed || false);

      // Parse checklist items
      const items = lessonData.checklist_items as { id: string; label: string }[] | null;
      if (items && Array.isArray(items)) {
        const completedIds = (progressData?.checklist_progress as string[] | null) || [];
        setChecklistItems(items.map(item => ({
          id: item.id,
          text: item.label,
          completed: completedIds.includes(item.id)
        })));
      }

      // Find next lesson in the course and calculate progress
      const { data: courseLessons } = await supabase
        .from('lessons')
        .select('id, titulo, ordem')
        .eq('course_id', lessonInfo.course_id)
        .order('ordem');

      if (courseLessons) {
        const currentIndex = courseLessons.findIndex(l => l.id === id);
        const nextLessonData = courseLessons[currentIndex + 1];
        
        if (nextLessonData) {
          setNextLesson({ id: nextLessonData.id, titulo: nextLessonData.titulo });
        } else {
          setIsLastLesson(true);
        }

        // Get completed lessons count for course progress
        const { data: completedLessons } = await supabase
          .from('user_progress')
          .select('lesson_id')
          .eq('user_id', session.user.id)
          .eq('completed', true)
          .in('lesson_id', courseLessons.map(l => l.id));

        const completedIds = new Set(completedLessons?.map(l => l.lesson_id) || []);
        const completedCount = completedIds.size;
        
        setCourseProgress({ 
          completed: completedCount, 
          total: courseLessons.length 
        });

        // Build lessons list with completion status
        setCourseLessonsList(courseLessons.map(l => ({
          id: l.id,
          titulo: l.titulo,
          ordem: l.ordem,
          completed: completedIds.has(l.id)
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
        completed: isCompleted || (completedIds.length === checklistItems.length)
      }, {
        onConflict: 'user_id,lesson_id'
      });
  };

  const handleMarkCompleted = async () => {
    if (!userId || !id || !lesson) return;
    
    setSavingProgress(true);
    
    try {
      // Mark lesson as completed
      const { error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: userId,
          lesson_id: id,
          completed: true,
          completed_at: new Date().toISOString(),
          checklist_progress: checklistItems.filter(i => i.completed).map(i => i.id)
        }, {
          onConflict: 'user_id,lesson_id'
        });

      if (error) throw error;

      // Add XP to user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('xp_points')
        .eq('id', userId)
        .single();

      if (profile) {
        await supabase
          .from('profiles')
          .update({ xp_points: (profile.xp_points || 0) + XP_PER_LESSON })
          .eq('id', userId);
      }

      setIsCompleted(true);
      setCourseProgress(prev => ({ ...prev, completed: prev.completed + 1 }));
      setCourseLessonsList(prev => prev.map(l => l.id === id ? { ...l, completed: true } : l));
      
      // Show XP animation
      setShowXPGain(true);

      // Check if this completes the course (last lesson)
      if (isLastLesson) {
        // Verify all lessons in course are completed
        const { data: courseLessons } = await supabase
          .from('lessons')
          .select('id')
          .eq('course_id', lesson.course_id);

        if (courseLessons) {
          const { data: completedLessons } = await supabase
            .from('user_progress')
            .select('lesson_id')
            .eq('user_id', userId)
            .eq('completed', true)
            .in('lesson_id', courseLessons.map(l => l.id));

          // All lessons completed (including this one)
          if (completedLessons && completedLessons.length >= courseLessons.length) {
            setShowCourseComplete(true);
          }
        }
      }
    } catch (error) {
      toast.error('Erro ao salvar progresso');
    } finally {
      setSavingProgress(false);
    }
  };

  const handleNextLesson = () => {
    if (nextLesson) {
      navigate(`/aula/${nextLesson.id}`);
    } else if (lesson?.course?.id) {
      navigate(`/curso/${lesson.course.id}`);
    }
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

  // Helper to get PDF embed URL
  const getPdfEmbedUrl = (url: string) => {
    if (url.includes('drive.google.com/file/d/')) {
      const fileId = url.match(/\/d\/([^\/]+)/)?.[1];
      if (fileId) {
        return `https://drive.google.com/file/d/${fileId}/preview`;
      }
    }
    // For other URLs, try to embed directly
    return url;
  };

  const getPdfDownloadUrl = (url: string) => {
    if (url.includes('drive.google.com/file/d/')) {
      const fileId = url.match(/\/d\/([^\/]+)/)?.[1];
      if (fileId) {
        return `https://drive.google.com/uc?export=download&id=${fileId}`;
      }
    }
    return url;
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
            <div className="flex items-center gap-2">
              {trackTitle && <p className="text-xs text-primary font-medium">{trackTitle}</p>}
              {isCompleted && (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-500">
                  <CheckCircle2 className="w-3 h-3" />
                  Concluída
                </span>
              )}
            </div>
            <h1 className="text-sm font-display font-semibold text-foreground truncate">
              {lesson.titulo}
            </h1>
          </div>
          {nextLesson ? (
            <Button variant="outline" size="sm" onClick={handleNextLesson}>
              Próxima
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => lesson?.course?.id && navigate(`/curso/${lesson.course.id}`)}>
              Ver Curso
            </Button>
          )}
        </div>
      </header>

      {/* Course Progress Bar */}
      {courseProgress.total > 0 && (
        <div className="bg-muted/50 border-b border-border">
          <div className="max-w-7xl mx-auto px-4 py-2">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLessonsList(!showLessonsList)}
                className="gap-2 h-7 px-2"
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline text-xs">Aulas</span>
                {showLessonsList ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </Button>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {courseProgress.completed}/{courseProgress.total}
              </span>
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${(courseProgress.completed / courseProgress.total) * 100}%` }}
                />
              </div>
              <span className="text-xs font-medium text-primary whitespace-nowrap">
                {Math.round((courseProgress.completed / courseProgress.total) * 100)}%
              </span>
            </div>
          </div>

          {/* Collapsible Lessons List */}
          {showLessonsList && (
            <div className="border-t border-border bg-background animate-fade-in">
              <div className="max-w-7xl mx-auto">
                <ScrollArea className="max-h-64">
                  <div className="p-2 space-y-1">
                    {courseLessonsList.map((lessonItem, index) => (
                      <button
                        key={lessonItem.id}
                        onClick={() => {
                          if (lessonItem.id !== id) {
                            navigate(`/aula/${lessonItem.id}`);
                          }
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                          lessonItem.id === id 
                            ? 'bg-primary/10 text-primary' 
                            : 'hover:bg-muted text-foreground'
                        }`}
                      >
                        <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                          lessonItem.completed 
                            ? 'bg-emerald-500/20 text-emerald-500' 
                            : lessonItem.id === id
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground'
                        }`}>
                          {lessonItem.completed ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            index + 1
                          )}
                        </div>
                        <span className={`flex-1 text-sm truncate ${
                          lessonItem.completed ? 'text-muted-foreground' : ''
                        }`}>
                          {lessonItem.titulo}
                        </span>
                        {lessonItem.id === id && (
                          <Play className="w-3 h-3 text-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}
        </div>
      )}

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
                <div className="mb-4 space-y-4">
                  <div className="p-4 rounded-lg bg-muted/50 border border-border">
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
                          <p className="text-xs text-muted-foreground">Visualize abaixo ou baixe</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowPdfViewer(!showPdfViewer)}
                          className="gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          {showPdfViewer ? 'Ocultar' : 'Visualizar'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(getPdfDownloadUrl(lesson.url_pdf!), '_blank')}
                          className="gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Baixar
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Embedded PDF Viewer */}
                  {showPdfViewer && (
                    <div className="relative rounded-lg overflow-hidden border border-border bg-muted animate-fade-in">
                      <div className="absolute top-2 right-2 z-10 flex gap-2">
                        <Button
                          variant="secondary"
                          size="icon"
                          onClick={() => setIsFullscreen(true)}
                          className="h-8 w-8 bg-background/80 backdrop-blur-sm"
                        >
                          <Maximize2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <iframe
                        src={getPdfEmbedUrl(lesson.url_pdf!)}
                        className="w-full h-[500px]"
                        allow="autoplay"
                        title="PDF Viewer"
                      />
                    </div>
                  )}
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

              {/* Mark as Completed Section */}
              <div className="mt-6 pt-6 border-t border-border">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {isCompleted ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    ) : (
                      <Circle className="w-6 h-6 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium text-foreground">
                        {isCompleted ? 'Aula concluída!' : 'Marcar como concluída'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isCompleted 
                          ? 'Você completou esta aula' 
                          : isLastLesson 
                            ? 'Esta é a última aula do curso' 
                            : 'Conclua para avançar no curso'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!isCompleted && (
                      <Button 
                        onClick={handleMarkCompleted}
                        disabled={savingProgress}
                        className="gap-2"
                      >
                        {savingProgress ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                        Concluir Aula
                      </Button>
                    )}
                    {isCompleted && nextLesson && (
                      <Button onClick={handleNextLesson} className="gap-2">
                        Próxima Aula
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    )}
                    {isCompleted && isLastLesson && (
                      <Button onClick={() => lesson?.course?.id && navigate(`/curso/${lesson.course.id}`)} variant="outline">
                        Ver Curso
                      </Button>
                    )}
                  </div>
                </div>
              </div>
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

      {/* Fullscreen PDF Dialog */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-[95vw] w-full h-[90vh] p-0 overflow-hidden">
          <div className="relative w-full h-full">
            <div className="absolute top-3 right-3 z-10 flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.open(getPdfDownloadUrl(lesson.url_pdf!), '_blank')}
                className="gap-2 bg-background/80 backdrop-blur-sm"
              >
                <Download className="w-4 h-4" />
                Baixar
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setIsFullscreen(false)}
                className="h-8 w-8 bg-background/80 backdrop-blur-sm"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            {lesson.url_pdf && (
              <iframe
                src={getPdfEmbedUrl(lesson.url_pdf)}
                className="w-full h-full"
                allow="autoplay"
                title="PDF Viewer Fullscreen"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* XP Gain Animation */}
      <XPGainToast 
        xpAmount={XP_PER_LESSON} 
        show={showXPGain} 
        onComplete={() => setShowXPGain(false)} 
      />

      {/* Course Completion Celebration */}
      <CelebrationModal
        isOpen={showCourseComplete}
        onClose={() => {
          setShowCourseComplete(false);
          if (lesson?.course?.id) {
            navigate(`/curso/${lesson.course.id}`);
          }
        }}
        trackTitle={lesson?.course?.titulo || 'Curso'}
      />
    </div>
    </PageTransition>
  );
}
