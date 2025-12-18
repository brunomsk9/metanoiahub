import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Upload, FileText, CheckCircle, XCircle, Download, Loader2, Mail, Church, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useChurch } from "@/contexts/ChurchContext";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface UserRow {
  email: string;
  nome: string;
  role: string;
}

interface ImportResult {
  email: string;
  success: boolean;
  error?: string;
}

interface ChurchOption {
  id: string;
  nome: string;
}

export function AdminUserImport() {
  const [parsedUsers, setParsedUsers] = useState<UserRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [sendingEmails, setSendingEmails] = useState(false);
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true);
  const [results, setResults] = useState<ImportResult[] | null>(null);
  const [emailResults, setEmailResults] = useState<{ sent: number; failed: number } | null>(null);
  const [selectedChurchId, setSelectedChurchId] = useState<string>("");
  const [churches, setChurches] = useState<ChurchOption[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loadingChurches, setLoadingChurches] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { church } = useChurch();

  useEffect(() => {
    loadChurchesAndCheckRole();
  }, []);

  const loadChurchesAndCheckRole = async () => {
    setLoadingChurches(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Check if user is super_admin
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id);

      const superAdmin = roles?.some(r => r.role === 'super_admin');
      setIsSuperAdmin(superAdmin || false);

      if (superAdmin) {
        // Super admin can see all churches
        const { data: churchesData } = await supabase
          .from('churches')
          .select('id, nome')
          .eq('is_active', true)
          .order('nome');

        setChurches(churchesData || []);
      } else if (church) {
        // Regular admin can only import to their own church
        setChurches([{ id: church.id, nome: church.nome }]);
        setSelectedChurchId(church.id);
      }
    } catch (error) {
      console.error('Error loading churches:', error);
    } finally {
      setLoadingChurches(false);
    }
  };

  const parseCSV = (content: string): UserRow[] => {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
    const emailIdx = headers.findIndex(h => h === 'email');
    const nomeIdx = headers.findIndex(h => h === 'nome' || h === 'name' || h === 'nome completo');
    const roleIdx = headers.findIndex(h => h === 'role' || h === 'papel' || h === 'tipo');

    if (emailIdx === -1 || nomeIdx === -1) {
      toast.error("CSV deve conter colunas 'email' e 'nome'");
      return [];
    }

    const users: UserRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
      if (values[emailIdx]) {
        users.push({
          email: values[emailIdx],
          nome: values[nomeIdx] || '',
          role: roleIdx !== -1 ? values[roleIdx] || 'discipulo' : 'discipulo'
        });
      }
    }

    return users;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const users = parseCSV(content);
      setParsedUsers(users);
      setResults(null);
      
      if (users.length > 0) {
        toast.success(`${users.length} usuários encontrados no CSV`);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (parsedUsers.length === 0) return;

    if (!selectedChurchId) {
      toast.error("Selecione uma igreja para importar os usuários");
      return;
    }

    setImporting(true);
    setResults(null);
    setEmailResults(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        toast.error("Sessão expirada. Faça login novamente.");
        return;
      }

      const { data, error } = await supabase.functions.invoke('import-users', {
        body: { 
          users: parsedUsers,
          church_id: selectedChurchId
        }
      });

      if (error) throw error;

      setResults(data.results);
      
      const { success, failed } = data.summary;
      if (failed === 0) {
        toast.success(`${success} usuários importados com sucesso!`);
      } else {
        toast.warning(`${success} importados, ${failed} com erro`);
      }

      // Send welcome emails if enabled and there are successful imports
      if (sendWelcomeEmail && success > 0) {
        const successfulUsers = data.results
          .filter((r: ImportResult) => r.success)
          .map((r: ImportResult) => {
            const user = parsedUsers.find(u => u.email === r.email);
            return { email: r.email, nome: user?.nome || '' };
          });

        await sendWelcomeEmails(successfulUsers);
      }

    } catch (error) {
      console.error('Import error:', error);
      toast.error("Erro ao importar usuários");
    } finally {
      setImporting(false);
    }
  };

  const sendWelcomeEmails = async (users: Array<{ email: string; nome: string }>) => {
    setSendingEmails(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-welcome-email', {
        body: { users }
      });

      if (error) throw error;

      setEmailResults(data.summary);
      
      if (data.summary.failed === 0) {
        toast.success(`${data.summary.sent} emails enviados!`);
      } else {
        toast.warning(`${data.summary.sent} emails enviados, ${data.summary.failed} com erro`);
      }
    } catch (error) {
      console.error('Email error:', error);
      toast.error("Erro ao enviar emails de boas-vindas");
    } finally {
      setSendingEmails(false);
    }
  };

  const downloadTemplate = () => {
    const template = "email,nome,role\njohn@example.com,John Doe,discipulo\njane@example.com,Jane Smith,discipulador";
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_usuarios.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearData = () => {
    setParsedUsers([]);
    setResults(null);
    setEmailResults(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const selectedChurch = churches.find(c => c.id === selectedChurchId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-foreground">Importar Usuários</h3>
          <p className="text-sm text-muted-foreground">
            Importe usuários de outros sistemas via arquivo CSV
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={downloadTemplate}>
          <Download className="w-4 h-4 mr-2" />
          Baixar Template
        </Button>
      </div>

      {/* Church Selection */}
      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-3">
        <div className="flex items-center gap-2">
          <Church className="w-5 h-5 text-primary" />
          <h4 className="font-medium text-foreground">Igreja de Destino</h4>
        </div>
        
        {loadingChurches ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Carregando igrejas...</span>
          </div>
        ) : isSuperAdmin ? (
          <Select value={selectedChurchId} onValueChange={setSelectedChurchId}>
            <SelectTrigger className="w-full bg-background">
              <SelectValue placeholder="Selecione a igreja para importar os usuários" />
            </SelectTrigger>
            <SelectContent>
              {churches.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background border border-border">
            <Church className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              {selectedChurch?.nome || 'Igreja não encontrada'}
            </span>
          </div>
        )}

        {selectedChurchId && (
          <Alert className="bg-primary/10 border-primary/30">
            <AlertCircle className="h-4 w-4 text-primary" />
            <AlertDescription className="text-primary text-sm">
              Todos os usuários importados serão vinculados à igreja <strong>{selectedChurch?.nome}</strong>
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Upload Area */}
      <div 
        className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileSelect}
        />
        <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
        <p className="text-foreground font-medium">Clique para selecionar arquivo CSV</p>
        <p className="text-sm text-muted-foreground mt-1">
          Colunas: email, nome, role (discipulo/discipulador/admin)
        </p>
      </div>

      {/* Preview Table */}
      {parsedUsers.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Preview ({parsedUsers.length} usuários)
            </h4>
            <Button variant="ghost" size="sm" onClick={clearData}>
              Limpar
            </Button>
          </div>
          
          <div className="border border-border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Email</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Nome</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Role</th>
                  {results && (
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Status</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {parsedUsers.map((user, idx) => {
                  const result = results?.find(r => r.email === user.email);
                  return (
                    <tr key={idx} className="hover:bg-muted/30">
                      <td className="px-4 py-2 text-foreground">{user.email}</td>
                      <td className="px-4 py-2 text-foreground">{user.nome}</td>
                      <td className="px-4 py-2">
                        <span className="px-2 py-0.5 rounded text-xs bg-primary/10 text-primary">
                          {user.role}
                        </span>
                      </td>
                      {results && (
                        <td className="px-4 py-2">
                          {result?.success ? (
                            <span className="flex items-center gap-1 text-green-500">
                              <CheckCircle className="w-4 h-4" />
                              Importado
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-red-500" title={result?.error}>
                              <XCircle className="w-4 h-4" />
                              {result?.error?.slice(0, 30)}...
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Send Email Option */}
          {!results && (
            <div className="flex items-center space-x-2 p-3 bg-muted/30 rounded-lg">
              <Checkbox
                id="sendWelcomeEmail"
                checked={sendWelcomeEmail}
                onCheckedChange={(checked) => setSendWelcomeEmail(checked === true)}
              />
              <Label htmlFor="sendWelcomeEmail" className="text-sm text-foreground cursor-pointer flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                Enviar email de boas-vindas com instruções de acesso
              </Label>
            </div>
          )}

          {/* Import Button */}
          {!results && (
            <Button 
              onClick={handleImport} 
              disabled={importing || sendingEmails || !selectedChurchId} 
              className="w-full"
            >
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importando...
                </>
              ) : sendingEmails ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando emails...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Importar {parsedUsers.length} Usuários para {selectedChurch?.nome || 'igreja selecionada'}
                </>
              )}
            </Button>
          )}

          {/* Results Summary */}
          {results && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 text-green-500">
                  <CheckCircle className="w-5 h-5" />
                  <span>{results.filter(r => r.success).length} importados</span>
                </div>
                <div className="flex items-center gap-2 text-red-500">
                  <XCircle className="w-5 h-5" />
                  <span>{results.filter(r => !r.success).length} com erro</span>
                </div>
                {emailResults && (
                  <div className="flex items-center gap-2 text-primary">
                    <Mail className="w-5 h-5" />
                    <span>{emailResults.sent} emails enviados</span>
                  </div>
                )}
                <Button variant="outline" size="sm" className="ml-auto" onClick={clearData}>
                  Nova Importação
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
