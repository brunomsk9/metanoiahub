import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserChurchId } from '@/hooks/useUserChurchId';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, Circle, ClipboardCheck, CalendarDays, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SearchableSelect } from '@/components/ui/searchable-select';

interface ChecklistItem {
  id: string;
  titulo: string;
  descricao: string | null;
  ordem: number;
}

interface ChecklistResponse {
  id: string;
  item_id: string;
  completed: boolean;
  completed_by: string | null;
  completed_at: string | null;
}

interface Service {
  id: string;
  nome: string;
  data_hora: string;
  status: string;
}

export function ServiceChecklist() {
  const { churchId, loading: churchLoading } = useUserChurchId();
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [responses, setResponses] = useState<ChecklistResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOficiais, setIsOficiais] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    checkAccess();
  }, []);

  useEffect(() => {
    if (churchId) {
      fetchServices();
      fetchChecklistItems();
    }
  }, [churchId]);

  useEffect(() => {
    if (selectedServiceId) {
      fetchResponses();
    }
  }, [selectedServiceId]);

  const checkAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    // Check if user is in Oficiais ministry
    const { data: volunteerData } = await supabase
      .from('ministry_volunteers')
      .select('ministry_id, ministries!inner(nome, is_active)')
      .eq('user_id', user.id);

    const inOficiais = volunteerData?.some((v: any) =>
      v.ministries?.nome?.toLowerCase().includes('oficiais') && v.ministries?.is_active
    ) || false;
    setIsOficiais(inOficiais);

    // Also check admin/lider roles
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const userRoles = roles?.map(r => r.role) || [];
    if (userRoles.includes('admin') || userRoles.includes('lider_ministerial')) {
      setIsOficiais(true);
    }
  };

  const fetchServices = async () => {
    if (!churchId) return;
    const now = new Date();
    const pastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const futureWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from('services')
      .select('id, nome, data_hora, status')
      .eq('church_id', churchId)
      .gte('data_hora', pastWeek.toISOString())
      .lte('data_hora', futureWeek.toISOString())
      .order('data_hora', { ascending: true });

    if (error) {
      console.error('Error fetching services:', error);
    } else {
      setServices(data || []);
      // Auto-select the next upcoming service
      const upcoming = data?.find(s => new Date(s.data_hora) >= now);
      if (upcoming) setSelectedServiceId(upcoming.id);
      else if (data && data.length > 0) setSelectedServiceId(data[data.length - 1].id);
    }
    setLoading(false);
  };

  const fetchChecklistItems = async () => {
    const { data, error } = await supabase
      .from('service_checklist_items')
      .select('id, titulo, descricao, ordem')
      .eq('ativo', true)
      .order('ordem');

    if (error) console.error('Error fetching checklist items:', error);
    else setChecklistItems(data || []);
  };

  const fetchResponses = async () => {
    if (!selectedServiceId) return;
    const { data, error } = await supabase
      .from('service_checklist_responses')
      .select('id, item_id, completed, completed_by, completed_at')
      .eq('service_id', selectedServiceId);

    if (error) console.error('Error fetching responses:', error);
    else setResponses(data || []);
  };

  const toggleItem = async (itemId: string) => {
    if (!isOficiais) {
      toast.error('Apenas voluntários do ministério Oficiais podem preencher o checklist');
      return;
    }
    if (!selectedServiceId || !churchId || !userId) return;

    const existing = responses.find(r => r.item_id === itemId);
    const newCompleted = !existing?.completed;

    try {
      if (existing) {
        const { error } = await supabase
          .from('service_checklist_responses')
          .update({
            completed: newCompleted,
            completed_by: newCompleted ? userId : null,
            completed_at: newCompleted ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('service_checklist_responses')
          .insert({
            service_id: selectedServiceId,
            church_id: churchId,
            item_id: itemId,
            completed: true,
            completed_by: userId,
            completed_at: new Date().toISOString(),
          });
        if (error) throw error;
      }
      fetchResponses();
    } catch (error) {
      console.error('Error toggling item:', error);
      toast.error('Erro ao atualizar checklist');
    }
  };

  const selectedService = services.find(s => s.id === selectedServiceId);
  const completedCount = checklistItems.filter(item => responses.find(r => r.item_id === item.id && r.completed)).length;
  const progress = checklistItems.length > 0 ? (completedCount / checklistItems.length) * 100 : 0;

  if (loading || churchLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CalendarDays className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum culto encontrado para esta semana</p>
        </CardContent>
      </Card>
    );
  }

  if (checklistItems.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <ClipboardCheck className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum item de checklist cadastrado</p>
          <p className="text-sm text-muted-foreground mt-1">
            O administrador precisa configurar os itens do checklist do culto
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Service selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Selecione o Culto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SearchableSelect
            options={services.map(s => ({
              value: s.id,
              label: `${s.nome} - ${format(new Date(s.data_hora), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
            }))}
            value={selectedServiceId}
            onValueChange={setSelectedServiceId}
            placeholder="Selecione um culto"
            searchPlaceholder="Buscar culto..."
          />
        </CardContent>
      </Card>

      {/* Checklist */}
      {selectedService && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5 text-primary" />
                  Checklist Pré-Culto
                </CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <Clock className="h-3 w-3" />
                  {format(new Date(selectedService.data_hora), "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                </CardDescription>
              </div>
              <Badge variant={completedCount === checklistItems.length ? 'default' : 'secondary'}>
                {completedCount}/{checklistItems.length}
              </Badge>
            </div>
            {/* Progress bar */}
            <div className="relative h-2 bg-muted rounded-full overflow-hidden mt-3">
              <div
                className="absolute left-0 top-0 h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {!isOficiais && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground mb-4">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>Somente voluntários do ministério Oficiais podem marcar os itens</span>
              </div>
            )}

            {checklistItems.map((item) => {
              const response = responses.find(r => r.item_id === item.id);
              const isCompleted = response?.completed || false;

              return (
                <button
                  key={item.id}
                  onClick={() => toggleItem(item.id)}
                  disabled={!isOficiais}
                  className={cn(
                    "w-full text-left flex items-center gap-3 p-3 rounded-lg border transition-all duration-200",
                    isCompleted
                      ? "bg-primary/5 border-primary/20"
                      : "bg-card border-border hover:border-primary/30",
                    !isOficiais && "cursor-default opacity-70"
                  )}
                >
                  <div className={cn(
                    "flex items-center justify-center w-6 h-6 rounded-full border-2 transition-all duration-200 shrink-0",
                    isCompleted
                      ? "bg-primary border-primary"
                      : "border-border"
                  )}>
                    {isCompleted ? (
                      <Check className="w-4 h-4 text-primary-foreground" />
                    ) : (
                      <Circle className="w-3 h-3 text-muted-foreground/30" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={cn(
                      "text-sm font-medium transition-colors",
                      isCompleted ? "text-muted-foreground line-through" : "text-foreground"
                    )}>
                      {item.titulo}
                    </span>
                    {item.descricao && (
                      <p className="text-xs text-muted-foreground mt-0.5">{item.descricao}</p>
                    )}
                  </div>
                </button>
              );
            })}

            {completedCount === checklistItems.length && checklistItems.length > 0 && (
              <div className="flex items-center justify-center gap-2 p-4 bg-primary/10 rounded-lg border border-primary/30 mt-4">
                <span className="text-2xl">✅</span>
                <span className="text-primary font-medium">Tudo pronto para o culto!</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
