import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BookOpen, Clock, Sparkles, GraduationCap } from "lucide-react";
import { AppShell } from "@/components/layout";
import { MentorChatButton } from "@/components/MentorChat";
import { PageTransition } from "@/components/PageTransition";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

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
          {/* Breadcrumb */}
          <PageBreadcrumb 
            items={[
              { label: 'Trilhas', href: '/trilhas' },
              { label: track?.titulo || 'Trilha' }
            ]} 
          />

          {/* Header */}
          {loading ? (
            <div className="hidden lg:block space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
          ) : track && (
            <header className="hidden lg:block section-pattern rounded-2xl p-6 border border-border/50">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                  <GraduationCap className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-display font-bold">
                    <span className="text-gradient">{track.titulo}</span>
                  </h1>
                  {track.descricao && (
                    <p className="text-sm text-muted-foreground mt-1">{track.descricao}</p>
                  )}
                </div>
              </div>
            </header>
          )}

          {/* Loading */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-56 rounded-2xl" />
              ))}
            </div>
          )}

          {/* Courses Grid */}
          {!loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {courses.map((course) => (
                <div
                  key={course.id}
                  onClick={() => navigate(`/curso/${course.id}`)}
                  className="group cursor-pointer rounded-2xl overflow-hidden bg-card border border-border/50 hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5"
                >
                  <div className="aspect-video relative overflow-hidden bg-secondary/50">
                    {course.thumbnail ? (
                      <img
                        src={course.thumbnail}
                        alt={course.titulo}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-muted-foreground/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <div className="p-5 space-y-3">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {course.titulo}
                    </h3>
                    {course.descricao && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {course.descricao}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                      <span className="flex items-center gap-1.5 bg-primary/10 text-primary px-2 py-1 rounded-full">
                        <BookOpen className="w-3.5 h-3.5" />
                        {course.lessonsCount} aulas
                      </span>
                      {course.duracao_minutos && course.duracao_minutos > 0 && (
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
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
            <div className="text-center py-16 section-pattern rounded-2xl border border-border/50">
              <Sparkles className="w-12 h-12 mx-auto text-primary/50 mb-3" />
              <p className="text-muted-foreground">Nenhum curso encontrado nesta trilha</p>
            </div>
          )}
        </div>
      </PageTransition>

      <MentorChatButton />
    </AppShell>
  );
}
