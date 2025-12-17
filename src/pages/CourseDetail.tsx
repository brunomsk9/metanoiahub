import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { MentorChatButton } from "@/components/MentorChat";
import { PageTransition } from "@/components/PageTransition";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Play, FileText, CheckSquare, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Lesson {
  id: string;
  titulo: string;
  tipo: 'video' | 'texto' | 'checklist_interativo';
  duracao_minutos: number | null;
  ordem: number;
  completed: boolean;
}

interface Course {
  id: string;
  titulo: string;
  descricao: string | null;
  track_id: string;
  track_titulo: string;
}

export default function CourseDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourseAndLessons = async () => {
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

      const [courseResult, lessonsResult, progressResult] = await Promise.all([
        supabase
          .from('courses')
          .select('id, titulo, descricao, track_id, tracks(titulo)')
          .eq('id', id)
          .single(),
        supabase
          .from('lessons')
          .select('id, titulo, tipo, duracao_minutos, ordem')
          .eq('course_id', id)
          .order('ordem'),
        supabase
          .from('user_progress')
          .select('lesson_id, completed')
          .eq('user_id', session.user.id)
      ]);

      if (courseResult.error) {
        console.error('Error fetching course:', courseResult.error);
        navigate('/trilhas');
        return;
      }

      const courseData = courseResult.data;
      setCourse({
        id: courseData.id,
        titulo: courseData.titulo,
        descricao: courseData.descricao,
        track_id: courseData.track_id,
        track_titulo: (courseData.tracks as any)?.titulo || 'Trilha',
      });

      const completedLessons = new Set(
        progressResult.data?.filter(p => p.completed).map(p => p.lesson_id) || []
      );

      const formattedLessons = lessonsResult.data?.map(lesson => ({
        id: lesson.id,
        titulo: lesson.titulo,
        tipo: lesson.tipo,
        duracao_minutos: lesson.duracao_minutos,
        ordem: lesson.ordem,
        completed: completedLessons.has(lesson.id),
      })) || [];

      setLessons(formattedLessons);
      setLoading(false);
    };

    fetchCourseAndLessons();
  }, [id, navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const getLessonIcon = (tipo: string) => {
    switch (tipo) {
      case 'video':
        return <Play className="w-4 h-4" />;
      case 'texto':
        return <FileText className="w-4 h-4" />;
      case 'checklist_interativo':
        return <CheckSquare className="w-4 h-4" />;
      default:
        return <Play className="w-4 h-4" />;
    }
  };

  const completedCount = lessons.filter(l => l.completed).length;
  const progressPercent = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar onLogout={handleLogout} />
      
      <PageTransition>
        <main className="pt-14 lg:pt-16 pb-8">
          <div className="px-4 lg:px-6 max-w-3xl mx-auto space-y-6">
            {/* Back button */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => course && navigate(`/trilha/${course.track_id}`)}
              className="mt-4 -ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Voltar
            </Button>

            {/* Header */}
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96" />
              </div>
            ) : course && (
              <header className="space-y-1">
                <p className="text-xs text-muted-foreground">{course.track_titulo}</p>
                <h1 className="text-2xl lg:text-3xl font-display font-semibold text-foreground">
                  {course.titulo}
                </h1>
                {course.descricao && (
                  <p className="text-sm text-muted-foreground">{course.descricao}</p>
                )}
              </header>
            )}

            {/* Progress */}
            {!loading && lessons.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Progresso</span>
                  <span className="text-sm font-medium">{completedCount}/{lessons.length} aulas</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-16 rounded-lg" />
                ))}
              </div>
            )}

            {/* Lessons List */}
            {!loading && (
              <div className="space-y-2">
                {lessons.map((lesson, index) => (
                  <div
                    key={lesson.id}
                    onClick={() => navigate(`/aula/${lesson.id}`)}
                    className="group cursor-pointer flex items-center gap-4 p-4 rounded-lg bg-card border border-border hover:border-primary/50 transition-all duration-200"
                  >
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      lesson.completed 
                        ? 'bg-primary/20 text-primary' 
                        : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                    } transition-colors`}>
                      {lesson.completed ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        getLessonIcon(lesson.tipo)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium group-hover:text-primary transition-colors line-clamp-1 ${
                        lesson.completed ? 'text-muted-foreground' : 'text-foreground'
                      }`}>
                        {index + 1}. {lesson.titulo}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="capitalize">
                          {lesson.tipo === 'video' ? 'Vídeo' : 
                           lesson.tipo === 'texto' ? 'Texto' : 'Checklist'}
                        </span>
                        {lesson.duracao_minutos && lesson.duracao_minutos > 0 && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {lesson.duracao_minutos} min
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && lessons.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">Nenhuma aula encontrada neste curso</p>
              </div>
            )}
          </div>
        </main>
      </PageTransition>

      <MentorChatButton />
    </div>
  );
}
