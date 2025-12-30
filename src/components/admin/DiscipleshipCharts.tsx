import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Legend, CartesianGrid, LineChart, Line, AreaChart, Area } from "recharts";
import { Users, TrendingUp, Award, BookOpen, Flame, Target, Calendar, Filter, UserCheck, UserX, Clock } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format, subDays, subMonths, isAfter, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Profile {
  id: string;
  nome: string;
  current_streak: number;
  xp_points: number;
}

interface Relationship {
  id: string;
  discipulo_id: string;
  discipulador_id: string;
  status: string;
  started_at?: string;
  completed_at?: string;
  alicerce_completed_at?: string;
  alicerce_completed_presencial: boolean;
  academia_nivel_1: boolean;
  academia_nivel_2: boolean;
  academia_nivel_3: boolean;
  academia_nivel_4: boolean;
  conexao_inicial_1: boolean;
  conexao_inicial_2: boolean;
  discipulo?: Profile;
  discipulador?: Profile;
}

interface DiscipleshipChartsProps {
  relationships: Relationship[];
  discipuladores: Profile[];
  discipuladorDiscipleCount: Record<string, number>;
  maxDisciplesLimit: number;
}

type PeriodFilter = "30d" | "90d" | "180d" | "1y" | "all";

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4'
];

const PERIOD_OPTIONS = [
  { value: "30d", label: "Últimos 30 dias" },
  { value: "90d", label: "Últimos 3 meses" },
  { value: "180d", label: "Últimos 6 meses" },
  { value: "1y", label: "Último ano" },
  { value: "all", label: "Todo período" },
];

export function DiscipleshipCharts({
  relationships,
  discipuladores,
  discipuladorDiscipleCount,
  maxDisciplesLimit
}: DiscipleshipChartsProps) {
  const [period, setPeriod] = useState<PeriodFilter>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed">("all");

  // Calculate date cutoff based on period
  const dateCutoff = useMemo(() => {
    const now = new Date();
    switch (period) {
      case "30d": return subDays(now, 30);
      case "90d": return subDays(now, 90);
      case "180d": return subDays(now, 180);
      case "1y": return subMonths(now, 12);
      default: return null;
    }
  }, [period]);

  // Filter relationships by period and status
  const filteredRelationships = useMemo(() => {
    return relationships.filter(r => {
      // Status filter
      if (statusFilter === "active" && r.status !== "active") return false;
      if (statusFilter === "completed" && r.status !== "completed") return false;
      
      // Period filter
      if (dateCutoff && r.started_at) {
        const startDate = parseISO(r.started_at);
        if (!isAfter(startDate, dateCutoff)) return false;
      }
      
      return true;
    });
  }, [relationships, dateCutoff, statusFilter]);

  // Stats cards data
  const stats = useMemo(() => {
    const active = filteredRelationships.filter(r => r.status === 'active');
    const completed = filteredRelationships.filter(r => r.status === 'completed');
    const alicerceCompleted = active.filter(r => r.alicerce_completed_presencial).length;
    
    const avgStreak = active.length > 0
      ? Math.round(active.reduce((sum, r) => sum + (r.discipulo?.current_streak || 0), 0) / active.length)
      : 0;
    
    const conexaoCompleted = active.filter(r => r.conexao_inicial_1 && r.conexao_inicial_2).length;
    
    // Average days in discipleship
    const avgDays = active.length > 0
      ? Math.round(active.reduce((sum, r) => {
          if (!r.started_at) return sum;
          return sum + differenceInDays(new Date(), parseISO(r.started_at));
        }, 0) / active.length)
      : 0;
    
    // Count discipuladores with at least one disciple
    const activeDiscipuladores = new Set(active.map(r => r.discipulador_id)).size;
    
    return {
      totalRelationships: filteredRelationships.length,
      activeRelationships: active.length,
      completedRelationships: completed.length,
      totalDiscipuladores: discipuladores.length,
      activeDiscipuladores,
      alicerceCompleted,
      alicerceRate: active.length > 0 
        ? Math.round((alicerceCompleted / active.length) * 100) 
        : 0,
      avgStreak,
      conexaoCompleted,
      avgDays,
      completionRate: filteredRelationships.length > 0
        ? Math.round((completed.length / filteredRelationships.length) * 100)
        : 0
    };
  }, [filteredRelationships, discipuladores]);

  // Monthly evolution data
  const monthlyEvolutionData = useMemo(() => {
    const now = new Date();
    const startDate = dateCutoff || subMonths(now, 12);
    const months = eachMonthOfInterval({ start: startDate, end: now });
    
    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const newInMonth = relationships.filter(r => {
        if (!r.started_at) return false;
        const started = parseISO(r.started_at);
        return started >= monthStart && started <= monthEnd;
      }).length;
      
      const completedInMonth = relationships.filter(r => {
        if (!r.completed_at) return false;
        const completed = parseISO(r.completed_at);
        return completed >= monthStart && completed <= monthEnd;
      }).length;
      
      const activeAtEnd = relationships.filter(r => {
        if (!r.started_at) return false;
        const started = parseISO(r.started_at);
        if (started > monthEnd) return false;
        if (r.completed_at) {
          const completed = parseISO(r.completed_at);
          return completed > monthEnd;
        }
        return r.status === 'active';
      }).length;
      
      return {
        month: format(month, 'MMM/yy', { locale: ptBR }),
        novos: newInMonth,
        concluidos: completedInMonth,
        ativos: activeAtEnd
      };
    });
  }, [relationships, dateCutoff]);

  // Disciples per discipulador chart data
  const disciplesPerDiscipuladorData = useMemo(() => {
    return discipuladores
      .map(d => ({
        nome: d.nome?.split(' ')[0] || 'Sem nome',
        fullName: d.nome || 'Sem nome',
        discipulos: discipuladorDiscipleCount[d.id] || 0,
        capacidade: maxDisciplesLimit
      }))
      .sort((a, b) => b.discipulos - a.discipulos)
      .slice(0, 10);
  }, [discipuladores, discipuladorDiscipleCount, maxDisciplesLimit]);

  // Program completion funnel data
  const programFunnelData = useMemo(() => {
    const active = filteredRelationships.filter(r => r.status === 'active');
    if (active.length === 0) return [];

    const conexao1 = active.filter(r => r.conexao_inicial_1).length;
    const conexao2 = active.filter(r => r.conexao_inicial_2).length;
    const alicerce = active.filter(r => r.alicerce_completed_presencial).length;
    const academia1 = active.filter(r => r.academia_nivel_1).length;
    const academia2 = active.filter(r => r.academia_nivel_2).length;
    const academia3 = active.filter(r => r.academia_nivel_3).length;
    const academia4 = active.filter(r => r.academia_nivel_4).length;

    return [
      { etapa: 'Conexão 1', quantidade: conexao1, taxa: Math.round((conexao1/active.length)*100) },
      { etapa: 'Conexão 2', quantidade: conexao2, taxa: Math.round((conexao2/active.length)*100) },
      { etapa: 'Alicerce', quantidade: alicerce, taxa: Math.round((alicerce/active.length)*100) },
      { etapa: 'Academia 1', quantidade: academia1, taxa: Math.round((academia1/active.length)*100) },
      { etapa: 'Academia 2', quantidade: academia2, taxa: Math.round((academia2/active.length)*100) },
      { etapa: 'Academia 3', quantidade: academia3, taxa: Math.round((academia3/active.length)*100) },
      { etapa: 'Academia 4', quantidade: academia4, taxa: Math.round((academia4/active.length)*100) },
    ];
  }, [filteredRelationships]);

  // Status distribution data
  const statusDistributionData = useMemo(() => {
    const active = relationships.filter(r => r.status === 'active').length;
    const completed = relationships.filter(r => r.status === 'completed').length;
    const inactive = relationships.filter(r => r.status !== 'active' && r.status !== 'completed').length;

    return [
      { name: 'Ativos', value: active, color: COLORS[5] },
      { name: 'Concluídos', value: completed, color: COLORS[0] },
      { name: 'Inativos', value: inactive, color: COLORS[7] },
    ].filter(d => d.value > 0);
  }, [relationships]);

  // Capacity usage data
  const capacityData = useMemo(() => {
    const ranges = [
      { range: '0%', min: 0, max: 0.01, color: COLORS[7] },
      { range: '1-25%', min: 0.01, max: 0.26, color: COLORS[6] },
      { range: '26-50%', min: 0.26, max: 0.51, color: COLORS[1] },
      { range: '51-75%', min: 0.51, max: 0.76, color: COLORS[5] },
      { range: '76-100%', min: 0.76, max: 1.01, color: COLORS[0] },
    ];

    return ranges.map(r => ({
      range: r.range,
      count: discipuladores.filter(d => {
        const usage = (discipuladorDiscipleCount[d.id] || 0) / maxDisciplesLimit;
        return usage >= r.min && usage < r.max;
      }).length,
      fill: r.color
    }));
  }, [discipuladores, discipuladorDiscipleCount, maxDisciplesLimit]);

  // Discipuladores without disciples
  const discipuladoresSemDiscipulos = useMemo(() => {
    return discipuladores.filter(d => !discipuladorDiscipleCount[d.id] || discipuladorDiscipleCount[d.id] === 0).length;
  }, [discipuladores, discipuladorDiscipleCount]);

  const chartConfig = {
    discipulos: { label: "Discípulos", color: "hsl(var(--primary))" },
    capacidade: { label: "Capacidade", color: "hsl(var(--muted))" },
    count: { label: "Discipuladores", color: "hsl(var(--chart-2))" },
    quantidade: { label: "Quantidade", color: "hsl(var(--chart-3))" },
    novos: { label: "Novos", color: "hsl(var(--chart-2))" },
    concluidos: { label: "Concluídos", color: "hsl(var(--chart-3))" },
    ativos: { label: "Ativos", color: "hsl(var(--primary))" },
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filtros:</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={period} onValueChange={(v) => setPeriod(v as PeriodFilter)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as "all" | "active" | "completed")}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="completed">Concluídos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Badge variant="outline" className="ml-auto">
          {filteredRelationships.length} registros
        </Badge>
      </div>

      {/* Stats Cards - Row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Total Vínculos</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.totalRelationships}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Ativos</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.activeRelationships}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Concluídos</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.completedRelationships}</p>
            <p className="text-xs text-muted-foreground">{stats.completionRate}% taxa</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              <span className="text-xs text-muted-foreground">Discipuladores</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.activeDiscipuladores}</p>
            <p className="text-xs text-muted-foreground">de {stats.totalDiscipuladores}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-transparent border-orange-500/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-xs text-muted-foreground">Média Streak</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.avgStreak}</p>
            <p className="text-xs text-muted-foreground">dias</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-500/10 to-transparent border-cyan-500/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-cyan-500" />
              <span className="text-xs text-muted-foreground">Tempo Médio</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.avgDays}</p>
            <p className="text-xs text-muted-foreground">dias</p>
          </CardContent>
        </Card>
      </div>

      {/* Stats Cards - Row 2 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Alicerce OK</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.alicerceCompleted}</p>
            <p className="text-xs text-muted-foreground">{stats.alicerceRate}% dos ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-500" />
              <span className="text-xs text-muted-foreground">Conexão OK</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.conexaoCompleted}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <UserX className="h-4 w-4 text-red-500" />
              <span className="text-xs text-muted-foreground">Sem Discípulos</span>
            </div>
            <p className="text-2xl font-bold mt-1">{discipuladoresSemDiscipulos}</p>
            <p className="text-xs text-muted-foreground">discipuladores</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-yellow-500" />
              <span className="text-xs text-muted-foreground">Média/Disc.</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {stats.activeDiscipuladores > 0 
                ? (stats.activeRelationships / stats.activeDiscipuladores).toFixed(1) 
                : 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly Evolution */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Evolução Mensal de Discipulados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyEvolutionData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyEvolutionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAtivos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area type="monotone" dataKey="ativos" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorAtivos)" />
                    <Line type="monotone" dataKey="novos" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="concluidos" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={{ r: 4 }} />
                    <Legend />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhum dado disponível para o período selecionado
              </div>
            )}
          </CardContent>
        </Card>

        {/* Program Funnel */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Funil de Progressão
            </CardTitle>
          </CardHeader>
          <CardContent>
            {programFunnelData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={programFunnelData} layout="vertical" margin={{ left: 10, right: 50 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" />
                    <YAxis dataKey="etapa" type="category" width={90} tick={{ fontSize: 11 }} />
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      formatter={(value, name, props) => [`${value} (${props.payload.taxa}%)`, 'Quantidade']}
                    />
                    <Bar dataKey="quantidade" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]}>
                      {programFunnelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Distribution Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Distribuição por Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statusDistributionData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {statusDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>

        {/* Disciples per Discipulador */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Top 10 Discipuladores
            </CardTitle>
          </CardHeader>
          <CardContent>
            {disciplesPerDiscipuladorData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={disciplesPerDiscipuladorData} layout="vertical" margin={{ left: 10, right: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" domain={[0, maxDisciplesLimit]} />
                    <YAxis dataKey="nome" type="category" width={80} tick={{ fontSize: 12 }} />
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      formatter={(value, name, props) => [
                        `${value}/${maxDisciplesLimit}`,
                        props.payload.fullName
                      ]}
                    />
                    <Bar dataKey="discipulos" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>

        {/* Capacity Usage */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Utilização da Capacidade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={capacityData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {capacityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
