import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppShell } from "@/components/layout";
import { MentorChatButton } from "@/components/MentorChat";
import { PageTransition } from "@/components/PageTransition";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Clock } from "lucide-react";

interface Course {
  id: string;
  titulo: string;
  descricao: string | null;
  thumbnail: string | null;
  duracao_minutos: number | null;
  ordem: number;
  lessonsCount: number;
}

interface Track {
  id: string;
  titulo: string;
  descricao: string | null;
  cover_image: string | null;
}

export default function TrackDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [track, setTrack] = useState<Track | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrackAndCourses = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      if (!id) {
        navigate('/trilhas');
        return;
      }

      const [trackResult, coursesResult] = await Promise.all([
        supabase
          .from('tracks')
          .select('id, titulo, descricao, cover_image')
          .eq('id', id)
          .single(),
        supabase
          .from('courses')
          .select('id, titulo, descricao, thumbnail, duracao_minutos, ordem, lessons(count)')
          .eq('track_id', id)
          .order('ordem')
      ]);

      if (trackResult.error) {
        console.error('Error fetching track:', trackResult.error);
        navigate('/trilhas');
        return;
      }

      setTrack(trackResult.data);

      const formattedCourses = coursesResult.data?.map(course => ({
        id: course.id,
        titulo: course.titulo,
        descricao: course.descricao,
        thumbnail: course.thumbnail,
        duracao_minutos: course.duracao_minutos,
        ordem: course.ordem,
        lessonsCount: course.lessons?.[0]?.count || 0,
      })) || [];

      setCourses(formattedCourses);
      setLoading(false);
    };

    fetchTrackAndCourses();
  }, [id, navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <AppShell 
      headerTitle={track?.titulo || "Trilha"} 
      showBack 
      backTo="/trilhas" 
      onLogout={handleLogout}
    >
      <PageTransition>
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header - visible on desktop */}
          {loading ? (
            <div className="hidden lg:block space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
          ) : track && (
            <header className="hidden lg:block">
              <h1 className="text-2xl lg:text-3xl font-display font-semibold text-foreground">
                {track.titulo}
              </h1>
              {track.descricao && (
                <p className="text-sm text-muted-foreground mt-1">{track.descricao}</p>
              )}
            </header>
          )}

            {/* Loading */}
            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-48 rounded-xl" />
                ))}
              </div>
            )}

            {/* Courses Grid */}
            {!loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    onClick={() => navigate(`/curso/${course.id}`)}
                    className="group cursor-pointer rounded-xl overflow-hidden bg-card border border-border hover:border-primary/50 transition-all duration-300"
                  >
                    <div className="aspect-video relative overflow-hidden bg-muted">
                      {course.thumbnail ? (
                        <img
                          src={course.thumbnail}
                          alt={course.titulo}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="w-12 h-12 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>
                    <div className="p-4 space-y-2">
                      <h3 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {course.titulo}
                      </h3>
                      {course.descricao && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {course.descricao}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          {course.lessonsCount} aulas
                        </span>
                        {course.duracao_minutos && course.duracao_minutos > 0 && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {course.duracao_minutos} min
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          {!loading && courses.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum curso encontrado nesta trilha</p>
            </div>
          )}
        </div>
      </PageTransition>

      <MentorChatButton />
    </AppShell>
  );
}
