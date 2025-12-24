import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  isSameMonth, 
  addMonths, 
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Check, X, Clock, Users, ChevronLeft, ChevronRight, List, CalendarDays, HandHeart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { VolunteerAvailability } from "./VolunteerAvailability";

interface VolunteerSchedulesProps {
  userId: string;
  churchId?: string;
}

type Schedule = {
  id: string;
  status: string;
  notes: string | null;
  service: {
    id: string;
    nome: string;
    data_hora: string;
    descricao: string | null;
    is_special_event: boolean;
  } | null;
  position: {
    id: string;
    nome: string;
  } | null;
  ministry: {
    id: string;
    nome: string;
    cor: string | null;
    icone: string | null;
  } | null;
};

export function VolunteerSchedules({ userId, churchId }: VolunteerSchedulesProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"schedules" | "availability">("schedules");
  const [view, setView] = useState<"list" | "calendar">("calendar");
  const [filter, setFilter] = useState<"upcoming" | "past">("upcoming");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const { data: schedules, isLoading } = useQuery({
    queryKey: ["volunteer-schedules", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schedules")
        .select(`
          *,
          service:services(id, nome, data_hora, descricao, is_special_event),
          position:ministry_positions(id, nome),
          ministry:ministries(id, nome, cor, icone)
        `)
        .eq("volunteer_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Schedule[];
    },
    enabled: !!userId,
  });

  const notifyLeader = async (schedule: Schedule, status: "confirmed" | "declined") => {
    try {
      if (!schedule.ministry?.id) return;
      
      // Get ministry leader info
      const { data: ministry } = await supabase
        .from("ministries")
        .select("lider_principal_id, lider_secundario_id")
        .eq("id", schedule.ministry.id)
        .single();
      
      if (!ministry?.lider_principal_id) return;

      // Get leader profile and email
      const { data: leaderProfile } = await supabase
        .from("profiles")
        .select("nome")
        .eq("id", ministry.lider_principal_id)
        .single();

      const { data: userEmails } = await supabase.rpc('get_user_emails');
      const leaderEmail = userEmails?.find((u: { id: string; email: string }) => u.id === ministry.lider_principal_id)?.email;
      
      // Get volunteer name
      const { data: volunteerProfile } = await supabase
        .from("profiles")
        .select("nome")
        .eq("id", userId)
        .single();

      if (!leaderEmail || !volunteerProfile) return;

      await supabase.functions.invoke('notify-schedule-response', {
        body: {
          leaderEmail,
          leaderName: leaderProfile?.nome || 'Líder',
          volunteerName: volunteerProfile.nome,
          serviceName: schedule.service?.nome || 'Culto',
          serviceDate: schedule.service?.data_hora,
          positionName: schedule.position?.nome || 'Posição',
          ministryName: schedule.ministry?.nome || 'Ministério',
          status,
        },
      });

      console.log('Leader notification sent');
    } catch (error) {
      console.error('Error notifying leader:', error);
    }
  };

  const updateStatusMutation = useMutation({
    mutationFn: async ({ scheduleId, status, schedule }: { scheduleId: string; status: string; schedule: Schedule }) => {
      const { error } = await supabase
        .from("schedules")
        .update({ 
          status, 
          confirmed_at: status === "confirmed" ? new Date().toISOString() : null 
        })
        .eq("id", scheduleId);

      if (error) throw error;
      
      // Notify leader about the response
      await notifyLeader(schedule, status as "confirmed" | "declined");
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["volunteer-schedules"] });
      toast.success(
        variables.status === "confirmed" 
          ? "Presença confirmada!" 
          : "Presença recusada"
      );
    },
    onError: () => {
      toast.error("Erro ao atualizar status");
    },
  });

  const now = new Date();

  // Group schedules by date for calendar view
  const schedulesByDate = useMemo(() => {
    const map = new Map<string, Schedule[]>();
    schedules?.forEach((schedule) => {
      if (schedule.service?.data_hora) {
        const dateKey = format(new Date(schedule.service.data_hora), "yyyy-MM-dd");
        const existing = map.get(dateKey) || [];
        map.set(dateKey, [...existing, schedule]);
      }
    });
    return map;
  }, [schedules]);

  // Calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { locale: ptBR });
    const calendarEnd = endOfWeek(monthEnd, { locale: ptBR });
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  // Filtered schedules for list view
  const filteredSchedules = schedules?.filter((schedule) => {
    const serviceDate = new Date(schedule.service?.data_hora || "");
    return filter === "upcoming" ? serviceDate >= now : serviceDate < now;
  });

  // Schedules for selected date
  const selectedDateSchedules = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = format(selectedDate, "yyyy-MM-dd");
    return schedulesByDate.get(dateKey) || [];
  }, [selectedDate, schedulesByDate]);

  const pendingCount = schedules?.filter(s => s.status === "pending").length || 0;

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
      </div>
    );
  }

  if (!schedules || schedules.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Você ainda não está em nenhuma escala</p>
      </div>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "schedules" | "availability")} className="space-y-4">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="schedules" className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4" />
          Minhas Escalas
          {pendingCount > 0 && (
            <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-[10px]">
              {pendingCount}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="availability" className="flex items-center gap-2">
          <HandHeart className="w-4 h-4" />
          Disponibilidade
        </TabsTrigger>
      </TabsList>

      <TabsContent value="availability" className="mt-4">
        {churchId ? (
          <VolunteerAvailability userId={userId} churchId={churchId} />
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <p className="text-sm">Não foi possível carregar a disponibilidade</p>
          </div>
        )}
      </TabsContent>

      <TabsContent value="schedules" className="mt-4 space-y-4">
        {/* View Toggle */}
        <div className="flex gap-2">
          <Button
            variant={view === "calendar" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("calendar")}
            className="flex-1"
          >
            <CalendarDays className="w-4 h-4 mr-1" />
            Calendário
          </Button>
          <Button
            variant={view === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("list")}
            className="flex-1"
          >
            <List className="w-4 h-4 mr-1" />
            Lista
          </Button>
        </div>

      {view === "calendar" ? (
        <div className="space-y-4">
          {/* Month Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h3 className="text-sm font-medium text-foreground capitalize">
              {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Weekday Headers */}
            {["D", "S", "T", "Q", "Q", "S", "S"].map((day, i) => (
              <div key={i} className="text-center text-xs font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}

            {/* Days */}
            {calendarDays.map((day) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const daySchedules = schedulesByDate.get(dateKey) || [];
              const hasSchedules = daySchedules.length > 0;
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const hasPending = daySchedules.some(s => s.status === "pending");
              const hasConfirmed = daySchedules.some(s => s.status === "confirmed");
              const hasDeclined = daySchedules.every(s => s.status === "declined") && hasSchedules;

              return (
                <button
                  key={dateKey}
                  onClick={() => setSelectedDate(hasSchedules ? day : null)}
                  disabled={!hasSchedules}
                  className={cn(
                    "relative aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-all",
                    !isCurrentMonth && "text-muted-foreground/40",
                    isCurrentMonth && !hasSchedules && "text-muted-foreground",
                    hasSchedules && "cursor-pointer hover:bg-muted",
                    isSelected && "bg-primary text-primary-foreground hover:bg-primary",
                    isToday(day) && !isSelected && "ring-1 ring-primary",
                    !hasSchedules && "cursor-default"
                  )}
                >
                  <span>{format(day, "d")}</span>
                  {hasSchedules && (
                    <div className="flex gap-0.5 mt-0.5">
                      {hasPending && (
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      )}
                      {hasConfirmed && (
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      )}
                      {hasDeclined && !hasPending && !hasConfirmed && (
                        <div className="w-1.5 h-1.5 rounded-full bg-destructive" />
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Pendente</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>Confirmado</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-destructive" />
              <span>Recusado</span>
            </div>
          </div>

          {/* Selected Date Details */}
          {selectedDate && selectedDateSchedules.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-border">
              <h4 className="text-sm font-medium text-foreground">
                {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
              </h4>
              {selectedDateSchedules.map((schedule) => (
                <ScheduleCard
                  key={schedule.id}
                  schedule={schedule}
                  now={now}
                  onConfirm={() => updateStatusMutation.mutate({ scheduleId: schedule.id, status: "confirmed", schedule })}
                  onDecline={() => updateStatusMutation.mutate({ scheduleId: schedule.id, status: "declined", schedule })}
                  isUpdating={updateStatusMutation.isPending}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* List View Tabs */}
          <div className="flex gap-2">
            <Button
              variant={filter === "upcoming" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setFilter("upcoming")}
              className="flex-1"
            >
              Próximas
            </Button>
            <Button
              variant={filter === "past" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setFilter("past")}
              className="flex-1"
            >
              Anteriores
            </Button>
          </div>

          {/* Schedules List */}
          <div className="space-y-3">
            {filteredSchedules?.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground text-sm">
                {filter === "upcoming" 
                  ? "Nenhuma escala próxima" 
                  : "Nenhuma escala anterior"}
              </div>
            ) : (
              filteredSchedules?.map((schedule) => (
                <ScheduleCard
                  key={schedule.id}
                  schedule={schedule}
                  now={now}
                  showDate
                  onConfirm={() => updateStatusMutation.mutate({ scheduleId: schedule.id, status: "confirmed", schedule })}
                  onDecline={() => updateStatusMutation.mutate({ scheduleId: schedule.id, status: "declined", schedule })}
                  isUpdating={updateStatusMutation.isPending}
                />
              ))
            )}
          </div>
        </>
      )}
      </TabsContent>
    </Tabs>
  );
}

interface ScheduleCardProps {
  schedule: Schedule;
  now: Date;
  showDate?: boolean;
  onConfirm: () => void;
  onDecline: () => void;
  isUpdating: boolean;
}

function ScheduleCard({ schedule, now, showDate, onConfirm, onDecline, isUpdating }: ScheduleCardProps) {
  const service = schedule.service;
  const position = schedule.position;
  const ministry = schedule.ministry;
  const serviceDate = service ? new Date(service.data_hora) : null;
  const isPast = serviceDate ? serviceDate < now : false;
  const isPending = schedule.status === "pending" && !isPast;

  return (
    <div
      className={cn(
        "p-4 rounded-lg border transition-all",
        isPending && "border-amber-500/50 bg-amber-500/5",
        schedule.status === "confirmed" && "border-green-500/30 bg-green-500/5",
        schedule.status === "declined" && "border-destructive/30 bg-destructive/5 opacity-60",
        !isPending && schedule.status === "pending" && "border-border bg-card"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {service?.is_special_event && (
              <Badge variant="secondary" className="text-[10px]">
                Especial
              </Badge>
            )}
            <h4 className="font-medium text-foreground truncate">
              {service?.nome || "Culto"}
            </h4>
          </div>
          {serviceDate && showDate && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {format(serviceDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
              </span>
            </div>
          )}
          {serviceDate && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span>{format(serviceDate, "HH:mm")}</span>
            </div>
          )}
        </div>
        <StatusBadge status={schedule.status} isPast={isPast} />
      </div>

      {/* Position & Ministry */}
      <div className="flex items-center gap-2 mb-3">
        {ministry && (
          <Badge 
            variant="outline" 
            className="text-xs"
            style={{ 
              borderColor: ministry.cor || undefined,
              color: ministry.cor || undefined 
            }}
          >
            <Users className="w-3 h-3 mr-1" />
            {ministry.nome}
          </Badge>
        )}
        {position && (
          <Badge variant="secondary" className="text-xs">
            {position.nome}
          </Badge>
        )}
      </div>

      {/* Actions for pending schedules */}
      {isPending && (
        <div className="flex gap-2 pt-2 border-t border-border/50">
          <Button
            size="sm"
            className="flex-1"
            onClick={onConfirm}
            disabled={isUpdating}
          >
            <Check className="w-4 h-4 mr-1" />
            Confirmar
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={onDecline}
            disabled={isUpdating}
          >
            <X className="w-4 h-4 mr-1" />
            Recusar
          </Button>
        </div>
      )}

      {/* Notes */}
      {schedule.notes && (
        <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border/50">
          {schedule.notes}
        </p>
      )}
    </div>
  );
}

function StatusBadge({ status, isPast }: { status: string; isPast: boolean }) {
  if (isPast && status === "pending") {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Não respondido
      </Badge>
    );
  }

  switch (status) {
    case "pending":
      return (
        <Badge variant="outline" className="border-amber-500 text-amber-500 bg-amber-500/10">
          Aguardando
        </Badge>
      );
    case "confirmed":
      return (
        <Badge variant="outline" className="border-green-500 text-green-500 bg-green-500/10">
          <Check className="w-3 h-3 mr-1" />
          Confirmado
        </Badge>
      );
    case "declined":
      return (
        <Badge variant="outline" className="border-destructive text-destructive bg-destructive/10">
          <X className="w-3 h-3 mr-1" />
          Recusado
        </Badge>
      );
    default:
      return null;
  }
}
