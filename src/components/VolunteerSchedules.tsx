import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, MapPin, Check, X, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface VolunteerSchedulesProps {
  userId: string;
}

export function VolunteerSchedules({ userId }: VolunteerSchedulesProps) {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"upcoming" | "past">("upcoming");

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
      return data;
    },
    enabled: !!userId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ scheduleId, status }: { scheduleId: string; status: string }) => {
      const { error } = await supabase
        .from("schedules")
        .update({ 
          status, 
          confirmed_at: status === "confirmed" ? new Date().toISOString() : null 
        })
        .eq("id", scheduleId);

      if (error) throw error;
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
  const filteredSchedules = schedules?.filter((schedule) => {
    const serviceDate = new Date(schedule.service?.data_hora || "");
    return filter === "upcoming" ? serviceDate >= now : serviceDate < now;
  });

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
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          variant={filter === "upcoming" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("upcoming")}
          className="flex-1"
        >
          Próximas
          {pendingCount > 0 && filter !== "upcoming" && (
            <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
              {pendingCount}
            </Badge>
          )}
        </Button>
        <Button
          variant={filter === "past" ? "default" : "outline"}
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
          filteredSchedules?.map((schedule) => {
            const service = schedule.service;
            const position = schedule.position;
            const ministry = schedule.ministry;
            const serviceDate = service ? new Date(service.data_hora) : null;
            const isPast = serviceDate ? serviceDate < now : false;
            const isPending = schedule.status === "pending" && !isPast;

            return (
              <div
                key={schedule.id}
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
                    {serviceDate && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          {format(serviceDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
                        </span>
                        <Clock className="w-3.5 h-3.5 ml-1" />
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
                      onClick={() => updateStatusMutation.mutate({ 
                        scheduleId: schedule.id, 
                        status: "confirmed" 
                      })}
                      disabled={updateStatusMutation.isPending}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Confirmar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => updateStatusMutation.mutate({ 
                        scheduleId: schedule.id, 
                        status: "declined" 
                      })}
                      disabled={updateStatusMutation.isPending}
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
          })
        )}
      </div>
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
