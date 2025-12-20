import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, BookOpen, Heart, Flame, TrendingUp, GraduationCap } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from "recharts";

interface Stats {
  totalUsers: number;
  activeDiscipulados: number;
  totalTracks: number;
  totalCourses: number;
  totalLessons: number;
  avgStreak: number;
  usersWithStreak: number;
  totalXP: number;
}

interface MonthlyData {
  month: string;
  usuarios: number;
  discipulados: number;
}

export function VisaoGeralReport() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [roleDistribution, setRoleDistribution] = useState<{ name: string; value: number; fill: string }[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Get user's church_id
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('church_id')
        .eq('id', session.user.id)
        .single();

      const churchId = profile?.church_id;

      // Fetch all stats in parallel
      const [
        profilesResult,
        relationshipsResult,
        tracksResult,
        coursesResult,
        lessonsResult,
        rolesResult
      ] = await Promise.all([
        supabase.from('profiles').select('id, current_streak, xp_points, created_at').eq('church_id', churchId),
        supabase.from('discipleship_relationships').select('id, created_at').eq('church_id', churchId).eq('status', 'active'),
        supabase.from('tracks').select('id').eq('church_id', churchId),
        supabase.from('courses').select('id').eq('church_id', churchId),
        supabase.from('lessons').select('id').eq('church_id', churchId),
        supabase.from('user_roles').select('role, user_id')
      ]);

      const profiles = profilesResult.data || [];
      const relationships = relationshipsResult.data || [];
      const tracks = tracksResult.data || [];
      const courses = coursesResult.data || [];
      const lessons = lessonsResult.data || [];
      const roles = rolesResult.data || [];

      // Calculate stats
      const usersWithStreak = profiles.filter(p => p.current_streak > 0).length;
      const avgStreak = profiles.length > 0 
        ? Math.round(profiles.reduce((sum, p) => sum + p.current_streak, 0) / profiles.length)
        : 0;
      const totalXP = profiles.reduce((sum, p) => sum + p.xp_points, 0);

      setStats({
        totalUsers: profiles.length,
        activeDiscipulados: relationships.length,
        totalTracks: tracks.length,
        totalCourses: courses.length,
        totalLessons: lessons.length,
        avgStreak,
        usersWithStreak,
        totalXP
      });

      // Role distribution
      const roleCount: Record<string, number> = {};
      roles.forEach(r => {
        roleCount[r.role] = (roleCount[r.role] || 0) + 1;
      });

      const roleColors: Record<string, string> = {
        discipulo: 'hsl(var(--primary))',
        discipulador: 'hsl(var(--chart-2))',
        admin: 'hsl(var(--chart-3))',
        church_admin: 'hsl(var(--chart-4))',
        super_admin: 'hsl(var(--chart-5))'
      };

      const roleLabels: Record<string, string> = {
        discipulo: 'Discípulos',
        discipulador: 'Discipuladores',
        admin: 'Admins',
        church_admin: 'Admin Igreja',
        super_admin: 'Super Admin'
      };

      setRoleDistribution(
        Object.entries(roleCount).map(([role, count]) => ({
          name: roleLabels[role] || role,
          value: count,
          fill: roleColors[role] || 'hsl(var(--muted))'
        }))
      );

      // Monthly data (last 6 months)
      const now = new Date();
      const monthlyStats: MonthlyData[] = [];
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        const monthName = date.toLocaleDateString('pt-BR', { month: 'short' });

        const usersInMonth = profiles.filter(p => {
          const created = new Date(p.created_at);
          return created <= monthEnd;
        }).length;

        const discipuladosInMonth = relationships.filter(r => {
          const created = new Date(r.created_at);
          return created <= monthEnd;
        }).length;

        monthlyStats.push({
          month: monthName,
          usuarios: usersInMonth,
          discipulados: discipuladosInMonth
        });
      }

      setMonthlyData(monthlyStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  const chartConfig = {
    usuarios: { label: "Usuários", color: "hsl(var(--primary))" },
    discipulados: { label: "Discipulados", color: "hsl(var(--chart-2))" }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">usuários cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Discipulados Ativos</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeDiscipulados || 0}</div>
            <p className="text-xs text-muted-foreground">relacionamentos ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média de Streak</CardTitle>
            <Flame className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.avgStreak || 0} dias</div>
            <p className="text-xs text-muted-foreground">{stats?.usersWithStreak || 0} usuários com streak</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">XP Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalXP?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">pontos acumulados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trilhas</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalTracks || 0}</div>
            <p className="text-xs text-muted-foreground">trilhas criadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cursos</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCourses || 0}</div>
            <p className="text-xs text-muted-foreground">cursos disponíveis</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aulas</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalLessons || 0}</div>
            <p className="text-xs text-muted-foreground">aulas criadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Role Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Papel</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px]">
              <PieChart>
                <Pie
                  data={roleDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {roleDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Monthly Evolution */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px]">
              <LineChart data={monthlyData}>
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey="usuarios" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))" }}
                />
                <Line 
                  type="monotone" 
                  dataKey="discipulados" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--chart-2))" }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
