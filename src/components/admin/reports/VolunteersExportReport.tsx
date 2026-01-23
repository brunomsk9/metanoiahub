import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SearchableSelect, SearchableSelectOption } from "@/components/ui/searchable-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Download, Users, Filter, FileSpreadsheet, FileText, Search } from "lucide-react";
import { toast } from "sonner";
import { useUserChurchId } from "@/hooks/useUserChurchId";
import html2pdf from "html2pdf.js";

interface Volunteer {
  id: string;
  nome: string;
  telefone: string | null;
  genero: string | null;
  email: string | null;
  ministries: {
    id: string;
    nome: string;
    funcao: string | null;
  }[];
}

type PdfColumn = 'nome' | 'email' | 'telefone' | 'ministerio' | 'funcao';

const PDF_COLUMNS: { key: PdfColumn; label: string }[] = [
  { key: 'nome', label: 'Nome' },
  { key: 'email', label: 'Email' },
  { key: 'telefone', label: 'Telefone' },
  { key: 'ministerio', label: 'Ministério' },
  { key: 'funcao', label: 'Função' },
];

export function VolunteersExportReport() {
  const { churchId } = useUserChurchId();
  const [selectedMinistry, setSelectedMinistry] = useState<string>("all");
  const [selectedGender, setSelectedGender] = useState<string>("all");
  const [selectedVolunteers, setSelectedVolunteers] = useState<Set<string>>(new Set());
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [pdfColumns, setPdfColumns] = useState<Set<PdfColumn>>(new Set(['nome', 'email', 'ministerio']));
  const [searchQuery, setSearchQuery] = useState("");

  const togglePdfColumn = (col: PdfColumn) => {
    const newCols = new Set(pdfColumns);
    if (newCols.has(col)) {
      if (newCols.size > 1) newCols.delete(col);
    } else {
      newCols.add(col);
    }
    setPdfColumns(newCols);
  };

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
      
      // Get profiles, ministries, and emails in parallel
      const [profilesResult, ministriesResult, emailsResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, nome, telefone, genero')
          .in('id', userIds),
        supabase
          .from('ministries')
          .select('id, nome')
          .in('id', ministryIds),
        supabase.rpc('get_user_auth_details')
      ]);
      
      if (profilesResult.error) throw profilesResult.error;
      if (ministriesResult.error) throw ministriesResult.error;
      
      // Create email lookup map
      const emailsMap = new Map(emailsResult.data?.map(u => [u.id, u.email]) || []);
      
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
          email: emailsMap.get(profile.id) || null,
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

  // Filter volunteers by selected ministry, gender, and search query
  const filteredVolunteers = useMemo(() => {
    let filtered = volunteers;
    
    if (selectedMinistry !== "all") {
      filtered = filtered.filter(v => 
        v.ministries.some(m => m.id === selectedMinistry)
      );
    }
    
    if (selectedGender !== "all") {
      filtered = filtered.filter(v => v.genero === selectedGender);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(v => 
        v.nome.toLowerCase().includes(query) ||
        (v.email && v.email.toLowerCase().includes(query))
      );
    }
    
    return filtered;
  }, [volunteers, selectedMinistry, selectedGender, searchQuery]);

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

  // Get volunteers to export (helper function)
  const getVolunteersToExport = () => {
    return selectedVolunteers.size > 0
      ? filteredVolunteers.filter(v => selectedVolunteers.has(v.id))
      : filteredVolunteers;
  };

  const getSelectedMinistryName = () => {
    return selectedMinistry === "all" 
      ? "Todos os Ministérios" 
      : ministries.find(m => m.id === selectedMinistry)?.nome || "";
  };

  // Export to CSV
  const exportToCSV = () => {
    const volunteersToExport = getVolunteersToExport();
    
    if (volunteersToExport.length === 0) {
      toast.error("Nenhum voluntário para exportar");
      return;
    }

    const selectedMinistryName = getSelectedMinistryName();

    const headers = ["Nome", "Email", "Gênero", "Ministérios", "Funções"];
    const rows = volunteersToExport.map(v => [
      v.nome,
      v.email || "",
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

  // Export to PDF
  const exportToPDF = async () => {
    const volunteersToExport = getVolunteersToExport();
    
    if (volunteersToExport.length === 0) {
      toast.error("Nenhum voluntário para exportar");
      return;
    }

    setGeneratingPdf(true);
    
    try {
      const selectedMinistryName = getSelectedMinistryName();
      const dateStr = new Date().toLocaleDateString('pt-BR');

      const getColumnValue = (v: Volunteer, col: PdfColumn): string => {
        switch (col) {
          case 'nome': return v.nome;
          case 'email': return v.email || "-";
          case 'telefone': return v.telefone || "-";
          case 'ministerio': return v.ministries.map(m => m.nome).join(", ");
          case 'funcao': return v.ministries.map(m => getFuncaoLabel(m.funcao)).join(", ");
          default: return "-";
        }
      };

      const selectedCols = PDF_COLUMNS.filter(c => pdfColumns.has(c.key));

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin: 0; font-size: 24px;">Lista de Voluntários</h1>
            <p style="color: #666; margin: 8px 0; font-size: 16px;">${selectedMinistryName}</p>
            <p style="color: #888; font-size: 12px; margin: 5px 0;">Gerado em: ${dateStr}</p>
          </div>
          
          <table style="width: 100%; border-collapse: collapse; font-size: 12px; page-break-inside: auto;">
            <thead>
              <tr style="background-color: #8B5CF6; color: white;">
                ${selectedCols.map(c => `<th style="border: 1px solid #7c4fe0; padding: 12px 10px; text-align: left; font-weight: 600;">${c.label}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${volunteersToExport.map((v, index) => `
                <tr style="background-color: ${index % 2 === 0 ? '#ffffff' : '#f9fafb'}; page-break-inside: avoid; page-break-after: auto;">
                  ${selectedCols.map(c => `<td style="border: 1px solid #e5e7eb; padding: 10px;${c.key === 'nome' ? ' font-weight: 500;' : ''}">${getColumnValue(v, c.key)}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div style="margin-top: 20px; text-align: right; font-size: 12px; color: #888;">
            Total: ${volunteersToExport.length} voluntários
          </div>
        </div>
      `;

      const container = document.createElement('div');
      container.innerHTML = htmlContent;
      document.body.appendChild(container);

      const opt = {
        margin: [15, 10, 15, 10] as [number, number, number, number],
        filename: `voluntarios_${selectedMinistryName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'landscape' as const },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      await html2pdf().set(opt).from(container).save();
      document.body.removeChild(container);

      toast.success(`${volunteersToExport.length} voluntários exportados em PDF com sucesso!`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error("Erro ao gerar PDF");
    } finally {
      setGeneratingPdf(false);
    }
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
          <div className="flex flex-col gap-4">
            <div className="relative w-full sm:w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                <Filter className="h-4 w-4 text-muted-foreground hidden sm:block" />
                <SearchableSelect
                  options={[
                    { value: "all", label: "Todos os Ministérios" },
                    ...ministries.map(ministry => ({ value: ministry.id, label: ministry.nome }))
                  ]}
                  value={selectedMinistry}
                  onValueChange={setSelectedMinistry}
                  placeholder="Selecione um ministério"
                  searchPlaceholder="Buscar ministério..."
                  triggerClassName="w-full sm:w-[220px]"
                />
                
                <SearchableSelect
                  options={[
                    { value: "all", label: "Todos os Gêneros" },
                    { value: "masculino", label: "Masculino" },
                    { value: "feminino", label: "Feminino" },
                  ]}
                  value={selectedGender}
                  onValueChange={setSelectedGender}
                  placeholder="Gênero"
                  searchPlaceholder="Buscar gênero..."
                  triggerClassName="w-full sm:w-[160px]"
                />
              </div>
              
              <Badge variant="secondary" className="gap-1">
                <Users className="h-3 w-3" />
                {filteredVolunteers.length} voluntários
              </Badge>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end justify-between border-t pt-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Colunas do PDF:</p>
              <div className="flex flex-wrap gap-3">
                {PDF_COLUMNS.map(col => (
                  <label key={col.key} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox 
                      checked={pdfColumns.has(col.key)}
                      onCheckedChange={() => togglePdfColumn(col.key)}
                    />
                    <span className="text-sm">{col.label}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button onClick={exportToCSV} variant="outline" className="gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                CSV
                {selectedVolunteers.size > 0 && ` (${selectedVolunteers.size})`}
              </Button>
              
              <Button onClick={exportToPDF} disabled={generatingPdf} className="gap-2">
                <FileText className="h-4 w-4" />
                {generatingPdf ? "Gerando..." : "PDF"}
                {selectedVolunteers.size > 0 && !generatingPdf && ` (${selectedVolunteers.size})`}
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
                    <TableHead>Email</TableHead>
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
                      <TableCell>{volunteer.email || "-"}</TableCell>
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
