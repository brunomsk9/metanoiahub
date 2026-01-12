import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Users, BookOpen, Heart, Flame, TrendingUp, GraduationCap, 
  Calendar, MessageSquare, CheckCircle2, Award, Target, Activity,
  ArrowUp, ArrowDown, Minus, BarChart3
} from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, BarChart, Bar, ResponsiveContainer, Legend, AreaChart, Area } from "recharts";
import { PeriodFilter, PeriodOption, getDateFromPeriod } from "./PeriodFilter";
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CHART_COLORS, CHART_COLORS_ARRAY, chartAnimationVariants } from "@/lib/chartColors";

interface Stats {
  // Usuários
  totalUsers: number;
  newUsersThisPeriod: number;
  usersGrowth: number;
  // Discipulado
  activeDiscipulados: number;
  totalDiscipuladores: number;
  avgDiscipulosPerMentor: number;
  jornadaCompletedCount: number;
  jornadaCompletionRate: number;
  // Encontros
  totalMeetings: number;
  meetingsIndividual: number;
  meetingsCelula: number;
  avgMeetingsPerWeek: number;
  // Engajamento
  avgStreak: number;
  usersWithStreak: number;
  totalXP: number;
  avgXP: number;
  // Conteúdo
  totalTracks: number;
  totalCourses: number;
  totalLessons: number;
  lessonsCompleted: number;
  // Checklist
  avgChecklistCompliance: number;
}

interface MonthlyData {
  month: string;
  usuarios: number;
  discipulados: number;
  encontros: number;
}

interface TrendIndicatorProps {
  value: number;
  suffix?: string;
}

function TrendIndicator({ value, suffix = "%" }: TrendIndicatorProps) {
  if (value === 0) return <Minus className="h-3 w-3 text-muted-foreground" />;
  if (value > 0) return (
    <span className="flex items-center text-green-500 text-xs">
      <ArrowUp className="h-3 w-3" />
      {Math.abs(value).toFixed(0)}{suffix}
    </span>
  );
  return (
    <span className="flex items-center text-red-500 text-xs">
      <ArrowDown className="h-3 w-3" />
      {Math.abs(value).toFixed(0)}{suffix}
    </span>
  );
}


export function VisaoGeralReport() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodOption>("3m");
  const [stats, setStats] = useState<Stats | null>(null);
  const [roleDistribution, setRoleDistribution] = useState<{ name: string; value: number; fill: string }[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [meetingTypeData, setMeetingTypeData] = useState<{ name: string; value: number; fill: string }[]>([]);
  const [topDiscipuladores, setTopDiscipuladores] = useState<{ nome: string; discipulos: number }[]>([]);

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const periodStart = getDateFromPeriod(period);
      const now = new Date();
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('church_id')
        .eq('id', session.user.id)
        .single();

      const churchId = profile?.church_id;

      // Fetch all data in parallel
      const [
        profilesResult,
        allProfilesResult,
        relationshipsResult,
        allRelationshipsResult,
        meetingsResult,
        tracksResult,
        coursesResult,
        lessonsResult,
        progressResult,
        rolesResult,
        checklistResult,
        discipuladorRolesResult
      ] = await Promise.all([
        // Profiles no período
        supabase.from('profiles').select('id, current_streak, xp_points, created_at').eq('church_id', churchId),
        // Todos os profiles para comparação
        supabase.from('profiles').select('id, created_at').eq('church_id', churchId),
        // Relacionamentos ativos
        supabase.from('discipleship_relationships')
          .select('id, discipulador_id, discipulo_id, started_at, alicerce_completed_presencial, status')
          .eq('church_id', churchId)
          .eq('status', 'active'),
        // Todos os relacionamentos para histórico
        supabase.from('discipleship_relationships')
          .select('id, discipulador_id, started_at, status')
          .eq('church_id', churchId),
        // Encontros
        supabase.from('meetings').select('id, tipo, data_encontro, discipulador_id').eq('church_id', churchId),
        // Conteúdo
        supabase.from('tracks').select('id').eq('church_id', churchId),
        supabase.from('courses').select('id').eq('church_id', churchId),
        supabase.from('lessons').select('id').eq('church_id', churchId),
        // Progresso de aulas
        supabase.from('user_progress').select('id, user_id, completed').eq('completed', true),
        // Roles
        supabase.from('user_roles').select('role, user_id'),
        // Checklist responses
        supabase.from('weekly_checklist_responses').select('discipulador_id, responses'),
        // Discipuladores
        supabase.from('user_roles').select('user_id').eq('role', 'discipulador')
      ]);

      const allProfiles = allProfilesResult.data || [];
      let profiles = profilesResult.data || [];
      let relationships = relationshipsResult.data || [];
      let allRelationships = allRelationshipsResult.data || [];
      let meetings = meetingsResult.data || [];
      const tracks = tracksResult.data || [];
      const courses = coursesResult.data || [];
      const lessons = lessonsResult.data || [];
      const progress = progressResult.data || [];
      const roles = rolesResult.data || [];
      const checklistResponses = checklistResult.data || [];
      const discipuladorRoles = discipuladorRolesResult.data || [];

      // Filter by period
      if (periodStart) {
        profiles = profiles.filter(p => new Date(p.created_at) >= periodStart);
        meetings = meetings.filter(m => new Date(m.data_encontro) >= periodStart);
      }

      // Calculate weeks in period for avg meetings
      const weeksInPeriod = periodStart 
        ? Math.max(1, Math.ceil(differenceInDays(now, periodStart) / 7))
        : 12;

      // Users growth
      const previousPeriodStart = periodStart 
        ? new Date(periodStart.getTime() - (now.getTime() - periodStart.getTime()))
        : subMonths(now, 6);
      const previousPeriodProfiles = allProfiles.filter(p => {
        const created = new Date(p.created_at);
        return created >= previousPeriodStart && created < (periodStart || now);
      }).length;
      const currentPeriodProfiles = profiles.length;
      const usersGrowth = previousPeriodProfiles > 0 
        ? ((currentPeriodProfiles - previousPeriodProfiles) / previousPeriodProfiles) * 100
        : 0;

      // Discipuladores count
      const discipuladorIds = new Set(discipuladorRoles.map(r => r.user_id));
      const totalDiscipuladores = discipuladorIds.size;

      // Avg disciples per mentor
      const discipuladoresWithDisciples = new Map<string, number>();
      relationships.forEach(r => {
        discipuladoresWithDisciples.set(
          r.discipulador_id, 
          (discipuladoresWithDisciples.get(r.discipulador_id) || 0) + 1
        );
      });
      const avgDiscipulosPerMentor = discipuladoresWithDisciples.size > 0
        ? Math.round(relationships.length / discipuladoresWithDisciples.size * 10) / 10
        : 0;

      // Jornada completed
      const jornadaCompletedCount = relationships.filter(r => r.alicerce_completed_presencial).length;
      const jornadaCompletionRate = relationships.length > 0
        ? Math.round((jornadaCompletedCount / relationships.length) * 100)
        : 0;

      // Meetings stats
      const meetingsIndividual = meetings.filter(m => m.tipo === 'individual').length;
      const meetingsCelula = meetings.filter(m => m.tipo === 'celula').length;
      const avgMeetingsPerWeek = Math.round((meetings.length / weeksInPeriod) * 10) / 10;

      // Streak and XP stats
      const allProfilesData = profilesResult.data || [];
      const usersWithStreak = allProfilesData.filter(p => p.current_streak > 0).length;
      const avgStreak = allProfilesData.length > 0 
        ? Math.round(allProfilesData.reduce((sum, p) => sum + p.current_streak, 0) / allProfilesData.length)
        : 0;
      const totalXP = allProfilesData.reduce((sum, p) => sum + p.xp_points, 0);
      const avgXP = allProfilesData.length > 0 
        ? Math.round(totalXP / allProfilesData.length)
        : 0;

      // Checklist compliance
      let avgChecklistCompliance = 0;
      if (checklistResponses.length > 0) {
        const totalCompliance = checklistResponses.reduce((sum, c) => {
          const responses = c.responses as Record<string, Record<string, boolean>>;
          let totalChecked = 0;
          let totalPossible = 0;
          Object.values(responses).forEach(discResponses => {
            Object.values(discResponses).forEach(checked => {
              totalPossible++;
              if (checked) totalChecked++;
            });
          });
          return sum + (totalPossible > 0 ? (totalChecked / totalPossible) * 100 : 0);
        }, 0);
        avgChecklistCompliance = Math.round(totalCompliance / checklistResponses.length);
      }

      setStats({
        totalUsers: allProfilesData.length,
        newUsersThisPeriod: currentPeriodProfiles,
        usersGrowth,
        activeDiscipulados: relationships.length,
        totalDiscipuladores,
        avgDiscipulosPerMentor,
        jornadaCompletedCount,
        jornadaCompletionRate,
        totalMeetings: meetings.length,
        meetingsIndividual,
        meetingsCelula,
        avgMeetingsPerWeek,
        avgStreak,
        usersWithStreak,
        totalXP,
        avgXP,
        totalTracks: tracks.length,
        totalCourses: courses.length,
        totalLessons: lessons.length,
        lessonsCompleted: progress.length,
        avgChecklistCompliance
      });

      // Role distribution
      const roleCount: Record<string, number> = {};
      roles.forEach(r => {
        roleCount[r.role] = (roleCount[r.role] || 0) + 1;
      });

      const roleColors: Record<string, string> = {
        discipulo: CHART_COLORS_ARRAY[0],
        discipulador: CHART_COLORS_ARRAY[1],
        admin: CHART_COLORS_ARRAY[2],
        church_admin: CHART_COLORS_ARRAY[3],
        lider_ministerial: CHART_COLORS_ARRAY[4]
      };

      const roleLabels: Record<string, string> = {
        discipulo: 'Discípulos',
        discipulador: 'Discipuladores',
        admin: 'Admins',
        church_admin: 'Admin Igreja',
        lider_ministerial: 'Líderes'
      };

      setRoleDistribution(
        Object.entries(roleCount)
          .filter(([role]) => role !== 'super_admin')
          .map(([role, count]) => ({
            name: roleLabels[role] || role,
            value: count,
            fill: roleColors[role] || 'hsl(var(--muted))'
          }))
      );

      // Meeting type distribution
      setMeetingTypeData([
        { name: "Individuais", value: meetingsIndividual, fill: CHART_COLORS.lime },
        { name: "Células", value: meetingsCelula, fill: CHART_COLORS.teal }
      ].filter(d => d.value > 0));

      // Top discipuladores
      const topDisc = Array.from(discipuladoresWithDisciples.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
      
      // Get names for top discipuladores
      const topDiscIds = topDisc.map(([id]) => id);
      const { data: topDiscProfiles } = await supabase
        .from('profiles')
        .select('id, nome')
        .in('id', topDiscIds);
      
      const profileMap = new Map(topDiscProfiles?.map(p => [p.id, p.nome]) || []);
      setTopDiscipuladores(
        topDisc.map(([id, count]) => ({
          nome: (profileMap.get(id) || 'Desconhecido').split(' ')[0],
          discipulos: count
        }))
      );

      // Monthly data
      const monthsToShow = period === "30d" ? 1 : period === "3m" ? 3 : period === "6m" ? 6 : period === "1y" ? 12 : 6;
      const monthStart = subMonths(now, monthsToShow - 1);
      const months = eachMonthOfInterval({ start: startOfMonth(monthStart), end: now });
      
      const monthlyStats: MonthlyData[] = months.map(monthDate => {
        const monthEnd = endOfMonth(monthDate);
        const monthName = format(monthDate, "MMM", { locale: ptBR });

        const usersInMonth = allProfiles.filter(p => new Date(p.created_at) <= monthEnd).length;
        const discipuladosInMonth = allRelationships.filter(r => {
          const created = new Date(r.started_at);
          return created <= monthEnd && r.status === 'active';
        }).length;
        const meetingsInMonth = (meetingsResult.data || []).filter(m => {
          const date = new Date(m.data_encontro);
          return date >= startOfMonth(monthDate) && date <= monthEnd;
        }).length;

        return {
          month: monthName,
          usuarios: usersInMonth,
          discipulados: discipuladosInMonth,
          encontros: meetingsInMonth
        };
      });

      setMonthlyData(monthlyStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  const chartConfig = {
    usuarios: { label: "Usuários", color: CHART_COLORS.lime },
    discipulados: { label: "Discipulados", color: CHART_COLORS.teal },
    encontros: { label: "Encontros", color: CHART_COLORS.cyan },
    discipulos: { label: "Discípulos", color: CHART_COLORS.lime }
  };

  return (
    <div className="space-y-6">
      {/* Period Filter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Dashboard Consolidado</h3>
        </div>
        <PeriodFilter value={period} onChange={setPeriod} />
      </div>

      {/* Quick Stats - Row 1: Usuários e Discipulado */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: "Total de Membros",
            value: stats?.totalUsers || 0,
            subtitle: <div className="flex items-center gap-2 mt-1">
              <TrendIndicator value={stats?.usersGrowth || 0} />
              <span className="text-xs text-muted-foreground">+{stats?.newUsersThisPeriod || 0} no período</span>
            </div>,
            Icon: Users,
            iconClass: "text-primary",
            highlight: true
          },
          {
            title: "Discipulados Ativos",
            value: stats?.activeDiscipulados || 0,
            subtitle: <p className="text-xs text-muted-foreground">{stats?.totalDiscipuladores || 0} discipuladores • {stats?.avgDiscipulosPerMentor || 0} média</p>,
            Icon: Heart,
            iconClass: "text-pink-500"
          },
          {
            title: "Jornada Metanoia",
            value: stats?.jornadaCompletedCount || 0,
            subtitle: <div className="flex items-center gap-2 mt-1">
              <Progress value={stats?.jornadaCompletionRate || 0} className="h-1.5 flex-1" />
              <span className="text-xs text-muted-foreground">{stats?.jornadaCompletionRate || 0}%</span>
            </div>,
            Icon: Target,
            iconClass: "text-green-500"
          },
          {
            title: "Encontros",
            value: stats?.totalMeetings || 0,
            subtitle: <p className="text-xs text-muted-foreground">~{stats?.avgMeetingsPerWeek || 0}/semana • {stats?.meetingsIndividual || 0} ind. / {stats?.meetingsCelula || 0} cél.</p>,
            Icon: Calendar,
            iconClass: "text-blue-500"
          }
        ].map((card, i) => (
          <motion.div
            key={card.title}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={chartAnimationVariants.card}
          >
            <Card className={card.highlight ? "border-primary/20" : ""}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <card.Icon className={`h-4 w-4 ${card.iconClass}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                {card.subtitle}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Stats - Row 2: Engajamento e Conteúdo */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: "Streak Médio",
            value: <>{stats?.avgStreak || 0} <span className="text-sm font-normal text-muted-foreground">dias</span></>,
            subtitle: <p className="text-xs text-muted-foreground">{stats?.usersWithStreak || 0} com streak ativo</p>,
            Icon: Flame,
            iconClass: "text-orange-500"
          },
          {
            title: "XP Total",
            value: (stats?.totalXP || 0).toLocaleString(),
            subtitle: <p className="text-xs text-muted-foreground">média {stats?.avgXP || 0} XP/membro</p>,
            Icon: Award,
            iconClass: "text-yellow-500"
          },
          {
            title: "Conteúdo",
            value: <>{stats?.totalLessons || 0} <span className="text-sm font-normal text-muted-foreground">aulas</span></>,
            subtitle: <p className="text-xs text-muted-foreground">{stats?.totalTracks || 0} trilhas • {stats?.totalCourses || 0} cursos</p>,
            Icon: BookOpen,
            iconClass: "text-muted-foreground"
          },
          {
            title: "Checklist Semanal",
            value: `${stats?.avgChecklistCompliance || 0}%`,
            subtitle: <div className="flex items-center gap-2 mt-1">
              <Progress value={stats?.avgChecklistCompliance || 0} className="h-1.5 flex-1" />
            </div>,
            Icon: CheckCircle2,
            iconClass: "text-muted-foreground"
          }
        ].map((card, i) => (
          <motion.div
            key={card.title}
            custom={i + 4}
            initial="hidden"
            animate="visible"
            variants={chartAnimationVariants.card}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <card.Icon className={`h-4 w-4 ${card.iconClass}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                {card.subtitle}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts - Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Evolução Mensal */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={chartAnimationVariants.chart}
        >
          <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Evolução Mensal
            </CardTitle>
            <CardDescription>Crescimento de usuários, discipulados e encontros</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[280px] w-full overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="colorUsuarios" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.lime} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={CHART_COLORS.lime} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorDiscipulados" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.teal} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={CHART_COLORS.teal} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area 
                    type="monotone" 
                    dataKey="usuarios" 
                    stroke={CHART_COLORS.lime} 
                    fillOpacity={1}
                    fill="url(#colorUsuarios)"
                    strokeWidth={2}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="discipulados" 
                    stroke={CHART_COLORS.teal} 
                    fillOpacity={1}
                    fill="url(#colorDiscipulados)"
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="encontros" 
                    stroke={CHART_COLORS.cyan} 
                    strokeWidth={2}
                    dot={{ fill: CHART_COLORS.cyan, r: 3 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
        </motion.div>

        {/* Role Distribution */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={chartAnimationVariants.chart}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Distribuição por Papel
              </CardTitle>
              <CardDescription>Composição da comunidade por função</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[280px]">
                <PieChart>
                  <Pie
                    data={roleDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    labelLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}
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
        </motion.div>
      </div>

      {/* Charts - Row 2 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Meeting Types */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={chartAnimationVariants.chart}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Tipos de Encontro
              </CardTitle>
            </CardHeader>
            <CardContent>
              {meetingTypeData.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[180px]">
                  <PieChart>
                    <Pie
                      data={meetingTypeData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={60}
                      paddingAngle={4}
                    >
                      {meetingTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
              ) : (
                <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">
                  Sem dados de encontros
                </div>
              )}
              <div className="flex justify-center gap-4 mt-2">
                {meetingTypeData.map((item, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                    <span>{item.name}: {item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Discipuladores */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={chartAnimationVariants.chart}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Top Discipuladores
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topDiscipuladores.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[180px]">
                  <BarChart data={topDiscipuladores} layout="vertical">
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="nome" type="category" width={80} tick={{ fontSize: 11 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="discipulos" fill={CHART_COLORS.lime} radius={4} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">
                  Sem dados de discipuladores
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Summary Footer */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-background">{stats?.lessonsCompleted || 0}</Badge>
              <span className="text-muted-foreground">aulas concluídas</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-background">{stats?.activeDiscipulados || 0}</Badge>
              <span className="text-muted-foreground">jornadas em andamento</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-background">{stats?.totalMeetings || 0}</Badge>
              <span className="text-muted-foreground">encontros realizados</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
