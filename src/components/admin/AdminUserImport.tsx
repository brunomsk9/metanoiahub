import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload, FileText, CheckCircle, XCircle, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

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

export function AdminUserImport() {
  const [parsedUsers, setParsedUsers] = useState<UserRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<ImportResult[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    setImporting(true);
    setResults(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        toast.error("Sessão expirada. Faça login novamente.");
        return;
      }

      const { data, error } = await supabase.functions.invoke('import-users', {
        body: { users: parsedUsers }
      });

      if (error) throw error;

      setResults(data.results);
      
      const { success, failed } = data.summary;
      if (failed === 0) {
        toast.success(`${success} usuários importados com sucesso!`);
      } else {
        toast.warning(`${success} importados, ${failed} com erro`);
      }

    } catch (error) {
      console.error('Import error:', error);
      toast.error("Erro ao importar usuários");
    } finally {
      setImporting(false);
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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

          {/* Import Button */}
          {!results && (
            <Button onClick={handleImport} disabled={importing} className="w-full">
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Importar {parsedUsers.length} Usuários
                </>
              )}
            </Button>
          )}

          {/* Results Summary */}
          {results && (
            <div className="flex gap-4 p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2 text-green-500">
                <CheckCircle className="w-5 h-5" />
                <span>{results.filter(r => r.success).length} importados</span>
              </div>
              <div className="flex items-center gap-2 text-red-500">
                <XCircle className="w-5 h-5" />
                <span>{results.filter(r => !r.success).length} com erro</span>
              </div>
              <Button variant="outline" size="sm" className="ml-auto" onClick={clearData}>
                Nova Importação
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
