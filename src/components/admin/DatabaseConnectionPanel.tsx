import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Copy, Check, Database, Shield, AlertTriangle, History, User, Clock, Eye, EyeOff, Lock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
const DB_PASSWORD = 'Metanoia@Hub#2025!Secure';

interface ConnectionInfo {
  label: string;
  description: string;
  connectionString: string;
  connectionStringWithPassword: string;
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
    connectionString: `postgresql://postgres:[SENHA-PROTEGIDA]@db.${PROJECT_REF}.supabase.co:5432/postgres`,
    connectionStringWithPassword: `postgresql://postgres:${DB_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres`,
    type: 'admin',
  },
  {
    label: 'Pooler - Transaction Mode (Recomendado)',
    description: 'Conexão via pool. Ideal para aplicações serverless e conexões de curta duração.',
    connectionString: `postgresql://postgres.${PROJECT_REF}:[SENHA-PROTEGIDA]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres`,
    connectionStringWithPassword: `postgresql://postgres.${PROJECT_REF}:${DB_PASSWORD}@aws-0-sa-east-1.pooler.supabase.com:6543/postgres`,
    type: 'admin',
  },
  {
    label: 'Pooler - Session Mode',
    description: 'Conexão via pool com sessão persistente. Use para prepared statements.',
    connectionString: `postgresql://postgres.${PROJECT_REF}:[SENHA-PROTEGIDA]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres`,
    connectionStringWithPassword: `postgresql://postgres.${PROJECT_REF}:${DB_PASSWORD}@aws-0-sa-east-1.pooler.supabase.com:5432/postgres`,
    type: 'admin',
  },
];

export function DatabaseConnectionPanel() {
  const { toast } = useToast();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [passwordRevealed, setPasswordRevealed] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [verifying, setVerifying] = useState(false);

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

  const verifyPasswordAndReveal = async () => {
    if (!adminPassword.trim()) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Digite sua senha.',
      });
      return;
    }

    setVerifying(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Usuário não encontrado.',
        });
        return;
      }

      // Verify password by trying to sign in
      const { error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: adminPassword,
      });

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Senha incorreta',
          description: 'A senha informada não está correta.',
        });
        
        // Log failed attempt
        const { data: profile } = await supabase
          .from('profiles')
          .select('nome')
          .eq('id', user.id)
          .single();

        await supabase.from('super_admin_audit_logs').insert({
          user_id: user.id,
          user_name: profile?.nome || user.email || 'Desconhecido',
          action: 'reveal_password_failed',
          details: { attempted_at: new Date().toISOString() },
          user_agent: navigator.userAgent,
        });
        loadAuditLogs();
        return;
      }

      // Password verified successfully
      setPasswordRevealed(true);
      setShowPasswordDialog(false);
      setAdminPassword('');

      // Log successful reveal
      const { data: profile } = await supabase
        .from('profiles')
        .select('nome')
        .eq('id', user.id)
        .single();

      await supabase.from('super_admin_audit_logs').insert({
        user_id: user.id,
        user_name: profile?.nome || user.email || 'Desconhecido',
        action: 'reveal_password_success',
        details: { revealed_at: new Date().toISOString() },
        user_agent: navigator.userAgent,
      });
      loadAuditLogs();

      toast({
        title: 'Senha revelada',
        description: 'As strings de conexão agora mostram a senha completa.',
      });

      // Auto-hide password after 5 minutes
      setTimeout(() => {
        setPasswordRevealed(false);
        toast({
          title: 'Senha ocultada',
          description: 'Por segurança, a senha foi ocultada novamente.',
        });
      }, 5 * 60 * 1000);

    } catch (error) {
      console.error('Error verifying password:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao verificar senha.',
      });
    } finally {
      setVerifying(false);
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
          action: passwordRevealed ? 'copy_connection_with_password' : 'copy_connection_string',
          details: { connection_type: label, copied_at: new Date().toISOString(), with_password: passwordRevealed },
          user_agent: navigator.userAgent,
        });
        
        // Reload logs to show the new entry
        loadAuditLogs();
      }
      
      toast({
        title: 'Copiado!',
        description: 'String de conexão copiada para a área de transferência.',
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
        return 'Copiou string (sem senha)';
      case 'copy_connection_with_password':
        return 'Copiou string COM senha';
      case 'reveal_password_success':
        return 'Revelou senha';
      case 'reveal_password_failed':
        return 'Tentativa falha de revelar senha';
      default:
        return action;
    }
  };

  const getActionBadgeVariant = (action: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (action) {
      case 'copy_connection_with_password':
      case 'reveal_password_success':
        return 'destructive';
      case 'reveal_password_failed':
        return 'destructive';
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
          <Alert variant={passwordRevealed ? "destructive" : "default"} className={passwordRevealed ? "bg-destructive/10 border-destructive/30" : ""}>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{passwordRevealed ? 'Modo Senha Visível' : 'Senha Protegida'}</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>
                {passwordRevealed 
                  ? 'As strings de conexão estão mostrando a senha real. A senha será ocultada automaticamente em 5 minutos.'
                  : 'A senha do banco está oculta. Clique no botão para revelar usando sua senha de login.'}
              </span>
              <Button 
                variant={passwordRevealed ? "outline" : "secondary"}
                size="sm"
                onClick={() => {
                  if (passwordRevealed) {
                    setPasswordRevealed(false);
                  } else {
                    setShowPasswordDialog(true);
                  }
                }}
                className="ml-4 gap-2"
              >
                {passwordRevealed ? (
                  <><EyeOff className="h-4 w-4" /> Ocultar Senha</>
                ) : (
                  <><Eye className="h-4 w-4" /> Revelar Senha</>
                )}
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
                      {passwordRevealed && (
                        <Badge variant="outline" className="text-xs border-destructive text-destructive">
                          <Lock className="h-3 w-3 mr-1" /> Com Senha
                        </Badge>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(
                        passwordRevealed ? conn.connectionStringWithPassword : conn.connectionString, 
                        index, 
                        conn.label
                      )}
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
                    {passwordRevealed ? conn.connectionStringWithPassword : conn.connectionString}
                  </code>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="instructions" className="mt-4 space-y-4">
              <div className="space-y-4">
                <div className="border rounded-lg p-4 space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span>
                    Revelar a Senha
                  </h4>
                  <p className="text-sm text-muted-foreground ml-8">
                    Clique em "Revelar Senha" acima e confirme com sua senha de login do sistema.
                    A senha será exibida nas strings de conexão.
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
                    <li>Senha: revelada no passo 1</li>
                  </ul>
                </div>

                <div className="border rounded-lg p-4 space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">3</span>
                    VS Code (SQLTools)
                  </h4>
                  <ul className="text-sm text-muted-foreground ml-8 space-y-1 list-disc list-inside">
                    <li>Instale a extensão SQLTools + PostgreSQL Driver</li>
                    <li>Revele a senha e copie a string de conexão completa</li>
                    <li>Cole diretamente na configuração do SQLTools</li>
                  </ul>
                </div>

                <div className="border rounded-lg p-4 space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">4</span>
                    Terminal (psql)
                  </h4>
                  <p className="text-sm text-muted-foreground ml-8">
                    Copie a string de conexão com senha revelada e cole diretamente no terminal.
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
              Nenhum log de auditoria encontrado.
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Detalhes</TableHead>
                    <TableHead>Data/Hora</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{log.user_name || 'Desconhecido'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionBadgeVariant(log.action)}>
                          {getActionLabel(log.action)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {(log.action === 'copy_connection_string' || log.action === 'copy_connection_with_password') && log.details ? (
                          <span>{(log.details as Record<string, string>).connection_type}</span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Password Verification Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Verificação de Segurança
            </DialogTitle>
            <DialogDescription>
              Digite sua senha de login para revelar a senha do banco de dados.
              Esta ação será registrada no log de auditoria.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="admin-password">Sua senha de login</Label>
              <Input
                id="admin-password"
                type="password"
                placeholder="Digite sua senha..."
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    verifyPasswordAndReveal();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowPasswordDialog(false);
              setAdminPassword('');
            }}>
              Cancelar
            </Button>
            <Button onClick={verifyPasswordAndReveal} disabled={verifying}>
              {verifying ? 'Verificando...' : 'Revelar Senha'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
