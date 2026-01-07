import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import { SortableHeader } from "@/components/ui/sortable-header";
import { Users, Flame, Calendar, CheckCircle2, TrendingUp, Filter, Search } from "lucide-react";
import { PeriodFilter, PeriodOption, getDateFromPeriod } from "./PeriodFilter";
import { usePagination } from "@/hooks/usePagination";
import { useSorting } from "@/hooks/useSorting";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";

interface DiscipuladorStats {
  id: string;
  nome: string;
  totalDiscipulos: number;
  avgStreak: number;
  jornadaCompleted: number;
  meetingsCount: number;
  checklistCompliance: number;
}

export function PerformanceDiscipuladoresReport() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodOption>("6m");
  const [searchTerm, setSearchTerm] = useState("");
  const [minDisciples, setMinDisciples] = useState<string>("all");
  const [discipuladores, setDiscipuladores] = useState<DiscipuladorStats[]>([]);
  const [summary, setSummary] = useState({
    totalDiscipuladores: 0,
    avgDiscipulosPerDiscipulador: 0,
    totalMeetings: 0,
    avgChecklistCompliance: 0
  });

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

      // Fetch all discipuladores with role
      const { data: discipuladorRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'discipulador');

      const discipuladorIds = discipuladorRoles?.map(r => r.user_id) || [];

      if (discipuladorIds.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch profiles for discipuladores in this church
      const { data: discipuladorProfiles } = await supabase
        .from('profiles')
        .select('id, nome')
        .eq('church_id', churchId)
        .in('id', discipuladorIds);

      const discipuladoresInChurch = discipuladorProfiles || [];

      // Fetch relationships, meetings, and checklist responses
      const [relationshipsResult, meetingsResult, checklistResult] = await Promise.all([
        supabase.from('discipleship_relationships')
          .select('discipulador_id, discipulo_id, alicerce_completed_presencial, status, created_at')
          .eq('church_id', churchId)
          .eq('status', 'active'),
        supabase.from('meetings')
          .select('discipulador_id, id, created_at')
          .eq('church_id', churchId),
        supabase.from('weekly_checklist_responses')
          .select('discipulador_id, responses, created_at')
      ]);

      let relationships = relationshipsResult.data || [];
      let meetings = meetingsResult.data || [];
      let checklistResponses = checklistResult.data || [];

      // Filter by period
      if (periodStart) {
        relationships = relationships.filter(r => new Date(r.created_at) >= periodStart);
        meetings = meetings.filter(m => new Date(m.created_at) >= periodStart);
        checklistResponses = checklistResponses.filter(c => new Date(c.created_at) >= periodStart);
      }

      // Get discipulo profiles for streak data
      const discipuloIds = [...new Set(relationships.map(r => r.discipulo_id))];
      const { data: discipuloProfiles } = await supabase
        .from('profiles')
        .select('id, current_streak')
        .in('id', discipuloIds);

      const discipuloMap = new Map(discipuloProfiles?.map(p => [p.id, p]) || []);

      // Calculate stats for each discipulador
      const stats: DiscipuladorStats[] = discipuladoresInChurch.map(disc => {
        const discRels = relationships.filter(r => r.discipulador_id === disc.id);
        const discMeetings = meetings.filter(m => m.discipulador_id === disc.id);
        const discChecklists = checklistResponses.filter(c => c.discipulador_id === disc.id);

        // Calculate average streak of disciples
        const streaks = discRels
          .map(r => discipuloMap.get(r.discipulo_id)?.current_streak || 0)
          .filter(s => s > 0);
        const avgStreak = streaks.length > 0 
          ? Math.round(streaks.reduce((a, b) => a + b, 0) / streaks.length)
          : 0;

        // Jornada Metanoia completed count
        const jornadaCompleted = discRels.filter(r => r.alicerce_completed_presencial).length;

        // Checklist compliance (percentage of items completed on average)
        let checklistCompliance = 0;
        if (discChecklists.length > 0) {
          const totalItems = discChecklists.reduce((sum, c) => {
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
          checklistCompliance = Math.round(totalItems / discChecklists.length);
        }

        return {
          id: disc.id,
          nome: disc.nome || 'Sem nome',
          totalDiscipulos: discRels.length,
          avgStreak,
          jornadaCompleted,
          meetingsCount: discMeetings.length,
          checklistCompliance
        };
      });

      // Sort by total disciples
      stats.sort((a, b) => b.totalDiscipulos - a.totalDiscipulos);
      setDiscipuladores(stats);

      // Calculate summary
      const totalDiscipulos = stats.reduce((sum, d) => sum + d.totalDiscipulos, 0);
      const totalMeetings = stats.reduce((sum, d) => sum + d.meetingsCount, 0);
      const avgCompliance = stats.length > 0
        ? Math.round(stats.reduce((sum, d) => sum + d.checklistCompliance, 0) / stats.length)
        : 0;

      setSummary({
        totalDiscipuladores: stats.length,
        avgDiscipulosPerDiscipulador: stats.length > 0 ? Math.round(totalDiscipulos / stats.length * 10) / 10 : 0,
        totalMeetings,
        avgChecklistCompliance: avgCompliance
      });
    } catch (error) {
      console.error('Error fetching discipulador stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter discipuladores based on search and min disciples
  const filteredDiscipuladores = useMemo(() => {
    let filtered = discipuladores;

    if (searchTerm) {
      filtered = filtered.filter(d => 
        d.nome.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (minDisciples !== "all") {
      const min = parseInt(minDisciples);
      filtered = filtered.filter(d => d.totalDiscipulos >= min);
    }

    return filtered;
  }, [discipuladores, searchTerm, minDisciples]);

  const minDisciplesOptions = [
    { value: "all", label: "Todos" },
    { value: "1", label: "1+ discípulos" },
    { value: "3", label: "3+ discípulos" },
    { value: "5", label: "5+ discípulos" },
    { value: "10", label: "10+ discípulos" }
  ];

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
    totalDiscipulos: { label: "Discípulos", color: "hsl(var(--primary))" }
  };

  const topDiscipuladores = filteredDiscipuladores.slice(0, 10);

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
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs text-muted-foreground mb-1 block">Buscar por nome</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nome do discipulador..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="min-w-[160px]">
              <label className="text-xs text-muted-foreground mb-1 block">Mínimo de discípulos</label>
              <SearchableSelect
                options={minDisciplesOptions}
                value={minDisciples}
                onValueChange={setMinDisciples}
                placeholder="Filtrar"
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
            <CardTitle className="text-sm font-medium">Total Discipuladores</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalDiscipuladores}</div>
            <p className="text-xs text-muted-foreground">discipuladores ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média de Discípulos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.avgDiscipulosPerDiscipulador}</div>
            <p className="text-xs text-muted-foreground">por discipulador</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Encontros Registrados</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalMeetings}</div>
            <p className="text-xs text-muted-foreground">total de encontros</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Checklist</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.avgChecklistCompliance}%</div>
            <p className="text-xs text-muted-foreground">média de preenchimento</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Discipuladores Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Top Discipuladores por Número de Discípulos</CardTitle>
        </CardHeader>
        <CardContent>
          {topDiscipuladores.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[300px]">
              <BarChart data={topDiscipuladores} layout="vertical">
                <XAxis type="number" />
                <YAxis 
                  dataKey="nome" 
                  type="category" 
                  width={120}
                  tick={{ fontSize: 11 }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="totalDiscipulos" fill="hsl(var(--primary))" radius={4} />
              </BarChart>
            </ChartContainer>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Nenhum discipulador encontrado
            </p>
          )}
        </CardContent>
      </Card>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Detalhamento por Discipulador</span>
            <Badge variant="secondary" className="font-mono">
              {filteredDiscipuladores.length} resultados
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <DiscipuladoresTable discipuladores={filteredDiscipuladores} />
        </CardContent>
      </Card>
    </div>
  );
}

function DiscipuladoresTable({ discipuladores }: { discipuladores: DiscipuladorStats[] }) {
  const sorting = useSorting({ data: discipuladores, defaultSortKey: "nome", defaultDirection: "asc" });
  const pagination = usePagination({ data: sorting.sortedData, pageSize: 10 });

  return (
    <>
      <Table className="min-w-[600px]">
        <TableHeader>
          <TableRow>
            <TableHead>
              <SortableHeader sortState={sorting.getSortIcon("nome")} onClick={() => sorting.toggleSort("nome")}>
                Discipulador
              </SortableHeader>
            </TableHead>
            <TableHead className="text-center">
              <SortableHeader sortState={sorting.getSortIcon("totalDiscipulos")} onClick={() => sorting.toggleSort("totalDiscipulos")} className="justify-center">
                Discípulos
              </SortableHeader>
            </TableHead>
            <TableHead className="text-center">
              <SortableHeader sortState={sorting.getSortIcon("avgStreak")} onClick={() => sorting.toggleSort("avgStreak")} className="justify-center">
                Média Streak
              </SortableHeader>
            </TableHead>
            <TableHead className="text-center">
              <SortableHeader sortState={sorting.getSortIcon("jornadaCompleted")} onClick={() => sorting.toggleSort("jornadaCompleted")} className="justify-center">
                Jornada OK
              </SortableHeader>
            </TableHead>
            <TableHead className="text-center">
              <SortableHeader sortState={sorting.getSortIcon("meetingsCount")} onClick={() => sorting.toggleSort("meetingsCount")} className="justify-center">
                Encontros
              </SortableHeader>
            </TableHead>
            <TableHead className="text-center">
              <SortableHeader sortState={sorting.getSortIcon("checklistCompliance")} onClick={() => sorting.toggleSort("checklistCompliance")} className="justify-center">
                Checklist
              </SortableHeader>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pagination.paginatedData.map(disc => (
            <TableRow key={disc.id}>
              <TableCell className="font-medium">{disc.nome}</TableCell>
              <TableCell className="text-center">
                <Badge variant="secondary">{disc.totalDiscipulos}</Badge>
              </TableCell>
              <TableCell className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Flame className="h-3 w-3 text-orange-500" />
                  {disc.avgStreak}
                </div>
              </TableCell>
              <TableCell className="text-center">
                <Badge variant={disc.jornadaCompleted > 0 ? "default" : "outline"}>
                  {disc.jornadaCompleted}/{disc.totalDiscipulos}
                </Badge>
              </TableCell>
              <TableCell className="text-center">{disc.meetingsCount}</TableCell>
              <TableCell className="text-center">
                <div className="flex items-center gap-2">
                  <Progress value={disc.checklistCompliance} className="h-2 w-16" />
                  <span className="text-xs text-muted-foreground">{disc.checklistCompliance}%</span>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {discipuladores.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                Nenhum discipulador encontrado
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {discipuladores.length > 0 && (
        <TablePagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          startIndex={pagination.startIndex}
          endIndex={pagination.endIndex}
          totalItems={pagination.totalItems}
          onPageChange={pagination.setPage}
          onNextPage={pagination.nextPage}
          onPrevPage={pagination.prevPage}
          hasNextPage={pagination.hasNextPage}
          hasPrevPage={pagination.hasPrevPage}
        />
      )}
    </>
  );
}
