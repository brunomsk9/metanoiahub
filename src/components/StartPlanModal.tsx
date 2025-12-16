import { useState } from "react";
import { Bell, BellOff, Calendar, Clock, BookOpen, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Plan {
  id: string;
  titulo: string;
  descricao: string | null;
  duracao_dias: number;
  cover_image: string | null;
}

interface StartPlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: Plan | null;
  onPlanStarted: () => void;
}

const REMINDER_TIMES = [
  { value: "06:00", label: "6:00" },
  { value: "07:00", label: "7:00" },
  { value: "08:00", label: "8:00" },
  { value: "09:00", label: "9:00" },
  { value: "12:00", label: "12:00" },
  { value: "18:00", label: "18:00" },
  { value: "20:00", label: "20:00" },
  { value: "21:00", label: "21:00" },
];

export function StartPlanModal({ open, onOpenChange, plan, onPlanStarted }: StartPlanModalProps) {
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState("08:00");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleStartPlan = async () => {
    if (!plan) return;
    
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setLoading(false);
      return;
    }

    // Check if user already has progress for this plan
    const { data: existingProgress } = await supabase
      .from('user_reading_progress')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('plan_id', plan.id)
      .maybeSingle();

    if (existingProgress) {
      // Update existing progress with reminder settings
      await supabase
        .from('user_reading_progress')
        .update({
          reminder_enabled: reminderEnabled,
          reminder_time: reminderTime + ':00'
        })
        .eq('id', existingProgress.id);
    } else {
      // Create new progress record
      await supabase
        .from('user_reading_progress')
        .insert({
          user_id: session.user.id,
          plan_id: plan.id,
          current_day: 1,
          completed_days: [],
          reminder_enabled: reminderEnabled,
          reminder_time: reminderTime + ':00'
        });
    }

    // Request notification permission if reminders enabled
    if (reminderEnabled && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toast({
          title: "Plano iniciado!",
          description: `Você receberá lembretes às ${reminderTime}.`,
        });
      } else {
        toast({
          title: "Plano iniciado!",
          description: "Lembretes não puderam ser ativados. Verifique as permissões do navegador.",
        });
      }
    } else {
      toast({
        title: "Plano iniciado!",
        description: `Comece sua jornada de ${plan.duracao_dias} dias.`,
      });
    }

    setLoading(false);
    onOpenChange(false);
    onPlanStarted();
  };

  if (!plan) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Iniciar Plano de Leitura
          </DialogTitle>
          <DialogDescription>
            Configure suas preferências para o plano
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Plan Preview */}
          <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
            <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
              <img
                src={plan.cover_image || "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=200"}
                alt={plan.titulo}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-foreground">{plan.titulo}</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <Calendar className="w-3 h-3" />
                {plan.duracao_dias} dias
              </p>
            </div>
          </div>

          {/* Reminder Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium flex items-center gap-2">
                  {reminderEnabled ? (
                    <Bell className="w-4 h-4 text-primary" />
                  ) : (
                    <BellOff className="w-4 h-4 text-muted-foreground" />
                  )}
                  Lembrete diário
                </Label>
                <p className="text-xs text-muted-foreground">
                  Receba uma notificação para ler
                </p>
              </div>
              <Switch
                checked={reminderEnabled}
                onCheckedChange={setReminderEnabled}
              />
            </div>

            {reminderEnabled && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  Horário do lembrete
                </Label>
                <Select value={reminderTime} onValueChange={setReminderTime}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o horário" />
                  </SelectTrigger>
                  <SelectContent>
                    {REMINDER_TIMES.map((time) => (
                      <SelectItem key={time.value} value={time.value}>
                        {time.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleStartPlan}
            disabled={loading}
            className="flex-1"
          >
            {loading ? "Iniciando..." : "Iniciar Plano"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}