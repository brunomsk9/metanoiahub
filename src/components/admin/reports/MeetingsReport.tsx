import { useMemo, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { format, startOfWeek, endOfWeek, subWeeks, subMonths, startOfMonth, endOfMonth, eachWeekOfInterval, eachMonthOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Users, Calendar, MessageSquare, TrendingUp, Download, FileText, User, Filter, FileSpreadsheet } from "lucide-react";
import { useUserChurchId } from "@/hooks/useUserChurchId";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { PeriodFilter, PeriodOption, getDateFromPeriod } from "./PeriodFilter";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface MeetingWithDetails {
  id: string;
  tipo: "individual" | "celula";
  data_encontro: string;
  notas: string | null;
  local: string | null;
  discipulador: {
    id: string;
    nome: string;
  };
  discipulo?: {
    id: string;
    nome: string;
  } | null;
  attendances?: Array<{
    discipulo_id: string;
    presente: boolean;
    profile: { nome: string };
  }>;
}

interface DiscipuladorStats {
  id: string;
  nome: string;
  individuais: number;
  celulas: number;
  totalEncontros: number;
  totalParticipantes: number;
}

// Vibrant chart palette aligned with lime/dark design system
const CHART_COLORS = [
  "hsl(78 80% 48%)",     // Primary lime
  "hsl(42 90% 52%)",     // Accent gold
  "hsl(152 65% 42%)",    // Success green
  "hsl(210 70% 55%)",    // Info blue
  "hsl(320 70% 55%)",    // Magenta accent
  "hsl(180 60% 45%)",    // Teal
  "hsl(270 60% 55%)",    // Purple
  "hsl(15 80% 55%)",     // Orange
];

export function MeetingsReport() {
  const { churchId } = useUserChurchId();
  const [period, setPeriod] = useState<PeriodOption>("3m");
  const [selectedDiscipulador, setSelectedDiscipulador] = useState<string>("all");
  const [selectedTipo, setSelectedTipo] = useState<string>("all");
  const tableRef = useRef<HTMLDivElement>(null);

  const getDateRange = (periodOption: PeriodOption) => {
    const now = new Date();
    const periodStart = getDateFromPeriod(periodOption);
    // Include future meetings within next 30 days
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    return { start: periodStart || subMonths(now, 3), end: futureDate };
  };

  const { start: periodStart, end: periodEnd } = getDateRange(period);

  const { data: meetings = [], isLoading } = useQuery({
    queryKey: ["meetings-report", churchId, period],
    queryFn: async () => {
      if (!churchId) return [];

      const { data, error } = await supabase
        .from("meetings")
        .select(`
          id,
          tipo,
          data_encontro,
          notas,
          local,
          discipulador_id,
          discipulo_id
        `)
        .eq("church_id", churchId)
        .gte("data_encontro", periodStart.toISOString())
        .lte("data_encontro", periodEnd.toISOString())
        .order("data_encontro", { ascending: false });

      if (error) throw error;

      // Fetch profiles for discipuladores and discipulos
      const userIds = new Set<string>();
      data?.forEach((m) => {
        userIds.add(m.discipulador_id);
        if (m.discipulo_id) userIds.add(m.discipulo_id);
      });

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, nome")
        .in("id", Array.from(userIds));

      const profileMap = new Map(profiles?.map((p) => [p.id, p]));

      // Fetch attendances for cell meetings
      const cellMeetingIds = data?.filter((m) => m.tipo === "celula").map((m) => m.id) || [];
      
      let attendanceData: any[] = [];
      if (cellMeetingIds.length > 0) {
        const { data: attendances } = await supabase
          .from("meeting_attendance")
          .select("meeting_id, discipulo_id, presente")
          .in("meeting_id", cellMeetingIds);
        
        attendanceData = attendances || [];
      }

      // Get profile names for attendance
      const attendeeIds = new Set(attendanceData.map((a) => a.discipulo_id));
      const { data: attendeeProfiles } = await supabase
        .from("profiles")
        .select("id, nome")
        .in("id", Array.from(attendeeIds));
      
      const attendeeProfileMap = new Map(attendeeProfiles?.map((p) => [p.id, p]));

      return data?.map((meeting) => ({
        ...meeting,
        discipulador: profileMap.get(meeting.discipulador_id) || { id: meeting.discipulador_id, nome: "Desconhecido" },
        discipulo: meeting.discipulo_id ? profileMap.get(meeting.discipulo_id) : null,
        attendances: attendanceData
          .filter((a) => a.meeting_id === meeting.id)
          .map((a) => ({
            ...a,
            profile: attendeeProfileMap.get(a.discipulo_id) || { nome: "Desconhecido" },
          })),
      })) as MeetingWithDetails[];
    },
    enabled: !!churchId,
  });

  // Get unique discipuladores for filter
  const discipuladores = useMemo(() => {
    const map = new Map<string, string>();
    meetings.forEach((m) => map.set(m.discipulador.id, m.discipulador.nome));
    return Array.from(map.entries()).map(([id, nome]) => ({ id, nome }));
  }, [meetings]);

  // Apply filters
  const filteredMeetings = useMemo(() => {
    return meetings.filter((m) => {
      if (selectedDiscipulador !== "all" && m.discipulador.id !== selectedDiscipulador) return false;
      if (selectedTipo !== "all" && m.tipo !== selectedTipo) return false;
      return true;
    });
  }, [meetings, selectedDiscipulador, selectedTipo]);

  // Stats calculations
  const stats = useMemo(() => {
    const discipuladorMap = new Map<string, DiscipuladorStats>();

    filteredMeetings.forEach((meeting) => {
      const existing = discipuladorMap.get(meeting.discipulador.id) || {
        id: meeting.discipulador.id,
        nome: meeting.discipulador.nome,
        individuais: 0,
        celulas: 0,
        totalEncontros: 0,
        totalParticipantes: 0,
      };

      if (meeting.tipo === "individual") {
        existing.individuais++;
        existing.totalParticipantes++;
      } else {
        existing.celulas++;
        existing.totalParticipantes += (meeting.attendances?.filter((a) => a.presente).length || 0);
      }
      existing.totalEncontros++;

      discipuladorMap.set(meeting.discipulador.id, existing);
    });

    return Array.from(discipuladorMap.values()).sort(
      (a, b) => b.totalEncontros - a.totalEncontros
    );
  }, [filteredMeetings]);

  const totals = useMemo(() => {
    return stats.reduce(
      (acc, s) => ({
        individuais: acc.individuais + s.individuais,
        celulas: acc.celulas + s.celulas,
        total: acc.total + s.totalEncontros,
        participantes: acc.participantes + s.totalParticipantes,
      }),
      { individuais: 0, celulas: 0, total: 0, participantes: 0 }
    );
  }, [stats]);

  // Weekly trend data
  const weeklyTrend = useMemo(() => {
    const weeks = eachWeekOfInterval({ start: periodStart, end: periodEnd }, { weekStartsOn: 0 });
    
    return weeks.map((weekStart) => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 });
      const weekMeetings = filteredMeetings.filter((m) => {
        const date = new Date(m.data_encontro);
        return date >= weekStart && date <= weekEnd;
      });

      return {
        week: format(weekStart, "dd/MM", { locale: ptBR }),
        individuais: weekMeetings.filter((m) => m.tipo === "individual").length,
        celulas: weekMeetings.filter((m) => m.tipo === "celula").length,
        total: weekMeetings.length,
      };
    }).slice(-12); // Last 12 weeks max
  }, [filteredMeetings, periodStart, periodEnd]);

  // Monthly trend data
  const monthlyTrend = useMemo(() => {
    const months = eachMonthOfInterval({ start: periodStart, end: periodEnd });
    
    return months.map((monthStart) => {
      const monthEnd = endOfMonth(monthStart);
      const monthMeetings = filteredMeetings.filter((m) => {
        const date = new Date(m.data_encontro);
        return date >= monthStart && date <= monthEnd;
      });

      return {
        month: format(monthStart, "MMM", { locale: ptBR }),
        individuais: monthMeetings.filter((m) => m.tipo === "individual").length,
        celulas: monthMeetings.filter((m) => m.tipo === "celula").length,
        total: monthMeetings.length,
      };
    });
  }, [filteredMeetings, periodStart, periodEnd]);

  // Pie chart data for type distribution
  const typeDistribution = useMemo(() => {
    return [
      { name: "Individuais", value: totals.individuais, fill: CHART_COLORS[0] },
      { name: "Células", value: totals.celulas, fill: CHART_COLORS[1] },
    ].filter((d) => d.value > 0);
  }, [totals]);

  // Top discipuladores chart data
  const topDiscipuladores = useMemo(() => {
    return stats.slice(0, 8).map((s, i) => ({
      name: s.nome.split(" ")[0], // First name only
      encontros: s.totalEncontros,
      fill: CHART_COLORS[i % CHART_COLORS.length],
    }));
  }, [stats]);

  // Export functions
  const exportToCSV = () => {
    const headers = ["Discipulador", "Individuais", "Células", "Total Encontros", "Participantes"];
    const rows = stats.map((s) => [s.nome, s.individuais, s.celulas, s.totalEncontros, s.totalParticipantes]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
      "",
      `Total,${totals.individuais},${totals.celulas},${totals.total},${totals.participantes}`,
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-encontros-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    toast.success("Relatório exportado com sucesso!");
  };

  const exportToWhatsApp = () => {
    const dateRange = `${format(periodStart, "dd/MM", { locale: ptBR })} - ${format(periodEnd, "dd/MM/yyyy", { locale: ptBR })}`;
    
    let message = `📊 *Relatório de Encontros*\n`;
    message += `📅 Período: ${dateRange}\n\n`;
    message += `📈 *Resumo Geral*\n`;
    message += `• Total de Encontros: ${totals.total}\n`;
    message += `• Individuais: ${totals.individuais}\n`;
    message += `• Células: ${totals.celulas}\n`;
    message += `• Participantes: ${totals.participantes}\n\n`;
    
    if (stats.length > 0) {
      message += `👥 *Por Discipulador*\n`;
      stats.slice(0, 10).forEach((s) => {
        message += `• ${s.nome}: ${s.totalEncontros} encontros (${s.individuais} ind. / ${s.celulas} cél.)\n`;
      });
    }

    navigator.clipboard.writeText(message);
    toast.success("Relatório copiado para a área de transferência!");
  };

  const discipuladorOptions = useMemo(() => [
    { value: "all", label: "Todos os discipuladores" },
    ...discipuladores.map((d) => ({ value: d.id, label: d.nome })),
  ], [discipuladores]);

  const tipoOptions = [
    { value: "all", label: "Todos os tipos" },
    { value: "individual", label: "Individual" },
    { value: "celula", label: "Célula" },
  ];

  const chartConfig = {
    individuais: { label: "Individuais", color: "hsl(78 80% 48%)" },
    celulas: { label: "Células", color: "hsl(42 90% 52%)" },
    total: { label: "Total", color: "hsl(78 80% 48%)" },
    encontros: { label: "Encontros", color: "hsl(78 80% 48%)" },
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtros
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportToCSV}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button variant="outline" size="sm" onClick={exportToWhatsApp}>
                <FileText className="h-4 w-4 mr-2" />
                WhatsApp
              </Button>
            </div>
          </div>
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
              <label className="text-xs text-muted-foreground mb-1 block">Tipo</label>
              <SearchableSelect
                options={tipoOptions}
                value={selectedTipo}
                onValueChange={setSelectedTipo}
                placeholder="Filtrar por tipo"
              />
            </div>
            <div className="min-w-[140px]">
              <label className="text-xs text-muted-foreground mb-1 block">Período</label>
              <PeriodFilter value={period} onChange={setPeriod} />
            </div>
          </div>
          {(selectedDiscipulador !== "all" || selectedTipo !== "all") && (
            <div className="mt-3 flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {filteredMeetings.length} encontros encontrados
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Encontros</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{totals.total}</div>
            <p className="text-xs text-muted-foreground mt-1">no período selecionado</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-[hsl(78_80%_48%)]/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Individuais</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-[hsl(78_80%_48%)]/10 flex items-center justify-center">
              <User className="h-4 w-4 text-[hsl(78_80%_48%)]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totals.individuais}</div>
            <div className="flex items-center gap-2 mt-1">
              <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[hsl(78_80%_48%)] rounded-full transition-all"
                  style={{ width: `${totals.total > 0 ? (totals.individuais / totals.total) * 100 : 0}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">
                {totals.total > 0 ? Math.round((totals.individuais / totals.total) * 100) : 0}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-[hsl(42_90%_52%)]/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Células</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-[hsl(42_90%_52%)]/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-[hsl(42_90%_52%)]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totals.celulas}</div>
            <div className="flex items-center gap-2 mt-1">
              <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[hsl(42_90%_52%)] rounded-full transition-all"
                  style={{ width: `${totals.total > 0 ? (totals.celulas / totals.total) * 100 : 0}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">
                {totals.total > 0 ? Math.round((totals.celulas / totals.total) * 100) : 0}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-[hsl(152_65%_42%)]/20 bg-gradient-to-br from-[hsl(152_65%_42%)]/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Participantes</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-[hsl(152_65%_42%)]/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-[hsl(152_65%_42%)]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[hsl(152_65%_42%)]">{totals.participantes}</div>
            <p className="text-xs text-muted-foreground mt-1">
              média de <span className="font-medium">{totals.total > 0 ? (totals.participantes / totals.total).toFixed(1) : 0}</span> por encontro
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Evolução Mensal */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary" />
              Evolução Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyTrend.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[280px]">
                <BarChart data={monthlyTrend} barGap={4}>
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12, fill: 'hsl(60 5% 55%)' }} 
                    axisLine={{ stroke: 'hsl(220 10% 18%)' }}
                    tickLine={{ stroke: 'hsl(220 10% 18%)' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: 'hsl(60 5% 55%)' }} 
                    axisLine={{ stroke: 'hsl(220 10% 18%)' }}
                    tickLine={{ stroke: 'hsl(220 10% 18%)' }}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    cursor={{ fill: 'hsl(220 10% 12% / 0.5)' }}
                  />
                  <Bar dataKey="individuais" name="Individuais" fill="hsl(78 80% 48%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="celulas" name="Células" fill="hsl(42 90% 52%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-[280px] flex flex-col items-center justify-center text-muted-foreground gap-2">
                <Calendar className="h-10 w-10 opacity-20" />
                <span className="text-sm">Nenhum dado disponível</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Distribuição por Tipo */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[hsl(42_90%_52%)]" />
              Distribuição por Tipo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {typeDistribution.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={typeDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="45%"
                      outerRadius={85}
                      innerRadius={55}
                      paddingAngle={3}
                      strokeWidth={2}
                      stroke="hsl(220 12% 8%)"
                    >
                      {typeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend 
                      verticalAlign="bottom" 
                      height={40}
                      iconType="circle"
                      iconSize={8}
                      formatter={(value) => <span className="text-sm text-foreground ml-1">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-[280px] flex flex-col items-center justify-center text-muted-foreground gap-2">
                <Users className="h-10 w-10 opacity-20" />
                <span className="text-sm">Nenhum dado disponível</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tendência Semanal */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[hsl(152_65%_42%)]" />
              Tendência Semanal
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weeklyTrend.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[280px]">
                <LineChart data={weeklyTrend}>
                  <defs>
                    <linearGradient id="gradientLine" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(78 80% 48%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(78 80% 48%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="week" 
                    tick={{ fontSize: 11, fill: 'hsl(60 5% 55%)' }}
                    axisLine={{ stroke: 'hsl(220 10% 18%)' }}
                    tickLine={{ stroke: 'hsl(220 10% 18%)' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: 'hsl(60 5% 55%)' }}
                    axisLine={{ stroke: 'hsl(220 10% 18%)' }}
                    tickLine={{ stroke: 'hsl(220 10% 18%)' }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    name="Total"
                    stroke="hsl(78 80% 48%)" 
                    strokeWidth={3}
                    dot={{ fill: "hsl(78 80% 48%)", strokeWidth: 0, r: 4 }}
                    activeDot={{ fill: "hsl(78 80% 58%)", strokeWidth: 0, r: 6 }}
                  />
                </LineChart>
              </ChartContainer>
            ) : (
              <div className="h-[280px] flex flex-col items-center justify-center text-muted-foreground gap-2">
                <TrendingUp className="h-10 w-10 opacity-20" />
                <span className="text-sm">Nenhum dado disponível</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Discipuladores */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[hsl(210_70%_55%)]" />
              Top Discipuladores
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topDiscipuladores.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[280px]">
                <BarChart data={topDiscipuladores} layout="vertical" barSize={20}>
                  <XAxis 
                    type="number" 
                    tick={{ fontSize: 12, fill: 'hsl(60 5% 55%)' }}
                    axisLine={{ stroke: 'hsl(220 10% 18%)' }}
                    tickLine={{ stroke: 'hsl(220 10% 18%)' }}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    tick={{ fontSize: 11, fill: 'hsl(60 10% 96%)' }} 
                    width={75}
                    axisLine={{ stroke: 'hsl(220 10% 18%)' }}
                    tickLine={false}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    cursor={{ fill: 'hsl(220 10% 12% / 0.5)' }}
                  />
                  <Bar dataKey="encontros" name="Encontros" radius={[0, 4, 4, 0]}>
                    {topDiscipuladores.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-[280px] flex flex-col items-center justify-center text-muted-foreground gap-2">
                <Users className="h-10 w-10 opacity-20" />
                <span className="text-sm">Nenhum dado disponível</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Table by Discipulador */}
      <Card ref={tableRef}>
        <CardHeader>
          <CardTitle className="text-base">Detalhamento por Discipulador</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Discipulador</TableHead>
                <TableHead className="text-center">Individuais</TableHead>
                <TableHead className="text-center">Células</TableHead>
                <TableHead className="text-center">Total</TableHead>
                <TableHead className="text-center">Participantes</TableHead>
                <TableHead className="text-center">Média/Encontro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum encontro registrado no período
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {stats.map((stat) => (
                    <TableRow key={stat.id}>
                      <TableCell className="font-medium">{stat.nome}</TableCell>
                      <TableCell className="text-center">{stat.individuais}</TableCell>
                      <TableCell className="text-center">{stat.celulas}</TableCell>
                      <TableCell className="text-center font-semibold">{stat.totalEncontros}</TableCell>
                      <TableCell className="text-center">{stat.totalParticipantes}</TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {stat.totalEncontros > 0 
                          ? (stat.totalParticipantes / stat.totalEncontros).toFixed(1) 
                          : "0"}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-center">{totals.individuais}</TableCell>
                    <TableCell className="text-center">{totals.celulas}</TableCell>
                    <TableCell className="text-center">{totals.total}</TableCell>
                    <TableCell className="text-center">{totals.participantes}</TableCell>
                    <TableCell className="text-center">
                      {totals.total > 0 ? (totals.participantes / totals.total).toFixed(1) : "0"}
                    </TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Meetings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Encontros Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredMeetings.slice(0, 10).map((meeting) => (
              <div
                key={meeting.id}
                className="flex items-start gap-4 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
              >
                <div className="flex-shrink-0 mt-0.5">
                  {meeting.tipo === "individual" ? (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-chart-2/10 flex items-center justify-center">
                      <Users className="h-4 w-4 text-chart-2" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{meeting.discipulador.nome}</span>
                    <Badge variant={meeting.tipo === "individual" ? "default" : "secondary"} className="text-xs">
                      {meeting.tipo === "individual" ? "1:1" : "Célula"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {format(new Date(meeting.data_encontro), "EEEE, dd/MM 'às' HH:mm", { locale: ptBR })}
                    {meeting.local && ` • ${meeting.local}`}
                  </p>
                  {meeting.tipo === "individual" && meeting.discipulo && (
                    <p className="text-xs mt-1">
                      Com: <span className="font-medium">{meeting.discipulo.nome}</span>
                    </p>
                  )}
                  {meeting.tipo === "celula" && meeting.attendances && meeting.attendances.length > 0 && (
                    <p className="text-xs mt-1 text-muted-foreground">
                      Presentes ({meeting.attendances.filter((a) => a.presente).length}): {" "}
                      {meeting.attendances.filter((a) => a.presente).map((a) => a.profile.nome).slice(0, 3).join(", ")}
                      {meeting.attendances.filter((a) => a.presente).length > 3 && ` +${meeting.attendances.filter((a) => a.presente).length - 3}`}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {filteredMeetings.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Nenhum encontro registrado no período
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
