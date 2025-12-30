import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Legend, CartesianGrid } from "recharts";
import { Users, TrendingUp, Award, BookOpen, Flame, Target } from "lucide-react";

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

export function DiscipleshipCharts({
  relationships,
  discipuladores,
  discipuladorDiscipleCount,
  maxDisciplesLimit
}: DiscipleshipChartsProps) {
  // Stats cards data
  const stats = useMemo(() => {
    const activeRelationships = relationships.filter(r => r.status === 'active');
    const alicerceCompleted = activeRelationships.filter(r => r.alicerce_completed_presencial).length;
    const avgStreak = activeRelationships.length > 0
      ? Math.round(activeRelationships.reduce((sum, r) => sum + (r.discipulo?.current_streak || 0), 0) / activeRelationships.length)
      : 0;
    
    const conexaoCompleted = activeRelationships.filter(r => r.conexao_inicial_1 && r.conexao_inicial_2).length;
    
    return {
      totalRelationships: activeRelationships.length,
      totalDiscipuladores: discipuladores.length,
      alicerceCompleted,
      alicerceRate: activeRelationships.length > 0 
        ? Math.round((alicerceCompleted / activeRelationships.length) * 100) 
        : 0,
      avgStreak,
      conexaoCompleted
    };
  }, [relationships, discipuladores]);

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

  // Program completion data for pie chart
  const programCompletionData = useMemo(() => {
    const active = relationships.filter(r => r.status === 'active');
    if (active.length === 0) return [];

    const alicerce = active.filter(r => r.alicerce_completed_presencial).length;
    const conexao = active.filter(r => r.conexao_inicial_1 && r.conexao_inicial_2).length;
    const academia = active.filter(r => 
      r.academia_nivel_1 || r.academia_nivel_2 || r.academia_nivel_3 || r.academia_nivel_4
    ).length;

    return [
      { name: 'Alicerce Concluído', value: alicerce, color: COLORS[0] },
      { name: 'Conexão Inicial OK', value: conexao, color: COLORS[1] },
      { name: 'Academia (1+ nível)', value: academia, color: COLORS[2] },
    ].filter(d => d.value > 0);
  }, [relationships]);

  // Capacity usage data
  const capacityData = useMemo(() => {
    const ranges = [
      { range: '0-25%', min: 0, max: 0.25 },
      { range: '26-50%', min: 0.25, max: 0.5 },
      { range: '51-75%', min: 0.5, max: 0.75 },
      { range: '76-100%', min: 0.75, max: 1.01 },
    ];

    return ranges.map(r => ({
      range: r.range,
      count: discipuladores.filter(d => {
        const usage = (discipuladorDiscipleCount[d.id] || 0) / maxDisciplesLimit;
        return usage >= r.min && usage < r.max;
      }).length
    }));
  }, [discipuladores, discipuladorDiscipleCount, maxDisciplesLimit]);

  // Academia progress data
  const academiaData = useMemo(() => {
    const active = relationships.filter(r => r.status === 'active');
    if (active.length === 0) return [];

    return [
      { nivel: 'Nível 1', concluidos: active.filter(r => r.academia_nivel_1).length },
      { nivel: 'Nível 2', concluidos: active.filter(r => r.academia_nivel_2).length },
      { nivel: 'Nível 3', concluidos: active.filter(r => r.academia_nivel_3).length },
      { nivel: 'Nível 4', concluidos: active.filter(r => r.academia_nivel_4).length },
    ];
  }, [relationships]);

  const chartConfig = {
    discipulos: { label: "Discípulos", color: "hsl(var(--primary))" },
    capacidade: { label: "Capacidade", color: "hsl(var(--muted))" },
    count: { label: "Discipuladores", color: "hsl(var(--chart-2))" },
    concluidos: { label: "Concluídos", color: "hsl(var(--chart-3))" },
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Discipulados</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.totalRelationships}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Discipuladores</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.totalDiscipuladores}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Alicerce OK</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.alicerceCompleted}</p>
            <p className="text-xs text-muted-foreground">{stats.alicerceRate}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-xs text-muted-foreground">Média Streak</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.avgStreak}</p>
            <p className="text-xs text-muted-foreground">dias</p>
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
              <Award className="h-4 w-4 text-yellow-500" />
              <span className="text-xs text-muted-foreground">Média/Disc.</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {stats.totalDiscipuladores > 0 
                ? (stats.totalRelationships / stats.totalDiscipuladores).toFixed(1) 
                : 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid md:grid-cols-2 gap-6">
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

        {/* Program Completion Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="h-4 w-4" />
              Programas Concluídos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {programCompletionData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={programCompletionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, value }) => `${value}`}
                    >
                      {programCompletionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend />
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhum programa concluído ainda
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
            <ChartContainer config={chartConfig} className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={capacityData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Academia Progress */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Academia das Nações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={academiaData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="nivel" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="concluidos" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
