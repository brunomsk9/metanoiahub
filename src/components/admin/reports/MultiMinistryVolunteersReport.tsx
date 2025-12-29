import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Filter, UserCheck, PieChart as PieChartIcon, BarChart3 } from "lucide-react";
import { useUserChurchId } from "@/hooks/useUserChurchId";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface MultiMinistryVolunteer {
  id: string;
  nome: string;
  telefone: string | null;
  genero: string | null;
  ministries: {
    id: string;
    nome: string;
    funcao: string | null;
  }[];
}

const COLORS = ['#8B5CF6', '#D946EF', '#F97316', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#6366F1'];

export function MultiMinistryVolunteersReport() {
  const { churchId } = useUserChurchId();
  const [minMinistries, setMinMinistries] = useState<string>("2");
  const [selectedMinistry, setSelectedMinistry] = useState<string>("all");

  // Fetch ministries
  const { data: ministries = [] } = useQuery({
    queryKey: ['ministries-multi', churchId],
    queryFn: async () => {
      if (!churchId) return [];
      const { data, error } = await supabase
        .from('ministries')
        .select('id, nome')
        .eq('church_id', churchId)
        .eq('is_active', true)
        .order('nome');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!churchId,
  });

  // Fetch volunteers with their ministries
  const { data: volunteers = [], isLoading } = useQuery({
    queryKey: ['volunteers-multi-ministry', churchId],
    queryFn: async () => {
      if (!churchId) return [];
      
      const { data: ministryVolunteers, error } = await supabase
        .from('ministry_volunteers')
        .select('user_id, funcao, ministry_id')
        .eq('church_id', churchId);
      
      if (error) throw error;
      
      const userIds = [...new Set(ministryVolunteers?.map(mv => mv.user_id) || [])];
      const ministryIds = [...new Set(ministryVolunteers?.map(mv => mv.ministry_id) || [])];
      
      if (userIds.length === 0) return [];
      
      const [profilesResult, ministriesResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, nome, telefone, genero')
          .in('id', userIds),
        supabase
          .from('ministries')
          .select('id, nome')
          .in('id', ministryIds),
      ]);
      
      if (profilesResult.error) throw profilesResult.error;
      if (ministriesResult.error) throw ministriesResult.error;
      
      const ministriesMap = new Map(ministriesResult.data?.map(m => [m.id, m]) || []);
      const volunteersMap = new Map<string, MultiMinistryVolunteer>();
      
      profilesResult.data?.forEach(profile => {
        volunteersMap.set(profile.id, {
          id: profile.id,
          nome: profile.nome,
          telefone: profile.telefone,
          genero: profile.genero,
          ministries: [],
        });
      });
      
      ministryVolunteers?.forEach(mv => {
        const volunteer = volunteersMap.get(mv.user_id);
        const ministry = ministriesMap.get(mv.ministry_id);
        if (volunteer && ministry) {
          volunteer.ministries.push({
            id: ministry.id,
            nome: ministry.nome,
            funcao: mv.funcao,
          });
        }
      });

      return Array.from(volunteersMap.values()).sort((a, b) => 
        b.ministries.length - a.ministries.length || a.nome.localeCompare(b.nome)
      );
    },
    enabled: !!churchId,
  });

  const filteredVolunteers = useMemo(() => {
    const minCount = parseInt(minMinistries);
    let filtered = volunteers.filter(v => v.ministries.length >= minCount);
    
    if (selectedMinistry !== "all") {
      filtered = filtered.filter(v => 
        v.ministries.some(m => m.id === selectedMinistry)
      );
    }
    
    return filtered;
  }, [volunteers, minMinistries, selectedMinistry]);

  // Distribution pie chart data
  const distributionData = useMemo(() => {
    const counts: Record<number, number> = {};
    volunteers.forEach(v => {
      const count = v.ministries.length;
      counts[count] = (counts[count] || 0) + 1;
    });
    
    return Object.entries(counts)
      .map(([count, qty]) => ({
        name: count === '1' ? '1 ministério' : `${count} ministérios`,
        value: qty,
        count: parseInt(count),
      }))
      .sort((a, b) => a.count - b.count);
  }, [volunteers]);

  // Volunteers per ministry bar chart data
  const volunteersPerMinistryData = useMemo(() => {
    const ministryCount: Record<string, number> = {};
    
    volunteers.forEach(v => {
      v.ministries.forEach(m => {
        ministryCount[m.nome] = (ministryCount[m.nome] || 0) + 1;
      });
    });
    
    return Object.entries(ministryCount)
      .map(([nome, count]) => ({ nome, voluntarios: count }))
      .sort((a, b) => b.voluntarios - a.voluntarios)
      .slice(0, 10);
  }, [volunteers]);

  const getFuncaoLabel = (funcao: string | null) => {
    switch (funcao) {
      case 'lider_principal': return 'Líder';
      case 'lider_secundario': return 'Co-líder';
      default: return 'Vol.';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[2, 3, 4, 5].map(count => (
          <Card key={count}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-primary">
                    {volunteers.filter(v => v.ministries.length >= count).length}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {count}+ ministérios
                  </p>
                </div>
                <UserCheck className="h-8 w-8 text-primary/20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PieChartIcon className="h-4 w-4" />
              Distribuição por Quantidade de Ministérios
            </CardTitle>
            <CardDescription>
              Total de voluntários: {volunteers.length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {distributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {distributionData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${value} voluntários`, 'Quantidade']}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-muted-foreground">
                Sem dados disponíveis
              </div>
            )}
          </CardContent>
        </Card>

        {/* Volunteers per Ministry Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4" />
              Voluntários Distintos por Ministério
            </CardTitle>
            <CardDescription>
              Top 10 ministérios com mais voluntários
            </CardDescription>
          </CardHeader>
          <CardContent>
            {volunteersPerMinistryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={volunteersPerMinistryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" />
                  <YAxis 
                    type="category" 
                    dataKey="nome" 
                    width={100}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`${value} voluntários`, 'Total']}
                  />
                  <Bar 
                    dataKey="voluntarios" 
                    fill="hsl(var(--primary))" 
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-muted-foreground">
                Sem dados disponíveis
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Voluntários em Múltiplos Ministérios
          </CardTitle>
          <CardDescription>
            Identifique voluntários que participam de mais de um ministério
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
              <Filter className="h-4 w-4 text-muted-foreground hidden sm:block" />
              
              <Select value={minMinistries} onValueChange={setMinMinistries}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Mínimo de ministérios" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2+ ministérios</SelectItem>
                  <SelectItem value="3">3+ ministérios</SelectItem>
                  <SelectItem value="4">4+ ministérios</SelectItem>
                  <SelectItem value="5">5+ ministérios</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedMinistry} onValueChange={setSelectedMinistry}>
                <SelectTrigger className="w-full sm:w-[220px]">
                  <SelectValue placeholder="Filtrar por ministério" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Ministérios</SelectItem>
                  {ministries.map(ministry => (
                    <SelectItem key={ministry.id} value={ministry.id}>
                      {ministry.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Badge variant="secondary" className="gap-1">
              <Users className="h-3 w-3" />
              {filteredVolunteers.length} voluntários
            </Badge>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando voluntários...
            </div>
          ) : filteredVolunteers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum voluntário encontrado com {minMinistries}+ ministérios
            </div>
          ) : (
            <div className="border rounded-lg overflow-x-auto">
              <Table className="min-w-[500px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead className="text-center w-20">Qtd</TableHead>
                    <TableHead>Ministérios</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVolunteers.map(volunteer => (
                    <TableRow key={volunteer.id}>
                      <TableCell className="font-medium">{volunteer.nome}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="default" className="text-xs">
                          {volunteer.ministries.length}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {volunteer.ministries.map((m, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {m.nome}
                              <span className="ml-1 opacity-60">
                                ({getFuncaoLabel(m.funcao)})
                              </span>
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
