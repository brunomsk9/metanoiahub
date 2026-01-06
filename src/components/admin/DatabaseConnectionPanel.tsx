import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Copy, Check, Database, Shield, AlertTriangle, History, User, Clock, ExternalLink } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';

const PROJECT_REF = 'cnpvlloooyyxlgayfzth';

// SECURITY: Database password is NOT stored in client code.
// Super admins must obtain the password from the Supabase dashboard.

interface ConnectionInfo {
  label: string;
  description: string;
  connectionString: string;
  type: 'readonly' | 'admin';
}

interface AuditLog {
  id: string;
  user_id: string;
  user_name: string | null;
  action: string;
  details: unknown;
  created_at: string;
}

const connectionStrings: ConnectionInfo[] = [
  {
    label: 'Conexão Direta (Admin)',
    description: 'Acesso completo ao banco. Use apenas em ferramentas seguras como DBeaver ou VS Code.',
    connectionString: `postgresql://postgres:[SUA-SENHA]@db.${PROJECT_REF}.supabase.co:5432/postgres`,
    type: 'admin',
  },
  {
    label: 'Pooler - Transaction Mode (Recomendado)',
    description: 'Conexão via pool. Ideal para aplicações serverless e conexões de curta duração.',
    connectionString: `postgresql://postgres.${PROJECT_REF}:[SUA-SENHA]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres`,
    type: 'admin',
  },
  {
    label: 'Pooler - Session Mode',
    description: 'Conexão via pool com sessão persistente. Use para prepared statements.',
    connectionString: `postgresql://postgres.${PROJECT_REF}:[SUA-SENHA]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres`,
    type: 'admin',
  },
];

export function DatabaseConnectionPanel() {
  const { toast } = useToast();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  useEffect(() => {
    logPanelAccess();
    loadAuditLogs();
  }, []);

  const logPanelAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('nome')
        .eq('id', user.id)
        .single();

      await supabase.from('super_admin_audit_logs').insert({
        user_id: user.id,
        user_name: profile?.nome || user.email || 'Desconhecido',
        action: 'view_database_connections',
        details: { accessed_at: new Date().toISOString() },
        user_agent: navigator.userAgent,
      });
    } catch (error) {
      console.error('Error logging panel access:', error);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('super_admin_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAuditLogs(data || []);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoadingLogs(false);
    }
  };

  const copyToClipboard = async (text: string, index: number, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      
      // Log the copy action
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('nome')
          .eq('id', user.id)
          .single();

        await supabase.from('super_admin_audit_logs').insert({
          user_id: user.id,
          user_name: profile?.nome || user.email || 'Desconhecido',
          action: 'copy_connection_string',
          details: { connection_type: label, copied_at: new Date().toISOString() },
          user_agent: navigator.userAgent,
        });
        
        loadAuditLogs();
      }
      
      toast({
        title: 'Copiado!',
        description: 'String de conexão copiada. Substitua [SUA-SENHA] pela senha do banco.',
      });
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível copiar para a área de transferência.',
      });
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'view_database_connections':
        return 'Visualizou conexões';
      case 'copy_connection_string':
        return 'Copiou string de conexão';
      default:
        return action;
    }
  };

  const getActionBadgeVariant = (action: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (action) {
      case 'copy_connection_string':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <CardTitle>Conexão do Banco de Dados</CardTitle>
          </div>
          <CardDescription>
            Strings de conexão para acesso externo ao banco de dados via DBeaver, VS Code ou outras ferramentas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Senha do Banco</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>
                Por segurança, a senha do banco não é armazenada no código. 
                Você deve obter a senha diretamente no painel do Supabase.
              </p>
              <Button 
                variant="outline"
                size="sm"
                asChild
                className="gap-2"
              >
                <a 
                  href={`https://supabase.com/dashboard/project/${PROJECT_REF}/settings/database`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4" />
                  Acessar Painel Supabase (Database Settings)
                </a>
              </Button>
            </AlertDescription>
          </Alert>

          <Tabs defaultValue="connections" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="connections">Strings de Conexão</TabsTrigger>
              <TabsTrigger value="instructions">Instruções</TabsTrigger>
            </TabsList>

            <TabsContent value="connections" className="space-y-4 mt-4">
              {connectionStrings.map((conn, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 space-y-3 bg-muted/30"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{conn.label}</span>
                      <Badge 
                        variant="destructive"
                        className="text-xs"
                      >
                        <Shield className="h-3 w-3 mr-1" /> Admin
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(conn.connectionString, index, conn.label)}
                      className="gap-2"
                    >
                      {copiedIndex === index ? (
                        <><Check className="h-4 w-4 text-green-500" /> Copiado</>
                      ) : (
                        <><Copy className="h-4 w-4" /> Copiar</>
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">{conn.description}</p>
                  <code className="block text-xs bg-background p-2 rounded border font-mono break-all">
                    {conn.connectionString}
                  </code>
                  <p className="text-xs text-muted-foreground italic">
                    Substitua [SUA-SENHA] pela senha obtida no painel do Supabase.
                  </p>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="instructions" className="mt-4 space-y-4">
              <div className="space-y-4">
                <div className="border rounded-lg p-4 space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span>
                    Obter a Senha
                  </h4>
                  <p className="text-sm text-muted-foreground ml-8">
                    Acesse o <a href={`https://supabase.com/dashboard/project/${PROJECT_REF}/settings/database`} target="_blank" rel="noopener noreferrer" className="text-primary underline">painel do Supabase</a> e 
                    copie a senha do banco na seção "Connection parameters" ou "Database Password".
                  </p>
                </div>

                <div className="border rounded-lg p-4 space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">2</span>
                    DBeaver
                  </h4>
                  <ul className="text-sm text-muted-foreground ml-8 space-y-1 list-disc list-inside">
                    <li>Nova Conexão → PostgreSQL</li>
                    <li>Host: <code className="bg-muted px-1 rounded">db.{PROJECT_REF}.supabase.co</code></li>
                    <li>Porta: <code className="bg-muted px-1 rounded">5432</code></li>
                    <li>Database: <code className="bg-muted px-1 rounded">postgres</code></li>
                    <li>Usuário: <code className="bg-muted px-1 rounded">postgres</code></li>
                    <li>Senha: obtida no passo 1</li>
                  </ul>
                </div>

                <div className="border rounded-lg p-4 space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">3</span>
                    VS Code (SQLTools)
                  </h4>
                  <ul className="text-sm text-muted-foreground ml-8 space-y-1 list-disc list-inside">
                    <li>Instale a extensão SQLTools + PostgreSQL Driver</li>
                    <li>Copie a string de conexão e substitua [SUA-SENHA]</li>
                    <li>Cole diretamente na configuração do SQLTools</li>
                  </ul>
                </div>

                <div className="border rounded-lg p-4 space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">4</span>
                    Terminal (psql)
                  </h4>
                  <p className="text-sm text-muted-foreground ml-8">
                    Copie a string de conexão, substitua [SUA-SENHA] pela senha real e cole no terminal.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Audit Logs Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            <CardTitle>Log de Auditoria</CardTitle>
          </div>
          <CardDescription>
            Histórico de acessos ao painel de conexão do banco de dados pelos super admins.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingLogs ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              Carregando logs...
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              Nenhum registro de auditoria encontrado.
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead><User className="h-4 w-4 inline mr-1" /> Usuário</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead><Clock className="h-4 w-4 inline mr-1" /> Data/Hora</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.user_name || 'Desconhecido'}</TableCell>
                      <TableCell>
                        <Badge variant={getActionBadgeVariant(log.action)} className="text-xs">
                          {getActionLabel(log.action)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}