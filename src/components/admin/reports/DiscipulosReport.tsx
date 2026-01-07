import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import { SortableHeader } from "@/components/ui/sortable-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Flame, GraduationCap, CheckCircle2, BookOpen, TrendingUp, Calendar, Filter } from "lucide-react";
import { PeriodFilter, PeriodOption, getDateFromPeriod } from "./PeriodFilter";
import { usePagination } from "@/hooks/usePagination";
import { useSorting } from "@/hooks/useSorting";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DiscipuloStats {
  id: string;
  nome: string;
  avatarUrl: string | null;
  discipuladorNome: string | null;
  currentStreak: number;
  xpPoints: number;
  lessonsCompleted: number;
  readingDaysCompleted: number;
  jornadaCompleted: boolean;
  academiaNiveis: number;
  conexaoInicial: number;
  startedAt: string;
  daysInProgram: number;
}

interface Summary {
  totalDiscipulos: number;
  avgStreak: number;
  avgXp: number;
  jornadaCompletedCount: number;
  academiaProgress: number;
}

// Harmonized chart palette - lime/dark theme aligned
const CHART_COLORS = {
  lime: "hsl(78 80% 48%)",        // Primary lime (matches theme)
  teal: "hsl(168 65% 45%)",       // Complementary teal
  cyan: "hsl(188 75% 48%)",       // Fresh cyan
  violet: "hsl(265 55% 55%)",     // Soft violet
  rose: "hsl(340 65% 55%)",       // Muted rose
  emerald: "hsl(152 60% 42%)",    // Deep emerald
  sky: "hsl(200 70% 50%)",        // Cool sky
  mint: "hsl(160 50% 50%)",       // Soft mint
};

const CHART_COLORS_ARRAY = Object.values(CHART_COLORS);

export function DiscipulosReport() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodOption>("all");
  const [selectedDiscipulador, setSelectedDiscipulador] = useState<string>("all");
  const [discipulos, setDiscipulos] = useState<DiscipuloStats[]>([]);
  const [discipuladores, setDiscipuladores] = useState<{ id: string; nome: string }[]>([]);
  const [summary, setSummary] = useState<Summary>({
    totalDiscipulos: 0,
    avgStreak: 0,
    avgXp: 0,
    jornadaCompletedCount: 0,
    academiaProgress: 0
  });

  useEffect(() => {
    fetchData();
  }, [period, selectedDiscipulador]);

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
      let relationshipsQuery = supabase
        .from('discipleship_relationships')
        .select(`
          id,
          discipulador_id,
          discipulo_id,
          started_at,
          status,
          alicerce_completed_presencial,
          academia_nivel_1,
          academia_nivel_2,
          academia_nivel_3,
          academia_nivel_4,
          conexao_inicial_1,
          conexao_inicial_2
        `)
        .eq('church_id', churchId)
        .eq('status', 'active');

      if (selectedDiscipulador !== "all") {
        relationshipsQuery = relationshipsQuery.eq('discipulador_id', selectedDiscipulador);
      }

      const { data: relationships } = await relationshipsQuery;
      
      if (!relationships || relationships.length === 0) {
        setDiscipulos([]);
        setSummary({
          totalDiscipulos: 0,
          avgStreak: 0,
          avgXp: 0,
          jornadaCompletedCount: 0,
          academiaProgress: 0
        });
        setLoading(false);
        return;
      }

      // Filter by period (based on started_at)
      let filteredRelationships = relationships;
      if (periodStart) {
        filteredRelationships = relationships.filter(r => new Date(r.started_at) >= periodStart);
      }

      const discipuloIds = filteredRelationships.map(r => r.discipulo_id);
      const discipuladorIds = [...new Set(filteredRelationships.map(r => r.discipulador_id))];

      // Fetch discipulo profiles
      const { data: discipuloProfiles } = await supabase
        .from('profiles')
        .select('id, nome, avatar_url, current_streak, xp_points')
        .in('id', discipuloIds);

      // Fetch discipulador profiles
      const { data: discipuladorProfiles } = await supabase
        .from('profiles')
        .select('id, nome')
        .in('id', discipuladorIds);

      // Fetch all discipuladores for filter dropdown
      const { data: allDiscipuladorRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'discipulador');

      if (allDiscipuladorRoles) {
        const { data: allDiscProfiles } = await supabase
          .from('profiles')
          .select('id, nome')
          .eq('church_id', churchId)
          .in('id', allDiscipuladorRoles.map(r => r.user_id));

        setDiscipuladores(allDiscProfiles || []);
      }

      // Fetch lesson progress
      const { data: userProgress } = await supabase
        .from('user_progress')
        .select('user_id, completed')
        .in('user_id', discipuloIds)
        .eq('completed', true);

      // Fetch reading progress
      const { data: readingProgress } = await supabase
        .from('user_reading_progress')
        .select('user_id, completed_days')
        .in('user_id', discipuloIds);

      const discipuloMap = new Map(discipuloProfiles?.map(p => [p.id, p]) || []);
      const discipuladorMap = new Map(discipuladorProfiles?.map(p => [p.id, p]) || []);
      
      const progressMap = new Map<string, number>();
      userProgress?.forEach(p => {
        progressMap.set(p.user_id, (progressMap.get(p.user_id) || 0) + 1);
      });

      const readingMap = new Map<string, number>();
      readingProgress?.forEach(p => {
        const completedDays = Array.isArray(p.completed_days) ? p.completed_days.length : 0;
        readingMap.set(p.user_id, (readingMap.get(p.user_id) || 0) + completedDays);
      });

      const stats: DiscipuloStats[] = filteredRelationships.map(rel => {
        const discipulo = discipuloMap.get(rel.discipulo_id);
        const discipulador = discipuladorMap.get(rel.discipulador_id);

        const academiaNiveis = [
          rel.academia_nivel_1,
          rel.academia_nivel_2,
          rel.academia_nivel_3,
          rel.academia_nivel_4
        ].filter(Boolean).length;

        const conexaoInicial = [
          rel.conexao_inicial_1,
          rel.conexao_inicial_2
        ].filter(Boolean).length;

        return {
          id: rel.discipulo_id,
          nome: discipulo?.nome || 'Sem nome',
          avatarUrl: discipulo?.avatar_url || null,
          discipuladorNome: discipulador?.nome || null,
          currentStreak: discipulo?.current_streak || 0,
          xpPoints: discipulo?.xp_points || 0,
          lessonsCompleted: progressMap.get(rel.discipulo_id) || 0,
          readingDaysCompleted: readingMap.get(rel.discipulo_id) || 0,
          jornadaCompleted: rel.alicerce_completed_presencial || false,
          academiaNiveis,
          conexaoInicial,
          startedAt: rel.started_at,
          daysInProgram: differenceInDays(new Date(), new Date(rel.started_at))
        };
      });

      setDiscipulos(stats);

      // Calculate summary
      const totalDiscipulos = stats.length;
      const avgStreak = totalDiscipulos > 0
        ? Math.round(stats.reduce((sum, d) => sum + d.currentStreak, 0) / totalDiscipulos)
        : 0;
      const avgXp = totalDiscipulos > 0
        ? Math.round(stats.reduce((sum, d) => sum + d.xpPoints, 0) / totalDiscipulos)
        : 0;
      const jornadaCompletedCount = stats.filter(d => d.jornadaCompleted).length;
      const totalAcademiaNiveis = stats.reduce((sum, d) => sum + d.academiaNiveis, 0);
      const maxAcademiaNiveis = totalDiscipulos * 4;
      const academiaProgress = maxAcademiaNiveis > 0
        ? Math.round((totalAcademiaNiveis / maxAcademiaNiveis) * 100)
        : 0;

      setSummary({
        totalDiscipulos,
        avgStreak,
        avgXp,
        jornadaCompletedCount,
        academiaProgress
      });
    } catch (error) {
      console.error('Error fetching discipulo stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Streak distribution data
  const streakDistribution = [
    { range: "0 dias", count: discipulos.filter(d => d.currentStreak === 0).length },
    { range: "1-7 dias", count: discipulos.filter(d => d.currentStreak >= 1 && d.currentStreak <= 7).length },
    { range: "8-30 dias", count: discipulos.filter(d => d.currentStreak >= 8 && d.currentStreak <= 30).length },
    { range: "31-90 dias", count: discipulos.filter(d => d.currentStreak >= 31 && d.currentStreak <= 90).length },
    { range: "90+ dias", count: discipulos.filter(d => d.currentStreak > 90).length }
  ];

  // Jornada status data
  const jornadaData = [
    { name: "Concluída", value: discipulos.filter(d => d.jornadaCompleted).length },
    { name: "Em Andamento", value: discipulos.filter(d => !d.jornadaCompleted).length }
  ];

  const discipuladorOptions = [
    { value: "all", label: "Todos os discipuladores" },
    ...discipuladores.map(d => ({ value: d.id, label: d.nome }))
  ];

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24" />)}
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
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs text-muted-foreground mb-1.5 block">Discipulador</label>
              <SearchableSelect
                options={discipuladorOptions}
                value={selectedDiscipulador}
                onValueChange={setSelectedDiscipulador}
                placeholder="Todos os discipuladores"
                searchPlaceholder="Buscar discipulador..."
              />
            </div>
            <div className="min-w-[140px]">
              <label className="text-xs text-muted-foreground mb-1.5 block">Período</label>
              <PeriodFilter value={period} onChange={setPeriod} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Discípulos</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalDiscipulos}</div>
            <p className="text-xs text-muted-foreground">ativos no programa</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média Streak</CardTitle>
            <Flame className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.avgStreak}</div>
            <p className="text-xs text-muted-foreground">dias consecutivos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média XP</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.avgXp}</div>
            <p className="text-xs text-muted-foreground">pontos de experiência</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jornada Concluída</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.jornadaCompletedCount}</div>
            <p className="text-xs text-muted-foreground">
              {summary.totalDiscipulos > 0 
                ? `${Math.round((summary.jornadaCompletedCount / summary.totalDiscipulos) * 100)}% do total`
                : '0% do total'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Academia</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.academiaProgress}%</div>
            <p className="text-xs text-muted-foreground">níveis concluídos</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Streak Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              Distribuição de Streaks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ count: { label: "Discípulos", color: "hsl(var(--primary))" } }} className="h-[250px]">
              <BarChart data={streakDistribution}>
                <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Jornada Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Status Jornada Metanoia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ value: { label: "Quantidade" } }} className="h-[250px]">
              <PieChart>
                <Pie
                  data={jornadaData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {jornadaData.map((_, index) => (
                    <Cell key={index} fill={CHART_COLORS_ARRAY[index % CHART_COLORS_ARRAY.length]} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Detalhamento por Discípulo
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <DiscipulosTable discipulos={discipulos} />
        </CardContent>
      </Card>
    </div>
  );
}

function DiscipulosTable({ discipulos }: { discipulos: DiscipuloStats[] }) {
  const sorting = useSorting({ data: discipulos, defaultSortKey: "nome", defaultDirection: "asc" });
  const pagination = usePagination({ data: sorting.sortedData, pageSize: 10 });

  return (
    <>
      <Table className="min-w-[800px]">
        <TableHeader>
          <TableRow>
            <TableHead>
              <SortableHeader sortState={sorting.getSortIcon("nome")} onClick={() => sorting.toggleSort("nome")}>
                Discípulo
              </SortableHeader>
            </TableHead>
            <TableHead>
              <SortableHeader sortState={sorting.getSortIcon("discipuladorNome")} onClick={() => sorting.toggleSort("discipuladorNome")}>
                Discipulador
              </SortableHeader>
            </TableHead>
            <TableHead className="text-center">
              <SortableHeader sortState={sorting.getSortIcon("currentStreak")} onClick={() => sorting.toggleSort("currentStreak")} className="justify-center">
                Streak
              </SortableHeader>
            </TableHead>
            <TableHead className="text-center">
              <SortableHeader sortState={sorting.getSortIcon("xpPoints")} onClick={() => sorting.toggleSort("xpPoints")} className="justify-center">
                XP
              </SortableHeader>
            </TableHead>
            <TableHead className="text-center">
              <SortableHeader sortState={sorting.getSortIcon("lessonsCompleted")} onClick={() => sorting.toggleSort("lessonsCompleted")} className="justify-center">
                Lições
              </SortableHeader>
            </TableHead>
            <TableHead className="text-center">Jornada</TableHead>
            <TableHead className="text-center">Academia</TableHead>
            <TableHead className="text-center">
              <SortableHeader sortState={sorting.getSortIcon("daysInProgram")} onClick={() => sorting.toggleSort("daysInProgram")} className="justify-center">
                Dias
              </SortableHeader>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pagination.paginatedData.map(disc => (
            <TableRow key={disc.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={disc.avatarUrl || undefined} />
                    <AvatarFallback className="text-xs">
                      {disc.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{disc.nome}</span>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {disc.discipuladorNome || '-'}
              </TableCell>
              <TableCell className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Flame className="h-3 w-3 text-orange-500" />
                  {disc.currentStreak}
                </div>
              </TableCell>
              <TableCell className="text-center">
                <Badge variant="secondary">{disc.xpPoints}</Badge>
              </TableCell>
              <TableCell className="text-center">{disc.lessonsCompleted}</TableCell>
              <TableCell className="text-center">
                <Badge variant={disc.jornadaCompleted ? "default" : "outline"}>
                  {disc.jornadaCompleted ? "✓" : "—"}
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Progress value={(disc.academiaNiveis / 4) * 100} className="h-2 w-12" />
                  <span className="text-xs text-muted-foreground">{disc.academiaNiveis}/4</span>
                </div>
              </TableCell>
              <TableCell className="text-center">
                <span className="text-xs text-muted-foreground">{disc.daysInProgram}d</span>
              </TableCell>
            </TableRow>
          ))}
          {discipulos.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                Nenhum discípulo encontrado
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {discipulos.length > 0 && (
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
