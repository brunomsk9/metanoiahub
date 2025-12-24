import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Check, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface VolunteerAvailabilityProps {
  userId: string;
  churchId: string;
}

type Service = {
  id: string;
  nome: string;
  data_hora: string;
  descricao: string | null;
  is_special_event: boolean;
};

type Availability = {
  id: string;
  service_id: string;
  is_available: boolean;
  notes: string | null;
};

export function VolunteerAvailability({ userId, churchId }: VolunteerAvailabilityProps) {
  const queryClient = useQueryClient();
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);

  // Fetch upcoming services
  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ["upcoming-services", churchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("id, nome, data_hora, descricao, is_special_event")
        .eq("church_id", churchId)
        .gte("data_hora", new Date().toISOString())
        .order("data_hora", { ascending: true })
        .limit(20);

      if (error) throw error;
      return data as Service[];
    },
    enabled: !!churchId,
  });

  // Fetch user's availability
  const { data: availability, isLoading: availabilityLoading } = useQuery({
    queryKey: ["volunteer-availability", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("volunteer_availability")
        .select("id, service_id, is_available, notes")
        .eq("volunteer_id", userId);

      if (error) throw error;
      return data as Availability[];
    },
    enabled: !!userId,
  });

  // Create availability map
  const availabilityMap = useMemo(() => {
    const map = new Map<string, Availability>();
    availability?.forEach((a) => map.set(a.service_id, a));
    return map;
  }, [availability]);

  const upsertAvailabilityMutation = useMutation({
    mutationFn: async ({ 
      serviceId, 
      isAvailable, 
      notes 
    }: { 
      serviceId: string; 
      isAvailable: boolean; 
      notes: string;
    }) => {
      const existing = availabilityMap.get(serviceId);
      
      if (existing) {
        const { error } = await supabase
          .from("volunteer_availability")
          .update({ 
            is_available: isAvailable, 
            notes: notes || null 
          })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("volunteer_availability")
          .insert({
            volunteer_id: userId,
            service_id: serviceId,
            church_id: churchId,
            is_available: isAvailable,
            notes: notes || null,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["volunteer-availability"] });
      setDialogOpen(false);
      setSelectedService(null);
      setNotes("");
      toast.success(isAvailable ? "Disponibilidade confirmada!" : "Indisponibilidade registrada");
    },
    onError: () => {
      toast.error("Erro ao salvar disponibilidade");
    },
  });

  const openAvailabilityDialog = (service: Service, available: boolean) => {
    setSelectedService(service);
    setIsAvailable(available);
    const existing = availabilityMap.get(service.id);
    setNotes(existing?.notes || "");
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!selectedService) return;
    upsertAvailabilityMutation.mutate({
      serviceId: selectedService.id,
      isAvailable,
      notes,
    });
  };

  if (servicesLoading || availabilityLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-20 rounded-lg" />
      </div>
    );
  }

  if (!services || services.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Nenhum culto próximo encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground mb-4">
        Informe sua disponibilidade para os próximos cultos:
      </p>

      {services.map((service) => {
        const serviceDate = new Date(service.data_hora);
        const isPast = isBefore(serviceDate, startOfDay(new Date()));
        const existing = availabilityMap.get(service.id);

        return (
          <div
            key={service.id}
            className={cn(
              "p-4 rounded-lg border transition-all",
              existing?.is_available === true && "border-green-500/30 bg-green-500/5",
              existing?.is_available === false && "border-destructive/30 bg-destructive/5",
              !existing && "border-amber-500/30 bg-amber-500/5",
              isPast && "opacity-50"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {service.is_special_event && (
                    <Badge variant="secondary" className="text-[10px]">
                      Especial
                    </Badge>
                  )}
                  <h4 className="font-medium text-foreground truncate">
                    {service.nome}
                  </h4>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {format(serviceDate, "EEEE, d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>
                {existing?.notes && (
                  <p className="text-xs text-muted-foreground mt-1 italic">
                    "{existing.notes}"
                  </p>
                )}
              </div>

              {/* Status Badge */}
              {existing && (
                <Badge
                  variant="outline"
                  className={cn(
                    existing.is_available
                      ? "border-green-500 text-green-500 bg-green-500/10"
                      : "border-destructive text-destructive bg-destructive/10"
                  )}
                >
                  {existing.is_available ? (
                    <>
                      <Check className="w-3 h-3 mr-1" />
                      Disponível
                    </>
                  ) : (
                    <>
                      <X className="w-3 h-3 mr-1" />
                      Indisponível
                    </>
                  )}
                </Badge>
              )}
              {!existing && !isPast && (
                <Badge
                  variant="outline"
                  className="border-amber-500 text-amber-500 bg-amber-500/10"
                >
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Pendente
                </Badge>
              )}
            </div>

            {/* Actions */}
            {!isPast && (
              <div className="flex gap-2 mt-3 pt-3 border-t border-border/50">
                <Button
                  size="sm"
                  variant={existing?.is_available === true ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => openAvailabilityDialog(service, true)}
                >
                  <Check className="w-4 h-4 mr-1" />
                  Disponível
                </Button>
                <Button
                  size="sm"
                  variant={existing?.is_available === false ? "destructive" : "outline"}
                  className="flex-1"
                  onClick={() => openAvailabilityDialog(service, false)}
                >
                  <X className="w-4 h-4 mr-1" />
                  Indisponível
                </Button>
              </div>
            )}
          </div>
        );
      })}

      {/* Dialog for notes */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isAvailable ? "Confirmar Disponibilidade" : "Registrar Indisponibilidade"}
            </DialogTitle>
            <DialogDescription>
              {selectedService && (
                <>
                  {selectedService.nome} -{" "}
                  {format(new Date(selectedService.data_hora), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">
                Observações (opcional)
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  isAvailable
                    ? "Ex: Posso chegar um pouco mais tarde..."
                    : "Ex: Estarei viajando nesse dia..."
                }
                className="mt-1.5"
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={upsertAvailabilityMutation.isPending}
                className="flex-1"
                variant={isAvailable ? "default" : "destructive"}
              >
                {upsertAvailabilityMutation.isPending ? "Salvando..." : "Confirmar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
