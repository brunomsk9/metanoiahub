import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Calendar, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { startOfWeek, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ChecklistItem {
  id: string;
  titulo: string;
  descricao: string | null;
  ordem: number;
}

interface WeeklyChecklistProps {
  userId: string;
}

export function WeeklyChecklist({ userId }: WeeklyChecklistProps) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [responses, setResponses] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [responseId, setResponseId] = useState<string | null>(null);

  // Get the start of the current week (Monday)
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekStartStr = format(weekStart, 'yyyy-MM-dd');
  const weekLabel = format(weekStart, "'Semana de' dd 'de' MMMM", { locale: ptBR });

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    try {
      // Fetch active checklist items
      const { data: itemsData, error: itemsError } = await supabase
        .from('weekly_checklist_items')
        .select('*')
        .eq('ativo', true)
        .order('ordem');

      if (itemsError) throw itemsError;
      setItems(itemsData || []);

      // Fetch this week's response
      const { data: responseData, error: responseError } = await supabase
        .from('weekly_checklist_responses')
        .select('*')
        .eq('discipulador_id', userId)
        .eq('week_start', weekStartStr)
        .maybeSingle();

      if (responseError) throw responseError;

      if (responseData) {
        setResponseId(responseData.id);
        setResponses(responseData.responses as Record<string, boolean> || {});
      } else {
        setResponses({});
        setResponseId(null);
      }
    } catch (error) {
      console.error('Error fetching checklist data:', error);
      toast.error('Erro ao carregar checklist');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (itemId: string, checked: boolean) => {
    const newResponses = { ...responses, [itemId]: checked };
    setResponses(newResponses);
    setSaving(true);

    try {
      if (responseId) {
        // Update existing response
        const { error } = await supabase
          .from('weekly_checklist_responses')
          .update({ responses: newResponses })
          .eq('id', responseId);

        if (error) throw error;
      } else {
        // Create new response
        const { data, error } = await supabase
          .from('weekly_checklist_responses')
          .insert({
            discipulador_id: userId,
            week_start: weekStartStr,
            responses: newResponses
          })
          .select()
          .single();

        if (error) throw error;
        setResponseId(data.id);
      }
    } catch (error) {
      console.error('Error saving response:', error);
      toast.error('Erro ao salvar resposta');
      // Revert on error
      setResponses(responses);
    } finally {
      setSaving(false);
    }
  };

  const completedCount = items.filter(item => responses[item.id]).length;
  const totalCount = items.length;
  const allCompleted = completedCount === totalCount && totalCount > 0;

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <Card className={`bg-card border-border transition-colors ${allCompleted ? 'border-primary/50 bg-primary/5' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-semibold">Checklist Semanal</CardTitle>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {allCompleted && <CheckCircle2 className="h-4 w-4 text-primary" />}
            <span className={`font-medium ${allCompleted ? 'text-primary' : 'text-muted-foreground'}`}>
              {completedCount}/{totalCount}
            </span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground capitalize">{weekLabel}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <label
            key={item.id}
            className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer
              ${responses[item.id] 
                ? 'border-primary/30 bg-primary/5' 
                : 'border-border hover:border-border/80 hover:bg-muted/30'
              }`}
          >
            <Checkbox
              checked={responses[item.id] || false}
              onCheckedChange={(checked) => handleToggle(item.id, checked as boolean)}
              disabled={saving}
              className="mt-0.5"
            />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${responses[item.id] ? 'text-primary' : 'text-foreground'}`}>
                {item.titulo}
              </p>
              {item.descricao && (
                <p className="text-xs text-muted-foreground mt-0.5">{item.descricao}</p>
              )}
            </div>
          </label>
        ))}
        {saving && (
          <p className="text-xs text-muted-foreground text-center">Salvando...</p>
        )}
      </CardContent>
    </Card>
  );
}
