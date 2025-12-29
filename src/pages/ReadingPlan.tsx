import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/PageTransition";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { DayProgressDots } from "@/components/ReadingPlanCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { AppShell } from "@/components/layout";

interface ReadingPlan {
  id: string;
  titulo: string;
  descricao: string | null;
  duracao_dias: number;
  cover_image: string | null;
}

interface PlanDay {
  id: string;
  dia: number;
  titulo: string;
  conteudo: string | null;
  versiculo_referencia: string | null;
}

interface UserProgress {
  current_day: number;
  completed_days: number[];
}

export default function ReadingPlan() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<ReadingPlan | null>(null);
  const [days, setDays] = useState<PlanDay[]>([]);
  const [progress, setProgress] = useState<UserProgress>({ current_day: 1, completed_days: [] });
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      setUserId(session.user.id);

      if (!id) return;

      // Fetch plan, days, and user progress in parallel
      const [planRes, daysRes, progressRes] = await Promise.all([
        supabase.from('reading_plans').select('*').eq('id', id).maybeSingle(),
        supabase.from('reading_plan_days').select('*').eq('plan_id', id).order('dia'),
        supabase.from('user_reading_progress').select('*').eq('plan_id', id).eq('user_id', session.user.id).maybeSingle()
      ]);

      if (planRes.data) {
        setPlan(planRes.data);
      }

      if (daysRes.data) {
        setDays(daysRes.data);
      }

      if (progressRes.data) {
        setProgress({
          current_day: progressRes.data.current_day,
          completed_days: progressRes.data.completed_days || []
        });
        setSelectedDay(progressRes.data.current_day);
      } else {
        // Create initial progress record
        await supabase.from('user_reading_progress').insert({
          user_id: session.user.id,
          plan_id: id,
          current_day: 1,
          completed_days: []
        });
      }

      setLoading(false);
    };

    fetchData();
  }, [id, navigate]);

  const handleCompleteDay = async () => {
    if (!userId || !id) return;

    const newCompletedDays = progress.completed_days.includes(selectedDay)
      ? progress.completed_days
      : [...progress.completed_days, selectedDay];
    
    const nextDay = Math.min(selectedDay + 1, plan?.duracao_dias || 1);
    const isFullyCompleted = newCompletedDays.length >= (plan?.duracao_dias || 0);

    const { error } = await supabase
      .from('user_reading_progress')
      .update({
        completed_days: newCompletedDays,
        current_day: nextDay,
        completed_at: isFullyCompleted ? new Date().toISOString() : null
      })
      .eq('user_id', userId)
      .eq('plan_id', id);

    if (!error) {
      setProgress({ current_day: nextDay, completed_days: newCompletedDays });
      toast({
        title: "Dia completo!",
        description: isFullyCompleted ? "Parabéns! Você completou o plano!" : `Dia ${selectedDay} marcado como lido.`,
      });
      if (!isFullyCompleted) {
        setSelectedDay(nextDay);
      }
    }
  };

  const currentDayContent = days.find(d => d.dia === selectedDay);
  const isDayCompleted = progress.completed_days.includes(selectedDay);

  if (loading) {
    return (
      <AppShell headerTitle="Plano de Leitura" showBack hideNavigation>
        <div className="space-y-4">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-32" />
        </div>
      </AppShell>
    );
  }

  if (!plan) {
    return (
      <AppShell headerTitle="Plano de Leitura" showBack hideNavigation>
        <div className="flex flex-col items-center justify-center py-20">
          <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Plano não encontrado</p>
          <Button variant="outline" onClick={() => navigate(-1)} className="mt-4">
            Voltar
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell headerTitle={plan.titulo} showBack hideNavigation>
      <PageTransition>
        <div className="max-w-2xl mx-auto -mx-4 lg:mx-auto">
          {/* Breadcrumb */}
          <div className="px-4 pt-2 lg:px-0">
            <PageBreadcrumb 
              items={[
                { label: 'Planos de Leitura', href: '/dashboard' },
                { label: plan.titulo }
              ]} 
            />
          </div>

          {/* Header with cover */}
          <div className="relative mt-4">
            <div className="h-48 overflow-hidden rounded-b-2xl lg:rounded-2xl">
              <img
                src={plan.cover_image || "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=800&auto=format&fit=crop"}
                alt={plan.titulo}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
            </div>
          </div>

          {/* Content */}
          <div className="px-4 pb-8 -mt-12 relative z-10">
            <h1 className="text-2xl font-display font-bold text-foreground mb-2">{plan.titulo}</h1>
            {plan.descricao && (
              <p className="text-muted-foreground text-sm mb-6">{plan.descricao}</p>
            )}

            {/* Day selector dots */}
            <div className="bg-card rounded-2xl border border-border p-4 mb-6">
              <p className="text-sm text-muted-foreground text-center mb-3">Selecione um dia</p>
              <DayProgressDots
                totalDays={plan.duracao_dias}
                completedDays={progress.completed_days}
                currentDay={selectedDay}
                onDayClick={setSelectedDay}
              />
            </div>

            {/* Day content */}
            {currentDayContent ? (
              <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                    Dia {selectedDay}
                  </span>
                  {isDayCompleted && (
                    <span className="flex items-center gap-1 text-xs text-success">
                      <CheckCircle2 className="w-4 h-4" />
                      Completo
                    </span>
                  )}
                </div>
                
                <h2 className="text-xl font-display font-semibold text-foreground">
                  {currentDayContent.titulo}
                </h2>
                
                {currentDayContent.versiculo_referencia && (
                  <p className="text-sm font-medium text-primary">
                    {currentDayContent.versiculo_referencia}
                  </p>
                )}
                
                {currentDayContent.conteudo && (
                  <div className="prose prose-sm max-w-none">
                    <p className="text-muted-foreground leading-relaxed font-serif italic">
                      {currentDayContent.conteudo}
                    </p>
                  </div>
                )}

                {/* Complete day button */}
                <Button
                  onClick={handleCompleteDay}
                  disabled={isDayCompleted}
                  className="w-full mt-4"
                  variant={isDayCompleted ? "outline" : "default"}
                >
                  {isDayCompleted ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Dia Completo
                    </>
                  ) : (
                    "Marcar como Lido"
                  )}
                </Button>
              </div>
            ) : (
              <div className="bg-card rounded-2xl border border-border p-8 text-center">
                <BookOpen className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground">Conteúdo não disponível para este dia</p>
              </div>
            )}
          </div>
        </div>
      </PageTransition>
    </AppShell>
  );
}
