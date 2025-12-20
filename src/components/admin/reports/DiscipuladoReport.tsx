import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell } from "recharts";
import { Heart, CheckCircle2, Users, TrendingUp } from "lucide-react";

interface StageStats {
  name: string;
  completed: number;
  total: number;
  percentage: number;
  fill: string;
}

interface DiscipuladoStats {
  totalActive: number;
  totalCompleted: number;
  avgDuration: number;
  stages: StageStats[];
}

export function DiscipuladoReport() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DiscipuladoStats | null>(null);
  const [monthlyProgress, setMonthlyProgress] = useState<{ month: string; novos: number; concluidos: number }[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('church_id')
        .eq('id', session.user.id)
        .single();

      const churchId = profile?.church_id;

      // Fetch relationships
      const { data: relationships } = await supabase
        .from('discipleship_relationships')
        .select('*')
        .eq('church_id', churchId);

      const rels = relationships || [];
      const activeRels = rels.filter(r => r.status === 'active');
      const completedRels = rels.filter(r => r.status === 'completed');

      // Calculate stage progress
      const stages: StageStats[] = [
        {
          name: 'Conexão Inicial 1',
          completed: activeRels.filter(r => r.conexao_inicial_1).length,
          total: activeRels.length,
          percentage: activeRels.length > 0 ? Math.round((activeRels.filter(r => r.conexao_inicial_1).length / activeRels.length) * 100) : 0,
          fill: 'hsl(var(--chart-1))'
        },
        {
          name: 'Conexão Inicial 2',
          completed: activeRels.filter(r => r.conexao_inicial_2).length,
          total: activeRels.length,
          percentage: activeRels.length > 0 ? Math.round((activeRels.filter(r => r.conexao_inicial_2).length / activeRels.length) * 100) : 0,
          fill: 'hsl(var(--chart-2))'
        },
        {
          name: 'Alicerce Presencial',
          completed: activeRels.filter(r => r.alicerce_completed_presencial).length,
          total: activeRels.length,
          percentage: activeRels.length > 0 ? Math.round((activeRels.filter(r => r.alicerce_completed_presencial).length / activeRels.length) * 100) : 0,
          fill: 'hsl(var(--chart-3))'
        },
        {
          name: 'Academia Nível 1',
          completed: activeRels.filter(r => r.academia_nivel_1).length,
          total: activeRels.length,
          percentage: activeRels.length > 0 ? Math.round((activeRels.filter(r => r.academia_nivel_1).length / activeRels.length) * 100) : 0,
          fill: 'hsl(var(--chart-4))'
        },
        {
          name: 'Academia Nível 2',
          completed: activeRels.filter(r => r.academia_nivel_2).length,
          total: activeRels.length,
          percentage: activeRels.length > 0 ? Math.round((activeRels.filter(r => r.academia_nivel_2).length / activeRels.length) * 100) : 0,
          fill: 'hsl(var(--chart-5))'
        },
        {
          name: 'Academia Nível 3',
          completed: activeRels.filter(r => r.academia_nivel_3).length,
          total: activeRels.length,
          percentage: activeRels.length > 0 ? Math.round((activeRels.filter(r => r.academia_nivel_3).length / activeRels.length) * 100) : 0,
          fill: 'hsl(var(--primary))'
        },
        {
          name: 'Academia Nível 4',
          completed: activeRels.filter(r => r.academia_nivel_4).length,
          total: activeRels.length,
          percentage: activeRels.length > 0 ? Math.round((activeRels.filter(r => r.academia_nivel_4).length / activeRels.length) * 100) : 0,
          fill: 'hsl(var(--chart-1))'
        }
      ];

      // Calculate average duration for completed relationships
      let avgDuration = 0;
      if (completedRels.length > 0) {
        const durations = completedRels
          .filter(r => r.completed_at && r.started_at)
          .map(r => {
            const start = new Date(r.started_at);
            const end = new Date(r.completed_at!);
            return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
          });
        
        if (durations.length > 0) {
          avgDuration = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
        }
      }

      setStats({
        totalActive: activeRels.length,
        totalCompleted: completedRels.length,
        avgDuration,
        stages
      });

      // Monthly progress (last 6 months)
      const now = new Date();
      const monthly: { month: string; novos: number; concluidos: number }[] = [];
      
      for (let i = 5; i >= 0; i--) {
        const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        const monthName = startDate.toLocaleDateString('pt-BR', { month: 'short' });

        const novos = rels.filter(r => {
          const created = new Date(r.created_at);
          return created >= startDate && created <= endDate;
        }).length;

        const concluidos = completedRels.filter(r => {
          if (!r.completed_at) return false;
          const completed = new Date(r.completed_at);
          return completed >= startDate && completed <= endDate;
        }).length;

        monthly.push({ month: monthName, novos, concluidos });
      }

      setMonthlyProgress(monthly);
    } catch (error) {
      console.error('Error fetching discipleship stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const chartConfig = {
    novos: { label: "Novos", color: "hsl(var(--primary))" },
    concluidos: { label: "Concluídos", color: "hsl(var(--chart-2))" }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Discipulados Ativos</CardTitle>
            <Heart className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalActive || 0}</div>
            <p className="text-xs text-muted-foreground">relacionamentos em andamento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Discipulados Concluídos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCompleted || 0}</div>
            <p className="text-xs text-muted-foreground">jornadas completas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Duração Média</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.avgDuration || 0} dias</div>
            <p className="text-xs text-muted-foreground">para conclusão</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats && (stats.totalActive + stats.totalCompleted) > 0
                ? Math.round((stats.totalCompleted / (stats.totalActive + stats.totalCompleted)) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">discipulados finalizados</p>
          </CardContent>
        </Card>
      </div>

      {/* Stage Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Progresso por Etapa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats?.stages.map((stage, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{stage.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {stage.completed}/{stage.total}
                    </span>
                    <Badge variant={stage.percentage > 50 ? "default" : "secondary"}>
                      {stage.percentage}%
                    </Badge>
                  </div>
                </div>
                <Progress value={stage.percentage} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stage Distribution Chart */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Etapa</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <BarChart data={stats?.stages || []} layout="vertical">
                <XAxis type="number" />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={120}
                  tick={{ fontSize: 11 }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="completed" radius={4}>
                  {stats?.stages.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Evolução Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <BarChart data={monthlyProgress}>
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="novos" fill="hsl(var(--primary))" radius={4} />
                <Bar dataKey="concluidos" fill="hsl(var(--chart-2))" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
