import { useMemo, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
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
import { CHART_COLORS, CHART_COLORS_ARRAY, CHART_GRADIENTS } from "@/lib/chartColors";

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

// Animation variants
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1] as const
    }
  })
};

const chartVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1] as const
    }
  }
};

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
      { name: "Individuais", value: totals.individuais, fill: CHART_COLORS.lime },
      { name: "Células", value: totals.celulas, fill: CHART_COLORS.teal },
    ].filter((d) => d.value > 0);
  }, [totals]);

  // Top discipuladores chart data
  const topDiscipuladores = useMemo(() => {
    return stats.slice(0, 8).map((s, i) => ({
      name: s.nome.split(" ")[0], // First name only
      encontros: s.totalEncontros,
      fill: CHART_COLORS_ARRAY[i % CHART_COLORS_ARRAY.length],
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
    individuais: { label: "Individuais", color: CHART_COLORS.lime },
    celulas: { label: "Células", color: CHART_COLORS.teal },
    total: { label: "Total", color: CHART_COLORS.lime },
    encontros: { label: "Encontros", color: CHART_COLORS.lime },
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
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: "Total de Encontros",
            value: totals.total,
            subtitle: "no período selecionado",
            color: CHART_COLORS.lime,
            Icon: Calendar,
            hasGlow: true
          },
          {
            title: "Individuais",
            value: totals.individuais,
            percent: totals.total > 0 ? Math.round((totals.individuais / totals.total) * 100) : 0,
            color: CHART_COLORS.lime,
            Icon: User,
            hasProgress: true
          },
          {
            title: "Células",
            value: totals.celulas,
            percent: totals.total > 0 ? Math.round((totals.celulas / totals.total) * 100) : 0,
            color: CHART_COLORS.teal,
            Icon: Users,
            hasProgress: true
          },
          {
            title: "Participantes",
            value: totals.participantes,
            subtitle: `média de ${totals.total > 0 ? (totals.participantes / totals.total).toFixed(1) : 0} por encontro`,
            color: CHART_COLORS.emerald,
            Icon: TrendingUp,
            hasGlow: true
          }
        ].map((card, i) => (
          <motion.div
            key={card.title}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
          >
            <Card className={`relative overflow-hidden h-full`} style={{ borderColor: `${card.color}33` }}>
              {card.hasGlow && (
                <div 
                  className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 opacity-20"
                  style={{ background: card.color }}
                />
              )}
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                <CardTitle className="text-xs sm:text-sm font-medium truncate pr-2">{card.title}</CardTitle>
                <div 
                  className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl flex-shrink-0 flex items-center justify-center"
                  style={{ background: `${card.color}15` }}
                >
                  <card.Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" style={{ color: card.color }} />
                </div>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="text-2xl sm:text-3xl font-bold" style={{ color: card.hasGlow ? card.color : undefined }}>
                  {card.value}
                </div>
                {card.hasProgress && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="h-1.5 sm:h-2 flex-1 bg-muted/40 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${card.percent}%` }}
                        transition={{ duration: 0.8, delay: 0.3 + i * 0.1, ease: "easeOut" }}
                        style={{ background: card.color }}
                      />
                    </div>
                    <span className="text-[10px] sm:text-xs font-semibold" style={{ color: card.color }}>
                      {card.percent}%
                    </span>
                  </div>
                )}
                {card.subtitle && (
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 truncate">{card.subtitle}</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Evolução Mensal */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={chartVariants}
        >
          <Card className="border-border/50 overflow-hidden">
            <CardHeader className="pb-2 px-3 sm:px-6">
              <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                <div className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full" style={{ background: CHART_COLORS.lime }} />
                Evolução Mensal
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 sm:px-6 pb-3 sm:pb-6">
              {monthlyTrend.length > 0 ? (
                <div className="h-[220px] sm:h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyTrend} barGap={4} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                      <defs>
                        <linearGradient id="barLime" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={CHART_COLORS.lime} />
                          <stop offset="100%" stopColor="hsl(82 75% 38%)" />
                        </linearGradient>
                        <linearGradient id="barTeal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={CHART_COLORS.teal} />
                          <stop offset="100%" stopColor="hsl(168 65% 32%)" />
                        </linearGradient>
                      </defs>
                      <XAxis 
                        dataKey="month" 
                        tick={{ fontSize: 10, fill: 'hsl(60 10% 65%)' }} 
                        axisLine={{ stroke: 'hsl(220 10% 25%)' }}
                        tickLine={false}
                      />
                      <YAxis 
                        tick={{ fontSize: 10, fill: 'hsl(60 10% 65%)' }} 
                        axisLine={{ stroke: 'hsl(220 10% 25%)' }}
                        tickLine={false}
                        width={30}
                      />
                      <Tooltip
                        contentStyle={{ 
                          background: 'hsl(220 12% 12%)', 
                          border: '1px solid hsl(220 10% 25%)',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      />
                      <Legend 
                        wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                        iconSize={8}
                      />
                      <Bar dataKey="individuais" name="Individuais" fill="url(#barLime)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="celulas" name="Células" fill="url(#barTeal)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[220px] sm:h-[280px] flex flex-col items-center justify-center text-muted-foreground gap-3">
                  <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-muted/30 flex items-center justify-center">
                    <Calendar className="h-6 w-6 sm:h-7 sm:w-7 opacity-40" />
                  </div>
                  <span className="text-xs sm:text-sm">Nenhum dado disponível</span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Distribuição por Tipo */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={chartVariants}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-border/50 overflow-hidden h-full">
            <CardHeader className="pb-2 px-3 sm:px-6">
              <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                <div className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full" style={{ background: CHART_COLORS.teal }} />
                Distribuição por Tipo
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 sm:px-6 pb-3 sm:pb-6">
              {typeDistribution.length > 0 ? (
                <div className="h-[220px] sm:h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={typeDistribution}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="45%"
                        outerRadius={70}
                        innerRadius={45}
                        paddingAngle={4}
                        strokeWidth={0}
                      >
                        {typeDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ 
                          background: 'hsl(220 12% 12%)', 
                          border: '1px solid hsl(220 10% 25%)',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={40}
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[220px] sm:h-[280px] flex flex-col items-center justify-center text-muted-foreground gap-3">
                  <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-muted/30 flex items-center justify-center">
                    <Users className="h-6 w-6 sm:h-7 sm:w-7 opacity-40" />
                  </div>
                  <span className="text-xs sm:text-sm">Nenhum dado disponível</span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Tendência Semanal */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={chartVariants}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-border/50 overflow-hidden h-full">
            <CardHeader className="pb-2 px-3 sm:px-6">
              <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                <div className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full" style={{ background: CHART_COLORS.emerald }} />
                Tendência Semanal
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 sm:px-6 pb-3 sm:pb-6">
              {weeklyTrend.length > 0 ? (
                <div className="h-[220px] sm:h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weeklyTrend} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                      <defs>
                        <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor={CHART_COLORS.lime} />
                          <stop offset="100%" stopColor={CHART_COLORS.emerald} />
                        </linearGradient>
                      </defs>
                      <XAxis 
                        dataKey="week" 
                        tick={{ fontSize: 10, fill: 'hsl(60 10% 65%)' }}
                        axisLine={{ stroke: 'hsl(220 10% 25%)' }}
                        tickLine={false}
                      />
                      <YAxis 
                        tick={{ fontSize: 10, fill: 'hsl(60 10% 65%)' }}
                        axisLine={{ stroke: 'hsl(220 10% 25%)' }}
                        tickLine={false}
                        width={30}
                      />
                      <Tooltip
                        contentStyle={{ 
                          background: 'hsl(220 12% 12%)', 
                          border: '1px solid hsl(220 10% 25%)',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="total" 
                        name="Total"
                        stroke="url(#lineGradient)" 
                        strokeWidth={2.5}
                        dot={{ fill: CHART_COLORS.lime, strokeWidth: 0, r: 4 }}
                        activeDot={{ fill: CHART_COLORS.emerald, strokeWidth: 2, stroke: 'hsl(220 12% 15%)', r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[220px] sm:h-[280px] flex flex-col items-center justify-center text-muted-foreground gap-3">
                  <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-muted/30 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 sm:h-7 sm:w-7 opacity-40" />
                  </div>
                  <span className="text-xs sm:text-sm">Nenhum dado disponível</span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Discipuladores */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={chartVariants}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-border/50 overflow-hidden h-full">
            <CardHeader className="pb-2 px-3 sm:px-6">
              <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                <div className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full" style={{ background: CHART_COLORS.cyan }} />
                Top Discipuladores
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 sm:px-6 pb-3 sm:pb-6">
              {topDiscipuladores.length > 0 ? (
                <div className="h-[220px] sm:h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topDiscipuladores} layout="vertical" barSize={18} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <XAxis 
                        type="number" 
                        tick={{ fontSize: 10, fill: 'hsl(60 10% 65%)' }}
                        axisLine={{ stroke: 'hsl(220 10% 25%)' }}
                        tickLine={false}
                      />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        tick={{ fontSize: 11, fill: 'hsl(60 10% 85%)' }} 
                        width={65}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{ 
                          background: 'hsl(220 12% 12%)', 
                          border: '1px solid hsl(220 10% 25%)',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      />
                      <Bar dataKey="encontros" name="Encontros" radius={[0, 6, 6, 0]}>
                        {topDiscipuladores.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[220px] sm:h-[280px] flex flex-col items-center justify-center text-muted-foreground gap-3">
                  <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-muted/30 flex items-center justify-center">
                    <Users className="h-6 w-6 sm:h-7 sm:w-7 opacity-40" />
                  </div>
                  <span className="text-xs sm:text-sm">Nenhum dado disponível</span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Table by Discipulador */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <Card ref={tableRef} className="border-border/50 overflow-hidden">
          <CardHeader className="px-3 sm:px-6">
            <CardTitle className="text-sm sm:text-base">Detalhamento por Discipulador</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs sm:text-sm">Discipulador</TableHead>
                  <TableHead className="text-center text-xs sm:text-sm">Ind.</TableHead>
                  <TableHead className="text-center text-xs sm:text-sm">Cél.</TableHead>
                  <TableHead className="text-center text-xs sm:text-sm">Total</TableHead>
                  <TableHead className="text-center text-xs sm:text-sm hidden sm:table-cell">Part.</TableHead>
                  <TableHead className="text-center text-xs sm:text-sm hidden md:table-cell">Média</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-xs sm:text-sm">
                      Nenhum encontro registrado no período
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {stats.map((stat) => (
                      <TableRow key={stat.id}>
                        <TableCell className="font-medium text-xs sm:text-sm max-w-[120px] truncate">{stat.nome}</TableCell>
                        <TableCell className="text-center text-xs sm:text-sm">{stat.individuais}</TableCell>
                        <TableCell className="text-center text-xs sm:text-sm">{stat.celulas}</TableCell>
                        <TableCell className="text-center font-semibold text-xs sm:text-sm" style={{ color: CHART_COLORS.lime }}>{stat.totalEncontros}</TableCell>
                        <TableCell className="text-center text-xs sm:text-sm hidden sm:table-cell">{stat.totalParticipantes}</TableCell>
                        <TableCell className="text-center text-muted-foreground text-xs sm:text-sm hidden md:table-cell">
                          {stat.totalEncontros > 0 
                            ? (stat.totalParticipantes / stat.totalEncontros).toFixed(1) 
                            : "0"}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/30 font-semibold">
                      <TableCell className="text-xs sm:text-sm">Total</TableCell>
                      <TableCell className="text-center text-xs sm:text-sm">{totals.individuais}</TableCell>
                      <TableCell className="text-center text-xs sm:text-sm">{totals.celulas}</TableCell>
                      <TableCell className="text-center text-xs sm:text-sm" style={{ color: CHART_COLORS.lime }}>{totals.total}</TableCell>
                      <TableCell className="text-center text-xs sm:text-sm hidden sm:table-cell">{totals.participantes}</TableCell>
                      <TableCell className="text-center text-xs sm:text-sm hidden md:table-cell">
                        {totals.total > 0 ? (totals.participantes / totals.total).toFixed(1) : "0"}
                      </TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

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
