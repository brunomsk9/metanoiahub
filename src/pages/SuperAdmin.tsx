import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PageTransition } from '@/components/PageTransition';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, ShieldAlert, ArrowLeft, Plus, Pencil, Church, Users, LogOut, Trash2, 
  Search, BookOpen, GraduationCap, FileText, LifeBuoy, CalendarDays, 
  ClipboardList, BarChart3, Bot, Presentation, Sparkles, ChevronDown, LayoutDashboard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import metanoiaLogo from "@/assets/metanoia-hub-logo.png";

// Admin components
import { AdminTracks } from '@/components/admin/AdminTracks';
import { AdminCourses } from '@/components/admin/AdminCourses';
import { AdminLessons } from '@/components/admin/AdminLessons';
import { AdminResources } from '@/components/admin/AdminResources';
import { AdminUsers } from '@/components/admin/AdminUsers';
import { AdminDiscipleship } from '@/components/admin/AdminDiscipleship';
import { AdminReadingPlanDays } from '@/components/admin/AdminReadingPlanDays';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { AdminWeeklyChecklist } from '@/components/admin/AdminWeeklyChecklist';
import { AdminChecklistCompliance } from '@/components/admin/AdminChecklistCompliance';
import { AdminAISettings } from '@/components/admin/AdminAISettings';
import { AdminHabits } from '@/components/admin/AdminHabits';
import { PresentationPdfGenerator } from '@/components/admin/PresentationPdfGenerator';

type ContentSection = 'dashboard' | 'tracks' | 'courses' | 'lessons' | 'resources' | 'admin-users' | 'reading-plans' | 'discipleship' | 'weekly-checklist' | 'checklist-compliance' | 'ai-settings' | 'presentation' | 'habits';

const contentSections = [
  { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'tracks' as const, label: 'Trilhas', icon: BookOpen },
  { id: 'courses' as const, label: 'Cursos', icon: GraduationCap },
  { id: 'lessons' as const, label: 'Aulas', icon: FileText },
  { id: 'resources' as const, label: 'Recursos', icon: LifeBuoy },
  { id: 'reading-plans' as const, label: 'Planos de Leitura', icon: CalendarDays },
  { id: 'habits' as const, label: 'Hábitos Diários', icon: Sparkles },
  { id: 'weekly-checklist' as const, label: 'Checklist Semanal', icon: ClipboardList },
  { id: 'checklist-compliance' as const, label: 'Relatório Compliance', icon: BarChart3 },
  { id: 'ai-settings' as const, label: 'Configurações IA', icon: Bot },
  { id: 'presentation' as const, label: 'Apresentação', icon: Presentation },
  { id: 'admin-users' as const, label: 'Usuários (Admin)', icon: Users },
];

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

interface UserData {
  id: string;
  nome: string;
  telefone: string | null;
  email: string;
  church_id: string | null;
  church_name?: string;
  roles: string[];
  created_at: string;
}

export default function SuperAdmin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [churches, setChurches] = useState<ChurchData[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterChurch, setFilterChurch] = useState<string>('all');
  const [isChurchDialogOpen, setIsChurchDialogOpen] = useState(false);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editingChurch, setEditingChurch] = useState<ChurchData | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [activeContentSection, setActiveContentSection] = useState<ContentSection>('dashboard');
  const [formData, setFormData] = useState({
    nome: '',
    slug: '',
    logo_url: '',
    cor_primaria: '#8B5CF6',
    cor_secundaria: '#D946EF',
    is_active: true,
  });
  const [userFormData, setUserFormData] = useState({
    nome: '',
    telefone: '',
    church_id: '',
    role: '',
  });

  useEffect(() => {
    checkSuperAdminAccess();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, filterChurch, users]);

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
      await Promise.all([loadChurches(), loadUsers()]);
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
  };

  const loadUsers = async () => {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, nome, telefone, church_id, created_at')
      .order('nome');

    if (profilesError) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao carregar usuários.',
      });
      return;
    }

    const { data: allRoles } = await supabase
      .from('user_roles')
      .select('user_id, role');

    const { data: churchesData } = await supabase
      .from('churches')
      .select('id, nome');

    const churchMap = new Map(churchesData?.map(c => [c.id, c.nome]) || []);
    const rolesMap = new Map<string, string[]>();
    
    allRoles?.forEach(r => {
      if (!rolesMap.has(r.user_id)) {
        rolesMap.set(r.user_id, []);
      }
      rolesMap.get(r.user_id)!.push(r.role);
    });

    const usersWithData: UserData[] = (profiles || []).map(profile => ({
      id: profile.id,
      nome: profile.nome || 'Sem nome',
      telefone: profile.telefone,
      email: '',
      church_id: profile.church_id,
      church_name: profile.church_id ? churchMap.get(profile.church_id) || 'Igreja desconhecida' : 'Sem igreja',
      roles: rolesMap.get(profile.id) || ['discipulo'],
      created_at: profile.created_at,
    }));

    setUsers(usersWithData);
    setFilteredUsers(usersWithData);
  };

  const filterUsers = () => {
    let filtered = [...users];
    
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.nome.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterChurch !== 'all') {
      if (filterChurch === 'none') {
        filtered = filtered.filter(user => !user.church_id);
      } else {
        filtered = filtered.filter(user => user.church_id === filterChurch);
      }
    }
    
    setFilteredUsers(filtered);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const handleOpenChurchDialog = (church?: ChurchData) => {
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
    setIsChurchDialogOpen(true);
  };

  const handleOpenUserDialog = (user: UserData) => {
    setSelectedUser(user);
    setUserFormData({
      nome: user.nome,
      telefone: user.telefone || '',
      church_id: user.church_id || '',
      role: user.roles.includes('super_admin') ? 'super_admin' :
            user.roles.includes('church_admin') ? 'church_admin' : 
            user.roles.includes('admin') ? 'admin' : 
            user.roles.includes('discipulador') ? 'discipulador' : 'discipulo',
    });
    setIsUserDialogOpen(true);
  };

  const handleSubmitChurch = async (e: React.FormEvent) => {
    e.preventDefault();

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

    setIsChurchDialogOpen(false);
    loadChurches();
  };

  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        nome: userFormData.nome,
        telefone: userFormData.telefone || null,
        church_id: userFormData.church_id || null 
      })
      .eq('id', selectedUser.id);

    if (profileError) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao atualizar dados do usuário.',
      });
      return;
    }

    // Update roles - handle all role types
    const allAdminRoles: ('admin' | 'church_admin' | 'super_admin' | 'discipulador')[] = ['admin', 'church_admin', 'super_admin', 'discipulador'];
    
    // Remove existing admin roles
    await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', selectedUser.id)
      .in('role', allAdminRoles);

    // Add new role if it's an admin role
    if (userFormData.role !== 'discipulo') {
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: selectedUser.id,
          role: userFormData.role as 'admin' | 'church_admin' | 'super_admin' | 'discipulador',
        });

      if (roleError) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Erro ao atualizar papel do usuário.',
        });
        return;
      }
    }

    toast({ title: 'Sucesso', description: 'Usuário atualizado com sucesso.' });
    setIsUserDialogOpen(false);
    loadUsers();
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

  const getRoleBadge = (roles: string[]) => {
    if (roles.includes('super_admin')) return <Badge variant="destructive">Super Admin</Badge>;
    if (roles.includes('church_admin')) return <Badge className="bg-purple-500">Admin Igreja</Badge>;
    if (roles.includes('admin')) return <Badge className="bg-blue-500">Admin</Badge>;
    if (roles.includes('discipulador')) return <Badge className="bg-green-500">Discipulador</Badge>;
    return <Badge variant="secondary">Discípulo</Badge>;
  };

  const renderContentSection = () => {
    switch (activeContentSection) {
      case 'dashboard': return <AdminDashboard />;
      case 'tracks': return <AdminTracks />;
      case 'courses': return <AdminCourses />;
      case 'lessons': return <AdminLessons />;
      case 'resources': return <AdminResources isAdmin={true} />;
      case 'admin-users': return <AdminUsers />;
      case 'reading-plans': return <AdminReadingPlanDays />;
      case 'discipleship': return <AdminDiscipleship />;
      case 'weekly-checklist': return <AdminWeeklyChecklist />;
      case 'checklist-compliance': return <AdminChecklistCompliance />;
      case 'ai-settings': return <AdminAISettings />;
      case 'habits': return <AdminHabits />;
      case 'presentation': return <PresentationPdfGenerator />;
      default: return null;
    }
  };

  const activeSection = contentSections.find(s => s.id === activeContentSection);

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
          <Tabs defaultValue="churches" className="space-y-6">
            <TabsList className="grid w-full max-w-lg grid-cols-3">
              <TabsTrigger value="churches" className="flex items-center gap-2">
                <Church className="h-4 w-4" />
                <span className="hidden sm:inline">Igrejas</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Usuários</span>
              </TabsTrigger>
              <TabsTrigger value="content" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Conteúdo</span>
              </TabsTrigger>
            </TabsList>

            {/* Churches Tab */}
            <TabsContent value="churches" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Gerenciar Igrejas</h1>
                  <p className="text-muted-foreground mt-1">
                    Crie e gerencie as igrejas da plataforma
                  </p>
                </div>
                <Dialog open={isChurchDialogOpen} onOpenChange={setIsChurchDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => handleOpenChurchDialog()}>
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
                    <form onSubmit={handleSubmitChurch} className="space-y-4">
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
                        <Button type="button" variant="outline" onClick={() => setIsChurchDialogOpen(false)} className="flex-1">
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
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {churches.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
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
                                onClick={() => handleOpenChurchDialog(church)}
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
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users" className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Gerenciar Usuários</h1>
                  <p className="text-muted-foreground mt-1">
                    {filteredUsers.length} usuário(s) encontrado(s)
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={filterChurch} onValueChange={setFilterChurch}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Filtrar por igreja" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as igrejas</SelectItem>
                      <SelectItem value="none">Sem igreja</SelectItem>
                      {churches.map((church) => (
                        <SelectItem key={church.id} value={church.id}>
                          {church.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Users Table */}
              <div className="rounded-lg border border-border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Igreja</TableHead>
                      <TableHead>Papel</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>Nenhum usuário encontrado</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm">
                                {user.nome.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-medium">{user.nome}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {user.church_name}
                          </TableCell>
                          <TableCell>
                            {getRoleBadge(user.roles)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenUserDialog(user)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Content Tab (Admin functionality) */}
            <TabsContent value="content" className="space-y-6">
              <div className="flex flex-col gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Gerenciar Conteúdo</h1>
                  <p className="text-muted-foreground mt-1">
                    Adicione e edite trilhas, cursos, lições e recursos
                  </p>
                </div>

                {/* Content Navigation */}
                <div className="flex flex-wrap gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="default"
                        size="sm"
                        className="gap-2"
                      >
                        {activeSection ? (
                          <>
                            <activeSection.icon className="h-4 w-4" />
                            <span className="hidden sm:inline">{activeSection.label}</span>
                          </>
                        ) : (
                          <>
                            <BookOpen className="h-4 w-4" />
                            <span>Selecionar</span>
                          </>
                        )}
                        <ChevronDown className="h-3 w-3 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="bg-popover border border-border max-h-80 overflow-y-auto">
                      {contentSections.map((section) => (
                        <DropdownMenuItem
                          key={section.id}
                          onClick={() => setActiveContentSection(section.id)}
                          className={cn(
                            "gap-2 cursor-pointer",
                            activeContentSection === section.id && "bg-primary/10 text-primary"
                          )}
                        >
                          <section.icon className="h-4 w-4" />
                          {section.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Content Section */}
              <div className="mt-4">
                {renderContentSection()}
              </div>
            </TabsContent>
          </Tabs>

          {/* User Edit Dialog */}
          <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Editar Usuário</DialogTitle>
              </DialogHeader>
              {selectedUser && (
                <form onSubmit={handleSubmitUser} className="space-y-4">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">
                      Papéis atuais: {selectedUser.roles.join(', ')}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="user_nome">Nome</Label>
                    <Input
                      id="user_nome"
                      value={userFormData.nome}
                      onChange={(e) => setUserFormData({ ...userFormData, nome: e.target.value })}
                      placeholder="Nome do usuário"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="user_telefone">Telefone</Label>
                    <Input
                      id="user_telefone"
                      value={userFormData.telefone}
                      onChange={(e) => setUserFormData({ ...userFormData, telefone: e.target.value })}
                      placeholder="(00) 00000-0000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Igreja</Label>
                    <Select 
                      value={userFormData.church_id} 
                      onValueChange={(value) => setUserFormData({ ...userFormData, church_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma igreja" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Sem igreja</SelectItem>
                        {churches.map((church) => (
                          <SelectItem key={church.id} value={church.id}>
                            {church.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Papel Principal</Label>
                    <Select 
                      value={userFormData.role} 
                      onValueChange={(value) => setUserFormData({ ...userFormData, role: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um papel" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="discipulo">Discípulo</SelectItem>
                        <SelectItem value="discipulador">Discipulador</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="church_admin">Admin Igreja</SelectItem>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Super Admin: define papéis de qualquer usuário
                    </p>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsUserDialogOpen(false)} className="flex-1">
                      Cancelar
                    </Button>
                    <Button type="submit" className="flex-1">
                      Salvar
                    </Button>
                  </div>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </PageTransition>
  );
}
