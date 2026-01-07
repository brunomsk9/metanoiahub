import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, Cell, PieChart, Pie, Legend, ResponsiveContainer } from "recharts";
import { Heart, CheckCircle2, Users, TrendingUp, Filter } from "lucide-react";
import { PeriodFilter, PeriodOption, getDateFromPeriod } from "./PeriodFilter";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { CHART_COLORS, CHART_COLORS_ARRAY } from "@/lib/chartColors";

interface StageStats {
  name: string;
  shortName: string;
  completed: number;
  total: number;
  percentage: number;
  fill: string;
}

interface Discipulador {
  id: string;
  nome: string;
}

interface DiscipuladoStats {
  totalActive: number;
  totalCompleted: number;
  avgDuration: number;
  stages: StageStats[];
}

const STAGE_COLORS = CHART_COLORS_ARRAY;

export function DiscipuladoReport() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodOption>("6m");
  const [selectedDiscipulador, setSelectedDiscipulador] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [stats, setStats] = useState<DiscipuladoStats | null>(null);
  const [monthlyProgress, setMonthlyProgress] = useState<{ month: string; novos: number; concluidos: number }[]>([]);
  const [discipuladores, setDiscipuladores] = useState<Discipulador[]>([]);
  const [allRelationships, setAllRelationships] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, [period]);

  // Recalculate stats when filters change
  useEffect(() => {
    if (allRelationships.length > 0) {
      calculateStats();
    }
  }, [selectedDiscipulador, selectedStatus, allRelationships]);

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

      // Fetch relationships
      const { data: relationships } = await supabase
        .from('discipleship_relationships')
        .select('*')
        .eq('church_id', churchId);

      let rels = relationships || [];
      
      // Filter by period
      if (periodStart) {
        rels = rels.filter(r => new Date(r.created_at) >= periodStart);
      }

      setAllRelationships(rels);

      // Fetch discipuladores for filter
      const discipuladorIds = [...new Set(rels.map(r => r.discipulador_id))];
      if (discipuladorIds.length > 0) {
        const { data: discProfiles } = await supabase
          .from('profiles')
          .select('id, nome')
          .in('id', discipuladorIds);
        setDiscipuladores(discProfiles || []);
      }

      // Calculate monthly progress
      const monthsToShow = period === "30d" ? 1 : period === "3m" ? 3 : period === "6m" ? 6 : period === "1y" ? 12 : 6;
      const now = new Date();
      const monthly: { month: string; novos: number; concluidos: number }[] = [];
      
      for (let i = monthsToShow - 1; i >= 0; i--) {
        const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        const monthName = startDate.toLocaleDateString('pt-BR', { month: 'short' });

        const allRels = relationships || [];
        const novos = allRels.filter(r => {
          const created = new Date(r.created_at);
          return created >= startDate && created <= endDate;
        }).length;

        const allCompleted = allRels.filter(r => r.status === 'completed');
        const concluidos = allCompleted.filter(r => {
          if (!r.completed_at) return false;
          const completed = new Date(r.completed_at);
          return completed >= startDate && completed <= endDate;
        }).length;

        monthly.push({ month: monthName, novos, concluidos });
      }

      setMonthlyProgress(monthly);
    } catch (error) {
      console.error('Error fetching discipleship stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    let rels = [...allRelationships];

    // Apply discipulador filter
    if (selectedDiscipulador !== "all") {
      rels = rels.filter(r => r.discipulador_id === selectedDiscipulador);
    }

    // Apply status filter
    if (selectedStatus !== "all") {
      rels = rels.filter(r => r.status === selectedStatus);
    }

    const activeRels = rels.filter(r => r.status === 'active');
    const completedRels = rels.filter(r => r.status === 'completed');
    const baseTotal = selectedStatus === "all" ? activeRels.length : rels.length;

    // Calculate stage progress
    const stages: StageStats[] = [
      {
        name: 'Conexão Inicial 1',
        shortName: 'CI 1',
        completed: rels.filter(r => r.conexao_inicial_1).length,
        total: baseTotal,
        percentage: baseTotal > 0 ? Math.round((rels.filter(r => r.conexao_inicial_1).length / baseTotal) * 100) : 0,
        fill: STAGE_COLORS[0]
      },
      {
        name: 'Conexão Inicial 2',
        shortName: 'CI 2',
        completed: rels.filter(r => r.conexao_inicial_2).length,
        total: baseTotal,
        percentage: baseTotal > 0 ? Math.round((rels.filter(r => r.conexao_inicial_2).length / baseTotal) * 100) : 0,
        fill: STAGE_COLORS[1]
      },
      {
        name: 'Jornada Metanoia',
        shortName: 'Jornada',
        completed: rels.filter(r => r.alicerce_completed_presencial).length,
        total: baseTotal,
        percentage: baseTotal > 0 ? Math.round((rels.filter(r => r.alicerce_completed_presencial).length / baseTotal) * 100) : 0,
        fill: STAGE_COLORS[2]
      },
      {
        name: 'Academia Nível 1',
        shortName: 'Acad. 1',
        completed: rels.filter(r => r.academia_nivel_1).length,
        total: baseTotal,
        percentage: baseTotal > 0 ? Math.round((rels.filter(r => r.academia_nivel_1).length / baseTotal) * 100) : 0,
        fill: STAGE_COLORS[3]
      },
      {
        name: 'Academia Nível 2',
        shortName: 'Acad. 2',
        completed: rels.filter(r => r.academia_nivel_2).length,
        total: baseTotal,
        percentage: baseTotal > 0 ? Math.round((rels.filter(r => r.academia_nivel_2).length / baseTotal) * 100) : 0,
        fill: STAGE_COLORS[4]
      },
      {
        name: 'Academia Nível 3',
        shortName: 'Acad. 3',
        completed: rels.filter(r => r.academia_nivel_3).length,
        total: baseTotal,
        percentage: baseTotal > 0 ? Math.round((rels.filter(r => r.academia_nivel_3).length / baseTotal) * 100) : 0,
        fill: STAGE_COLORS[5]
      },
      {
        name: 'Academia Nível 4',
        shortName: 'Acad. 4',
        completed: rels.filter(r => r.academia_nivel_4).length,
        total: baseTotal,
        percentage: baseTotal > 0 ? Math.round((rels.filter(r => r.academia_nivel_4).length / baseTotal) * 100) : 0,
        fill: STAGE_COLORS[6]
      }
    ];

    // Calculate average duration for completed relationships
    let avgDuration = 0;
    if (completedRels.length > 0) {
      const durations = completedRels
        .filter(r => r.completed_at && r.started_at)
        .map(r => {
          const start = new Date(r.started_at);
          const end = new Date(r.completed_at!);
          return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        });
      
      if (durations.length > 0) {
        avgDuration = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
      }
    }

    setStats({
      totalActive: activeRels.length,
      totalCompleted: completedRels.length,
      avgDuration,
      stages
    });
  };

  const discipuladorOptions = useMemo(() => [
    { value: "all", label: "Todos os discipuladores" },
    ...discipuladores.map(d => ({ value: d.id, label: d.nome }))
  ], [discipuladores]);

  const statusOptions = [
    { value: "all", label: "Todos os status" },
    { value: "active", label: "Ativos" },
    { value: "completed", label: "Concluídos" },
    { value: "inactive", label: "Inativos" }
  ];

  // Prepare pie chart data (only stages with completed > 0)
  const pieChartData = useMemo(() => 
    stats?.stages.filter(s => s.completed > 0).map(s => ({
      name: s.shortName,
      value: s.completed,
      fill: s.fill
    })) || []
  , [stats]);

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
    novos: { label: "Novos", color: "hsl(var(--primary))" },
    concluidos: { label: "Concluídos", color: "hsl(var(--chart-2))" },
    completed: { label: "Concluídos", color: "hsl(var(--primary))" }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs text-muted-foreground mb-1 block">Discipulador</label>
              <SearchableSelect
                options={discipuladorOptions}
                value={selectedDiscipulador}
                onValueChange={setSelectedDiscipulador}
                placeholder="Filtrar por discipulador"
              />
            </div>
            <div className="flex-1 min-w-[160px]">
              <label className="text-xs text-muted-foreground mb-1 block">Status</label>
              <SearchableSelect
                options={statusOptions}
                value={selectedStatus}
                onValueChange={setSelectedStatus}
                placeholder="Filtrar por status"
              />
            </div>
            <div className="min-w-[140px]">
              <label className="text-xs text-muted-foreground mb-1 block">Período</label>
              <PeriodFilter value={period} onChange={setPeriod} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Discipulados Ativos</CardTitle>
            <Heart className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalActive || 0}</div>
            <p className="text-xs text-muted-foreground">relacionamentos em andamento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Discipulados Concluídos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCompleted || 0}</div>
            <p className="text-xs text-muted-foreground">jornadas completas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Duração Média</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.avgDuration || 0} dias</div>
            <p className="text-xs text-muted-foreground">para conclusão</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats && (stats.totalActive + stats.totalCompleted) > 0
                ? Math.round((stats.totalCompleted / (stats.totalActive + stats.totalCompleted)) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">discipulados finalizados</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid - Improved Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pie Chart - Distribuição por Etapa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Distribuição por Etapa
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pieChartData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      innerRadius={50}
                      paddingAngle={2}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      labelLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bar Chart - Evolução Mensal */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[280px]">
              <BarChart data={monthlyProgress}>
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="novos" name="Novos" fill="hsl(var(--primary))" radius={4} />
                <Bar dataKey="concluidos" name="Concluídos" fill="hsl(var(--chart-2))" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Stage Progress - Full Width */}
      <Card>
        <CardHeader>
          <CardTitle>Progresso por Etapa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {stats?.stages.map((stage, index) => (
              <div key={index} className="space-y-2 p-3 rounded-lg bg-muted/30 border border-border/50">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{stage.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {stage.completed}/{stage.total}
                    </span>
                    <Badge 
                      variant={stage.percentage > 50 ? "default" : "secondary"}
                      className="min-w-[45px] justify-center"
                    >
                      {stage.percentage}%
                    </Badge>
                  </div>
                </div>
                <Progress value={stage.percentage} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
