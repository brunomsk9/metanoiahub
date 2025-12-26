import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, Users, Filter, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { useUserChurchId } from "@/hooks/useUserChurchId";

interface Volunteer {
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

export function VolunteersExportReport() {
  const { churchId } = useUserChurchId();
  const [selectedMinistry, setSelectedMinistry] = useState<string>("all");
  const [selectedVolunteers, setSelectedVolunteers] = useState<Set<string>>(new Set());

  // Fetch ministries
  const { data: ministries = [] } = useQuery({
    queryKey: ['ministries-export', churchId],
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
    queryKey: ['volunteers-export', churchId],
    queryFn: async () => {
      if (!churchId) return [];
      
      // Get all ministry volunteers
      const { data: ministryVolunteers, error } = await supabase
        .from('ministry_volunteers')
        .select('user_id, funcao, ministry_id')
        .eq('church_id', churchId);
      
      if (error) throw error;
      
      // Get unique user IDs and ministry IDs
      const userIds = [...new Set(ministryVolunteers?.map(mv => mv.user_id) || [])];
      const ministryIds = [...new Set(ministryVolunteers?.map(mv => mv.ministry_id) || [])];
      
      if (userIds.length === 0) return [];
      
      // Get profiles and ministries in parallel
      const [profilesResult, ministriesResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, nome, telefone, genero')
          .in('id', userIds),
        supabase
          .from('ministries')
          .select('id, nome')
          .in('id', ministryIds)
      ]);
      
      if (profilesResult.error) throw profilesResult.error;
      if (ministriesResult.error) throw ministriesResult.error;
      
      // Create ministry lookup map
      const ministriesMap = new Map(ministriesResult.data?.map(m => [m.id, m]) || []);
      
      // Group ministries by user
      const volunteersMap = new Map<string, Volunteer>();
      
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
        a.nome.localeCompare(b.nome)
      );
    },
    enabled: !!churchId,
  });

  // Filter volunteers by selected ministry
  const filteredVolunteers = useMemo(() => {
    if (selectedMinistry === "all") return volunteers;
    return volunteers.filter(v => 
      v.ministries.some(m => m.id === selectedMinistry)
    );
  }, [volunteers, selectedMinistry]);

  // Toggle volunteer selection
  const toggleVolunteer = (id: string) => {
    const newSelected = new Set(selectedVolunteers);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedVolunteers(newSelected);
  };

  // Select/deselect all
  const toggleAll = () => {
    if (selectedVolunteers.size === filteredVolunteers.length) {
      setSelectedVolunteers(new Set());
    } else {
      setSelectedVolunteers(new Set(filteredVolunteers.map(v => v.id)));
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const volunteersToExport = selectedVolunteers.size > 0
      ? filteredVolunteers.filter(v => selectedVolunteers.has(v.id))
      : filteredVolunteers;
    
    if (volunteersToExport.length === 0) {
      toast.error("Nenhum voluntário para exportar");
      return;
    }

    const selectedMinistryName = selectedMinistry === "all" 
      ? "Todos os Ministérios" 
      : ministries.find(m => m.id === selectedMinistry)?.nome || "";

    const headers = ["Nome", "Telefone", "Gênero", "Ministérios", "Funções"];
    const rows = volunteersToExport.map(v => [
      v.nome,
      v.telefone || "",
      v.genero === "masculino" ? "Masculino" : v.genero === "feminino" ? "Feminino" : "",
      v.ministries.map(m => m.nome).join("; "),
      v.ministries.map(m => m.funcao || "Voluntário").join("; "),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `voluntarios_${selectedMinistryName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`${volunteersToExport.length} voluntários exportados com sucesso!`);
  };

  const getFuncaoLabel = (funcao: string | null) => {
    switch (funcao) {
      case 'lider_principal': return 'Líder Principal';
      case 'lider_secundario': return 'Líder Secundário';
      default: return 'Voluntário';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Exportar Voluntários
          </CardTitle>
          <CardDescription>
            Filtre e exporte a lista de voluntários por ministério
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedMinistry} onValueChange={setSelectedMinistry}>
                <SelectTrigger className="w-full sm:w-[280px]">
                  <SelectValue placeholder="Selecione um ministério" />
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
            
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <Users className="h-3 w-3" />
                {filteredVolunteers.length} voluntários
              </Badge>
              
              <Button onClick={exportToCSV} className="gap-2">
                <Download className="h-4 w-4" />
                Exportar CSV
                {selectedVolunteers.size > 0 && ` (${selectedVolunteers.size})`}
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando voluntários...
            </div>
          ) : filteredVolunteers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum voluntário encontrado
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox 
                        checked={selectedVolunteers.size === filteredVolunteers.length && filteredVolunteers.length > 0}
                        onCheckedChange={toggleAll}
                      />
                    </TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Gênero</TableHead>
                    <TableHead>Ministérios</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVolunteers.map(volunteer => (
                    <TableRow key={volunteer.id}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedVolunteers.has(volunteer.id)}
                          onCheckedChange={() => toggleVolunteer(volunteer.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{volunteer.nome}</TableCell>
                      <TableCell>{volunteer.telefone || "-"}</TableCell>
                      <TableCell>
                        {volunteer.genero === "masculino" ? "Masculino" : 
                         volunteer.genero === "feminino" ? "Feminino" : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(selectedMinistry === "all" 
                            ? volunteer.ministries 
                            : volunteer.ministries.filter(m => m.id === selectedMinistry)
                          ).map((m, idx) => (
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
