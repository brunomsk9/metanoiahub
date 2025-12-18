import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PageTransition } from '@/components/PageTransition';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Loader2, ShieldAlert, ArrowLeft, Plus, Pencil, Church, Users, LogOut, Trash2 } from 'lucide-react';
import metanoiaLogo from "@/assets/metanoia-hub-logo.png";

interface ChurchData {
  id: string;
  nome: string;
  slug: string;
  logo_url: string | null;
  cor_primaria: string | null;
  cor_secundaria: string | null;
  is_active: boolean;
  created_at: string;
}

interface ChurchAdmin {
  id: string;
  nome: string;
  church_id: string | null;
}

export default function SuperAdmin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [churches, setChurches] = useState<ChurchData[]>([]);
  const [churchAdmins, setChurchAdmins] = useState<Record<string, ChurchAdmin[]>>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingChurch, setEditingChurch] = useState<ChurchData | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    slug: '',
    logo_url: '',
    cor_primaria: '#8B5CF6',
    cor_secundaria: '#D946EF',
    is_active: true,
  });

  useEffect(() => {
    checkSuperAdminAccess();
  }, []);

  const checkSuperAdminAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate('/auth');
      return;
    }

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id);

    const userRoles = roles?.map(r => r.role) || [];
    const userIsSuperAdmin = userRoles.includes('super_admin');
    
    setIsSuperAdmin(userIsSuperAdmin);
    
    if (userIsSuperAdmin) {
      await loadChurches();
    }
    
    setLoading(false);
  };

  const loadChurches = async () => {
    const { data, error } = await supabase
      .from('churches')
      .select('*')
      .order('nome');

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao carregar igrejas.',
      });
      return;
    }

    setChurches(data || []);
    
    // Load church admins for each church
    const adminsByChurch: Record<string, ChurchAdmin[]> = {};
    for (const church of data || []) {
      const { data: admins } = await supabase
        .from('profiles')
        .select('id, nome, church_id')
        .eq('church_id', church.id)
        .in('id', 
          (await supabase
            .from('user_roles')
            .select('user_id')
            .eq('role', 'church_admin')
          ).data?.map(r => r.user_id) || []
        );
      adminsByChurch[church.id] = admins || [];
    }
    setChurchAdmins(adminsByChurch);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const handleOpenDialog = (church?: ChurchData) => {
    if (church) {
      setEditingChurch(church);
      setFormData({
        nome: church.nome,
        slug: church.slug,
        logo_url: church.logo_url || '',
        cor_primaria: church.cor_primaria || '#8B5CF6',
        cor_secundaria: church.cor_secundaria || '#D946EF',
        is_active: church.is_active,
      });
    } else {
      setEditingChurch(null);
      setFormData({
        nome: '',
        slug: '',
        logo_url: '',
        cor_primaria: '#8B5CF6',
        cor_secundaria: '#D946EF',
        is_active: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Generate slug from name if empty
    const slug = formData.slug || formData.nome.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const churchData = {
      nome: formData.nome,
      slug,
      logo_url: formData.logo_url || null,
      cor_primaria: formData.cor_primaria,
      cor_secundaria: formData.cor_secundaria,
      is_active: formData.is_active,
    };

    if (editingChurch) {
      const { error } = await supabase
        .from('churches')
        .update(churchData)
        .eq('id', editingChurch.id);

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Erro ao atualizar igreja.',
        });
        return;
      }

      toast({ title: 'Sucesso', description: 'Igreja atualizada com sucesso.' });
    } else {
      const { error } = await supabase
        .from('churches')
        .insert(churchData);

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: error.message.includes('duplicate') 
            ? 'Já existe uma igreja com esse slug.' 
            : 'Erro ao criar igreja.',
        });
        return;
      }

      toast({ title: 'Sucesso', description: 'Igreja criada com sucesso.' });
    }

    setIsDialogOpen(false);
    loadChurches();
  };

  const handleDeleteChurch = async (churchId: string) => {
    const { error } = await supabase
      .from('churches')
      .delete()
      .eq('id', churchId);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao excluir igreja. Verifique se não há dados vinculados.',
      });
      return;
    }

    toast({ title: 'Sucesso', description: 'Igreja excluída com sucesso.' });
    loadChurches();
  };

  const toggleChurchStatus = async (church: ChurchData) => {
    const { error } = await supabase
      .from('churches')
      .update({ is_active: !church.is_active })
      .eq('id', church.id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao alterar status da igreja.',
      });
      return;
    }

    toast({ 
      title: 'Sucesso', 
      description: `Igreja ${!church.is_active ? 'ativada' : 'desativada'} com sucesso.` 
    });
    loadChurches();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <ShieldAlert className="h-16 w-16 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">Acesso Negado</h1>
          <p className="text-muted-foreground">
            Apenas Super Admins podem acessar esta área.
          </p>
          <Link to="/dashboard">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao app
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-card border-b border-border sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowLeft className="h-5 w-5" />
                  <span className="hidden sm:inline text-sm">Voltar</span>
                </Link>
                <div className="h-6 w-px bg-border" />
                <div className="flex items-center gap-2">
                  <img src={metanoiaLogo} alt="Metanoia Hub" className="w-8 h-8 object-contain" />
                  <span className="font-semibold text-foreground">Super Admin</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Gerenciar Igrejas</h1>
              <p className="text-muted-foreground mt-1">
                Crie e gerencie as igrejas da plataforma
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Igreja
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingChurch ? 'Editar Igreja' : 'Nova Igreja'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome da Igreja</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder="Igreja Exemplo"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug (URL)</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="igreja-exemplo"
                    />
                    <p className="text-xs text-muted-foreground">
                      Deixe em branco para gerar automaticamente
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="logo_url">URL do Logo</Label>
                    <Input
                      id="logo_url"
                      value={formData.logo_url}
                      onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                      placeholder="https://exemplo.com/logo.png"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cor_primaria">Cor Primária</Label>
                      <div className="flex gap-2">
                        <Input
                          id="cor_primaria"
                          type="color"
                          value={formData.cor_primaria}
                          onChange={(e) => setFormData({ ...formData, cor_primaria: e.target.value })}
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          value={formData.cor_primaria}
                          onChange={(e) => setFormData({ ...formData, cor_primaria: e.target.value })}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cor_secundaria">Cor Secundária</Label>
                      <div className="flex gap-2">
                        <Input
                          id="cor_secundaria"
                          type="color"
                          value={formData.cor_secundaria}
                          onChange={(e) => setFormData({ ...formData, cor_secundaria: e.target.value })}
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          value={formData.cor_secundaria}
                          onChange={(e) => setFormData({ ...formData, cor_secundaria: e.target.value })}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="is_active">Igreja Ativa</Label>
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                      Cancelar
                    </Button>
                    <Button type="submit" className="flex-1">
                      {editingChurch ? 'Salvar' : 'Criar'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Churches Table */}
          <div className="rounded-lg border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Igreja</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Cores</TableHead>
                  <TableHead>Admins</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {churches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      <Church className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Nenhuma igreja cadastrada</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  churches.map((church) => (
                    <TableRow key={church.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {church.logo_url ? (
                            <img 
                              src={church.logo_url} 
                              alt={church.nome} 
                              className="w-8 h-8 rounded object-cover"
                            />
                          ) : (
                            <div 
                              className="w-8 h-8 rounded flex items-center justify-center"
                              style={{ backgroundColor: church.cor_primaria || '#8B5CF6' }}
                            >
                              <Church className="h-4 w-4 text-white" />
                            </div>
                          )}
                          <span className="font-medium">{church.nome}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {church.slug}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <div 
                            className="w-6 h-6 rounded border border-border" 
                            style={{ backgroundColor: church.cor_primaria || '#8B5CF6' }}
                            title="Primária"
                          />
                          <div 
                            className="w-6 h-6 rounded border border-border" 
                            style={{ backgroundColor: church.cor_secundaria || '#D946EF' }}
                            title="Secundária"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>{churchAdmins[church.id]?.length || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          church.is_active 
                            ? 'bg-green-500/10 text-green-500' 
                            : 'bg-red-500/10 text-red-500'
                        }`}>
                          {church.is_active ? 'Ativa' : 'Inativa'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleChurchStatus(church)}
                            title={church.is_active ? 'Desativar' : 'Ativar'}
                          >
                            <Switch 
                              checked={church.is_active} 
                              className="pointer-events-none"
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(church)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir Igreja</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir a igreja "{church.nome}"? 
                                  Esta ação não pode ser desfeita e todos os dados vinculados serão perdidos.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteChurch(church.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </main>
      </div>
    </PageTransition>
  );
}
