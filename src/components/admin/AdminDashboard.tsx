import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, BookOpen, GraduationCap, FileText, Flame, TrendingUp, Calendar, Heart } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface PlatformStats {
  totalUsers: number;
  totalTracks: number;
  totalCourses: number;
  totalLessons: number;
  totalResources: number;
  totalReadingPlans: number;
  activeRelationships: number;
  avgStreak: number;
  usersWithStreak: number;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentUsers, setRecentUsers] = useState<Array<{ id: string; nome: string; created_at: string }>>([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const [
      usersRes,
      tracksRes,
      coursesRes,
      lessonsRes,
      resourcesRes,
      plansRes,
      relationshipsRes,
      streakRes,
      recentUsersRes
    ] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('tracks').select('id', { count: 'exact', head: true }),
      supabase.from('courses').select('id', { count: 'exact', head: true }),
      supabase.from('lessons').select('id', { count: 'exact', head: true }),
      supabase.from('resources').select('id', { count: 'exact', head: true }),
      supabase.from('reading_plans').select('id', { count: 'exact', head: true }),
      supabase.from('discipleship_relationships').select('discipulador_id').eq('status', 'active'),
      supabase.from('profiles').select('current_streak').gt('current_streak', 0),
      supabase.from('profiles').select('id, nome, created_at').order('created_at', { ascending: false }).limit(5)
    ]);

    const streakData = streakRes.data || [];
    const avgStreak = streakData.length > 0
      ? Math.round(streakData.reduce((sum, p) => sum + (p.current_streak || 0), 0) / streakData.length)
      : 0;

    // Count unique discipuladores (each discipulador = 1 discipulado)
    const uniqueDiscipuladores = new Set(
      (relationshipsRes.data || []).map(r => r.discipulador_id)
    ).size;

    setStats({
      totalUsers: usersRes.count || 0,
      totalTracks: tracksRes.count || 0,
      totalCourses: coursesRes.count || 0,
      totalLessons: lessonsRes.count || 0,
      totalResources: resourcesRes.count || 0,
      totalReadingPlans: plansRes.count || 0,
      activeRelationships: uniqueDiscipuladores,
      avgStreak,
      usersWithStreak: streakData.length
    });

    setRecentUsers(recentUsersRes.data || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="space-y-6 section-pattern">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="glass-effect rounded-xl p-4">
              <Skeleton className="h-16 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    { label: 'Usuários', value: stats.totalUsers, icon: Users, color: 'primary' },
    { label: 'Trilhas', value: stats.totalTracks, icon: BookOpen, color: 'blue-500' },
    { label: 'Cursos', value: stats.totalCourses, icon: GraduationCap, color: 'purple-500' },
    { label: 'Aulas', value: stats.totalLessons, icon: FileText, color: 'green-500' },
    { label: 'Recursos S.O.S.', value: stats.totalResources, icon: FileText, color: 'orange-500' },
    { label: 'Planos de Leitura', value: stats.totalReadingPlans, icon: Calendar, color: 'cyan-500' },
    { label: 'Discipulados Ativos', value: stats.activeRelationships, icon: Heart, color: 'red-500' },
    { label: 'Com Streak Ativo', value: stats.usersWithStreak, icon: Flame, color: 'amber-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div 
              key={index}
              className="p-4 rounded-xl glass-effect hover:border-primary/30 transition-all duration-300 hover:scale-[1.02]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional Info */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Average Streak Card */}
        <div className="p-6 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary/30 flex items-center justify-center">
              <Flame className="w-7 h-7 text-primary" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gradient">{stats.avgStreak}</p>
              <p className="text-sm text-muted-foreground">Média de dias em streak</p>
            </div>
          </div>
        </div>

        {/* Recent Users */}
        <div className="p-6 rounded-xl glass-effect">
          <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Usuários Recentes
          </h3>
          <div className="space-y-3">
            {recentUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-primary/5 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                    {user.nome?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <span className="text-sm text-foreground">{user.nome || 'Sem nome'}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(user.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
