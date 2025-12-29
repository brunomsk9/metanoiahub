import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Users, CheckCircle2, Clock, XCircle, ChevronLeft, ChevronRight, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface MinistryLeaderScheduleReportProps {
  churchId?: string;
  isAdmin?: boolean;
}

export function MinistryLeaderScheduleReport({ churchId, isAdmin = false }: MinistryLeaderScheduleReportProps) {
  const [selectedMinistry, setSelectedMinistry] = useState<string>("all");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set());

  // Fetch ministries the user leads
  const { data: ministries, isLoading: ministriesLoading } = useQuery({
    queryKey: ["leader-ministries", churchId, isAdmin],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = supabase
        .from("ministries")
        .select("id, nome, cor")
        .eq("is_active", true);

      if (churchId) {
        query = query.eq("church_id", churchId);
      }

      // If not admin, filter to ministries the user leads
      if (!isAdmin) {
        query = query.or(`lider_principal_id.eq.${user.id},lider_secundario_id.eq.${user.id}`);
      }

      const { data, error } = await query.order("nome");
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch services for the selected month
  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ["services-report", churchId, currentMonth],
    queryFn: async () => {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);

      let query = supabase
        .from("services")
        .select(`
          id,
          nome,
          data_hora,
          descricao,
          status,
          is_special_event,
          service_type:service_types(nome)
        `)
        .gte("data_hora", start.toISOString())
        .lte("data_hora", end.toISOString())
        .order("data_hora");

      if (churchId) {
        query = query.eq("church_id", churchId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch schedules for the month
  const { data: schedules, isLoading: schedulesLoading } = useQuery({
    queryKey: ["schedules-report", churchId, currentMonth, selectedMinistry],
    queryFn: async () => {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);

      let query = supabase
        .from("schedules")
        .select(`
          id,
          service_id,
          ministry_id,
          position_id,
          volunteer_id,
          status,
          ministry:ministries(id, nome, cor),
          position:ministry_positions(id, nome),
          volunteer:profiles(id, nome)
        `);

      if (churchId) {
        query = query.eq("church_id", churchId);
      }

      if (selectedMinistry !== "all") {
        query = query.eq("ministry_id", selectedMinistry);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Calculate statistics
  const stats = useMemo(() => {
    if (!schedules || !services) {
      return {
        totalServices: 0,
        totalSchedules: 0,
        confirmed: 0,
        pending: 0,
        declined: 0,
        confirmationRate: 0,
        fillRate: 0,
      };
    }

    const serviceIds = new Set(services.map(s => s.id));
    const relevantSchedules = schedules.filter(s => serviceIds.has(s.service_id));

    const confirmed = relevantSchedules.filter(s => s.status === "confirmed").length;
    const pending = relevantSchedules.filter(s => s.status === "pending").length;
    const declined = relevantSchedules.filter(s => s.status === "declined").length;
    const total = relevantSchedules.length;

    return {
      totalServices: services.length,
      totalSchedules: total,
      confirmed,
      pending,
      declined,
      confirmationRate: total > 0 ? Math.round((confirmed / total) * 100) : 0,
      fillRate: total > 0 ? Math.round(((confirmed + pending) / total) * 100) : 0,
    };
  }, [schedules, services]);

  // Group schedules by service
  const serviceSchedules = useMemo(() => {
    if (!services || !schedules) return new Map();

    const map = new Map<string, typeof schedules>();
    
    services.forEach(service => {
      const serviceScheds = schedules.filter(s => s.service_id === service.id);
      map.set(service.id, serviceScheds);
    });

    return map;
  }, [services, schedules]);

  // Chart data for status distribution
  const statusChartData = useMemo(() => {
    return [
      { name: "Confirmados", value: stats.confirmed, color: "hsl(var(--chart-2))" },
      { name: "Pendentes", value: stats.pending, color: "hsl(var(--chart-4))" },
      { name: "Recusados", value: stats.declined, color: "hsl(var(--chart-1))" },
    ].filter(d => d.value > 0);
  }, [stats]);

  // Chart data for services
  const servicesChartData = useMemo(() => {
    if (!services || !schedules) return [];

    return services.slice(0, 10).map(service => {
      const serviceScheds = schedules.filter(s => s.service_id === service.id);
      return {
        name: format(new Date(service.data_hora), "dd/MM", { locale: ptBR }),
        Confirmados: serviceScheds.filter(s => s.status === "confirmed").length,
        Pendentes: serviceScheds.filter(s => s.status === "pending").length,
        Recusados: serviceScheds.filter(s => s.status === "declined").length,
      };
    });
  }, [services, schedules]);

  const toggleService = (serviceId: string) => {
    const newExpanded = new Set(expandedServices);
    if (newExpanded.has(serviceId)) {
      newExpanded.delete(serviceId);
    } else {
      newExpanded.add(serviceId);
    }
    setExpandedServices(newExpanded);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge variant="default" className="bg-green-500 text-white">Confirmado</Badge>;
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-500 text-white">Pendente</Badge>;
      case "declined":
        return <Badge variant="destructive">Recusado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const isLoading = ministriesLoading || servicesLoading || schedulesLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium min-w-[150px] text-center">
            {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Select value={selectedMinistry} onValueChange={setSelectedMinistry}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por ministério" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os ministérios</SelectItem>
            {ministries?.map((ministry) => (
              <SelectItem key={ministry.id} value={ministry.id}>
                {ministry.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Cultos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalServices}</div>
            <p className="text-xs text-muted-foreground">neste mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Escalas Criadas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSchedules}</div>
            <p className="text-xs text-muted-foreground">voluntários escalados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Confirmação</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.confirmationRate}%</div>
            <Progress value={stats.confirmationRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status das Escalas</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 text-xs">
              <span className="text-green-600">{stats.confirmed} ✓</span>
              <span className="text-yellow-600">{stats.pending} ⏳</span>
              <span className="text-red-600">{stats.declined} ✗</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {stats.totalSchedules > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Distribuição por Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Escalas por Culto</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={servicesChartData}>
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Confirmados" stackId="a" fill="hsl(var(--chart-2))" />
                  <Bar dataKey="Pendentes" stackId="a" fill="hsl(var(--chart-4))" />
                  <Bar dataKey="Recusados" stackId="a" fill="hsl(var(--chart-1))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Services List */}
      <Card>
        <CardHeader>
          <CardTitle>Cultos e Escalas</CardTitle>
        </CardHeader>
        <CardContent>
          {services?.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhum culto encontrado para este mês.
            </p>
          ) : (
            <div className="space-y-3">
              {services?.map((service) => {
                const serviceScheds = serviceSchedules.get(service.id) || [];
                const confirmed = serviceScheds.filter(s => s.status === "confirmed").length;
                const pending = serviceScheds.filter(s => s.status === "pending").length;
                const declined = serviceScheds.filter(s => s.status === "declined").length;
                const total = serviceScheds.length;
                const isExpanded = expandedServices.has(service.id);

                return (
                  <Collapsible key={service.id} open={isExpanded} onOpenChange={() => toggleService(service.id)}>
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="text-center min-w-[60px]">
                            <div className="text-lg font-bold">
                              {format(new Date(service.data_hora), "dd", { locale: ptBR })}
                            </div>
                            <div className="text-xs text-muted-foreground uppercase">
                              {format(new Date(service.data_hora), "EEE", { locale: ptBR })}
                            </div>
                          </div>
                          <div>
                            <div className="font-medium">{service.nome}</div>
                            <div className="text-sm text-muted-foreground">
                              {format(new Date(service.data_hora), "HH:mm", { locale: ptBR })}
                              {service.service_type && ` • ${service.service_type.nome}`}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          {total > 0 ? (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="flex items-center gap-1 text-green-600">
                                <CheckCircle2 className="h-3 w-3" /> {confirmed}
                              </span>
                              <span className="flex items-center gap-1 text-yellow-600">
                                <Clock className="h-3 w-3" /> {pending}
                              </span>
                              <span className="flex items-center gap-1 text-red-600">
                                <XCircle className="h-3 w-3" /> {declined}
                              </span>
                            </div>
                          ) : (
                            <Badge variant="outline">Sem escala</Badge>
                          )}
                        </div>
                      </div>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      {serviceScheds.length > 0 ? (
                        <div className="ml-20 mt-2 space-y-2 pb-3">
                          {/* Group by ministry */}
                          {Object.entries(
                            serviceScheds.reduce((acc, sched) => {
                              const ministryName = sched.ministry?.nome || "Sem ministério";
                              if (!acc[ministryName]) acc[ministryName] = [];
                              acc[ministryName].push(sched);
                              return acc;
                            }, {} as Record<string, typeof serviceScheds>)
                          ).map(([ministryName, scheds]: [string, typeof serviceScheds]) => (
                            <div key={ministryName} className="space-y-1">
                              <div className="text-sm font-medium text-muted-foreground">{ministryName}</div>
                              <div className="grid gap-1 pl-2">
                                {scheds.map((sched) => (
                                  <div
                                    key={sched.id}
                                    className="flex items-center justify-between text-sm p-2 rounded bg-muted/30"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="text-muted-foreground">{sched.position?.nome}:</span>
                                      <span>{sched.volunteer?.nome || "Não atribuído"}</span>
                                    </div>
                                    {getStatusBadge(sched.status)}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="ml-20 mt-2 pb-3">
                          <p className="text-sm text-muted-foreground">Nenhum voluntário escalado para este culto.</p>
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
