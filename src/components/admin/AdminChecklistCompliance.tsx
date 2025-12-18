import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle, AlertCircle, TrendingUp, Users } from 'lucide-react';
import { toast } from 'sonner';
import { startOfWeek, subWeeks, format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Progress } from '@/components/ui/progress';

interface ChecklistItem {
  id: string;
  titulo: string;
}

interface Discipulador {
  id: string;
  nome: string;
}

interface WeeklyResponse {
  id: string;
  discipulador_id: string;
  week_start: string;
  responses: Record<string, boolean>;
}

interface ComplianceData {
  discipulador: Discipulador;
  weeklyResponses: Record<string, WeeklyResponse | null>;
  completionRate: number;
}

export function AdminChecklistCompliance() {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [complianceData, setComplianceData] = useState<ComplianceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [weeksToShow, setWeeksToShow] = useState(4);

  // Generate week dates for the last N weeks
  const getWeekDates = () => {
    const weeks: string[] = [];
    for (let i = 0; i < weeksToShow; i++) {
      const weekStart = startOfWeek(subWeeks(new Date(), i), { weekStartsOn: 1 });
      weeks.push(format(weekStart, 'yyyy-MM-dd'));
    }
    return weeks;
  };

  const weekDates = getWeekDates();

  useEffect(() => {
    fetchData();
  }, [weeksToShow]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch active checklist items
      const { data: itemsData, error: itemsError } = await supabase
        .from('weekly_checklist_items')
        .select('id, titulo')
        .eq('ativo', true)
        .order('ordem');

      if (itemsError) throw itemsError;
      setItems(itemsData || []);

      // Fetch all discipuladores
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'discipulador');

      if (rolesError) throw rolesError;

      const discipuladorIds = rolesData?.map(r => r.user_id) || [];

      if (discipuladorIds.length === 0) {
        setComplianceData([]);
        setLoading(false);
        return;
      }

      // Fetch profiles for discipuladores
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, nome')
        .in('id', discipuladorIds);

      if (profilesError) throw profilesError;

      // Fetch all responses for the selected weeks
      const oldestWeek = weekDates[weekDates.length - 1];
      const { data: responsesData, error: responsesError } = await supabase
        .from('weekly_checklist_responses')
        .select('*')
        .in('discipulador_id', discipuladorIds)
        .gte('week_start', oldestWeek)
        .order('week_start', { ascending: false });

      if (responsesError) throw responsesError;

      // Build compliance data
      const compliance: ComplianceData[] = (profilesData || []).map(profile => {
        const discipuladorResponses = (responsesData || []).filter(
          r => r.discipulador_id === profile.id
        );

        const weeklyResponses: Record<string, WeeklyResponse | null> = {};
        let totalCompleted = 0;
        let totalPossible = 0;

        weekDates.forEach(weekDate => {
          const response = discipuladorResponses.find(r => r.week_start === weekDate);
          weeklyResponses[weekDate] = response ? {
            ...response,
            responses: response.responses as Record<string, boolean>
          } : null;

          if (response) {
            const responseObj = response.responses as Record<string, boolean>;
            const completedItems = (itemsData || []).filter(item => responseObj[item.id]).length;
            totalCompleted += completedItems;
          }
          totalPossible += (itemsData || []).length;
        });

        const completionRate = totalPossible > 0 ? (totalCompleted / totalPossible) * 100 : 0;

        return {
          discipulador: { id: profile.id, nome: profile.nome },
          weeklyResponses,
          completionRate
        };
      });

      // Sort by completion rate descending
      compliance.sort((a, b) => b.completionRate - a.completionRate);
      setComplianceData(compliance);
    } catch (error) {
      console.error('Error fetching compliance data:', error);
      toast.error('Erro ao carregar dados de compliance');
    } finally {
      setLoading(false);
    }
  };

  const getWeekLabel = (weekDate: string) => {
    const date = parseISO(weekDate);
    return format(date, "dd/MM", { locale: ptBR });
  };

  const getCompletionStatus = (response: WeeklyResponse | null, itemsCount: number) => {
    if (!response) {
      return { status: 'missing', count: 0, icon: XCircle, color: 'text-destructive' };
    }
    const completedCount = items.filter(item => response.responses[item.id]).length;
    if (completedCount === itemsCount) {
      return { status: 'complete', count: completedCount, icon: CheckCircle2, color: 'text-primary' };
    }
    if (completedCount > 0) {
      return { status: 'partial', count: completedCount, icon: AlertCircle, color: 'text-amber-500' };
    }
    return { status: 'empty', count: 0, icon: XCircle, color: 'text-destructive' };
  };

  // Calculate overall stats
  const totalDiscipuladores = complianceData.length;
  const avgCompletionRate = totalDiscipuladores > 0
    ? complianceData.reduce((sum, d) => sum + d.completionRate, 0) / totalDiscipuladores
    : 0;
  const currentWeek = weekDates[0];
  const currentWeekCompliance = complianceData.filter(
    d => d.weeklyResponses[currentWeek] !== null
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Relatório de Compliance</h2>
          <p className="text-sm text-muted-foreground">
            Acompanhe o preenchimento do checklist semanal por discipulador
          </p>
        </div>
        <Select value={weeksToShow.toString()} onValueChange={(v) => setWeeksToShow(parseInt(v))}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="4">Últimas 4 semanas</SelectItem>
            <SelectItem value="8">Últimas 8 semanas</SelectItem>
            <SelectItem value="12">Últimas 12 semanas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalDiscipuladores}</p>
                <p className="text-sm text-muted-foreground">Discipuladores</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{avgCompletionRate.toFixed(0)}%</p>
                <p className="text-sm text-muted-foreground">Taxa Média</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{currentWeekCompliance}/{totalDiscipuladores}</p>
                <p className="text-sm text-muted-foreground">Preencheram esta semana</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {complianceData.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>Nenhum discipulador encontrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[180px]">Discipulador</TableHead>
                <TableHead className="w-32">Taxa</TableHead>
                {weekDates.map(weekDate => (
                  <TableHead key={weekDate} className="text-center w-20">
                    {getWeekLabel(weekDate)}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {complianceData.map((data) => (
                <TableRow key={data.discipulador.id}>
                  <TableCell className="font-medium">{data.discipulador.nome}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={data.completionRate} className="w-16 h-2" />
                      <span className="text-sm text-muted-foreground">
                        {data.completionRate.toFixed(0)}%
                      </span>
                    </div>
                  </TableCell>
                  {weekDates.map(weekDate => {
                    const response = data.weeklyResponses[weekDate];
                    const { status, count, icon: Icon, color } = getCompletionStatus(response, items.length);
                    
                    return (
                      <TableCell key={weekDate} className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Icon className={`h-4 w-4 ${color}`} />
                          {status !== 'missing' && (
                            <span className={`text-xs ${color}`}>
                              {count}/{items.length}
                            </span>
                          )}
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <span>Completo</span>
        </div>
        <div className="flex items-center gap-1">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <span>Parcial</span>
        </div>
        <div className="flex items-center gap-1">
          <XCircle className="h-4 w-4 text-destructive" />
          <span>Não preenchido</span>
        </div>
      </div>
    </div>
  );
}
