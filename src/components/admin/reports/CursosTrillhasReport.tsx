import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis } from "recharts";
import { BookOpen, GraduationCap, CheckCircle } from "lucide-react";
import { PeriodFilter, PeriodOption, getDateFromPeriod } from "./PeriodFilter";

interface TrackStats {
  id: string;
  titulo: string;
  totalCourses: number;
  totalLessons: number;
  completedLessons: number;
  uniqueUsers: number;
}

interface CourseStats {
  id: string;
  titulo: string;
  trackTitulo: string;
  totalLessons: number;
  completedLessons: number;
  completionRate: number;
}

export function CursosTrillhasReport() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodOption>("6m");
  const [trackStats, setTrackStats] = useState<TrackStats[]>([]);
  const [courseStats, setCourseStats] = useState<CourseStats[]>([]);
  const [topLessons, setTopLessons] = useState<{ titulo: string; completions: number }[]>([]);

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const periodStart = getDateFromPeriod(period);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('church_id')
        .eq('id', session.user.id)
        .single();

      const churchId = profile?.church_id;

      // Fetch tracks, courses, lessons and progress
      const [tracksResult, coursesResult, lessonsResult, progressResult] = await Promise.all([
        supabase.from('tracks').select('id, titulo').eq('church_id', churchId),
        supabase.from('courses').select('id, titulo, track_id').eq('church_id', churchId),
        supabase.from('lessons').select('id, titulo, course_id').eq('church_id', churchId),
        supabase.from('user_progress').select('lesson_id, user_id, completed, completed_at').eq('completed', true)
      ]);

      const tracks = tracksResult.data || [];
      const courses = coursesResult.data || [];
      const lessons = lessonsResult.data || [];
      let progress = progressResult.data || [];

      // Filter progress by period
      if (periodStart) {
        progress = progress.filter(p => p.completed_at && new Date(p.completed_at) >= periodStart);
      }

      // Build track stats
      const trackStatsMap: TrackStats[] = tracks.map(track => {
        const trackCourses = courses.filter(c => c.track_id === track.id);
        const trackCourseIds = trackCourses.map(c => c.id);
        const trackLessons = lessons.filter(l => trackCourseIds.includes(l.course_id));
        const trackLessonIds = trackLessons.map(l => l.id);
        const completedProgress = progress.filter(p => trackLessonIds.includes(p.lesson_id));
        const uniqueUsers = new Set(completedProgress.map(p => p.user_id)).size;

        return {
          id: track.id,
          titulo: track.titulo,
          totalCourses: trackCourses.length,
          totalLessons: trackLessons.length,
          completedLessons: completedProgress.length,
          uniqueUsers
        };
      });

      setTrackStats(trackStatsMap);

      // Build course stats
      const courseStatsMap: CourseStats[] = courses.map(course => {
        const track = tracks.find(t => t.id === course.track_id);
        const courseLessons = lessons.filter(l => l.course_id === course.id);
        const courseLessonIds = courseLessons.map(l => l.id);
        const completedProgress = progress.filter(p => courseLessonIds.includes(p.lesson_id));
        
        const totalPossible = courseLessons.length * new Set(progress.map(p => p.user_id)).size;
        const completionRate = totalPossible > 0 
          ? Math.round((completedProgress.length / totalPossible) * 100)
          : 0;

        return {
          id: course.id,
          titulo: course.titulo,
          trackTitulo: track?.titulo || 'Sem trilha',
          totalLessons: courseLessons.length,
          completedLessons: completedProgress.length,
          completionRate: Math.min(completionRate, 100)
        };
      });

      setCourseStats(courseStatsMap.sort((a, b) => b.completionRate - a.completionRate));

      // Top lessons by completions
      const lessonCompletions: Record<string, { titulo: string; completions: number }> = {};
      lessons.forEach(lesson => {
        const completions = progress.filter(p => p.lesson_id === lesson.id).length;
        lessonCompletions[lesson.id] = { titulo: lesson.titulo, completions };
      });

      const topLessonsList = Object.values(lessonCompletions)
        .sort((a, b) => b.completions - a.completions)
        .slice(0, 10);

      setTopLessons(topLessonsList);
    } catch (error) {
      console.error('Error fetching course stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const chartConfig = {
    completions: { label: "Conclusões", color: "hsl(var(--primary))" }
  };

  return (
    <div className="space-y-6">
      {/* Period Filter */}
      <div className="flex justify-end">
        <PeriodFilter value={period} onChange={setPeriod} />
      </div>

      {/* Track Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {trackStats.map(track => (
          <Card key={track.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                {track.titulo}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cursos</span>
                <span className="font-medium">{track.totalCourses}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Aulas</span>
                <span className="font-medium">{track.totalLessons}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Conclusões</span>
                <span className="font-medium">{track.completedLessons}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Usuários ativos</span>
                <Badge variant="secondary">{track.uniqueUsers}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Course Progress Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Progresso por Curso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {courseStats.slice(0, 10).map(course => (
              <div key={course.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">{course.titulo}</span>
                    <span className="text-sm text-muted-foreground ml-2">({course.trackTitulo})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {course.completedLessons} conclusões
                    </span>
                    <Badge variant={course.completionRate > 50 ? "default" : "secondary"}>
                      {course.completionRate}%
                    </Badge>
                  </div>
                </div>
                <Progress value={course.completionRate} className="h-2" />
              </div>
            ))}
            {courseStats.length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                Nenhum curso encontrado
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top Lessons Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Aulas Mais Completadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topLessons.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[300px]">
              <BarChart data={topLessons} layout="vertical">
                <XAxis type="number" />
                <YAxis 
                  dataKey="titulo" 
                  type="category" 
                  width={150}
                  tick={{ fontSize: 12 }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="completions" fill="hsl(var(--primary))" radius={4} />
              </BarChart>
            </ChartContainer>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Nenhuma conclusão registrada ainda
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
