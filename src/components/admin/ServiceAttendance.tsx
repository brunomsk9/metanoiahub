import { useState } from "react";
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
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Users, Baby, UserCheck, Plus, BarChart3 } from "lucide-react";
import { useUserChurchId } from "@/hooks/useUserChurchId";

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

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
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
            <CardTitle className="text-sm font-medium">Total Adultos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.adultos}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Crianças</CardTitle>
            <Baby className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.criancas}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Voluntários</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.voluntarios}</div>
          </CardContent>
        </Card>
      </div>

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
