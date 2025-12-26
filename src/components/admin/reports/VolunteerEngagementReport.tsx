import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Check, X, Clock, TrendingUp, Calendar, Percent } from "lucide-react";
import { PeriodFilter, PeriodOption, getDateFromPeriod } from "./PeriodFilter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface VolunteerStats {
  id: string;
  nome: string;
  totalSchedules: number;
  confirmed: number;
  declined: number;
  pending: number;
  confirmationRate: number;
  ministries: string[];
}

interface MinistryStats {
  name: string;
  totalSchedules: number;
  confirmed: number;
  declined: number;
  pending: number;
  confirmationRate: number;
  color: string;
}

export function VolunteerEngagementReport() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodOption>("3m");
  const [volunteers, setVolunteers] = useState<VolunteerStats[]>([]);
  const [ministryStats, setMinistryStats] = useState<MinistryStats[]>([]);
  const [summary, setSummary] = useState({
    totalSchedules: 0,
    confirmed: 0,
    declined: 0,
    pending: 0,
    confirmationRate: 0,
    activeVolunteers: 0
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
      if (!churchId) return;

      // Fetch schedules with service and ministry data
      const { data: schedulesData, error: schedulesError } = await supabase
        .from('schedules')
        .select(`
          id,
          volunteer_id,
          status,
          ministry_id,
          created_at,
          services(data_hora, nome)
        `)
        .eq('church_id', churchId);

      if (schedulesError) {
        console.error('Error fetching schedules:', schedulesError);
      }

      let schedules = (schedulesData || []).filter(s => s.services !== null);

      // Filter by period based on service date
      if (periodStart) {
        schedules = schedules.filter(s => {
          const serviceDate = (s.services as any)?.data_hora;
          return serviceDate && new Date(serviceDate) >= periodStart;
        });
      }

      // Fetch volunteer profiles
      const volunteerIds = [...new Set(schedules.map(s => s.volunteer_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nome')
        .in('id', volunteerIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Fetch ministries
      const { data: ministries } = await supabase
        .from('ministries')
        .select('id, nome, cor')
        .eq('church_id', churchId);

      const ministryMap = new Map(ministries?.map(m => [m.id, m]) || []);

      // Calculate volunteer stats
      const volunteerStatsMap = new Map<string, VolunteerStats>();

      schedules.forEach(schedule => {
        const existing = volunteerStatsMap.get(schedule.volunteer_id) || {
          id: schedule.volunteer_id,
          nome: profileMap.get(schedule.volunteer_id)?.nome || 'Desconhecido',
          totalSchedules: 0,
          confirmed: 0,
          declined: 0,
          pending: 0,
          confirmationRate: 0,
          ministries: []
        };

        existing.totalSchedules++;
        if (schedule.status === 'confirmed') existing.confirmed++;
        else if (schedule.status === 'declined') existing.declined++;
        else existing.pending++;

        const ministryName = ministryMap.get(schedule.ministry_id)?.nome;
        if (ministryName && !existing.ministries.includes(ministryName)) {
          existing.ministries.push(ministryName);
        }

        volunteerStatsMap.set(schedule.volunteer_id, existing);
      });

      // Calculate confirmation rates and sort
      const volunteerArray = Array.from(volunteerStatsMap.values()).map(v => ({
        ...v,
        confirmationRate: v.totalSchedules > 0 
          ? Math.round((v.confirmed / v.totalSchedules) * 100)
          : 0
      }));
      volunteerArray.sort((a, b) => b.totalSchedules - a.totalSchedules);
      setVolunteers(volunteerArray);

      // Calculate ministry stats
      const ministryStatsMap = new Map<string, MinistryStats>();

      schedules.forEach(schedule => {
        const ministry = ministryMap.get(schedule.ministry_id);
        const ministryName = ministry?.nome || 'Desconhecido';
        const existing = ministryStatsMap.get(schedule.ministry_id) || {
          name: ministryName,
          totalSchedules: 0,
          confirmed: 0,
          declined: 0,
          pending: 0,
          confirmationRate: 0,
          color: ministry?.cor || '#8B5CF6'
        };

        existing.totalSchedules++;
        if (schedule.status === 'confirmed') existing.confirmed++;
        else if (schedule.status === 'declined') existing.declined++;
        else existing.pending++;

        ministryStatsMap.set(schedule.ministry_id, existing);
      });

      const ministryArray = Array.from(ministryStatsMap.values()).map(m => ({
        ...m,
        confirmationRate: m.totalSchedules > 0 
          ? Math.round((m.confirmed / m.totalSchedules) * 100)
          : 0
      }));
      ministryArray.sort((a, b) => b.totalSchedules - a.totalSchedules);
      setMinistryStats(ministryArray);

      // Calculate summary
      const totalSchedules = schedules.length;
      const confirmed = schedules.filter(s => s.status === 'confirmed').length;
      const declined = schedules.filter(s => s.status === 'declined').length;
      const pending = schedules.filter(s => s.status === 'pending').length;

      setSummary({
        totalSchedules,
        confirmed,
        declined,
        pending,
        confirmationRate: totalSchedules > 0 ? Math.round((confirmed / totalSchedules) * 100) : 0,
        activeVolunteers: volunteerIds.length
      });
    } catch (error) {
      console.error('Error fetching volunteer engagement stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const statusChartData = [
    { name: 'Confirmados', value: summary.confirmed, color: 'hsl(142, 76%, 36%)' },
    { name: 'Recusados', value: summary.declined, color: 'hsl(0, 84%, 60%)' },
    { name: 'Pendentes', value: summary.pending, color: 'hsl(45, 93%, 47%)' }
  ].filter(d => d.value > 0);

  const chartConfig = {
    confirmed: { label: "Confirmados", color: "hsl(142, 76%, 36%)" },
    declined: { label: "Recusados", color: "hsl(0, 84%, 60%)" },
    pending: { label: "Pendentes", color: "hsl(45, 93%, 47%)" }
  };

  const topVolunteers = volunteers.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Period Filter */}
      <div className="flex justify-end">
        <PeriodFilter value={period} onChange={setPeriod} />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Escalações</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalSchedules}</div>
            <p className="text-xs text-muted-foreground">no período</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Voluntários Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.activeVolunteers}</div>
            <p className="text-xs text-muted-foreground">escalados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmados</CardTitle>
            <Check className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary.confirmed}</div>
            <p className="text-xs text-muted-foreground">escalações</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recusados</CardTitle>
            <X className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{summary.declined}</div>
            <p className="text-xs text-muted-foreground">escalações</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{summary.pending}</div>
            <p className="text-xs text-muted-foreground">aguardando</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa Confirmação</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.confirmationRate}%</div>
            <Progress value={summary.confirmationRate} className="h-2 mt-1" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Status Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Status</CardTitle>
          </CardHeader>
          <CardContent>
            {statusChartData.length > 0 ? (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {statusChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Nenhuma escalação encontrada
              </p>
            )}
          </CardContent>
        </Card>

        {/* Ministry Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Engajamento por Ministério</CardTitle>
          </CardHeader>
          <CardContent>
            {ministryStats.length > 0 ? (
              <div className="space-y-4">
                {ministryStats.slice(0, 5).map(ministry => (
                  <div key={ministry.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: ministry.color }}
                        />
                        <span className="text-sm font-medium">{ministry.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{ministry.totalSchedules} escalações</span>
                        <Badge 
                          variant={ministry.confirmationRate >= 70 ? "default" : "secondary"}
                          className="text-[10px]"
                        >
                          {ministry.confirmationRate}%
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1 h-2">
                      <div 
                        className="rounded-l bg-green-500" 
                        style={{ width: `${(ministry.confirmed / ministry.totalSchedules) * 100}%` }}
                      />
                      <div 
                        className="bg-amber-500" 
                        style={{ width: `${(ministry.pending / ministry.totalSchedules) * 100}%` }}
                      />
                      <div 
                        className="rounded-r bg-destructive" 
                        style={{ width: `${(ministry.declined / ministry.totalSchedules) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Nenhum ministério encontrado
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Volunteers Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Voluntários Mais Escalados</CardTitle>
        </CardHeader>
        <CardContent>
          {topVolunteers.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[300px]">
              <BarChart data={topVolunteers} layout="vertical">
                <XAxis type="number" />
                <YAxis 
                  dataKey="nome" 
                  type="category" 
                  width={120}
                  tick={{ fontSize: 11 }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="confirmed" stackId="a" fill="hsl(142, 76%, 36%)" name="Confirmados" />
                <Bar dataKey="pending" stackId="a" fill="hsl(45, 93%, 47%)" name="Pendentes" />
                <Bar dataKey="declined" stackId="a" fill="hsl(0, 84%, 60%)" name="Recusados" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Nenhum voluntário encontrado
            </p>
          )}
        </CardContent>
      </Card>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhamento por Voluntário</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Voluntário</TableHead>
                <TableHead className="text-center">Total</TableHead>
                <TableHead className="text-center">Confirmados</TableHead>
                <TableHead className="text-center">Recusados</TableHead>
                <TableHead className="text-center">Pendentes</TableHead>
                <TableHead className="text-center">Taxa</TableHead>
                <TableHead>Ministérios</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {volunteers.map(vol => (
                <TableRow key={vol.id}>
                  <TableCell className="font-medium">{vol.nome}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{vol.totalSchedules}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-300">
                      {vol.confirmed}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
                      {vol.declined}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-300">
                      {vol.pending}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center gap-2 justify-center">
                      <Progress value={vol.confirmationRate} className="h-2 w-12" />
                      <span className="text-xs text-muted-foreground">{vol.confirmationRate}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {vol.ministries.slice(0, 2).map(m => (
                        <Badge key={m} variant="outline" className="text-[10px]">
                          {m}
                        </Badge>
                      ))}
                      {vol.ministries.length > 2 && (
                        <Badge variant="outline" className="text-[10px]">
                          +{vol.ministries.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {volunteers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhum voluntário encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
