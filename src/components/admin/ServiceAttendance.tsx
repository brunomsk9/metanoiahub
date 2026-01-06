import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { format, startOfWeek, startOfMonth, subMonths, parseISO, isWithinInterval, endOfMonth, subWeeks, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Users, Baby, UserCheck, Plus, BarChart3, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useUserChurchId } from "@/hooks/useUserChurchId";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ServiceWithAttendance {
  id: string;
  nome: string;
  data_hora: string;
  attendance?: {
    id: string;
    adultos: number;
    criancas: number;
    voluntarios: number;
    total_geral: number;
    notas: string | null;
  };
}

export function ServiceAttendance() {
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [adultos, setAdultos] = useState<number>(0);
  const [criancas, setCriancas] = useState<number>(0);
  const [voluntarios, setVoluntarios] = useState<number>(0);
  const [notas, setNotas] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const queryClient = useQueryClient();
  const { churchId } = useUserChurchId();

  // Fetch past services with attendance
  const { data: services = [], isLoading } = useQuery({
    queryKey: ["services-with-attendance", churchId],
    queryFn: async () => {
      if (!churchId) return [];
      
      const now = new Date().toISOString();
      
      const { data: servicesData, error: servicesError } = await supabase
        .from("services")
        .select("id, nome, data_hora")
        .eq("church_id", churchId)
        .lt("data_hora", now)
        .order("data_hora", { ascending: false })
        .limit(50);

      if (servicesError) throw servicesError;

      const { data: attendanceData, error: attendanceError } = await supabase
        .from("service_attendance")
        .select("*")
        .eq("church_id", churchId);

      if (attendanceError) throw attendanceError;

      const attendanceMap = new Map(
        attendanceData?.map((a) => [a.service_id, a])
      );

      return (servicesData || []).map((service) => ({
        ...service,
        attendance: attendanceMap.get(service.id),
      })) as ServiceWithAttendance[];
    },
    enabled: !!churchId,
  });

  // Fetch services without attendance for selection
  const { data: unregisteredServices = [] } = useQuery({
    queryKey: ["unregistered-services", churchId],
    queryFn: async () => {
      if (!churchId) return [];
      
      const now = new Date().toISOString();
      
      const { data: servicesData, error } = await supabase
        .from("services")
        .select("id, nome, data_hora")
        .eq("church_id", churchId)
        .lt("data_hora", now)
        .order("data_hora", { ascending: false });

      if (error) throw error;

      const { data: attendanceData } = await supabase
        .from("service_attendance")
        .select("service_id")
        .eq("church_id", churchId);

      const registeredIds = new Set(attendanceData?.map((a) => a.service_id));

      return (servicesData || []).filter((s) => !registeredIds.has(s.id));
    },
    enabled: !!churchId,
  });

  const createAttendance = useMutation({
    mutationFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user || !churchId) throw new Error("Não autorizado");

      const { error } = await supabase.from("service_attendance").insert({
        service_id: selectedServiceId,
        church_id: churchId,
        adultos,
        criancas,
        voluntarios,
        notas: notas || null,
        registered_by: session.session.user.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Presença registrada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["services-with-attendance"] });
      queryClient.invalidateQueries({ queryKey: ["unregistered-services"] });
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(`Erro ao registrar: ${error.message}`);
    },
  });

  const resetForm = () => {
    setSelectedServiceId("");
    setAdultos(0);
    setCriancas(0);
    setVoluntarios(0);
    setNotas("");
  };

  // Calculate totals
  const totals = services.reduce(
    (acc, s) => {
      if (s.attendance) {
        acc.adultos += s.attendance.adultos;
        acc.criancas += s.attendance.criancas;
        acc.voluntarios += s.attendance.voluntarios;
        acc.total += s.attendance.total_geral;
        acc.count++;
      }
      return acc;
    },
    { adultos: 0, criancas: 0, voluntarios: 0, total: 0, count: 0 }
  );

  const averageAttendance = totals.count > 0 ? Math.round(totals.total / totals.count) : 0;

  // Prepare chart data - weekly evolution
  const weeklyChartData = useMemo(() => {
    const servicesWithAttendance = services.filter((s) => s.attendance);
    if (servicesWithAttendance.length === 0) return [];

    // Group by week
    const weeklyMap = new Map<string, { total: number; adultos: number; criancas: number; voluntarios: number; count: number }>();
    
    servicesWithAttendance.forEach((service) => {
      const date = parseISO(service.data_hora);
      const weekStart = startOfWeek(date, { weekStartsOn: 0 });
      const weekKey = format(weekStart, "dd/MM", { locale: ptBR });
      
      const existing = weeklyMap.get(weekKey) || { total: 0, adultos: 0, criancas: 0, voluntarios: 0, count: 0 };
      existing.total += service.attendance!.total_geral;
      existing.adultos += service.attendance!.adultos;
      existing.criancas += service.attendance!.criancas;
      existing.voluntarios += service.attendance!.voluntarios;
      existing.count++;
      weeklyMap.set(weekKey, existing);
    });

    return Array.from(weeklyMap.entries())
      .map(([week, data]) => ({
        semana: week,
        total: data.total,
        media: Math.round(data.total / data.count),
        adultos: data.adultos,
        criancas: data.criancas,
        voluntarios: data.voluntarios,
      }))
      .reverse()
      .slice(-12); // Last 12 weeks
  }, [services]);

  // Monthly comparison data
  const monthlyComparisonData = useMemo(() => {
    const servicesWithAttendance = services.filter((s) => s.attendance);
    if (servicesWithAttendance.length === 0) return [];

    const monthlyMap = new Map<string, { total: number; count: number }>();
    
    servicesWithAttendance.forEach((service) => {
      const date = parseISO(service.data_hora);
      const monthKey = format(date, "MMM/yy", { locale: ptBR });
      
      const existing = monthlyMap.get(monthKey) || { total: 0, count: 0 };
      existing.total += service.attendance!.total_geral;
      existing.count++;
      monthlyMap.set(monthKey, existing);
    });

    return Array.from(monthlyMap.entries())
      .map(([month, data]) => ({
        mes: month,
        total: data.total,
        media: Math.round(data.total / data.count),
        cultos: data.count,
      }))
      .reverse()
      .slice(-6); // Last 6 months
  }, [services]);

  // Calculate week-over-week change
  const weeklyChange = useMemo(() => {
    if (weeklyChartData.length < 2) return null;
    const current = weeklyChartData[weeklyChartData.length - 1]?.total || 0;
    const previous = weeklyChartData[weeklyChartData.length - 2]?.total || 0;
    if (previous === 0) return null;
    const percentChange = Math.round(((current - previous) / previous) * 100);
    return { current, previous, percentChange };
  }, [weeklyChartData]);

  // Calculate month-over-month change
  const monthlyChange = useMemo(() => {
    if (monthlyComparisonData.length < 2) return null;
    const current = monthlyComparisonData[monthlyComparisonData.length - 1]?.media || 0;
    const previous = monthlyComparisonData[monthlyComparisonData.length - 2]?.media || 0;
    if (previous === 0) return null;
    const percentChange = Math.round(((current - previous) / previous) * 100);
    return { current, previous, percentChange };
  }, [monthlyComparisonData]);

  return (
    <div className="space-y-6">
      {/* Summary Cards with Comparisons */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média por Culto</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageAttendance}</div>
            <p className="text-xs text-muted-foreground">
              baseado em {totals.count} cultos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Variação Semanal</CardTitle>
            {weeklyChange && weeklyChange.percentChange > 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : weeklyChange && weeklyChange.percentChange < 0 ? (
              <TrendingDown className="h-4 w-4 text-red-500" />
            ) : (
              <Minus className="h-4 w-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">
                {weeklyChange ? `${weeklyChange.percentChange > 0 ? "+" : ""}${weeklyChange.percentChange}%` : "—"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {weeklyChange ? `${weeklyChange.previous} → ${weeklyChange.current}` : "sem dados suficientes"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Variação Mensal</CardTitle>
            {monthlyChange && monthlyChange.percentChange > 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : monthlyChange && monthlyChange.percentChange < 0 ? (
              <TrendingDown className="h-4 w-4 text-red-500" />
            ) : (
              <Minus className="h-4 w-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">
                {monthlyChange ? `${monthlyChange.percentChange > 0 ? "+" : ""}${monthlyChange.percentChange}%` : "—"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {monthlyChange ? `média: ${monthlyChange.previous} → ${monthlyChange.current}` : "sem dados suficientes"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Último Culto</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {services.find((s) => s.attendance)?.attendance?.total_geral ?? "—"}
            </div>
            <p className="text-xs text-muted-foreground">
              {services.find((s) => s.attendance) 
                ? format(parseISO(services.find((s) => s.attendance)!.data_hora), "dd/MM", { locale: ptBR })
                : "nenhum registro"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      {weeklyChartData.length > 0 && (
        <Tabs defaultValue="evolucao" className="w-full">
          <TabsList>
            <TabsTrigger value="evolucao">Evolução Semanal</TabsTrigger>
            <TabsTrigger value="distribuicao">Distribuição</TabsTrigger>
            <TabsTrigger value="mensal">Comparativo Mensal</TabsTrigger>
          </TabsList>

          <TabsContent value="evolucao" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Presença por Semana</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weeklyChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis 
                        dataKey="semana" 
                        tick={{ fontSize: 12 }}
                        className="fill-muted-foreground"
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        className="fill-muted-foreground"
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        labelStyle={{ color: "hsl(var(--foreground))" }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="total"
                        name="Total"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ fill: "hsl(var(--primary))" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="media"
                        name="Média por Culto"
                        stroke="hsl(var(--accent))"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={{ fill: "hsl(var(--accent))" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="distribuicao" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Distribuição por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis 
                        dataKey="semana" 
                        tick={{ fontSize: 12 }}
                        className="fill-muted-foreground"
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        className="fill-muted-foreground"
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Bar dataKey="adultos" name="Adultos" stackId="a" fill="hsl(var(--primary))" />
                      <Bar dataKey="criancas" name="Crianças" stackId="a" fill="hsl(var(--accent))" />
                      <Bar dataKey="voluntarios" name="Voluntários" stackId="a" fill="hsl(var(--muted-foreground))" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mensal" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Comparativo Mensal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyComparisonData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis 
                        dataKey="mes" 
                        tick={{ fontSize: 12 }}
                        className="fill-muted-foreground"
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        className="fill-muted-foreground"
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number, name: string) => [
                          value,
                          name === "media" ? "Média por Culto" : name === "total" ? "Total" : "Cultos",
                        ]}
                      />
                      <Legend />
                      <Bar dataKey="total" name="Total de Pessoas" fill="hsl(var(--primary))" />
                      <Bar dataKey="media" name="Média por Culto" fill="hsl(var(--accent))" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {monthlyComparisonData.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                    {monthlyComparisonData.slice(-3).map((month) => (
                      <div key={month.mes} className="p-3 rounded-lg bg-muted/50">
                        <p className="text-sm font-medium">{month.mes}</p>
                        <p className="text-lg font-bold text-primary">{month.media}</p>
                        <p className="text-xs text-muted-foreground">média/culto</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Register Dialog */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Histórico de Presença</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Registrar Presença
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Presença do Culto</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="service">Culto</Label>
                <Select
                  value={selectedServiceId}
                  onValueChange={setSelectedServiceId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o culto" />
                  </SelectTrigger>
                  <SelectContent>
                    {unregisteredServices.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.nome} -{" "}
                        {format(new Date(service.data_hora), "dd/MM/yyyy HH:mm", {
                          locale: ptBR,
                        })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="adultos">Adultos</Label>
                  <Input
                    id="adultos"
                    type="number"
                    min={0}
                    value={adultos}
                    onChange={(e) => setAdultos(Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="criancas">Crianças</Label>
                  <Input
                    id="criancas"
                    type="number"
                    min={0}
                    value={criancas}
                    onChange={(e) => setCriancas(Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="voluntarios">Voluntários</Label>
                  <Input
                    id="voluntarios"
                    type="number"
                    min={0}
                    value={voluntarios}
                    onChange={(e) => setVoluntarios(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Total Geral</p>
                <p className="text-2xl font-bold">
                  {adultos + criancas + voluntarios}
                </p>
              </div>

              <div>
                <Label htmlFor="notas">Observações</Label>
                <Textarea
                  id="notas"
                  placeholder="Alguma observação sobre este culto..."
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                />
              </div>

              <Button
                className="w-full"
                onClick={() => createAttendance.mutate()}
                disabled={!selectedServiceId || createAttendance.isPending}
              >
                {createAttendance.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Attendance Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Culto</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-center">Adultos</TableHead>
                <TableHead className="text-center">Crianças</TableHead>
                <TableHead className="text-center">Voluntários</TableHead>
                <TableHead className="text-center">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : services.filter((s) => s.attendance).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhuma presença registrada ainda
                  </TableCell>
                </TableRow>
              ) : (
                services
                  .filter((s) => s.attendance)
                  .map((service) => (
                    <TableRow key={service.id}>
                      <TableCell className="font-medium">{service.nome}</TableCell>
                      <TableCell>
                        {format(new Date(service.data_hora), "dd/MM/yyyy", {
                          locale: ptBR,
                        })}
                      </TableCell>
                      <TableCell className="text-center">
                        {service.attendance?.adultos}
                      </TableCell>
                      <TableCell className="text-center">
                        {service.attendance?.criancas}
                      </TableCell>
                      <TableCell className="text-center">
                        {service.attendance?.voluntarios}
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {service.attendance?.total_geral}
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
