import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, startOfWeek, endOfWeek, subWeeks, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Users, Calendar, MessageSquare, TrendingUp } from "lucide-react";
import { useUserChurchId } from "@/hooks/useUserChurchId";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PeriodType = "week" | "lastWeek" | "month" | "quarter" | "year";

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

export function WeeklyDiscipleshipReport() {
  const { churchId } = useUserChurchId();
  const [period, setPeriod] = useState<PeriodType>("week");

  const getDateRange = (periodType: PeriodType) => {
    const now = new Date();
    let start: Date;
    let end: Date = endOfWeek(now, { weekStartsOn: 0 });

    switch (periodType) {
      case "week":
        start = startOfWeek(now, { weekStartsOn: 0 });
        break;
      case "lastWeek":
        start = startOfWeek(subWeeks(now, 1), { weekStartsOn: 0 });
        end = endOfWeek(subWeeks(now, 1), { weekStartsOn: 0 });
        break;
      case "month":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case "quarter":
        const quarter = Math.floor(now.getMonth() / 3);
        start = new Date(now.getFullYear(), quarter * 3, 1);
        end = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
        break;
      case "year":
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31);
        break;
      default:
        start = startOfWeek(now, { weekStartsOn: 0 });
    }

    return { start, end };
  };

  const { start: periodStart, end: periodEnd } = getDateRange(period);

  const { data: meetings = [], isLoading } = useQuery({
    queryKey: ["discipleship-meetings-report", churchId, period],
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

  const stats = useMemo(() => {
    const discipuladorMap = new Map<string, DiscipuladorStats>();

    meetings.forEach((meeting) => {
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
  }, [meetings]);

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

  const periodLabel = period === "week" 
    ? "Esta Semana" 
    : period === "lastWeek" 
    ? "Semana Passada"
    : period === "month"
    ? "Este Mês"
    : period === "quarter"
    ? "Este Trimestre"
    : "Este Ano";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Relatório de Encontros</h2>
          <p className="text-sm text-muted-foreground">
            {format(periodStart, "dd/MM", { locale: ptBR })} - {format(periodEnd, "dd/MM/yyyy", { locale: ptBR })}
          </p>
        </div>
        <Select value={period} onValueChange={(v) => setPeriod(v as PeriodType)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Esta Semana</SelectItem>
            <SelectItem value="lastWeek">Semana Passada</SelectItem>
            <SelectItem value="month">Este Mês</SelectItem>
            <SelectItem value="quarter">Este Trimestre</SelectItem>
            <SelectItem value="year">Este Ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Encontros</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.total}</div>
            <p className="text-xs text-muted-foreground">{periodLabel}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Individuais</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.individuais}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Células</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.celulas}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Participantes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.participantes}</div>
          </CardContent>
        </Card>
      </div>

      {/* Stats by Discipulador */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Por Discipulador</CardTitle>
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : stats.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum encontro registrado no período
                  </TableCell>
                </TableRow>
              ) : (
                stats.map((stat) => (
                  <TableRow key={stat.id}>
                    <TableCell className="font-medium">{stat.nome}</TableCell>
                    <TableCell className="text-center">{stat.individuais}</TableCell>
                    <TableCell className="text-center">{stat.celulas}</TableCell>
                    <TableCell className="text-center font-semibold">{stat.totalEncontros}</TableCell>
                    <TableCell className="text-center">{stat.totalParticipantes}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Meetings List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Encontros Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {meetings.slice(0, 10).map((meeting) => (
              <div
                key={meeting.id}
                className="flex items-start gap-4 p-3 rounded-lg border"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{meeting.discipulador.nome}</span>
                    <Badge variant={meeting.tipo === "individual" ? "default" : "secondary"}>
                      {meeting.tipo === "individual" ? "Individual" : "Célula"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {format(new Date(meeting.data_encontro), "EEEE, dd/MM 'às' HH:mm", {
                      locale: ptBR,
                    })}
                    {meeting.local && ` • ${meeting.local}`}
                  </p>
                  {meeting.tipo === "individual" && meeting.discipulo && (
                    <p className="text-sm mt-1">
                      Com: <span className="font-medium">{meeting.discipulo.nome}</span>
                    </p>
                  )}
                  {meeting.tipo === "celula" && meeting.attendances && meeting.attendances.length > 0 && (
                    <p className="text-sm mt-1">
                      Presentes: {meeting.attendances.filter((a) => a.presente).map((a) => a.profile.nome).join(", ")}
                    </p>
                  )}
                  {meeting.notas && (
                    <p className="text-sm text-muted-foreground mt-2 italic">
                      "{meeting.notas}"
                    </p>
                  )}
                </div>
              </div>
            ))}
            {meetings.length === 0 && !isLoading && (
              <p className="text-center text-muted-foreground py-4">
                Nenhum encontro registrado no período
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
