import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, Legend, CartesianGrid } from "recharts";
import { Users, Building2, TrendingUp, Crown, UserCheck, Calendar, ClipboardList, Award } from "lucide-react";

interface Ministry {
  id: string;
  nome: string;
  cor: string;
  lider_principal_id: string | null;
  lider_secundario_id: string | null;
}

interface Volunteer {
  id: string;
  ministry_id: string;
  user_id: string;
}

interface Schedule {
  id: string;
  ministry_id: string;
  volunteer_id: string;
  status: string;
  service?: {
    data_hora: string;
  };
}

interface MinistryChartsProps {
  ministries: Ministry[];
  volunteers: Volunteer[];
  schedules: Schedule[];
  users: { id: string; nome: string }[];
}

const CHART_COLORS = [
  'hsl(var(--primary))',
  '#10b981',
  '#8b5cf6',
  '#f59e0b',
  '#ef4444',
  '#06b6d4',
  '#ec4899',
  '#6366f1',
  '#14b8a6',
  '#f97316',
];

const STATUS_COLORS = {
  confirmed: '#10b981',
  pending: '#f59e0b',
  declined: '#ef4444',
};

export function MinistryCharts({ ministries, volunteers, schedules, users }: MinistryChartsProps) {
  // Stats calculations
  const stats = useMemo(() => {
    const uniqueVolunteers = new Set(volunteers.map(v => v.user_id)).size;
    const ministriesWithLeaders = ministries.filter(m => m.lider_principal_id).length;
    const totalSchedules = schedules.length;
    const confirmedSchedules = schedules.filter(s => s.status === 'confirmed').length;
    const confirmationRate = totalSchedules > 0 ? Math.round((confirmedSchedules / totalSchedules) * 100) : 0;
    
    // Multi-ministry volunteers
    const volunteerMinistryCount: Record<string, number> = {};
    volunteers.forEach(v => {
      volunteerMinistryCount[v.user_id] = (volunteerMinistryCount[v.user_id] || 0) + 1;
    });
    const multiMinistryVolunteers = Object.values(volunteerMinistryCount).filter(c => c > 1).length;
    
    // Average volunteers per ministry
    const avgVolunteersPerMinistry = ministries.length > 0 
      ? (volunteers.length / ministries.length).toFixed(1) 
      : 0;

    return {
      totalMinistries: ministries.length,
      uniqueVolunteers,
      ministriesWithLeaders,
      totalSchedules,
      confirmedSchedules,
      confirmationRate,
      multiMinistryVolunteers,
      avgVolunteersPerMinistry,
    };
  }, [ministries, volunteers, schedules]);

  // Volunteers per ministry
  const volunteersPerMinistryData = useMemo(() => {
    return ministries
      .map(m => ({
        nome: m.nome.length > 12 ? m.nome.substring(0, 12) + '...' : m.nome,
        fullName: m.nome,
        voluntarios: volunteers.filter(v => v.ministry_id === m.id).length,
        fill: m.cor || CHART_COLORS[0],
      }))
      .sort((a, b) => b.voluntarios - a.voluntarios)
      .slice(0, 10);
  }, [ministries, volunteers]);

  // Ministry size distribution (pie)
  const ministrySizeDistributionData = useMemo(() => {
    const ranges = [
      { range: '0', min: 0, max: 1 },
      { range: '1-5', min: 1, max: 6 },
      { range: '6-10', min: 6, max: 11 },
      { range: '11-20', min: 11, max: 21 },
      { range: '20+', min: 21, max: 999999 },
    ];

    return ranges.map((r, index) => ({
      range: r.range + ' vol.',
      count: ministries.filter(m => {
        const count = volunteers.filter(v => v.ministry_id === m.id).length;
        return count >= r.min && count < r.max;
      }).length,
      fill: CHART_COLORS[index],
    })).filter(d => d.count > 0);
  }, [ministries, volunteers]);

  // Schedule status distribution
  const scheduleStatusData = useMemo(() => {
    const confirmed = schedules.filter(s => s.status === 'confirmed').length;
    const pending = schedules.filter(s => s.status === 'pending').length;
    const declined = schedules.filter(s => s.status === 'declined').length;

    return [
      { name: 'Confirmados', value: confirmed, color: STATUS_COLORS.confirmed },
      { name: 'Pendentes', value: pending, color: STATUS_COLORS.pending },
      { name: 'Recusados', value: declined, color: STATUS_COLORS.declined },
    ].filter(d => d.value > 0);
  }, [schedules]);

  // Top volunteers by schedules
  const topVolunteersData = useMemo(() => {
    const volunteerScheduleCounts: Record<string, { id: string; total: number; confirmed: number }> = {};
    
    schedules.forEach(s => {
      if (!volunteerScheduleCounts[s.volunteer_id]) {
        volunteerScheduleCounts[s.volunteer_id] = { id: s.volunteer_id, total: 0, confirmed: 0 };
      }
      volunteerScheduleCounts[s.volunteer_id].total++;
      if (s.status === 'confirmed') {
        volunteerScheduleCounts[s.volunteer_id].confirmed++;
      }
    });

    return Object.values(volunteerScheduleCounts)
      .map(v => {
        const user = users.find(u => u.id === v.id);
        const firstName = user?.nome?.split(' ')[0] || 'Voluntário';
        return {
          nome: firstName,
          fullName: user?.nome || 'Voluntário',
          escalas: v.total,
          confirmados: v.confirmed,
          taxa: v.total > 0 ? Math.round((v.confirmed / v.total) * 100) : 0,
        };
      })
      .sort((a, b) => b.escalas - a.escalas)
      .slice(0, 10);
  }, [schedules, users]);

  // Multi-ministry distribution
  const multiMinistryData = useMemo(() => {
    const volunteerMinistryCount: Record<string, number> = {};
    volunteers.forEach(v => {
      volunteerMinistryCount[v.user_id] = (volunteerMinistryCount[v.user_id] || 0) + 1;
    });

    const ranges = [
      { range: '1 área', min: 1, max: 2 },
      { range: '2 áreas', min: 2, max: 3 },
      { range: '3 áreas', min: 3, max: 4 },
      { range: '4+ áreas', min: 4, max: 999999 },
    ];

    return ranges.map((r, index) => ({
      range: r.range,
      count: Object.values(volunteerMinistryCount).filter(c => c >= r.min && c < r.max).length,
      fill: CHART_COLORS[index],
    })).filter(d => d.count > 0);
  }, [volunteers]);

  // Leaders without ministries
  const leadersWithoutVolunteers = useMemo(() => {
    return ministries.filter(m => {
      const volunteerCount = volunteers.filter(v => v.ministry_id === m.id).length;
      return volunteerCount === 0;
    }).length;
  }, [ministries, volunteers]);

  const chartConfig = {
    voluntarios: { label: "Voluntários", color: "hsl(var(--primary))" },
    escalas: { label: "Escalas", color: "hsl(var(--chart-2))" },
    confirmados: { label: "Confirmados", color: "#10b981" },
    count: { label: "Quantidade", color: "hsl(var(--chart-3))" },
  };

  if (ministries.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum ministério cadastrado para exibir estatísticas</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Ministérios</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.totalMinistries}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Voluntários</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.uniqueVolunteers}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-purple-500" />
              <span className="text-xs text-muted-foreground">Com Líderes</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.ministriesWithLeaders}</p>
            <p className="text-xs text-muted-foreground">de {stats.totalMinistries}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-transparent border-orange-500/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-orange-500" />
              <span className="text-xs text-muted-foreground">Multi-Área</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.multiMinistryVolunteers}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-500/10 to-transparent border-cyan-500/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-cyan-500" />
              <span className="text-xs text-muted-foreground">Escalas</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.totalSchedules}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Confirmação</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.confirmationRate}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Row 2 - Additional Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">Média/Ministério</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.avgVolunteersPerMinistry}</p>
            <p className="text-xs text-muted-foreground">voluntários</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Confirmados</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.confirmedSchedules}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-red-500" />
              <span className="text-xs text-muted-foreground">Sem Voluntários</span>
            </div>
            <p className="text-2xl font-bold mt-1">{leadersWithoutVolunteers}</p>
            <p className="text-xs text-muted-foreground">ministérios</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-500" />
              <span className="text-xs text-muted-foreground">Vínculos Total</span>
            </div>
            <p className="text-2xl font-bold mt-1">{volunteers.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1: Volunteers per Ministry + Ministry Size */}
      <div className="grid md:grid-cols-2 gap-4 md:gap-6">
        {/* Volunteers per Ministry */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Voluntários por Ministério
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-hidden">
            {volunteersPerMinistryData.length > 0 ? (
              <div className="w-full h-[320px]">
                <ChartContainer config={chartConfig} className="w-full h-full">
                  <BarChart data={volunteersPerMinistryData} layout="vertical" margin={{ left: 0, right: 20, top: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis dataKey="nome" type="category" width={80} tick={{ fontSize: 10, fill: 'hsl(var(--foreground))' }} />
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      formatter={(value, name, props) => [`${value} voluntários`, props.payload.fullName]}
                    />
                    <Bar dataKey="voluntarios" radius={[0, 6, 6, 0]}>
                      {volunteersPerMinistryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </div>
            ) : (
              <div className="h-[320px] flex items-center justify-center text-muted-foreground">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ministry Size Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4 text-purple-500" />
              Distribuição por Tamanho
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-hidden">
            {ministrySizeDistributionData.length > 0 ? (
              <div className="w-full h-[320px]">
                <ChartContainer config={chartConfig} className="w-full h-full">
                  <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <Pie
                      data={ministrySizeDistributionData}
                      cx="50%"
                      cy="45%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="count"
                      label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {ministrySizeDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} strokeWidth={0} />
                      ))}
                    </Pie>
                    <Legend 
                      verticalAlign="bottom"
                      formatter={(value) => <span className="text-foreground text-xs">{value}</span>}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
              </div>
            ) : (
              <div className="h-[320px] flex items-center justify-center text-muted-foreground">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2: Schedule Status + Multi-Ministry */}
      <div className="grid md:grid-cols-2 gap-4 md:gap-6">
        {/* Schedule Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-green-500" />
              Status das Escalas
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-hidden">
            {scheduleStatusData.length > 0 ? (
              <div className="w-full h-[280px]">
                <ChartContainer config={chartConfig} className="w-full h-full">
                  <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <Pie
                      data={scheduleStatusData}
                      cx="50%"
                      cy="45%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {scheduleStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                      ))}
                    </Pie>
                    <Legend 
                      verticalAlign="bottom"
                      formatter={(value) => <span className="text-foreground text-xs">{value}</span>}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
              </div>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                Nenhuma escala registrada
              </div>
            )}
          </CardContent>
        </Card>

        {/* Multi-Ministry Volunteers */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-orange-500" />
              Voluntários Multi-Área
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-hidden">
            {multiMinistryData.length > 0 ? (
              <div className="w-full h-[280px]">
                <ChartContainer config={chartConfig} className="w-full h-full">
                  <BarChart data={multiMinistryData} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="range" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} width={30} />
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      formatter={(value) => [`${value} voluntários`, 'Quantidade']}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {multiMinistryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </div>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 3: Top Volunteers */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Award className="h-4 w-4 text-amber-500" />
            Top 10 Voluntários por Escalas
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-hidden">
          {topVolunteersData.length > 0 ? (
            <div className="w-full h-[320px]">
              <ChartContainer config={chartConfig} className="w-full h-full">
                <BarChart data={topVolunteersData} layout="vertical" margin={{ left: 0, right: 30, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis dataKey="nome" type="category" width={70} tick={{ fontSize: 10, fill: 'hsl(var(--foreground))' }} />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    formatter={(value, name, props) => [
                      name === 'confirmados' 
                        ? `${value} (${props.payload.taxa}% taxa)` 
                        : `${value} escalas`,
                      props.payload.fullName
                    ]}
                  />
                  <Bar dataKey="escalas" fill="hsl(var(--primary))" radius={[0, 0, 0, 0]} stackId="a" />
                  <Bar dataKey="confirmados" fill="#10b981" radius={[0, 6, 6, 0]} stackId="b" />
                  <Legend 
                    verticalAlign="bottom"
                    formatter={(value) => <span className="text-sm text-muted-foreground capitalize">{value}</span>}
                  />
                </BarChart>
              </ChartContainer>
            </div>
          ) : (
            <div className="h-[320px] flex items-center justify-center text-muted-foreground">
              Nenhuma escala registrada
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
